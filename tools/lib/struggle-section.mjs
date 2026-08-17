// struggle-section.mjs — the canonical "What is likely to struggle to meet this standard" section
// rendered on every category Program Manual page (build-cat1-manual.mjs + build-category-manual.mjs).
//
// THE RULE (per the program owner): every manual page names, for the category as a whole, the
// products and ingredients least likely to meet the standard, and why — so a brand can self-assess
// before applying and a reader sees the program disclose where its own numbers bite.
//
// Data-driven, with a curation layer. For each compiled record × analyte, a "struggle" is flagged
// when the pooled occurrence median exceeds the published limit with enough samples. But raw
// occurrence has three failure modes this layer handles:
//   1. ANOMALIES — implausible pools (mercury at 83 ppb in infant formula, 261 in rice, 129 in oil;
//      mercury does not accumulate in those matrices). Explicitly excluded, with a reason, until the
//      occurrence pool is reviewed. Better to under-claim than to publish a false "you cannot meet this."
//   2. REFLEX-SCREEN analytes — total arsenic in seafood is mostly non-toxic organic arsenic; the tAs
//      limit is a screen that triggers inorganic-arsenic speciation, not a certification barrier.
//      Excluded per-category so seafood is not mislabelled as failing an arsenic ceiling it does not have.
//   3. THE "WHY" — a curated mechanism library, so the explanation is sound rather than inferred.
//
// Occurrence carries NO compliance weight and sets no limit; the limit is always the strictest
// government maximum (Method v2.0). The phrasing keeps the government-limit anchor next to any
// pooling term so method-drift-lint passes.

import fs from "node:fs"
import path from "node:path"

// analyte -> { name, why } — curated, mechanism-sound.
const MECHANISM = {
  iAs: { name: "Inorganic arsenic", why: "Inorganic arsenic is taken up from soil, irrigation water, and seawater; rice and rice-derived ingredients, and some seaweeds, carry it far above the strictest sovereign limits." },
  tAs: { name: "Total arsenic", why: "Rice and rice-derived ingredients carry high total arsenic; where the category sets total arsenic as a firm ceiling rather than a speciation screen, rice-based products run above it." },
  Al: { name: "Aluminium", why: "Grains and cereals, aluminium-based leavening agents (baking powder made with sodium aluminium sulfate or phosphate), and some tablet and capsule excipients carry high aluminium. The only government aluminium limit is written for infant formula and read across to other products; its application to solids is under methodological review, so this limit may itself change." },
  tHg: { name: "Mercury", why: "Large and predatory fish and other marine ingredients accumulate methylmercury up the food chain." },
  MeHg: { name: "Methylmercury", why: "Large and predatory fish and other marine ingredients accumulate methylmercury up the food chain." },
  Cd: { name: "Cadmium", why: "Cocoa, leafy greens, sunflower and other seeds, organ meats, shellfish, seaweed, and some root vegetables concentrate cadmium from soil and seawater." },
  Pb: { name: "Lead", why: "Lead is taken up from soil and can enter through adulteration; grains and rice, protein and collagen powders, spices, root and tuber vegetables, and some botanicals are common carriers." },
  Ni: { name: "Nickel", why: "Legumes, nuts, cocoa, and oats are naturally high in nickel." },
  Sn: { name: "Tin", why: "Acidic foods in unlined or older tinplate cans pick up tin by migration from the can." },
}

// record|analyte occurrence pools that are implausible for the matrix — excluded pending an
// occurrence-pool review at the Heavy Metal Index. Documented so the exclusion is auditable.
const ANOMALY_EXCLUDE = new Map([
  ["infant-formula-powder|tHg", "mercury pool implausibly high for a milk/soy formula matrix"],
  ["rice-bulk-grain|tHg", "mercury pool implausibly high for rice; likely a mispooled marine study"],
  ["cooking-oils-other|tHg", "mercury pool implausibly high for an oil matrix"],
  ["dairy-milk-cow|Pb", "lead median implausibly high for retail milk; pending occurrence review"],
  ["dairy-milk-cow|Cd", "cadmium median implausibly high for milk; pending occurrence review"],
])

// Per-compiled-dir analytes that function as a reflex SCREEN (not a firm ceiling), so exceeding them
// is not a certification barrier and must not be framed as "struggling to meet."
const SCREEN_ANALYTES = {
  "seafood-compiled": new Set(["tAs"]),
}

const MIN_N = 3
// Only surface a genuine gap: the pooled median must sit at least 1.5x over the limit. Barely-over
// cases (1.0-1.5x, roughly half the market clearing) are borderline, not a systematic struggle, and
// clutter the section — they are left out rather than dressed up as "~1x".
const MIN_RATIO = 1.5
const showRatio = (r) => (r >= 10 ? Math.round(r) : Math.round(r * 10) / 10)

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// Read every compiled record in a dir → [{ slug, name, cells }].
function readRecords(compiledDir) {
  const out = []
  for (const fn of fs.readdirSync(compiledDir).filter((f) => f.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(path.join(compiledDir, fn), "utf8"))
    const variants = j.variants && typeof j.variants === "object" ? j.variants : { _: j.cells || {} }
    const cells = variants[Object.keys(variants)[0]] || {}
    out.push({ slug: fn.replace(".json", ""), name: j.name || fn.replace(/\.json$/, "").replace(/-/g, " "), cells })
  }
  return out
}

// occurrence: the loaded { cells: {...} } object; categoryDirName: e.g. "cat1-compiled".
// Returns an HTML <section> string (always — the section is canonical), including an honest
// "no systematic gap" statement when nothing struggles.
export function renderStruggleSection({ compiledDir, occurrence, categoryDirName, categoryName, LINK = "#1c43ad", ACCENT = "#9f2727" }) {
  const records = readRecords(compiledDir)
  const screen = SCREEN_ANALYTES[categoryDirName] || new Set()
  const occCells = occurrence.cells || occurrence

  // gather struggles: analyte -> [{ name, limit, median, ratio, n, thin }]
  const byAnalyte = new Map()
  for (const rec of records) {
    for (const [an, cell] of Object.entries(rec.cells)) {
      const limit = cell && cell.value
      if (limit == null || !MECHANISM[an]) continue
      if (screen.has(an)) continue
      if (ANOMALY_EXCLUDE.has(`${rec.slug}|${an}`)) continue
      const o = occCells[`${rec.slug}|${an}`] && occCells[`${rec.slug}|${an}`].occurrence
      if (!o || !o.has_data) continue
      const median = o.central && o.central.value_ppb
      const n = o.n_samples || 0
      if (median == null || n < MIN_N || median / limit < MIN_RATIO) continue
      if (!byAnalyte.has(an)) byAnalyte.set(an, [])
      byAnalyte.get(an).push({ name: rec.name, limit, ratio: median / limit, n, thin: n < 8 })
    }
  }

  const H2 = `font-family:Lora,serif;font-weight:400;font-size:28px;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 18px`
  const head = `<section style="margin-bottom:44px"><h2 style="${H2}">What is likely to struggle to meet this standard</h2>`

  if (byAnalyte.size === 0) {
    return `${head}<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:80ch;margin:0 0 12px">On the published occurrence literature to date, no subcategory in ${esc(categoryName)} shows a systematic gap between typical market levels and the limit &mdash; the limit being the strictest government maximum for each product (Method v2.0). Certification is decided on a product&rsquo;s own tested result, not on a distribution; individual lots or suppliers can still exceed a limit.</p><p style="font-size:12px;line-height:1.6;color:#a9a1a1;max-width:80ch;margin:0">See <a href="/hard-to-meet" style="color:${LINK};text-decoration:none">the cross-category summary</a> of the ingredients that most often struggle.</p></section>`
  }

  // order analytes by worst ratio, render one paragraph each
  const order = [...byAnalyte.entries()].sort((a, b) => Math.max(...b[1].map((x) => x.ratio)) - Math.max(...a[1].map((x) => x.ratio)))
  const blocks = order.map(([an, list]) => {
    list.sort((a, b) => b.ratio - a.ratio)
    const items = list.map((x) => `${esc(x.name)} (typically ~${showRatio(x.ratio)}&times; the ${x.limit} ppb limit${x.thin ? ", thin data" : ""})`).join("; ")
    return `<p style="font-size:13.5px;line-height:1.7;color:#3f3a3a;max-width:80ch;margin:0 0 14px"><span style="font-weight:500">${MECHANISM[an].name}.</span> ${MECHANISM[an].why} In this category: ${items}.</p>`
  }).join("\n")

  const intro = `<p style="font-size:13.5px;line-height:1.7;color:#736b6b;max-width:80ch;margin:0 0 16px">These subcategories carry a natural or process background that runs above the limit &mdash; the limit being the strictest government maximum for the product, never a percentile of market data (Method v2.0). A product is not disqualified by this: only its own tested result decides certification, and a well-sourced lot can sit well below the market. What the pooled occurrence literature shows is where the work is &mdash; which ingredients demand exceptional sourcing.</p>`
  const foot = `<p style="font-size:12px;line-height:1.6;color:#a9a1a1;max-width:80ch;margin:14px 0 0">Multipliers are the ratio of the pooled occurrence median to the published limit; occurrence characterises the market only and carries no compliance weight. See <a href="/hard-to-meet" style="color:${LINK};text-decoration:none">the cross-category summary</a>.</p>`
  return `${head}${intro}${blocks}\n${foot}</section>`
}
