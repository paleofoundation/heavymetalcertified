import { QuartzTransformerPlugin } from "../types"
import { Root, Text, ElementContent } from "hast"
import { AUTOLINK_ENTRIES, AutolinkEntry } from "./autolink-terms.generated"

// Wiki-style autolinker. Turns the FIRST prose mention of any entity the cert
// corpus has a page for — an analyte, a product-category standard, a named
// regulation, or a sibling briefing — into an internal link, so the corpus gains
// the high-weight *in-content contextual* links that a "See also" rail can't
// provide (audit finding: pages linked "up" to sources but not "laterally/down"
// to concepts). Runs AFTER OFM's rehype-raw (which precedes it in the transformer
// list, so the raw-HTML `<p style=…>`/`<section>` blocks the design-ported pages
// are built from are already expanded into real hast element/text nodes by the
// time this walks the tree) and BEFORE CrawlLinks (so every inserted link is
// resolved and counted into the link graph like any other internal link).
//
// The VOCABULARY is generated from the real corpus by tools/build-autolink-terms.mjs
// into ./autolink-terms.generated.ts, so it can never point at a renamed/removed
// slug and stays in sync as the corpus grows. This file is the matcher + injector;
// the term→slug table lives there.
//
// PRECISION FIRST — this is a defensibility-critical reference surface, so a wrong
// link is worse than a missing one:
//   - Curated phrasings, each validated a SECOND time against the LIVE build graph
//     (ctx.allSlugs): an entry whose target page is absent from this build is
//     silently dropped.
//   - First mention per TARGET page only (no over-linking); a target already linked
//     on the page — by a hand-authored link, a generated Sources cell, or the
//     standards-prose regulatory linkifier (build-standards-reg-links.mjs) — is
//     left alone.
//   - Skips headings, existing links, and code; never self-links.
//   - Ambiguous bare words are handled explicitly: "lead" (the English verb) is
//     guarded against its verb/adjective collocations; the generic single-word
//     food categories are simply not in the vocabulary.
//
// COMPOSES WITH, does not duplicate: regulatory *instrument*-code citations in
// STANDARDS prose ("REACH Annex XVII entry 72", "Directive 2009/48/EC", "EU
// 10/2011", "2023/915") are owned by tools/lib/regulatory-instruments.mjs via the
// prebuild post-processor build-standards-reg-links.mjs, which bakes them into the
// standards .md as <a> before Quartz parses — so this transformer sees them as
// existing links and skips them. The generated vocabulary instead covers the
// JURISDICTION-NAMED regulation pages (Proposition 65, GB 2762, Codex CXS 193, the
// Food Standards Code…) that the instrument register does not — everywhere,
// including the briefings the standards-only post-processor never touches.

// Disambiguation guards, keyed by the `guard` field an entry carries. Given the
// text immediately BEFORE and AFTER a candidate match, a guard returns true to
// REJECT it. "lead" is also the most common English verb; on a heavy-metals corpus
// its first mention is overwhelmingly the metal, but reject the verb/adjective
// collocations so "lead to", "lead the way", "lead author", "lead time" never link.
const LEAD_AFTER =
  /^\s+(?:to|into|us|me|you|them|him|her|it|the|a|an|by|off|up|on|down|through|toward|towards|role|roles|singer|singers|time|times|author|authors|counsel|researcher|researchers|scientist|scientists|generation|way|ways)\b/i
const LEAD_BEFORE = /\bto\s*$/i
const GUARDS: Record<string, (before: string, after: string) => boolean> = {
  lead: (before, after) => LEAD_BEFORE.test(before) || LEAD_AFTER.test(after),
}

// Cap per page: a precision backstop, not a target. First-mention-per-target means
// a page reaches this only if it genuinely mentions this many distinct entities.
const MAX_LINKS_PER_PAGE = 40

const SKIP_TAGS = new Set([
  "a",
  "code",
  "pre",
  "kbd",
  "script",
  "style",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  // A <details> summary is a heading-like control (e.g. the Program Manual
  // "What will struggle" accordion's analyte name). Autolinking it turns the
  // header into a blue link — off-design and inconsistent (some analyte names
  // match a term and some do not). Links belong in the accordion's prose, not
  // its header, so block the summary subtree like a heading.
  "summary",
  // Tables are dense reference grids (the standards Master Limit / Derivation
  // tables, the Sources and Version tables): autolinking the analyte column and
  // jurisdiction cells reads as clutter, not navigation. Blocking the <table>
  // cascades to every <thead>/<tbody>/<tr>/<th>/<td>/<caption> via walk().
  "table",
])

// A container is "card-like" — a callout, admonition, flag, or content card —
// when it carries the standards completeness-flag marker (data-panel-audit, the
// one such container this corpus emits today) or a class in the callout/card/flag
// family. Autolinking analyte and regulation names inside these visual boxes reads
// as clutter — the names are already the box's whole subject — so suppress it there
// while keeping it in ordinary reading prose. Applied as an ancestor guard in
// walk(): a card-like element blocks its entire subtree, just like a SKIP_TAG. Kept
// deliberately narrow (a marker attribute + hyphen-delimited family keywords) so it
// never blocks an ordinary <div>/<section> prose wrapper.
const CARD_CLASS_RE = /(?:^|-)(?:callout|admonition|flag|card|aside|note)(?:$|-)/i

function isCardLike(node: any): boolean {
  const props = node.properties
  if (!props) return false
  if (props.dataPanelAudit !== undefined) return true
  const cn = props.className
  const tokens = Array.isArray(cn) ? cn : typeof cn === "string" ? cn.split(/\s+/) : []
  return tokens.some((t: unknown) => typeof t === "string" && CARD_CLASS_RE.test(t))
}

function normalize(slug: string): string {
  return slug
    .replace(/^\/+/, "")
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "")
    .replace(/\/index$/, "")
}

function collectLinkedSlugs(node: any, into: Set<string>): void {
  if (node?.type === "element") {
    if (node.tagName === "a" && typeof node.properties?.href === "string") {
      const href = node.properties.href as string
      if (!/^(https?:|#|mailto:|tel:)/.test(href)) into.add(normalize(href))
    }
    for (const c of node.children ?? []) collectLinkedSlugs(c, into)
  }
}

// Escape a phrasing into a regex source, with runs of whitespace made flexible so a
// phrase split across a line break inside a raw-HTML `<p>` still matches.
function toPattern(term: string): string {
  return term
    .split(/\s+/)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\s+")
}

function walk(node: any, blocked: boolean, repl: (t: Text) => ElementContent[] | null): void {
  if (!node.children) return
  const out: ElementContent[] = []
  for (const child of node.children) {
    if (child.type === "text" && !blocked) {
      const replaced = repl(child)
      out.push(...(replaced ?? [child]))
    } else {
      if (child.type === "element") {
        walk(child, blocked || SKIP_TAGS.has(child.tagName) || isCardLike(child), repl)
      }
      out.push(child)
    }
  }
  node.children = out
}

export const AutoLink: QuartzTransformerPlugin = () => {
  return {
    name: "AutoLink",
    htmlPlugins(ctx) {
      const allSlugs = new Set((ctx.allSlugs ?? []) as string[])

      // Keep only entries whose target page actually exists in this build; flatten
      // each entry's phrasings into their own regex alternative so a match maps back
      // to its entry by capture-group index. Longest phrasing first so "inorganic
      // arsenic" wins over "arsenic" and "Codex CXS 193" over "CXS 193" at a shared
      // start position.
      const alts: { entry: AutolinkEntry; src: string }[] = []
      for (const entry of AUTOLINK_ENTRIES) {
        if (!allSlugs.has(normalize(entry.slug))) continue
        for (const term of entry.terms) alts.push({ entry, src: toPattern(term) })
      }
      alts.sort((a, b) => b.src.length - a.src.length)

      const pattern =
        alts.length > 0
          ? new RegExp(`\\b(?:${alts.map((a) => `(${a.src})`).join("|")})\\b`, "gi")
          : null

      return [
        () => (tree: Root, file: any) => {
          if (!pattern) return
          const curSlug = (file.data.slug ?? "") as string
          if (curSlug === "index" || curSlug.startsWith("tags/")) return

          const linkedSlugs = new Set<string>([normalize(curSlug)]) // never self-link
          collectLinkedSlugs(tree, linkedSlugs) // respect existing explicit links
          let injected = 0

          walk(tree, false, (textNode: Text): ElementContent[] | null => {
            if (injected >= MAX_LINKS_PER_PAGE) return null
            const value = textNode.value
            pattern.lastIndex = 0
            const parts: ElementContent[] = []
            let last = 0
            let any = false
            let m: RegExpExecArray | null
            while ((m = pattern.exec(value)) !== null) {
              if (m[0].length === 0) {
                pattern.lastIndex++
                continue
              }
              // Which alternative fired? Its capture group is defined.
              let hit: AutolinkEntry | null = null
              for (let i = 0; i < alts.length; i++) {
                if (m[i + 1] !== undefined) {
                  hit = alts[i].entry
                  break
                }
              }
              if (!hit) continue
              const norm = normalize(hit.slug)
              if (linkedSlugs.has(norm)) continue // self or already linked (first-mention)
              const guard = hit.guard ? GUARDS[hit.guard] : undefined
              if (guard) {
                const before = value.slice(0, m.index)
                const after = value.slice(m.index + m[0].length)
                if (guard(before, after)) continue
              }
              if (m.index > last) parts.push({ type: "text", value: value.slice(last, m.index) })
              parts.push({
                type: "element",
                tagName: "a",
                properties: {
                  href: `/${hit.slug}`,
                  className: ["hmi-autolink", `hmi-autolink-${hit.type}`],
                },
                children: [{ type: "text", value: m[0] }],
              })
              linkedSlugs.add(norm)
              last = m.index + m[0].length
              any = true
              injected++
              if (injected >= MAX_LINKS_PER_PAGE) break
            }
            if (!any) return null
            if (last < value.length) parts.push({ type: "text", value: value.slice(last) })
            return parts
          })
        },
      ]
    },
  }
}
