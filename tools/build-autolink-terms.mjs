#!/usr/bin/env node
// build-autolink-terms.mjs — generate the AutoLink vocabulary from the real corpus.
//
// The wiki-style AutoLink transformer (quartz/plugins/transformers/autolink.ts)
// links the first prose mention of any entity the cert corpus has a page for — an
// analyte, a product-category standard, a jurisdiction-named regulation, or a
// sibling briefing. This tool is the SINGLE SOURCE of that vocabulary: a curated
// alias layer (the precise, unambiguous prose phrasings — which cannot be reliably
// derived from titles) VALIDATED against the pages that actually exist, emitted to
//   quartz/plugins/transformers/autolink-terms.generated.ts
// so the vocabulary can never point at a renamed/removed slug and stays in sync as
// the corpus grows. The generated file is:
//   - imported by autolink.ts (the matcher/injector logic), and
//   - read by tools/audit-transformer-parity.mjs (AUTOLINK_TARGET_MISSING) as the
//     registry it validates — the reason it is named *.generated.ts and exposes a
//     GENERATED_TERMS Record<string,string>.
//
// PRECISION FIRST (a wrong link is worse than a missing one):
//   - Curated phrasings only; bare ambiguous words are excluded (the generic
//     single-word food categories: honey, salt, chocolate, vinegar, spices, bread,
//     pasta, flour; and "lead" the English verb is guarded — see GUARDS in
//     autolink.ts). Multiword forms recover the high-value links unambiguously.
//   - Every curated slug MUST resolve to a real page or this generator FAILS the
//     build — that is the ratchet that keeps the vocabulary honest.
//
// COMPOSES WITH, does not duplicate: regulatory *instrument*-code citations in
// standards prose ("REACH Annex XVII entry 72", "Directive 2009/48/EC", "EU
// 10/2011") are owned by tools/lib/regulatory-instruments.mjs via
// build-standards-reg-links.mjs. This vocabulary covers the JURISDICTION-NAMED
// regulation pages (Proposition 65, GB 2762, Codex CXS 193, FSANZ, Closer to
// Zero…) that the instrument register does not — and everywhere, not just
// standards. Phrasing frequencies below are from a corpus prose scan.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const CONTENT = path.join(repoRoot, "content")
const OUT = path.join(repoRoot, "quartz", "plugins", "transformers", "autolink-terms.generated.ts")

function slugsIn(dir) {
  const d = path.join(CONTENT, dir)
  if (!fs.existsSync(d)) return new Set()
  return new Set(
    fs
      .readdirSync(d)
      .filter((f) => f.endsWith(".md") && f !== "index.md")
      .map((f) => `${dir}/${f.slice(0, -3)}`),
  )
}
const existing = new Set([
  ...slugsIn("analytes"),
  ...slugsIn("standards"),
  ...slugsIn("regulations"),
  ...slugsIn("briefings"),
])

// ── Curated vocabulary. [type, slug, [phrasings], guardKey?] ────────────────
// guardKey names a disambiguation guard implemented in autolink.ts (only "lead").
const CURATED = [
  // Analytes — the panel metals (antimony: baby wipes only). Multiword forms first so "inorganic
  // arsenic" wins over "arsenic", "hexavalent chromium" over "chromium".
  ["analyte", "analytes/aluminum", ["aluminum", "aluminium"]],
  ["analyte", "analytes/antimony", ["antimony"]],
  ["analyte", "analytes/arsenic", ["inorganic arsenic", "arsenic"]],
  ["analyte", "analytes/cadmium", ["cadmium"]],
  ["analyte", "analytes/chromium", ["hexavalent chromium", "chromium"]],
  ["analyte", "analytes/lead", ["lead"], "lead"],
  ["analyte", "analytes/mercury", ["methylmercury", "mercury"]],
  ["analyte", "analytes/nickel", ["nickel"]],
  ["analyte", "analytes/tin", ["tin"]],

  // Product-category standards — conservative: specific, unambiguous phrasings
  // with a single clear target. Generic single food words and the two-target
  // "infant formula" (powder / ready-to-feed, no hub) are deliberately excluded.
  ["standard", "standards/canned-seafood", ["canned seafood"]],
  ["standard", "standards/olive-oil", ["olive oil"]],
  ["standard", "standards/cephalopods", ["cephalopods"]],
  ["standard", "standards/shellfish", ["shellfish"]],
  ["standard", "standards/rice-noodles", ["rice noodles"]],
  ["standard", "standards/seaweed-kelp-foods", ["seaweed & kelp", "seaweed and kelp"]],
  ["standard", "standards/sippy-cups-toddler-drinkware", ["sippy cups"]],
  ["standard", "standards/pacifiers-and-sucking-teething-aids", ["pacifiers"]],
  ["standard", "standards/teething-toys-teethers", ["teething toys", "teethers"]],

  // Jurisdiction-named regulations — unambiguous short names/codes seen in prose.
  ["regulation", "regulations/ca-prop65", ["Proposition 65", "Prop 65"]],
  ["regulation", "regulations/china-gb-2762", ["GB 2762"]],
  ["regulation", "regulations/codex-cxs-193", ["Codex CXS 193", "CXS 193", "Codex Standard 193"]],
  ["regulation", "regulations/au-nz-fsanz", ["Food Standards Code", "FSANZ"]],
  ["regulation", "regulations/eu-2023-915", ["Regulation (EU) 2023/915", "EU 2023/915"]],
  ["regulation", "regulations/uk-1881-2006", ["Regulation (EC) No 1881/2006", "1881/2006"]],
  ["regulation", "regulations/us-fda-c2z", ["Closer to Zero"]],
  ["regulation", "regulations/india-fssai", ["FSSAI"]],
  ["regulation", "regulations/mercosur-gmc-res-12-2011-inorganic-contaminants", ["MERCOSUR"]],

  // Sibling briefings — distinctive Title-Case titles only. Rarely fire (briefings
  // cross-refer by series number, not title), but precise and future-proofing.
  // "After Palmquist" is excluded (doubles as a temporal phrase / paper citation).
  ["briefing", "briefings/defense-counsel-briefing", ["The Evidence a Jury Will See"]],
  ["briefing", "briefings/the-big-8", ["The Big 8"]],
  ["briefing", "briefings/brief-2-open-category", ["The Open Category"]],
  ["briefing", "briefings/brief-8-surveillance-protocol", ["The Surveillance Protocol"]],
  ["briefing", "briefings/brief-4-cost-of-being-uncertified", ["The Cost of Being Uncertified"]],
  ["briefing", "briefings/brief-5-retailer-as-anchor", ["The Retailer as Anchor"]],
  ["briefing", "briefings/brief-6-premium-promise", ["The Premium Promise"]],
  ["briefing", "briefings/brief-3-what-organic-doesnt-say", ["What Organic Doesn't Say"]],
  ["briefing", "briefings/hmtc-primer", ["What HMTc Is"]],
  ["briefing", "briefings/the-prop-65-gap", ["Named as a Hazard, Left Unlimited"]],
]

// ── Validate every curated slug exists (the sync ratchet) ───────────────────
const missing = CURATED.filter(([, slug]) => !existing.has(slug)).map(([, slug]) => slug)
if (missing.length) {
  console.error(
    `build-autolink-terms: ${missing.length} curated AutoLink target(s) have no backing page — ` +
      `fix the slug or remove the entry:\n  ${missing.join("\n  ")}`,
  )
  process.exit(1)
}

// Duplicate-phrasing guard: a phrasing must map to ONE slug (case-insensitive).
const termOwner = new Map()
for (const [, slug, terms] of CURATED) {
  for (const t of terms) {
    const key = t.toLowerCase()
    if (termOwner.has(key) && termOwner.get(key) !== slug) {
      console.error(
        `build-autolink-terms: phrasing "${t}" maps to two slugs ` +
          `(${termOwner.get(key)} and ${slug}) — remove the ambiguity.`,
      )
      process.exit(1)
    }
    termOwner.set(key, slug)
  }
}

// ── Emit ────────────────────────────────────────────────────────────────────
const entries = CURATED.map(([type, slug, terms, guard]) => ({ type, slug, terms, guard }))
const flat = {}
for (const [, slug, terms] of CURATED) for (const t of terms) flat[t] = slug

const body = `// AUTO-GENERATED by tools/build-autolink-terms.mjs — DO NOT EDIT BY HAND.
// Regenerated in the cert prebuild; committed so tsc/build and the transformer
// parity lint (tools/audit-transformer-parity.mjs, AUTOLINK_TARGET_MISSING) can
// read the vocabulary without a prior generate step. Edit the curated table in
// the generator, not this file.
export type AutolinkType = "analyte" | "standard" | "regulation" | "briefing"
export interface AutolinkEntry {
  slug: string
  type: AutolinkType
  terms: string[]
  /** Names a disambiguation guard implemented in autolink.ts (e.g. "lead"). */
  guard?: string
}

export const AUTOLINK_ENTRIES: AutolinkEntry[] = ${JSON.stringify(entries, null, 2)
  .replace(/"(slug|type|terms|guard)":/g, "$1:")}

// Flat term→slug map. This is the registry surface tools/audit-transformer-parity.mjs
// validates (it keys on the GENERATED_TERMS name and checks each slug resolves).
export const GENERATED_TERMS: Record<string, string> = ${JSON.stringify(flat, null, 2)}
`

fs.writeFileSync(OUT, body, "utf8")
const nTerms = Object.keys(flat).length
console.log(
  `build-autolink-terms: wrote ${entries.length} entries / ${nTerms} phrasings ` +
    `to ${path.relative(repoRoot, OUT)}.`,
)
