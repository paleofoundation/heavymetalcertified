#!/usr/bin/env node
// tools/audit-transformer-parity.mjs
//
// CONTENT → CAPABILITY parity lint. Catches the recurring cross-property failure
// where CONTENT (or a component) is ported from one Quartz property to another
// WITHOUT the transformer / CSS / data / link-target the feature depends on — so
// it silently renders broken or flat, with NO build error.
//
// This is the COMPLEMENT of tools/audit-layout-liveness.mjs (the "component
// mounted but renders empty" lint). The two split the failure space cleanly:
//
//   audit-layout-liveness  — starts from the ACTIVE COMPONENT SET, asks
//                            "does the data/graph/asset this component needs exist?"
//                            (COMPONENT → data)
//   audit-transformer-parity (this file)
//                          — starts from the CONTENT CORPUS, asks
//                            "for each rendering feature the content uses, is the
//                             transformer/CSS/target that renders it present & wired?"
//                            (CONTENT → capability)
//
// To avoid double-flagging, this lint deliberately does NOT re-check link-graph
// emptiness (that is layout-liveness L3's job — "RelatedPages mounted but the
// corpus carries 0 links"). Here the wikilink check is a CONFIG-WIRING check
// ("[[...]] in content but no resolver transformer"), orthogonal to graph size.
//
// ── Confirmed instances this codifies ──────────────────────────────────────
//   • cert FAQ renders flat: question-style headings (text ending in "?") are
//     folded into <details class="qa"> accordions by the CollapsibleQuestions
//     transformer on the Index, but that transformer was never wired into cert's
//     quartz.config.ts — even though the .qa CSS WAS ported. Content + CSS
//     present, transformer absent → flat. (task_7121fe3a; live right now in the
//     in-flight cert content/articles/*.md port.)                    → FAQ_TRANSFORMER_MISSING
//   • cert AutoLink mis-port: the ported AutoLink pointed at /metals/ slugs that
//     do not exist in cert's slug space (cert has /analytes/, not /metals/), so
//     it linked nothing — silently. Index's AutoLink validates targets against
//     the build graph at runtime, so a stale/moved target is DROPPED with no
//     signal either. Both are "links nothing, no error".            → AUTOLINK_TARGET_MISSING
//   • [n] citations render flat: cert wraps embedded [n] markers in
//     <sup class="hmtc-cite"> via SuperscriptCitations. Content carrying [n]
//     ported to a property without that transformer renders literal brackets. → CITENUM_TRANSFORMER_MISSING
//   • [[wikilinks]] render literal: content using Obsidian [[links]] needs the
//     ObsidianFlavoredMarkdown resolver; ported to a property without it, the
//     brackets ship as text.                                        → WIKILINK_RESOLVER_MISSING
//   • orphan index cards: a hand-authored listing/index page links to card
//     targets whose backing page does not exist (briefings-orphan class). → INDEX_CARD_ORPHAN
//
// Also flags the INVERSE where cheap — a transformer wired but ZERO content uses
// its pattern (dead wiring) — as an advisory, not a failure.
//
// ── Why STATIC, not a full build ────────────────────────────────────────────
// Every check here reads only (a) the content corpus, (b) quartz.config.ts (the
// wired transformer set), (c) the transformer registry files (for AutoLink
// targets), and (d) quartz/styles for the required CSS selector. No bundling, no
// render. Deterministic and cheap; runs in prebuild.
//
// ── Repo-agnostic ───────────────────────────────────────────────────────────
// The SAME file drops into every Quartz property's tools/ dir, byte-identical —
// the broad-product-scopes drift-kill discipline. There is NO per-repo constant
// in this file: per-property behavior is DERIVED at runtime from that property's
// own quartz.config.ts + corpus + transformer registry, so copies cannot drift
// in behavior. An OPTIONAL per-property tools/transformer-parity.config.json can
// disable individual checks or silence dead-wiring advisories (see CONFIG below);
// zero-config is the default. Non-Quartz properties (e.g. contaminantstandards,
// a Next.js app with no markdown corpus) are auto-detected and skipped (exit 0).
//
// Run `node tools/audit-transformer-parity.mjs --self-hash` in each repo; the
// hashes MUST match. A mismatch means a copy drifted — re-sync before editing.
//
// ── Usage ───────────────────────────────────────────────────────────────────
//   node tools/audit-transformer-parity.mjs [--warn-only] [--json]
//                                           [--update-baseline] [--list-manifest]
//                                           [--self-hash]
//
//   --warn-only        exit 0 even with NEW findings (prebuild default while draining)
//   --json             machine-readable output
//   --update-baseline  re-accept the current findings into the baseline ratchet
//   --list-manifest    print the capability manifest and exit
//   --self-hash        print a hash of the engine+manifest (cross-repo drift check)
//
// Exit 1 (unless --warn-only) when a NEW finding appears beyond the accepted
// baseline — same ratchet as audit-layout-liveness / audit-component-redundancy.

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join, dirname, basename, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { createHash } from "node:crypto"

const ROOT = process.cwd()
const SELF = fileURLToPath(import.meta.url)
const args = process.argv.slice(2)
const warnOnly = args.includes("--warn-only")
const asJson = args.includes("--json")
const updateBaseline = args.includes("--update-baseline")
const listManifest = args.includes("--list-manifest")
const selfHash = args.includes("--self-hash")

// ── read helpers ─────────────────────────────────────────────────────────────
const read = (p) => {
  try {
    return readFileSync(p, "utf8")
  } catch {
    return null
  }
}
const nonEmpty = (p) => {
  const s = read(p)
  return s != null && s.replace(/\s+/g, "").length > 0
}

// ── the capability MANIFEST ──────────────────────────────────────────────────
// Each entry maps a CONTENT PATTERN to the capability it requires. `detect(body)`
// returns an array of {line, sample} hits within a single file's (code-stripped)
// body. `requires(ctx)` returns null when the capability is present, or a string
// describing what is missing when it is not. `fix` is the human remediation.
// `deadWire`, if set, emits an advisory when the transformer is wired but the
// pattern appears NOWHERE in the corpus.
const MANIFEST = [
  {
    id: "faq-accordion",
    code: "FAQ_TRANSFORMER_MISSING",
    title: "Question-style heading needs the CollapsibleQuestions transformer",
    // The transformer folds any h1/h2/h3 whose text ends in "?" into a
    // <details class="qa"> accordion. Detect both Markdown and raw-HTML headings.
    detect(body) {
      const hits = []
      const lines = body.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i]
        if (/^#{1,3}\s+.*\S\?\s*$/.test(l)) hits.push({ line: i + 1, sample: l.trim().slice(0, 90) })
      }
      // raw-HTML headings ending in "?" (cert's <section>-HTML pages)
      for (const m of body.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)) {
        const txt = m[1].replace(/<[^>]+>/g, "").trim()
        if (/\?$/.test(txt)) hits.push({ line: null, sample: txt.slice(0, 90) })
      }
      return hits
    },
    requires(ctx) {
      if (!ctx.wired.has("CollapsibleQuestions"))
        return "CollapsibleQuestions transformer not wired in quartz.config.ts → question headings render as plain <h2>/<h3>, not <details class=\"qa\"> accordions"
      return null
    },
    fix: "Add `Plugin.CollapsibleQuestions()` to the transformers array in quartz.config.ts (after TableOfContents) and copy quartz/plugins/transformers/collapsibleQuestions.ts from the Index if absent.",
    deadWire: { code: "FAQ_TRANSFORMER_UNUSED", transformer: "CollapsibleQuestions", note: "CollapsibleQuestions is wired but no content carries a question-style heading — dead wiring, or content not yet ported." },
  },
  {
    id: "faq-css",
    code: "FAQ_CSS_MISSING",
    title: "CollapsibleQuestions wired but its .qa CSS is absent",
    // Secondary: transformer present but the .qa selector was not ported, so the
    // accordion has no +/− glyph / fold styling. Repo-level (not per-file).
    repoLevel: true,
    check(ctx) {
      if (!ctx.wired.has("CollapsibleQuestions")) return null // only relevant when folding happens
      if (!ctx.corpusHas("faq-accordion")) return null // no content to style
      if (ctx.cssHas("\\.qa\\b")) return null
      return {
        detail: "CollapsibleQuestions folds question headings into <details class=\"qa\"> but no `.qa` selector exists in quartz/styles → accordion ships unstyled (no glyph, no fold affordance)",
        fix: "Port the `.qa` / `.qa summary .mk` rules into quartz/styles (see the Index proof-design.scss).",
        severity: "warn",
      }
    },
  },
  {
    id: "superscript-citations",
    code: "CITENUM_TRANSFORMER_MISSING",
    title: "Embedded [n] citation marker needs the SuperscriptCitations transformer",
    detect(body) {
      const hits = []
      const lines = body.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i]
        // Embedded marker: a bracketed 1–3 digit number immediately preceded by a
        // non-space, non-'[' , non-']' char (e.g. `benzene[1]`). This is exactly
        // what SuperscriptCitations targets; standalone `[1]` reference-list cells
        // (preceded by whitespace / line-start) and [[wikilinks]] / [^footnotes]
        // are excluded.
        for (const m of l.matchAll(/(?<=[^\s\[\]])\[(\d{1,3})\]/g)) {
          hits.push({ line: i + 1, sample: l.slice(Math.max(0, m.index - 20), m.index + 6).trim().slice(0, 90) })
          break // one hit per line is enough signal
        }
      }
      return hits
    },
    requires(ctx) {
      // Whether embedded [n] means "citation" is a per-property EDITORIAL fact,
      // not statically inferable: cert uses [n] as its citation style, the Index
      // uses GFM footnotes [^n] and its 4k scientific source pages carry
      // incidental bracketed numbers (t[13]=2, "refs [13]–[17]") that are NOT
      // citations. So this check fires ONLY when a property DECLARES
      // `"citationStyle": "superscript-n"` in tools/transformer-parity.config.json
      // and the transformer is absent — a precise, intentional signal that also
      // catches a regression that removes SuperscriptCitations while [n]-cited
      // content remains. Properties that don't declare it (the Index) never flood.
      if (ctx.citationStyle !== "superscript-n") return null
      if (!ctx.wired.has("SuperscriptCitations"))
        return "property declares citationStyle=superscript-n but the SuperscriptCitations transformer is not wired → embedded [n] markers render as literal bracketed numbers instead of <sup class=\"hmtc-cite\">"
      return null
    },
    fix: "Add `Plugin.SuperscriptCitations()` to the transformers array and copy quartz/plugins/transformers/citenumbers.ts from cert. (Index prose uses GFM footnotes `[^n]` instead; do not port [n] content there without the transformer.)",
    deadWire: { code: "CITENUM_TRANSFORMER_UNUSED", transformer: "SuperscriptCitations", note: "SuperscriptCitations is wired but no content carries an embedded [n] marker — dead wiring." },
  },
  {
    id: "wikilinks",
    code: "WIKILINK_RESOLVER_MISSING",
    title: "[[wikilink]] needs the ObsidianFlavoredMarkdown resolver",
    detect(body) {
      const hits = []
      const lines = body.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const m = /\[\[[^\]\n]+\]\]/.exec(lines[i])
        if (m) hits.push({ line: i + 1, sample: m[0].slice(0, 90) })
      }
      return hits
    },
    requires(ctx) {
      if (!ctx.wired.has("ObsidianFlavoredMarkdown"))
        return "ObsidianFlavoredMarkdown transformer not wired → [[wikilinks]] ship as literal text (no anchor, no link-graph edge)"
      return null
    },
    fix: "Add `Plugin.ObsidianFlavoredMarkdown()` to the transformers array (before CrawlLinks).",
    // No dead-wire advisory: OFM does far more than wikilinks; "unused" is not meaningful.
  },
]

// AutoLink target-existence and index-card-orphan are structural checks (not a
// per-file body pattern), run separately below but reported through the same
// findings surface.

if (listManifest) {
  console.log("transformer-parity capability manifest:\n")
  for (const e of MANIFEST) console.log(`  ${e.code.padEnd(28)} ${e.title}`)
  console.log(`  ${"AUTOLINK_TARGET_MISSING".padEnd(28)} AutoLink term points at a slug with no backing page in this property`)
  console.log(`  ${"INDEX_CARD_ORPHAN".padEnd(28)} listing/index page links to a card whose backing page does not exist`)
  process.exit(0)
}

// The self-hash covers the engine source itself (manifest included, since it is
// inline). Two repos with the same file produce the same hash.
if (selfHash) {
  const src = read(SELF) || ""
  console.log(createHash("sha256").update(src).digest("hex").slice(0, 16) + "  audit-transformer-parity.mjs")
  process.exit(0)
}

// ── detect Quartz property + content dir (else skip cleanly) ─────────────────
const CONFIG_FILE = join(ROOT, "quartz.config.ts")
const CONTENT_DIR = existsSync(join(ROOT, "wiki"))
  ? join(ROOT, "wiki")
  : existsSync(join(ROOT, "content"))
    ? join(ROOT, "content")
    : null
const STYLES_DIR = join(ROOT, "quartz/styles")
const TRANSFORMERS_DIR = join(ROOT, "quartz/plugins/transformers")
const BASELINE = join(ROOT, "tools/transformer-parity-baseline.json")
const OPT_CONFIG = join(ROOT, "tools/transformer-parity.config.json")

if (!existsSync(CONFIG_FILE) || !CONTENT_DIR) {
  // Not a Quartz markdown property (e.g. contaminantstandards is a Next.js app
  // with a DB-backed corpus and no markdown transformer surface). Nothing to
  // parity-check; skip cleanly so the same file can sit in every property's
  // prebuild without special-casing.
  const msg = `transformer-parity: ${basename(ROOT)} is not a Quartz markdown property (no quartz.config.ts + wiki/|content/) → N/A, skipping`
  if (asJson) console.log(JSON.stringify({ repo: basename(ROOT), skipped: true, reason: msg }, null, 2))
  else console.log(msg)
  process.exit(0)
}

// ── optional per-property config ─────────────────────────────────────────────
let optConfig = { disableChecks: [], silenceDeadWire: [], citationStyle: null }
try {
  optConfig = { ...optConfig, ...(JSON.parse(read(OPT_CONFIG) || "{}") || {}) }
} catch {
  /* ignore malformed opt config */
}
const disabled = new Set(optConfig.disableChecks || [])
const silencedDeadWire = new Set(optConfig.silenceDeadWire || [])
const citationStyle = optConfig.citationStyle || null

// ── the wired transformer set (from quartz.config.ts) ────────────────────────
const configSrc = read(CONFIG_FILE) || ""
// Scope to the transformers: [ ... ] array so an emitter/filter of the same name
// is not miscounted; fall back to the whole file if the array can't be sliced.
const txSlice = (() => {
  const m = configSrc.match(/transformers\s*:\s*\[/)
  if (!m) return configSrc
  let i = m.index + m[0].length
  let depth = 1
  for (; i < configSrc.length && depth > 0; i++) {
    if (configSrc[i] === "[") depth++
    else if (configSrc[i] === "]") depth--
  }
  return configSrc.slice(m.index, i)
})()
const wired = new Set([...txSlice.matchAll(/Plugin\.(\w+)\s*\(/g)].map((m) => m[1]))

// ── CSS selector presence (across quartz/styles) ─────────────────────────────
const styleFiles = []
if (existsSync(STYLES_DIR)) {
  const walk = (d) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n)
      const st = statSync(p)
      if (st.isDirectory()) walk(p)
      else if (/\.(scss|css)$/.test(n)) styleFiles.push(p)
    }
  }
  walk(STYLES_DIR)
}
const styleBlob = styleFiles.map((p) => read(p) || "").join("\n")
const cssHas = (selectorRe) => new RegExp(selectorRe).test(styleBlob)

// ── enumerate content corpus ─────────────────────────────────────────────────
const corpus = [] // { path, slug, body }
const stripFrontmatter = (s) => s.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
const stripCode = (s) =>
  s
    .replace(/```[\s\S]*?```/g, "") // fenced blocks
    .replace(/~~~[\s\S]*?~~~/g, "")
    .replace(/`[^`\n]*`/g, "") // inline code
const walkContent = (dir) => {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === "static" || name === "assets") continue
      walkContent(p)
    } else if (name.endsWith(".md")) {
      const raw = read(p) || ""
      corpus.push({
        path: p,
        slug: relative(CONTENT_DIR, p).replace(/\.md$/, ""),
        body: stripCode(stripFrontmatter(raw)),
        raw,
      })
    }
  }
}
walkContent(CONTENT_DIR)

// ── run per-file body pattern checks ─────────────────────────────────────────
const findings = [] // { code, where, detail, severity }
const add = (code, where, detail, severity = "error") => findings.push({ code, where, detail, severity })
const rel = (p) => relative(ROOT, p)

// Which manifest patterns appear anywhere in the corpus (for dead-wire + FAQ css)
const corpusPatternHit = new Set()

for (const entry of MANIFEST) {
  if (entry.repoLevel || disabled.has(entry.code)) continue
  const missingReason = entry.requires({ wired, citationStyle })
  let anyHit = false
  for (const f of corpus) {
    const hits = entry.detect(f.body)
    if (hits.length === 0) continue
    anyHit = true
    if (missingReason) {
      const where = hits[0].line ? `${rel(f.path)}:${hits[0].line}` : rel(f.path)
      const samples = hits.slice(0, 3).map((h) => `“${h.sample}”`).join(", ")
      add(entry.code, where, `${missingReason}. ${hits.length} occurrence(s), e.g. ${samples}. FIX: ${entry.fix}`)
    }
  }
  if (anyHit) corpusPatternHit.add(entry.id)
}

// repo-level checks (FAQ_CSS_MISSING)
for (const entry of MANIFEST) {
  if (!entry.repoLevel || disabled.has(entry.code)) continue
  const ctx = {
    wired,
    cssHas,
    corpusHas: (id) => corpusPatternHit.has(id),
  }
  const res = entry.check(ctx)
  if (res) add(entry.code, basename(ROOT), `${res.detail}. FIX: ${res.fix}`, res.severity || "warn")
}

// dead-wiring advisories
for (const entry of MANIFEST) {
  if (!entry.deadWire || disabled.has(entry.code) || silencedDeadWire.has(entry.deadWire.code)) continue
  if (wired.has(entry.deadWire.transformer) && !corpusPatternHit.has(entry.id)) {
    add(entry.deadWire.code, basename(ROOT), entry.deadWire.note, "warn")
  }
}

// ── AutoLink target existence ────────────────────────────────────────────────
// Parse the term→slug maps the AutoLink transformer resolves, and confirm each
// target slug has a backing page in THIS property's slug space. Catches the cert
// /metals mis-port and silent stale-target drops on the Index.
if (!disabled.has("AUTOLINK_TARGET_MISSING") && wired.has("AutoLink")) {
  const slugSet = new Set(corpus.map((f) => f.slug))
  const resolves = (slug) => {
    const s = slug.replace(/^\/+/, "").replace(/[?#].*$/, "").replace(/\/$/, "")
    return slugSet.has(s) || slugSet.has(`${s}/index`) || slugSet.has(s.replace(/\/index$/, ""))
  }
  // Collect every `Record<string, string>` object-literal block from the
  // AutoLink registry files, then extract its slug-like string VALUES.
  const registryFiles = [
    join(TRANSFORMERS_DIR, "autolink.ts"),
    join(TRANSFORMERS_DIR, "autolink-terms.generated.ts"),
  ].filter(existsSync)
  const targets = new Map() // slug -> Set(term)
  for (const rf of registryFiles) {
    const src = read(rf) || ""
    // find object literals typed `Record<string, string>` (or named TERMS/METALS/
    // GENERATED_TERMS) and brace-match their bodies.
    const re = /(?::\s*Record<\s*string\s*,\s*string\s*>\s*=|\b(?:TERMS|METALS|GENERATED_TERMS)\b[^=\n]*=)\s*\{/g
    let m
    while ((m = re.exec(src))) {
      let i = re.lastIndex
      let depth = 1
      for (; i < src.length && depth > 0; i++) {
        if (src[i] === "{") depth++
        else if (src[i] === "}") depth--
      }
      const bodyBlock = src.slice(re.lastIndex, i - 1)
      for (const em of bodyBlock.matchAll(/(["']?)([^"':\n{}]+?)\1\s*:\s*["']([a-z0-9][a-z0-9/_-]*)["']/g)) {
        const term = em[2].trim()
        const slug = em[3].trim()
        if (/^\.{3}/.test(term)) continue // spread, not a real key
        if (!targets.has(slug)) targets.set(slug, new Set())
        targets.get(slug).add(term)
      }
    }
  }
  for (const [slug, terms] of targets) {
    if (resolves(slug)) continue
    const termList = [...terms].slice(0, 4).map((t) => `"${t}"`).join(", ")
    add(
      "AUTOLINK_TARGET_MISSING",
      `${slug}`,
      `AutoLink maps ${terms.size} term(s) (${termList}${terms.size > 4 ? ", …" : ""}) to slug "${slug}" but no page resolves there in ${basename(ROOT)} → those in-prose mentions link to nothing (silent). FIX: repoint the term to an existing slug, or create the target page, or drop the term from the AutoLink map.`,
    )
  }
}

// ── index-card orphan (listing/index pages → missing backing page) ───────────
// Scoped to files whose basename is `index` (hubs / listing pages), the class
// where a hand-authored card list orphans a target (the briefings-orphan /
// empty-Analysis-stub class). severity=warn.
//
// Quartz resolves a link like `](products/foo)` from products/index.md to the
// slug `products/foo` directly (markdownLinkResolution:"shortest"), NOT to a
// path-joined `products/products/foo`. Replicating that resolver exactly is the
// full-build cost this lint avoids, so resolution is PERMISSIVE: a link is an
// orphan only if it resolves under NO interpretation (direct slug, page-relative,
// or shortest-suffix). To stay on THIS lint's turf (cards into the rendered
// corpus) and off cross-boundary `docs/`/`data/`/`../` links (a different lint's
// job), only targets whose first path segment is a real top-level content
// directory are considered.
if (!disabled.has("INDEX_CARD_ORPHAN")) {
  const slugSet = new Set(corpus.map((f) => f.slug))
  const topLevelDirs = new Set(
    readdirSync(CONTENT_DIR)
      .filter((n) => !n.startsWith(".") && n !== "static" && n !== "assets")
      .filter((n) => {
        try {
          return statSync(join(CONTENT_DIR, n)).isDirectory()
        } catch {
          return false
        }
      }),
  )
  const norm = (s) => s.replace(/^\/+/, "").replace(/[?#].*$/, "").replace(/\/$/, "").replace(/\/index$/, "")
  const slugExists = (s) => {
    const n = norm(s)
    if (!n) return true
    return slugSet.has(n) || slugSet.has(`${n}/index`)
  }
  const suffixResolves = (t) => {
    // shortest-mode: any slug equal to t or ending in `/t`
    const n = norm(t)
    if (!n) return true
    return [...slugSet].some((s) => s === n || s.endsWith(`/${n}`))
  }
  const resolvesAnyWay = (fromSlug, target) => {
    if (/^(https?:|mailto:|tel:|#)/.test(target)) return true // external / anchor
    const t = target.replace(/[?#].*$/, "")
    if (t.startsWith("/")) return slugExists(t)
    // (a) direct slug from content root, (b) page-relative, (c) shortest-suffix
    if (slugExists(t)) return true
    const dir = fromSlug.replace(/\/index$/, "").replace(/\/[^/]*$/, "")
    const parts = (dir ? dir.split("/") : []).concat(t.split("/"))
    const out = []
    for (const p of parts) {
      if (p === "." || p === "") continue
      else if (p === "..") out.pop()
      else out.push(p)
    }
    if (slugExists(out.join("/"))) return true
    return suffixResolves(t)
  }
  for (const f of corpus) {
    if (basename(f.slug) !== "index") continue
    const seen = new Set()
    const links = []
    // trailing `\` = an Obsidian table-escaped pipe (`[[slug\|label]]`); strip it.
    const clean = (s) => s.replace(/\\+$/, "").trim()
    for (const m of f.body.matchAll(/\]\(([^)\s]+)\)/g)) links.push(clean(m[1]))
    for (const m of f.body.matchAll(/\[\[([^\]|#\\]+)(?:\\?[|#][^\]]*)?\]\]/g)) links.push(clean(m[1]))
    for (const target of links) {
      if (seen.has(target)) continue
      seen.add(target)
      if (/^(https?:|mailto:|tel:|#)/.test(target)) continue
      // only cards pointing INTO the rendered corpus (first segment is a real
      // top-level content dir); skip cross-boundary docs/data/../ links.
      const firstSeg = target.replace(/^\/+/, "").split("/")[0]
      if (!topLevelDirs.has(firstSeg)) continue
      if (!resolvesAnyWay(f.slug, target)) {
        add(
          "INDEX_CARD_ORPHAN",
          `${rel(f.path)} → ${target}`, // target in the key so each orphan is distinct in the baseline ratchet
          `listing page links to "${target}" but no page resolves there in ${basename(ROOT)} → orphan card. FIX: create the backing page, or remove/repoint the card.`,
          "warn",
        )
      }
    }
  }
}

// ── baseline ratchet ─────────────────────────────────────────────────────────
const key = (f) => `${f.code}::${f.where}`
let baselineObj = {}
try {
  baselineObj = JSON.parse(read(BASELINE) || "{}") || {}
} catch {
  baselineObj = {}
}
const baseline = baselineObj.accepted ?? []

if (updateBaseline) {
  writeFileSync(
    BASELINE,
    JSON.stringify(
      {
        note: "Accepted transformer-parity findings (ratchet). Draining backlog: do not grow. A NEW finding beyond this list fails the build (unless --warn-only). Re-run --update-baseline after an intended change.",
        accepted: findings.map(key).sort(),
      },
      null,
      2,
    ) + "\n",
  )
  console.log(`transformer-parity-baseline.json updated: ${findings.length} accepted finding(s)`)
  process.exit(0)
}

const baseSet = new Set(baseline)
const newFindings = findings.filter((f) => !baseSet.has(key(f)))
const resolved = baseline.filter((k) => !findings.some((f) => key(f) === k))

// ── report ───────────────────────────────────────────────────────────────────
if (asJson) {
  console.log(
    JSON.stringify(
      { repo: basename(ROOT), contentDir: relative(ROOT, CONTENT_DIR), totalPages: corpus.length, wired: [...wired].sort(), findings, newFindings, resolved },
      null,
      2,
    ),
  )
} else {
  console.log(`transformer-parity: ${corpus.length} pages in ${basename(ROOT)}, ${findings.length} finding(s) (${baseline.length} in accepted baseline)`)
  for (const f of findings) {
    const isNew = !baseSet.has(key(f))
    const tag = isNew ? "NEW " : "    "
    const mark = f.severity === "warn" ? "•" : "✗"
    console.log(`  ${mark} ${tag}${f.code}  ${f.where}\n        ${f.detail}`)
  }
  if (resolved.length) console.log(`  ✓ resolved since baseline (run --update-baseline to shrink it): ${resolved.join(", ")}`)
  if (findings.length === 0) console.log("  ✓ every rendering feature the content uses has its transformer/CSS/target present")
  else if (newFindings.length === 0) console.log("  ✓ no NEW findings beyond the accepted baseline")
  const bySev = (s) => findings.filter((f) => f.severity === s)
  console.log(`  (${bySev("error").length} error-class, ${bySev("warn").length} advisory)`)
}

const blocking = newFindings.filter((f) => f.severity !== "warn")
if (blocking.length > 0 && !warnOnly) {
  console.error(`\ntransformer-parity: ${blocking.length} NEW error-class finding(s). Fix, or --update-baseline to accept, or --warn-only to downgrade.`)
  process.exit(1)
}
process.exit(0)
