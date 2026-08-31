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
  Al: { name: "Aluminium", why: "Grains and cereals, aluminium-based leavening agents (baking powder made with sodium aluminium sulfate or phosphate), and some tablet and capsule excipients carry high aluminium. No government sets an aluminium limit for solid infant food, so the standard holds these products to the strictest sovereign infant aluminium ceiling &mdash; the AU-NZ infant-formula limit &mdash; as a protective read-across, rather than to the only limit that names solid foods (an adult additive-residue allowance many times looser). Much of the excess comes from aluminium-based leavening, which a brand can reformulate away with aluminium-free baking powder." },
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

  // v3 canonical section chrome (canvas isManual #hard). Lora 400 30px h2 with the
  // hairline underline; the section id feeds the "On this page" rail. NO bold — the
  // analyte name is a Lora accordion heading, never a font-weight lead-in.
  const H2 = `font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px`
  // id kept as "hard" (design-lint enforces the canonical manual section id); only the
  // visible heading text is shortened to "Risk Flag" per the program owner (rail space).
  const head = `<section style="margin-bottom:52px"><h2 id="hard" style="${H2}">Risk Flag</h2>`

  if (byAnalyte.size === 0) {
    return `${head}<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;max-width:74ch;margin:0 0 14px">On the published occurrence literature to date, no subcategory in ${esc(categoryName)} shows a systematic gap between typical market levels and the limit &mdash; the limit being the strictest government maximum for each product (Method v2.0). Certification is decided on a product&rsquo;s own tested result, not on a distribution; individual lots or suppliers can still exceed a limit.</p><p style="font-size:12.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:0">See <a href="/hard-to-meet" style="color:${LINK}">the cross-category summary</a> of the ingredients that most often struggle.</p></section>`
  }

  // Analyte pages for the "Analyte page →" link inside each accordion panel.
  const ANALYTE_PAGE = { iAs: "/analytes/arsenic", tAs: "/analytes/arsenic", Al: "/analytes/aluminum", tHg: "/analytes/mercury", MeHg: "/analytes/mercury", Cd: "/analytes/cadmium", Pb: "/analytes/lead", Ni: "/analytes/nickel", Sn: "/analytes/tin" }

  // One accordion row per analyte, worst ratio first — the canvas hardRows shape:
  // a Lora summary carrying a +/− sign and the analyte name; the panel holds the
  // mechanism prose, a mono multiplier · subcategory grid, and the analyte link.
  const order = [...byAnalyte.entries()].sort((a, b) => Math.max(...b[1].map((x) => x.ratio)) - Math.max(...a[1].map((x) => x.ratio)))
  const rows = order.map(([an, list], i) => {
    list.sort((a, b) => b.ratio - a.ratio)
    const items = list.map((x) =>
      `<span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap;font-variant-numeric:tabular-nums">~${showRatio(x.ratio)}&times;</span><span style="font-size:13.5px;line-height:1.55;color:#736b6b">${esc(x.name)} <span style="color:#a9a1a1">(the ${x.limit} ppb limit)</span>${x.thin ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#c3b9b9"> thin data</span>` : ""}</span>`,
    ).join("")
    const link = ANALYTE_PAGE[an]
      ? `<a href="${ANALYTE_PAGE[an]}" style="display:inline-block;margin-top:16px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${LINK};text-decoration:none">Analyte page &rarr;</a>`
      : ""
    return `<details class="hmtc-mhard"${i === 0 ? " open" : ""}>
<summary class="hmtc-mhard-sum"><span class="hmtc-mhard-sign" aria-hidden="true"></span><span class="hmtc-mhard-name">${esc(MECHANISM[an].name)}</span></summary>
<div class="hmtc-mhard-panel">
<p style="font-size:15.5px;line-height:1.76;color:#3f3a3a;margin:0 0 16px;max-width:78ch">${MECHANISM[an].why}</p>
<div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px 16px;align-items:baseline">${items}</div>${link}
</div>
</details>`
  }).join("\n")

  const intro = `<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;max-width:74ch;margin:0 0 22px">These subcategories carry a natural or process background that runs above the limit &mdash; the limit being the strictest government maximum for the product, never a percentile of market data (Method v2.0). A product is not disqualified by this: only its own tested result decides certification, and a well-sourced lot can sit well below the market. What the pooled occurrence literature shows is where the work is &mdash; which ingredients demand exceptional sourcing.</p>`
  const foot = `<p style="font-size:12.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:18px 0 0">Multipliers are the ratio of the pooled occurrence median to the published limit; occurrence characterises the market only and carries no compliance weight. See <a href="/hard-to-meet" style="color:${LINK}">the cross-category summary</a>.</p>`
  return `${head}${intro}<div class="hmtc-mhard-list">${rows}</div>${foot}</section>`
}

// ── per-standard Risk Flag (adopted on /standards/<slug> pages, 2026-08-31) ──────
// The single-subcategory analogue of renderStruggleSection. Occurrence-driven flags for
// THIS standard's own analytes (pooled median >= 1.5x the published limit), plus curated
// process/mechanism cautions for matrices whose risk is intrinsic to the process rather
// than shown by a market survey. Occurrence carries NO compliance weight; the limit is
// always the strictest government maximum (Method v2.0).
//
// CURATED entries are for matrices with a real, mechanism-based contamination pathway but
// NO occurrence survey (so the data-driven pass cannot flag them, and asserting "commonly
// fails" would be false). They are framed as controllable, input-dependent cautions —
// never as an intrinsic ceiling. Add one only where the mechanism is sound and disclosed.
const CURATED_PROCESS_RISK = {
  "pet-food-fermentation-derived-protein": {
    name: "A process that concentrates metals from its inputs",
    why: "A precision-fermented single-cell protein carries no lifetime environmental accumulation, so its heavy-metal load is set entirely by its inputs &mdash; a control lever, not a guarantee of cleanliness. The yeast biomass actively concentrates metals from its growth medium: cell-wall biosorption pulls in lead, cadmium, and nickel, and inorganic arsenic is imported through the phosphate-uptake pathway, so a phosphate-fed fermentation can enrich it. The mineral and nutrient premix is itself a recognised metal vector. The finished protein is only as clean as its sourced-and-tested feedstock and premix &mdash; a controllable, input-dependent risk rather than an intrinsic ceiling, which is why every certified lot is assayed against the full panel instead of presumed clean by process. Inorganic arsenic and cadmium are the analytes to watch.",
  },
}

export function renderRiskFlagForStandard({ slug, name, cells, occurrence, categoryDirName, LINK = "#1c43ad", ACCENT = "#9f2727" }) {
  const H2 = `font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px`
  const head = `<section style="margin-bottom:52px"><h2 id="risk-flag" style="${H2}">Risk Flag</h2>`
  const screen = SCREEN_ANALYTES[categoryDirName] || new Set()
  const occCells = (occurrence && occurrence.cells) || occurrence || {}
  const ANALYTE_PAGE = { iAs: "/analytes/arsenic", tAs: "/analytes/arsenic", Al: "/analytes/aluminum", tHg: "/analytes/mercury", MeHg: "/analytes/mercury", Cd: "/analytes/cadmium", Pb: "/analytes/lead", Ni: "/analytes/nickel", Sn: "/analytes/tin" }

  const flags = []
  for (const [an, cell] of Object.entries(cells || {})) {
    const limit = cell && cell.value
    if (limit == null || !MECHANISM[an] || screen.has(an)) continue
    if (ANOMALY_EXCLUDE.has(`${slug}|${an}`)) continue
    const oc = occCells[`${slug}|${an}`] && occCells[`${slug}|${an}`].occurrence
    if (!oc || !oc.has_data) continue
    const median = oc.central && oc.central.value_ppb
    const n = oc.n_samples || 0
    if (median == null || n < MIN_N || median / limit < MIN_RATIO) continue
    flags.push({ an, limit, ratio: median / limit, n, thin: n < 8 })
  }
  flags.sort((a, b) => b.ratio - a.ratio)
  const curated = CURATED_PROCESS_RISK[slug]

  if (!flags.length && !curated) {
    return `${head}<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;max-width:74ch;margin:0 0 14px">On the published occurrence literature to date, ${esc(name)} shows no systematic gap between typical market levels and the limit &mdash; the limit being the strictest government maximum for the product (Method v2.0). Certification is decided on a product&rsquo;s own tested result, not on a distribution; an individual lot or supplier can still exceed a limit.</p><p style="font-size:12.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:0">See <a href="/hard-to-meet" style="color:${LINK}">the cross-category summary</a> of the ingredients that most often struggle.</p></section>`
  }

  const rows = []
  if (curated) {
    rows.push(`<details class="hmtc-mhard" open>
<summary class="hmtc-mhard-sum"><span class="hmtc-mhard-sign" aria-hidden="true"></span><span class="hmtc-mhard-name">${esc(curated.name)}</span></summary>
<div class="hmtc-mhard-panel">
<p style="font-size:15.5px;line-height:1.76;color:#3f3a3a;margin:0;max-width:78ch">${curated.why}</p>
</div>
</details>`)
  }
  flags.forEach((x, i) => {
    const link = ANALYTE_PAGE[x.an] ? `<a href="${ANALYTE_PAGE[x.an]}" style="display:inline-block;margin-top:16px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:${LINK};text-decoration:none">Analyte page &rarr;</a>` : ""
    rows.push(`<details class="hmtc-mhard"${!curated && i === 0 ? " open" : ""}>
<summary class="hmtc-mhard-sum"><span class="hmtc-mhard-sign" aria-hidden="true"></span><span class="hmtc-mhard-name">${esc(MECHANISM[x.an].name)}</span></summary>
<div class="hmtc-mhard-panel">
<p style="font-size:15.5px;line-height:1.76;color:#3f3a3a;margin:0 0 16px;max-width:78ch">${MECHANISM[x.an].why}</p>
<div style="display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px 16px;align-items:baseline"><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap;font-variant-numeric:tabular-nums">~${showRatio(x.ratio)}&times;</span><span style="font-size:13.5px;line-height:1.55;color:#736b6b">pooled market median vs the ${x.limit} ppb limit${x.thin ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#c3b9b9"> thin data</span>` : ""}</span></div>${link}
</div>
</details>`)
  })
  const intro = `<p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;max-width:74ch;margin:0 0 22px">Where certification is demanding for this subcategory, and why. ${curated && !flags.length ? "The load here is set by process inputs rather than a market background, so it is controllable but real." : "These carry a natural or process background that runs above the limit &mdash; the limit being the strictest government maximum for the product, never a percentile of market data (Method v2.0)."} A product is not disqualified by this &mdash; only its own tested result decides certification, and a well-sourced lot can sit well below the market.</p>`
  const foot = `<p style="font-size:12.5px;line-height:1.7;color:#a9a1a1;max-width:84ch;margin:18px 0 0">${flags.length ? "Multipliers are the ratio of the pooled occurrence median to the published limit; occurrence characterises the market only and carries no compliance weight. " : "This flag is a mechanism-based caution, not a market survey, and carries no compliance weight. "}See <a href="/hard-to-meet" style="color:${LINK}">the cross-category summary</a>.</p>`
  return `${head}${intro}<div class="hmtc-mhard-list">${rows.join("\n")}</div>${foot}</section>`
}
