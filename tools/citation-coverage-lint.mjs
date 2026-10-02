#!/usr/bin/env node
// citation-coverage-lint.mjs — the site-wide "is this publishable page cited?" gate.
//
// WHY THIS EXISTS (ORDER HMTC-BIG8-CITE-1). Many heavymetalcertified.com pages were
// shipping without any inline citation or References apparatus. The citation-context
// engine (tools/citation-context.mjs) explains WHY each reference supports a claim;
// it does not check that a publishable page cites anything at all. This lint is the
// coverage floor: every publishable page must carry at least the citation form its
// page class uses, or the build fails.
//
// PER-TYPE RULES (locked 2026-10-02, full per-type scope):
//   briefings, articles        -> apparatus: inline sup.cite -> #ref-N and/or a
//                                  "## References" section. Index/listing/roundup
//                                  pages are exempt.
//   standards                  -> registered: a `cert_doi` means the standard passed
//                                  standard-readiness-lint (COMPLETE+REGISTERED+
//                                  CORRECTED), i.e. its claim-surface cells are
//                                  sourced. A standard with no cert_doi is a
//                                  non-publishable scaffold and is exempt here.
//   regulations                -> a law URL (regulation_page/url frontmatter, or an
//                                  http(s) link in the body) counts as the citation.
//   analytes, why-we-limit,    -> at least one citation: a DOI, the sup.cite/#ref
//   program, requirements         apparatus, a "## References" section, or a link to
//                                  a /regulations/ page. Index/nav pages are exempt.
//   ecosystem, manuals,        -> exempt (overview / instructional / profile / demo).
//   authors, brands, static
//
// FAIL-CLOSED: a content subdirectory this lint does not classify is a BLOCKING
// violation ("unknown content type"), so a new page family cannot ship uncited by
// slipping past an allowlist. Never a silent pass.
//
// GENERATOR: this lint only reports. Citation content is generated from existing
// bibliography / claim-surface data by the house machinery already in prebuild
// (tools/citation-context.mjs build, tools/build-cert-sources.mjs,
// tools/import-briefings.mjs, tools/build-cert-articles.mjs). No refs are invented
// and no µg/kg value is ever synthesised here.
//
// ROLLOUT. Genuine pre-existing gaps are grandfathered in BACKLOG so this lint can
// ship build-blocking for every NEW page without breaking the current build; drain
// BACKLOG to zero, then delete it. (Same staged pattern as tools/design-lint.mjs.)
//
// Flags:
//   --warn-only   never exit 1 (report only)
//   --list        print every page checked with its verdict
//
// Exit non-zero on any non-grandfathered blocking violation (build-blocking in prebuild).

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const CONTENT = path.join(root, "content")

const warnOnly = process.argv.includes("--warn-only")
const listAll = process.argv.includes("--list")

// Per-subdir rule. Unknown subdirs are fail-closed (blocking).
const RULES = {
  briefings: "apparatus",
  articles: "apparatus",
  standards: "standard",
  regulations: "lawurl",
  analytes: "cite",
  "why-we-limit": "cite",
  program: "cite",
  requirements: "cite",
  ecosystem: "exempt",
  manuals: "exempt",
  authors: "exempt",
  brands: "exempt",
  static: "exempt",
}

// Pre-existing, known gaps (slug relative to content/). Drain to empty, then remove.
// Populated from the first clean run so the gate ships blocking for new pages only.
// These 27 in-scope pages carry no citation form yet; drain via the house citation
// generator (claim-surface / bibliography data) or source them by hand. The 5
// program/* process pages are flagged for a scope decision (process vs claim pages).
const BACKLOG = new Set([
  "analytes/aluminum.md", "analytes/arsenic.md", "analytes/cadmium.md", "analytes/chromium.md",
  "analytes/lead.md", "analytes/mercury.md", "analytes/nickel.md", "analytes/tin.md",
  "why-we-limit/aluminum.md", "why-we-limit/arsenic.md", "why-we-limit/cadmium.md", "why-we-limit/chromium.md",
  "why-we-limit/lead.md", "why-we-limit/mercury.md", "why-we-limit/nickel.md", "why-we-limit/tin.md",
  "requirements/baby-food-heavy-metals.md", "requirements/california-baby-food-testing.md",
  "requirements/maryland-baby-food-testing.md", "requirements/private-label-manufacturers.md",
  "requirements/retailers.md", "requirements/supplements-heavy-metals.md",
  "program/corrective-action.md", "program/readiness.md", "program/remediation.md",
  "program/structure.md", "program/two-pathways.md",
])

const APPARATUS = /href="#ref-|<sup[^>]*class="[^"]*cite|^##\s*references\b/im
const DOI = /\bdoi\.org\//i
const REG_LINK = /\[\[regulations\//i.source + "|" + /\]\(\/regulations\//i.source
const REG_LINK_RE = new RegExp(REG_LINK, "i")
const HTTP = /https?:\/\//i

function splitFrontmatter(text) {
  if (!text.startsWith("---")) return { fm: "", body: text }
  const end = text.indexOf("\n---", 3)
  if (end === -1) return { fm: "", body: text }
  return { fm: text.slice(3, end), body: text.slice(end + 4) }
}

function fmHas(fm, key) {
  const re = new RegExp(`^${key}:\\s*\\S`, "im")
  return re.test(fm)
}

function fmType(fm) {
  const m = fm.match(/^type:\s*"?([a-z0-9-]+)"?/im)
  return m ? m[1] : ""
}

function isExemptPage(slug, base, fm) {
  if (base === "index.md") return true
  if (/(^|\/)index\.md$/.test(slug)) return true
  if (/-index$|^index$/.test(fmType(fm))) return true
  // listing / roundup pages that aggregate rather than assert
  if (slug === "articles/regulatory-watch.md") return true
  return false
}

function cited(body, fm, rule) {
  if (rule === "apparatus") return APPARATUS.test(body)
  if (rule === "standard") return fmHas(fm, "cert_doi") // registered => readiness-lint sourced it
  // A regulation cites the law by a resolvable URL or by naming the instrument
  // (the `reference` field, e.g. "Vietnam QCVN 8-2:2011/BYT"), which is the citation
  // for national laws that have no stable public URL.
  if (rule === "lawurl") return fmHas(fm, "regulation_page") || fmHas(fm, "url") || fmHas(fm, "reference") || HTTP.test(body)
  if (rule === "cite") return DOI.test(body) || APPARATUS.test(body) || REG_LINK_RE.test(body)
  return true
}

const violations = []
const checked = []

if (!fs.existsSync(CONTENT)) {
  console.error("citation-coverage-lint: content/ not found")
  process.exit(1)
}

for (const entry of fs.readdirSync(CONTENT, { withFileTypes: true })) {
  if (entry.name.startsWith(".")) continue
  if (entry.isFile()) {
    // content/ root pages are the site's nav/marketing/guide shell (home, portal,
    // verify, mark, apply, comparison, audience + SEO "guide" landers). They are out
    // of the v1 research-page scope locked for this gate. (v2 candidate: require
    // citations on the SEO topic landers, e.g. heavy-metals-in-rice, that assert
    // measured claims.) Fail-closed below applies to unknown research-page SUBDIRS.
    continue
  }
  const sub = entry.name
  const rule = RULES[sub]
  if (rule === undefined) {
    violations.push({ slug: sub + "/", blocking: true, reason: `unknown content type "${sub}" — classify it in citation-coverage-lint RULES (fail-closed)` })
    continue
  }
  if (rule === "exempt") continue
  const dir = path.join(CONTENT, sub)
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".md")) continue
    const slug = `${sub}/${file}`
    const text = fs.readFileSync(path.join(dir, file), "utf8")
    const { fm, body } = splitFrontmatter(text)
    if (isExemptPage(slug, file, fm)) continue
    // standards with no cert_doi are non-publishable scaffolds — exempt here.
    if (rule === "standard" && !fmHas(fm, "cert_doi")) continue
    const ok = cited(body, fm, rule)
    checked.push({ slug, rule, ok })
    if (!ok) {
      violations.push({ slug, blocking: !BACKLOG.has(slug), reason: `${sub} page has no ${rule} citation` })
    }
  }
}

if (listAll) {
  for (const c of checked) console.log(`${c.ok ? "ok  " : "MISS"} ${c.rule.padEnd(10)} ${c.slug}`)
}

const blocking = violations.filter((v) => v.blocking)
const grandfathered = violations.filter((v) => !v.blocking)

console.log(`citation-coverage-lint: ${checked.length} publishable pages checked; ${blocking.length} blocking, ${grandfathered.length} grandfathered`)
for (const v of blocking) console.log(`  BLOCK  ${v.slug} — ${v.reason}`)
if (grandfathered.length) console.log(`  (${grandfathered.length} grandfathered in BACKLOG; drain to zero then remove the set)`)

if (blocking.length && !warnOnly) process.exitCode = 1
