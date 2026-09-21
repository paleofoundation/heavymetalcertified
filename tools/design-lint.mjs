#!/usr/bin/env node
// design-lint.mjs — the deterministic, no-browser design-canon gate.
//
// WHY THIS EXISTS. The canon (docs/design-canon/) keeps getting quietly ignored,
// and the cause is always the same: a session eyeballs one page, "matches" it, and
// never runs the rendered gate (check:v3) because it needs a browser and is not in
// the build chain. So canon lived as prose, and prose does not block a build.
//
// This lint is the ALWAYS-RUNS floor. It reads generated content — no browser, no
// dependencies — and fails the build on the mechanical, non-negotiable canon rules:
//
//   1. NO BOLD on the reading surface (docs/design-canon/CONTENT-RULES.md §"No bold").
//      Emphasis is the type system's job — Lora headings, IBM Plex Mono labels —
//      never font-weight. So: no inline `font-weight: 600|700|800|900|bold`, and no
//      raw <strong>/<b> in the content HTML. (font-weight:500 is the canon's label /
//      measured-value weight and is allowed; markdown **…** is neutralised to 400 by
//      the sitewide CSS rule in cert-chrome.scss, so it is not flagged here.)
//
//   2. CANONICAL TABLE (advisory). A generated <table> should inherit the one
//      canonical rule (.wiki-content table, cert-chrome.scss) rather than hand-roll
//      its <thead> background inline. Reported as a count, non-blocking, because the
//      existing inline-styled derivation/master tables are a known backlog that the
//      generator refactor / page redesigns will drain.
//
// The rendered-truth companion is `npm run check:v3` (Playwright), wired into the
// release path — it catches cascade wins this source scan cannot. Run both.
//
// Flags:
//   --warn-only   never exit 1 (staged rollout / backlog-drain window)
//   --all         make the ADVISORY scope blocking too (briefings/articles/program)
//
// Exit non-zero on any BLOCKING violation (build-blocking in the cert prebuild).

import fs from "node:fs"
import path from "node:path"
import {
  lintHeroDek,
  lintManualLead,
  lintManualSections,
  lintTokenCss,
  lintStandardsHaveNoManualCover,
  lintCat1ManualShape,
  parseFrontmatterDescription,
  CAT1_MANUAL,
} from "./lib/manual-density-lint.mjs"
import { lintAnalyteTierStatus } from "./lib/analyte-tier-status-lint.mjs"

const repoRoot = process.cwd()
const CONTENT = path.join(repoRoot, "content")
const WARN_ONLY = process.argv.includes("--warn-only")
const ALL_BLOCKING = process.argv.includes("--all")

// The reading surface where "no bolded text anywhere" is enforced hard. These are
// the data pages a regulator / brand-legal reader audits. Program manuals are the
// bound, citable editions of the standards — the same audience, the same hard rule.
const BLOCKING_DIRS = ["standards", "regulations", "manuals"]
// Prose surfaces held to the same rule, advisory until their backlog is drained.
const ADVISORY_DIRS = ["briefings", "articles", "program", "brands", "why-we-limit"]

const INLINE_BOLD = /font-weight:\s*(?:bold|[6-9]00)\b/i
const STRONG_TAG = /<strong[\s>]/i
const B_TAG = /<b[\s>]/i // matches <b> / <b …>, not <br>, <blockquote>, <body>

const blocking = []
const advisory = []
let scanned = 0
let tableBacklog = 0

function scopeOf(file) {
  const rel = path.relative(CONTENT, file)
  const top = rel.split(path.sep)[0]
  if (BLOCKING_DIRS.includes(top)) return "blocking"
  if (ADVISORY_DIRS.includes(top)) return "advisory"
  return null // chrome/index/etc. — out of scope for the reading-surface rule
}

function lint(file) {
  const scope = scopeOf(file)
  if (!scope) return
  scanned++
  const rel = path.relative(repoRoot, file)
  // A finding is blocking when it is on the hard reading surface (standards /
  // regulations), or when --all promotes every scope to blocking.
  const sink = scope === "blocking" || ALL_BLOCKING ? blocking : advisory

  const lines = fs.readFileSync(file, "utf8").split("\n")
  lines.forEach((line, i) => {
    const n = i + 1
    if (INLINE_BOLD.test(line)) {
      const m = line.match(INLINE_BOLD)
      sink.push(`${rel}:${n}  inline bold — ${m[0]} (canon: no bold; use 400, or 500 for mono labels/values)`)
    }
    if (STRONG_TAG.test(line)) sink.push(`${rel}:${n}  <strong> tag (canon: no bold; render at normal weight)`)
    if (B_TAG.test(line)) sink.push(`${rel}:${n}  <b> tag (canon: no bold; render at normal weight)`)
  })

  // Canonical-table advisory: a hand-rolled table head instead of .wiki-content table.
  if (/<thead[\s>][\s\S]*?background:/i.test(lines.join("\n")) || /<tr[^>]*style="[^"]*background:#9f2727/i.test(lines.join("\n"))) {
    tableBacklog++
  }
}

function walk(dir, cb) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, cb)
    else if (e.name.endsWith(".md")) cb(full)
  }
}

walk(CONTENT, lint)

// ---- Analyte Tier 1/2 must not drive certification status -------------------
// Method v2: every claim analyte is equal at the gate. A leftover "Tier 1
// exceedance vs Tier 2 exceedance" branch, a Tier column on the claim surface,
// or a reaction-ladder footnote is a blocking defect. Product risk tiers and
// the appeals committee tiers are different axes and are not flagged.
function walkTierStatus(dir, cb) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walkTierStatus(full, cb)
    else if (/\.(md|mjs|json)$/.test(e.name)) cb(full)
  }
}
const TIER_STATUS_ROOTS = [
  path.join(CONTENT, "program"),
  path.join(CONTENT, "manuals"),
  path.join(CONTENT, "analytes"),
  path.join(CONTENT, "why-we-limit"),
  path.join(CONTENT, "briefings"),
  path.join(CONTENT, "standards"),
  path.join(CONTENT, "mark.md"),
  path.join(repoRoot, "data/manuals/cat1-manual"),
  path.join(repoRoot, "data/briefings"),
  path.join(repoRoot, "data/analytes"),
  path.join(repoRoot, "data/why-limited"),
  path.join(repoRoot, "data/method/method-v2.json"),
  path.join(repoRoot, "tools/lib/manual-v3-page.mjs"),
  path.join(repoRoot, "tools/lib/manual-page.mjs"),
]
let tierStatusScanned = 0
for (const root of TIER_STATUS_ROOTS) {
  const files = []
  if (fs.existsSync(root) && fs.statSync(root).isFile()) files.push(root)
  else walkTierStatus(root, (f) => files.push(f))
  for (const file of files) {
    tierStatusScanned++
    const rel = path.relative(repoRoot, file)
    blocking.push(...lintAnalyteTierStatus(fs.readFileSync(file, "utf8"), rel))
  }
}

// ---- Program-manual structural conformance ---------------------------------
// Every Program Manual page must be the canonical v3 shape emitted by
// tools/lib/manual-page.mjs: hero + rails driven by frontmatter (never a
// hand-rolled hero), and the canonical body sections. This catches a hand-edited
// or off-generator manual that would otherwise drift silently from the design.
// See docs/design-canon/MANUAL-PAGE.md and [[project_manual_v3_canonical_design]].
const MANUALS = path.join(CONTENT, "manuals")
let manualsChecked = 0
if (fs.existsSync(MANUALS)) {
  for (const f of fs.readdirSync(MANUALS)) {
    if (!f.endsWith(".md") || f === "index.md") continue // index.md is the manuals-index page, not a manual
    manualsChecked++
    const rel = path.relative(repoRoot, path.join(MANUALS, f))
    const raw = fs.readFileSync(path.join(MANUALS, f), "utf8")
    const fmEnd = raw.indexOf("\n---", 3)
    const fm = fmEnd === -1 ? "" : raw.slice(0, fmEnd)
    const body = fmEnd === -1 ? raw : raw.slice(fmEnd)
    // The hero title is the HeroBand (frontmatter `title`); a body <h1> is the old
    // duplicate-title defect.
    if (/<h1[\s>]/i.test(body)) blocking.push(`${rel}  hand-rolled <h1> in body — the manual hero is the HeroBand (frontmatter title); remove it (regenerate via tools/lib/manual-page.mjs)`)
    // Frontmatter must drive the hero dek, the page-snapshot card (other manuals),
    // and the rail. Cat-1 Manual v3 is a governing instrument: no hero snapshot.
    const requiredFm = f === `${CAT1_MANUAL}.md`
      ? ["description:", "hero_snapshot:", "connections:"]
      : ["description:", "snapshot:", "connections:"]
    for (const key of requiredFm) {
      if (!new RegExp(`(^|\\n)${key}`).test(fm)) blocking.push(`${rel}  frontmatter missing \`${key}\` (canonical manual hero/rail contract; regenerate via tools/lib/manual-page.mjs)`)
    }
    if (f === `${CAT1_MANUAL}.md`) {
      if (/(^|\n)snapshot:/.test(fm)) blocking.push(`${rel}  Cat-1 Manual v3 must not emit a hero page-snapshot (register chrome on a governing-instrument page); regenerate via tools/build-cat1-manual.mjs`)
      if (!/(^|\n)hero_snapshot:\s*false\b/.test(fm)) blocking.push(`${rel}  Cat-1 Manual v3 must set \`hero_snapshot: false\` so Document DOI is the right-column authority signal`)
    }
    // Cat-1 Manual v3 uses the locked thin TOC. Other category manuals keep the
    // shared matrix landing until they are rewritten the same way.
    const v3Ids = ["principles", "lifecycle", "instruments", "lot-testing", "register", "edition"]
    const v2Ids = ["scope", "matrix", "hard", "edition"]
    const ids = f === "infant-and-child-foods.md" ? v3Ids : v2Ids
    for (const id of ids) {
      if (!new RegExp(`<h2 id="${id}"`).test(body)) blocking.push(`${rel}  missing canonical section <h2 id="${id}"> (regenerate via tools/lib/manual-page.mjs)`)
    }
    const dek = parseFrontmatterDescription(fm)
    blocking.push(...lintHeroDek(dek, rel))
    blocking.push(...lintManualSections(body, rel))
    blocking.push(...lintManualLead(body, rel, { required: f === `${CAT1_MANUAL}.md` }))
    if (f === `${CAT1_MANUAL}.md`) blocking.push(...lintCat1ManualShape(raw, rel))
  }
}

const TOKENS_SCSS = path.join(repoRoot, "quartz/styles/tokens.scss")
if (fs.existsSync(TOKENS_SCSS)) {
  blocking.push(...lintTokenCss(fs.readFileSync(TOKENS_SCSS, "utf8")))
} else {
  blocking.push("quartz/styles/tokens.scss  missing — spacing scale 8/16/24/48/72 must be locked in the shared design system")
}

const STANDARDS = path.join(CONTENT, "standards")
if (fs.existsSync(STANDARDS)) {
  for (const f of fs.readdirSync(STANDARDS)) {
    if (!f.endsWith(".md")) continue
    const rel = path.relative(repoRoot, path.join(STANDARDS, f))
    const raw = fs.readFileSync(path.join(STANDARDS, f), "utf8")
    blocking.push(...lintStandardsHaveNoManualCover(raw, rel))
  }
}

// ---- Hand-maintained nav copy: no em dashes --------------------------------
// The sitewide language rule (docs/design-canon/CONTENT-RULES.md §7, "Avoid em
// dashes") is enforced at the content layer by tools/dedash-content.mjs, but that
// sweep only touches content/**. The mega-menu copy in
// quartz/components/generated/navPanels.ts is hand-maintained (build-nav-panels is
// NOT in prebuild — see [[project_cert_nav_hand_maintained]]), renders on EVERY
// page, and is therefore the one hand-authored surface most likely to reintroduce
// an em dash site-wide. It is pure menu copy (headings + blurbs), never citation
// text, so zero em dashes is the rule; rephrase with a colon/comma if one creeps in.
const NAVPANELS = path.join(repoRoot, "quartz/components/generated/navPanels.ts")
let navPanelsChecked = 0
if (fs.existsSync(NAVPANELS)) {
  navPanelsChecked = 1
  const rel = path.relative(repoRoot, NAVPANELS)
  fs.readFileSync(NAVPANELS, "utf8")
    .split("\n")
    .forEach((line, i) => {
      if (/—|&mdash;/.test(line)) blocking.push(`${rel}:${i + 1}  em dash in nav copy — ${line.trim().slice(0, 90)} (canon: no em dashes; use a colon or comma)`)
    })
}

// ---- Report -----------------------------------------------------------------
if (advisory.length) {
  console.warn(`design-lint: ${advisory.length} advisory no-bold finding(s) (non-blocking):`)
  for (const a of advisory) console.warn(`  · ${a}`)
}
if (tableBacklog) {
  console.warn(`design-lint: ${tableBacklog} generated table(s) hand-roll head styling instead of .wiki-content table (canonicalization backlog; advisory).`)
}

if (blocking.length) {
  console.error(`design-lint: ${blocking.length} BLOCKING no-bold violation(s):`)
  for (const b of blocking) console.error(`  ✗ ${b}`)
  console.error(`\ndesign-lint: fix the source (no bold; manuals section gap ≥ token floor; hero/lead not a word pile).`)
  if (!WARN_ONLY) process.exit(1)
  console.error("design-lint: (--warn-only) not failing the build.")
}

console.log(
  `design-lint: OK — ${scanned} reading-surface page(s) scanned, no bold in ${BLOCKING_DIRS.join("/")}` +
    `; ${manualsChecked} program manual(s) conform to the canonical v3 shape` +
    `; ${tierStatusScanned} surface(s) clean of analyte-tier status architecture` +
    (navPanelsChecked ? `; nav copy clean of em dashes` : "") +
    (advisory.length ? ` (${advisory.length} advisory)` : "") +
    ".",
)
process.exit(0)
