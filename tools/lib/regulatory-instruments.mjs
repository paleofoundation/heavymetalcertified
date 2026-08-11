// regulatory-instruments.mjs — the shared register of regulatory instruments a
// standards page may cite in PROSE, and the one place that resolves each mention
// to its regulation-reference page.
//
// WHY THIS EXISTS. Every category standards generator already links its structured
// Sources table to the right regulation page (build-cert-sources.mjs, and the
// hand-authored Cat-9 tables). But the SAME instrument, when it is named in the
// narrative — the intro paragraph derived from `governing_basis`, a per-analyte
// rationale cell, any explanatory sentence — rendered as PLAIN TEXT. On the
// defensibility-critical citations ("EU REACH Annex XVII entry 72", "Directive
// 2009/48/EC", "EU Regulation 10/2011") that is the single highest-frequency broken
// internal link on the reading surface. This module is the register + resolver +
// linkifier that closes that gap, shared by:
//   - tools/build-standards-reg-links.mjs  (the prebuild linkifier)
//   - tools/regulatory-link-lint.mjs       (the build-blocking guard)
// so the linking rule and the audit rule can never drift apart.
//
// PRECISION FIRST. A wrong link on a regulatory citation is worse than a missing
// one, so patterns key ONLY on an instrument's UNAMBIGUOUS identifier — a
// regulation number, an Annex XVII entry number, a directive code, a named act —
// never a bare common word or a substance name ("organotin", "nickel"). Slugs are
// verified against the canonical register: they resolve to a cert-side page when
// content/regulations/<slug>.md exists (the internal link wins), otherwise to the
// Heavy Metal Index reference page — the firewall-clean, one-way cite (the cert
// plane cites the index and never the reverse; it never imports index pages).
//
// NOT INSTRUMENTS. EN 71-3, EN 1811, EN 1400 and ASTM test methods that carry no
// register page are measurement methods, not sovereign instruments, and are
// deliberately absent so they are never linked and never flagged.

import fs from "node:fs"
import path from "node:path"

// Each entry: a stable id, the regulation-page slug, and the precise phrasings the
// prose uses. `patterns` are matched case-insensitively; the fullest identifier at
// any position wins (the matcher orders alternatives longest-first), so the anchor
// wraps "EU REACH Annex XVII entry 72", not just "entry 72".
export const INSTRUMENTS = [
  {
    id: "reach-entry-72",
    slug: "eu-reach-2018-1513-cmr-textiles",
    // REACH Annex XVII entry 72 — extractable metals in skin-contact textiles.
    patterns: [
      /(?:EU\s+)?REACH\s+Annex\s+XVII\s+entry\s+72/i,
      /Annex\s+XVII\s+entry\s+72/i,
      /\bentry\s+72\b/i,
    ],
  },
  {
    id: "reach-entry-20-organotin",
    slug: "eu-reach-2009-annex-xvii-entry-20-organotin",
    // REACH Annex XVII entry 20 — organotin compounds. Keyed on the entry, never
    // the bare substance word "organotin".
    patterns: [
      /(?:EU\s+)?REACH\s+Annex\s+XVII\s+entry\s+20/i,
      /Annex\s+XVII\s+entry\s+20/i,
      /\bentry\s+20\b/i,
    ],
  },
  {
    id: "eu-10-2011-fcm",
    slug: "eu-10-2011-food-contact-plastics-sml",
    // Regulation (EU) No 10/2011 — plastic food-contact materials, specific
    // migration limits.
    patterns: [
      /(?:EU\s+)?Regulation\s+(?:\(EU\)\s+)?(?:No\s+)?10\/2011/i,
      /\b10\/2011\b/,
    ],
  },
  {
    id: "eu-2009-48-toy-safety",
    slug: "eu-2009-48-toy-safety-migration-limits",
    // Toy Safety Directive 2009/48/EC — element migration from toy material.
    patterns: [
      /Toy\s+Safety\s+Directive(?:\s+2009\/48\/EC)?/i,
      /Directive\s+2009\/48\/EC/i,
      /\b2009\/48\/EC\b/,
    ],
  },
  {
    id: "eu-nickel-directive-94-27",
    slug: "eu-nickel-directive-94-27-ec",
    // Nickel Directive 94/27/EC, folded into REACH Annex XVII entry 27.
    patterns: [
      /Nickel\s+Directive(?:\s+94\/27\/EC)?/i,
      /\b94\/27\/EC\b/,
      /(?:REACH\s+(?:Annex\s+XVII\s+)?)?\bentry\s+27\b/i,
    ],
  },
  {
    id: "canada-sor-2011-17",
    slug: "canada-sor-2011-17-toys-regulations",
    // Canada Toys Regulations SOR/2011-17.
    patterns: [
      /Canada\s+Toys\s+Regulations(?:\s+SOR\/2011-17)?/i,
      /\bSOR\/2011-17\b/,
    ],
  },
  {
    id: "us-cpsia",
    slug: "us-cpsia-lead-childrens-products",
    // US Consumer Product Safety Improvement Act — total lead in children's products.
    patterns: [/\bCPSIA\b/],
  },
  {
    id: "astm-f963",
    slug: "astm-f963-soluble-migration",
    // ASTM F963 — soluble-element migration, US toy safety standard.
    patterns: [/\bASTM\s+F963\b/i],
  },
  {
    id: "washington-cspa",
    slug: "washington-cspa-childrens-products-lead-cadmium",
    // Washington Children's Safe Product Act.
    patterns: [
      /Washington(?:\s+State)?\s+Children['’]s\s+Safe\s+Product\s+Act/i,
      /Washington\s+CSPA/i,
    ],
  },
  {
    id: "eu-2023-915",
    slug: "eu-2023-915",
    // Commission Regulation (EU) 2023/915 — contaminant maximum levels in food.
    // Resolves to the cert-side page (it exists), so this stays an internal link.
    patterns: [
      /Commission\s+Regulation\s+\(EU\)\s+2023\/915/i,
      /(?:EU\s+)?(?:Regulation\s+(?:\(EU\)\s+)?)?\b2023\/915\b/i,
    ],
  },
]

const INDEX_ORIGIN = "https://heavymetalindex.com"

// The cert-relative and index-absolute forms of an instrument's page. The resolver
// returns ONE canonical target; both forms are recognised when detecting an
// already-present link (idempotency + respecting a hand-authored or prior-run
// link, even across a later cert-page addition).
export function possibleUrls(inst) {
  return [`/regulations/${inst.slug}`, `${INDEX_ORIGIN}/regulations/${inst.slug}`]
}

// Cert-side page wins when it exists; otherwise the firewall-clean index cite.
export function resolveInstrumentUrl(inst, repoRoot) {
  const certPage = path.join(repoRoot, "content", "regulations", `${inst.slug}.md`)
  if (fs.existsSync(certPage)) return `/regulations/${inst.slug}`
  return `${INDEX_ORIGIN}/regulations/${inst.slug}`
}

// One combined matcher over every instrument's phrasings. Each alternative is its
// own capture group so a hit maps back to its instrument; alternatives are ordered
// longest-source-first so the fullest identifier wins at any shared start position.
export function buildMatcher() {
  const alts = []
  for (const inst of INSTRUMENTS) {
    for (const p of inst.patterns) alts.push({ src: p.source, inst })
  }
  alts.sort((a, b) => b.src.length - a.src.length)
  const combined = new RegExp(alts.map((a) => `(${a.src})`).join("|"), "gi")
  return { combined, alts }
}

function instForMatch(m, alts) {
  for (let i = 0; i < alts.length; i++) {
    if (m[i + 1] !== undefined) return alts[i].inst
  }
  return null
}

// ---- Frontmatter / marker-block partitioning -------------------------------
// The linkifier and the lint operate on the SAME region: the rendered body, minus
// the frontmatter (its `governing_basis` is YAML metadata, not a reading surface)
// and minus every marker-bounded generated block (`<!-- BEGIN: X -->…<!-- END: X
// -->`) — the Sources table already links its instruments, and the version-history
// block is structured, not prose.
export function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/)
  if (!m) return { fm: "", body: raw }
  return { fm: m[0], body: raw.slice(m[0].length) }
}

const MARKER_BLOCK = /<!--\s*BEGIN:[\s\S]*?<!--\s*END:[\s\S]*?-->/g

// Partition the body into { text, prose } segments. prose regions are
// linkified/audited; non-prose regions (marker-bounded generated blocks) pass
// through untouched.
function normaliseParts(body) {
  const parts = []
  let last = 0
  let m
  MARKER_BLOCK.lastIndex = 0
  while ((m = MARKER_BLOCK.exec(body)) !== null) {
    if (m.index > last) parts.push({ text: body.slice(last, m.index), prose: true })
    parts.push({ text: m[0], prose: false })
    last = MARKER_BLOCK.lastIndex
  }
  if (last < body.length) parts.push({ text: body.slice(last), prose: true })
  return parts
}

// ---- HTML-aware linkification ----------------------------------------------
// Only text OUTSIDE these elements is eligible: existing links (never double-link),
// code, and headings. Mirrors the AutoLink transformer's SKIP_TAGS.
const SKIP_TAGS = new Set(["a", "code", "pre", "kbd", "script", "style", "h1", "h2", "h3", "h4", "h5", "h6"])
const TAG = /<!--[\s\S]*?-->|<(\/)?([a-zA-Z][\w:-]*)\b[^>]*?(\/)?>/g

function linkifyTextRun(text, ctx) {
  const { combined, alts } = ctx.matcher
  combined.lastIndex = 0
  let out = ""
  let last = 0
  let m
  while ((m = combined.exec(text)) !== null) {
    if (m[0].length === 0) {
      combined.lastIndex++
      continue
    }
    const inst = instForMatch(m, alts)
    if (!inst || ctx.linked.has(inst.id)) continue
    const url = ctx.resolve(inst)
    if (!url) continue
    out += text.slice(last, m.index)
    out += `<a href="${url}" style="color:#1c43ad">${m[0]}</a>`
    ctx.linked.add(inst.id)
    ctx.count++
    last = m.index + m[0].length
  }
  out += text.slice(last)
  return out
}

// Walk a prose segment, tracking skip-tag nesting; linkify only the text runs that
// sit at skip-depth zero. Content here is well-formed generated HTML (every <a>,
// <section>, <td> is balanced; no `>` inside attribute values), which this
// lightweight tokenizer relies on.
function linkifySegment(segment, ctx) {
  let out = ""
  let last = 0
  let depth = 0
  let m
  TAG.lastIndex = 0
  while ((m = TAG.exec(segment)) !== null) {
    const run = segment.slice(last, m.index)
    out += depth > 0 ? run : linkifyTextRun(run, ctx)
    out += m[0]
    last = TAG.lastIndex
    if (m[0].startsWith("<!--")) continue
    const tag = (m[2] || "").toLowerCase()
    if (!SKIP_TAGS.has(tag)) continue
    const closing = m[1] === "/"
    const selfClose = m[3] === "/"
    if (selfClose) continue
    if (closing) depth = Math.max(0, depth - 1)
    else depth++
  }
  const tail = segment.slice(last)
  out += depth > 0 ? tail : linkifyTextRun(tail, ctx)
  return out
}

// Strip tags to plain text for the lint's "is it mentioned?" test, so an instrument
// identifier that only appears inside an attribute value is never counted as prose.
function stripTags(html) {
  return html.replace(/<[^>]+>/g, " ")
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// Pre-scan the prose for anchors already pointing at an instrument's page, so an
// already-linked instrument (hand-authored, or a prior run) is left alone. Keyed on
// href to either the cert-relative or index-absolute form.
function preLinkedInstruments(proseHtml) {
  const linked = new Set()
  const byUrl = new Map()
  for (const inst of INSTRUMENTS) for (const u of possibleUrls(inst)) byUrl.set(u, inst.id)
  const A = /<a\b[^>]*\bhref="([^"]*)"/gi
  let m
  while ((m = A.exec(proseHtml)) !== null) {
    const id = byUrl.get(m[1])
    if (id) linked.add(id)
  }
  return linked
}

// Linkify one standards file's raw contents. Idempotent: re-running produces no
// further change. Returns { content, count }.
export function linkifyStandardsContent(raw, repoRoot) {
  const { fm, body } = splitFrontmatter(raw)
  const parts = normaliseParts(body)
  const proseHtml = parts.filter((p) => p.prose).map((p) => p.text).join("")
  const ctx = {
    matcher: buildMatcher(),
    resolve: (inst) => resolveInstrumentUrl(inst, repoRoot),
    linked: preLinkedInstruments(proseHtml),
    count: 0,
  }
  const outBody = parts.map((p) => (p.prose ? linkifySegment(p.text, ctx) : p.text)).join("")
  return { content: fm + outBody, count: ctx.count }
}

// Audit one standards file: instruments named in prose but with NO link to their
// page anywhere in the prose. Returns [{ id, slug, url }].
export function auditStandardsContent(raw, repoRoot) {
  const { body } = splitFrontmatter(raw)
  const parts = normaliseParts(body)
  const proseHtml = parts.filter((p) => p.prose).map((p) => p.text).join("")
  const proseText = stripTags(proseHtml)
  const missing = []
  for (const inst of INSTRUMENTS) {
    const mentioned = inst.patterns.some((p) => new RegExp(p.source, "i").test(proseText))
    if (!mentioned) continue
    const linked = possibleUrls(inst).some((u) => new RegExp(`href="${escapeRe(u)}"`).test(proseHtml))
    if (!linked) missing.push({ id: inst.id, slug: inst.slug, url: resolveInstrumentUrl(inst, repoRoot) })
  }
  return missing
}
