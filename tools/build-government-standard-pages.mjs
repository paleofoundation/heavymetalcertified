#!/usr/bin/env node

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const DATA = path.join(REPO, "data/standards")
const OUT = path.join(REPO, "content/standards")
const report = JSON.parse(fs.readFileSync(path.join(DATA, "hmtc-category-completion.json"), "utf8"))
const sync = JSON.parse(fs.readFileSync(path.join(DATA, "government-standards-sync.json"), "utf8"))

const DIR_BY_CATEGORY = new Map([
  [1, "cat1-compiled"], [3, "cat3-compiled"], [6, "seafood-compiled"],
  [7, "cat7-compiled"], [9, "cat9-compiled"], [24, "cat24-compiled"], [25, "cat25-compiled"],
])
const PUBLIC_SLUG = new Map([
  ["fruit-juice", "fruit-juice-not-canned"],
  ["infant-formula-rtf-liquid", "infant-formula-ready-to-feed"],
  ["root-vegetable-purees-single-ingredient", "root-vegetable-purees"],
  ["fruit-purees-general", "fruit-purees"],
])
const LABEL = {
  Pb: "Lead (Pb)", Cd: "Cadmium (Cd)", tAs: "Total arsenic (tAs)", tHg: "Total mercury (tHg)",
  Ni: "Nickel (Ni)", Sn: "Tin (Sn)", Al: "Aluminium (Al)", Cr: "Total chromium (Cr)",
  iAs: "Inorganic arsenic (iAs)", "Cr-VI": "Hexavalent chromium (Cr-VI)", MeHg: "Methylmercury (MeHg)",
}
const PANEL_ROLE = Object.fromEntries([
  ...report.canonical_panel.totals.map((analyte) => [analyte, "Required total"]),
  ...report.canonical_panel.core_species.map((analyte) => [analyte, "Required species"]),
  ...report.canonical_panel.conditional_species.map((analyte) => [analyte, "Conditional species"]),
])
const PANEL = report.canonical_panel.compiled_order

function esc(value) {
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function tableText(value) {
  return esc(value).replace(/\|/g, "&#124;").replace(/\s+/g, " ").trim()
}

function yaml(value) {
  return JSON.stringify(String(value))
}

function recordVariants(record) {
  return record.variants || { both: record.cells }
}

function publicSlug(slug) {
  return PUBLIC_SLUG.get(slug) || slug
}

function basisLabel(record) {
  if (record.native_basis_label) return record.native_basis_label
  return ({
    as_sold: "as sold",
    as_consumed: "as consumed",
    dry: "dry product",
    reconstituted: "reconstituted product",
  })[record.native_basis] || String(record.native_basis || "product-native basis").replaceAll("_", " ")
}

function numeric(cell) {
  return typeof cell?.value_exact === "number" || typeof cell?.value === "number"
}

function numericValue(cell) {
  return typeof cell.value_exact === "number" ? cell.value_exact : cell.value
}

function sourceId(cell) {
  return cell?.binding_id || cell?.source_id || cell?.source_page || cell?.binding_tHg_source || null
}

function jurisdiction(cell) {
  return cell?.binding_jurisdiction || cell?.source_jurisdiction || null
}

function defaultUnit(record) {
  return record.native_basis_label?.toLowerCase().includes("migration") ? "µg/kg food" : "µg/kg"
}

function displayValue(cell, record) {
  if (numeric(cell)) {
    const suffix = cell.type === "read_across" ? " (read-across)" : cell.type === "special" ? " (special basis)" : ""
    const nd = cell.not_detectable ? " — not-detectable ceiling" : ""
    return `${numericValue(cell)} ${cell.unit || defaultUnit(record)}${suffix}${nd}`
  }
  if (cell.type === "subsumed") return `Bounded by ${cell.subsumed_by || cell.bounded_by || "parent total"}`
  if (cell.type === "not_material") return "Screened; no separate numeric limit"
  if (cell.type === "control") return "Mandatory testing/control; no numeric limit"
  return "Unresolved"
}

function decisionLabel(cell) {
  return ({
    gov: "Direct sovereign maximum",
    read_across: "Disclosed sovereign read-across",
    special: "Sovereign special-basis limit",
    control: "Mandatory nonnumeric control",
    not_material: "Controlled not-material determination",
    subsumed: "Species bounded by parent total",
  })[cell.type] || cell.type
}

function sourceDisplay(cell) {
  const source = sourceId(cell)
  const jur = jurisdiction(cell)
  if (!source) return cell.bounded_by || cell.subsumed_by ? `Bounded by ${cell.bounded_by || cell.subsumed_by}` : "Control record"
  return jur ? `${jur} · ${source}` : source
}

function explanation(cell) {
  return cell.control || cell.rationale || cell.label || cell.basis_note || "No additional explanation recorded."
}

function method(cell) {
  return cell.reference_method || cell.basis || cell.basis_note || "Use the category laboratory method on the stated native basis."
}

function loadRecord(category, row) {
  const dir = DIR_BY_CATEGORY.get(Number(category.category))
  if (!dir) throw new Error(`no compiled directory for Category ${category.category}`)
  const record = JSON.parse(fs.readFileSync(path.join(DATA, dir, `${row.slug}.json`), "utf8"))
  if (record.slug !== row.slug) throw new Error(`compiled/public slug mismatch for ${row.slug}`)
  return record
}

function pageFrontmatter(category, row, record, stats) {
  const basis = basisLabel(record)
  const slug = publicSlug(row.slug)
  const name = record.name || row.slug.replaceAll("-", " ")
  return [
    "---",
    `title: ${yaml(`${name} — HMTc Standard`)}`,
    "type: standard",
    `description: ${yaml(`Government-anchored HMTc limits and mandatory controls for ${name}, covering eight total metals plus required species determinations.`)}`,
    `category: ${category.category}`,
    `category_name: ${yaml(category.name)}`,
    `product_slug: ${row.slug}`,
    `public_slug: ${slug}`,
    "custom_page: true",
    `subcategory: ${yaml(name)}`,
    `firm_analytes: ${stats.numeric}`,
    `controlled_analytes: ${stats.controlled}`,
    `native_basis: ${yaml(basis)}`,
    'standard_version: "Government-anchor review 2026-08"',
    'methodology_version: "Method v2.0 — government-limit-only initial standard"',
    "standard_status: governance-review",
    `source_snapshot_commit: ${yaml(sync.source_commit)}`,
    `effective_date: ${report.generated_on}`,
    "scholar_eligible: false",
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "snapshot:",
    '  - { k: "Required totals", v: "8 / 8 present" }',
    `  - { k: "Numeric cells", v: "${stats.numeric}" }`,
    `  - { k: "Controlled cells", v: "${stats.controlled}" }`,
    `  - { k: "Native basis", v: ${yaml(basis)} }`,
    "connections:",
    '  - { label: "All HMTc standards", href: "/standards" }',
    '  - { label: "How initial limits are set", href: "/program/structure" }',
    '  - { label: "Heavy Metal Index evidence base", href: "https://heavymetalindex.com" }',
    "---",
    "",
  ].join("\n")
}

function renderPage(category, row, record) {
  const variants = recordVariants(record)
  const variantEntries = Object.entries(variants)
  const cells = variantEntries.flatMap(([, panel]) => PANEL.map((analyte) => panel[analyte]))
  if (cells.some((cell) => !cell)) throw new Error(`${row.slug} does not carry every canonical panel cell`)
  const stats = { numeric: cells.filter(numeric).length, controlled: cells.filter((cell) => !numeric(cell)).length }
  const name = record.name || row.slug.replaceAll("-", " ")
  const basis = basisLabel(record)

  const limitRows = []
  for (const [variant, panel] of variantEntries) {
    for (const analyte of PANEL) {
      const cell = panel[analyte]
      limitRows.push(`| ${tableText(LABEL[analyte])} | ${PANEL_ROLE[analyte]} | ${variantEntries.length > 1 ? tableText(variant) : "—"} | ${tableText(displayValue(cell, record))} | ${tableText(decisionLabel(cell))} | <code>${tableText(sourceDisplay(cell))}</code> |`)
    }
  }

  const controlledRows = []
  const readAcrossRows = []
  for (const [variant, panel] of variantEntries) {
    for (const analyte of PANEL) {
      const cell = panel[analyte]
      const variantLabel = variantEntries.length > 1 ? variant : "—"
      if (!numeric(cell)) {
        controlledRows.push(`| ${tableText(LABEL[analyte])} | ${tableText(variantLabel)} | ${tableText(explanation(cell))} | ${tableText(method(cell))} | ${tableText(cell.bounded_by || cell.subsumed_by || "—")} |`)
      } else if (cell.type === "read_across") {
        readAcrossRows.push(`| ${tableText(LABEL[analyte])} | ${tableText(variantLabel)} | ${tableText(displayValue(cell, record))} | <code>${tableText(sourceDisplay(cell))}</code> | ${tableText(explanation(cell))} |`)
      }
    }
  }

  const scope = [record.scope_note, record.governing_basis].filter(Boolean).map((item) => `<p>${esc(item)}</p>`).join("\n")
  const limitTable = [
    "| Analyte | Panel role | Variant | Limit or control | Decision | Government source record |",
    "| --- | --- | --- | --- | --- | --- |",
    ...limitRows,
  ].join("\n")
  const controls = controlledRows.length ? [
    '<section id="controls">',
    "",
    "## Mandatory controls and species decisions",
    "",
    "A nonnumeric cell does not remove the analyte from testing. It records the governed control used when no defensible sovereign numeric maximum exists for the exact cell.",
    "",
    "| Analyte | Variant | Requirement and rationale | Reference method or basis | Bounded by |",
    "| --- | --- | --- | --- | --- |",
    ...controlledRows,
    "",
    "</section>",
  ].join("\n") : ""
  const readAcross = readAcrossRows.length ? [
    '<section id="read-across">',
    "",
    "## Disclosed sovereign read-acrosses",
    "",
    "These values come from the nearest applicable sovereign product or matrix limit. They are not occurrence-derived values.",
    "",
    "| Analyte | Variant | Selected limit | Sovereign source record | Why this comparator is used |",
    "| --- | --- | --- | --- | --- |",
    ...readAcrossRows,
    "",
    "</section>",
  ].join("\n") : ""

  const body = [
    '<section id="status">',
    "## Publication status",
    "",
    `<div style="border-left:3px solid #8b2a4a;background:#fbf5f7;padding:18px 22px"><p style="margin:0;font-size:15.5px;line-height:1.75;color:#5a4148">Government-anchored standard under governance review. Numeric cells are the strictest applicable sovereign maxima or disclosed sovereign read-acrosses. Control cells keep testing mandatory without inventing a number. This public record is not an occurrence-derived threshold and does not become a final certification boundary until governance approval.</p></div>`,
    "</section>",
    '<section id="scope">',
    "## Product scope and basis",
    "",
    `<p>${esc(name)} is evaluated on its ${esc(basis)} basis.</p>`,
    scope,
    "</section>",
    '<section id="limits">',
    "## Complete analyte panel",
    "",
    "Eight total-element results are required: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional required species decisions; methylmercury is conditional. Species never replace the parent total result.",
    "",
    limitTable,
    "</section>",
    readAcross,
    controls,
    '<section id="method">',
    "## How these cells are set",
    "",
    "The initial HMTc value is the strictest applicable maximum level set by a credible sovereign government in the product's native basis. If no government regulates the exact cell, the method uses a disclosed read-across from the nearest applicable sovereign value or an explicit nonnumeric control with its laboratory method. Public occurrence data describe markets and research gaps; they do not select the initial certification value. The 8:1 powder-to-liquid conversion is confined to infant formula.",
    "</section>",
    '<section id="provenance">',
    "## Provenance",
    "",
    `<p>Frozen from the Heavy Metal Index deterministic standards compiler at commit <code>${esc(sync.source_commit)}</code>. Source report date: ${esc(report.generated_on)}. Every numeric cell retains its selected government-register row identifier above.</p>`,
    "</section>",
  ].filter(Boolean).join("\n\n")

  return `${pageFrontmatter(category, row, record, stats)}${body}\n`
}

function legacyOverview(slug, title, targets) {
  const links = targets.map((target) => `- [${target.label}](/standards/${publicSlug(target.slug)})`).join("\n")
  return `---\ntitle: ${yaml(`${title} — HMTc Standards`)}\ntype: standard\ndescription: ${yaml(`Choose the governed ${title.toLowerCase()} formulation row.`)}\ncustom_page: true\nproduct_slug: ${slug}\nstandard_status: formulation-selector\naudience: [regulator, brand-legal, retailer-compliance, certifier]\nconnections:\n  - { label: "All HMTc standards", href: "/standards" }\n---\n\n<section id="formulations">\n\n## Choose the applicable formulation\n\nThis former combined page is now split because the governing maximum differs by formulation. Use the row that matches the product; the split must not be collapsed during certification.\n\n${links}\n\n</section>\n`
}

function renderIndex(records) {
  const numericTotal = report.categories.reduce((sum, category) => sum + category.numeric_total_cells, 0)
  const controlledTotal = report.categories.reduce((sum, category) => sum + category.controlled_total_cells, 0)
  const categoryRows = report.categories.map((category) => `| ${category.category} — ${tableText(category.name)} | ${category.compiled_rows} / ${category.planned_rows} | ${category.compiled_variants} | ${category.numeric_total_cells} | ${category.controlled_total_cells} | ${tableText(category.status)} |`).join("\n")
  const groups = report.categories.map((category) => {
    const rows = category.rows.map((row) => {
      const record = records.get(`${category.category}:${row.slug}`)
      return `| [${tableText(record.name || row.slug)}](/standards/${publicSlug(row.slug)}) | ${row.variants} | ${row.numeric_total_cells} / ${row.variants * 8} | ${row.controlled_total_cells} |`
    }).join("\n")
    return `<section id="category-${category.category}">\n\n## Category ${category.category} — ${category.name}\n\n${category.note || ""}\n\n| Standard row | Variants | Numeric total cells | Controlled total cells |\n| --- | ---: | ---: | ---: |\n${rows}\n\n</section>`
  }).join("\n\n")
  const unresolved = [
    ...report.categories.flatMap((category) => category.unresolved_rows.map((slug) => ({ category: category.category, name: category.name, slug, reason: category.note }))),
    ...report.policy_blocked_categories.flatMap((category) => category.unresolvedRows.map((slug) => ({ category: category.category, name: category.name, slug, reason: category.reason }))),
  ]
  const unresolvedRows = unresolved.map((item) => `| ${item.category} — ${tableText(item.name)} | <code>${tableText(item.slug)}</code> | ${tableText(item.reason)} |`).join("\n")

  return `---\ntitle: "HMTc Standards"\ntype: standards-index\ndescription: "The public register of government-anchored HMTc product standards: eight total metals, required species decisions, disclosed read-acrosses, and explicit unresolved rows."\naudience: [regulator, brand-legal, retailer-compliance, certifier]\nsnapshot:\n  - { k: "Resolved product rows", v: "62" }\n  - { k: "Product variants", v: "64" }\n  - { k: "Numeric total cells", v: "${numericTotal}" }\n  - { k: "Controlled total cells", v: "${controlledTotal}" }\nconnections:\n  - { label: "How limits are derived", href: "/program/structure" }\n  - { label: "Program Manuals", href: "/manuals" }\n  - { label: "Heavy Metal Index — evidence base", href: "https://heavymetalindex.com" }\n---\n\n<section id="method">\n\n## What is published here\n\nThis register exposes the current government-anchored cells for governance review. The initial numeric limit is never selected from product occurrence. It is the strictest applicable sovereign maximum in the product's native basis, followed only when necessary by a disclosed sovereign read-across or an explicit nonnumeric control. Final certification use begins after governance approval of the row.\n\nThe canonical laboratory contract always includes eight totals: Pb, Cd, total arsenic, total mercury, Ni, Sn, Al, and total Cr. Inorganic arsenic and Cr(VI) are additional species decisions; methylmercury is conditional.\n\n</section>\n\n<section id="completion">\n\n## Category completion\n\n| Category | Resolved / planned rows | Variants | Numeric total cells | Controlled total cells | Status |\n| --- | ---: | ---: | ---: | ---: | --- |\n${categoryRows}\n\n</section>\n\n${groups}\n\n<section id="unresolved">\n\n## Deliberately unresolved rows\n\nThese rows remain visible because inventing a certification value would violate the method. They are not silently dropped.\n\n| Category | Row | Why it remains unresolved |\n| --- | --- | --- |\n${unresolvedRows}\n\n</section>\n\n<section id="provenance">\n\n## Register provenance\n\nFrozen from Heavy Metal Index commit <code>${sync.source_commit}</code>; compiler report date ${report.generated_on}. The certification site carries the frozen public snapshot, while the independent Index retains the regulatory register and derivation machinery.\n\n</section>\n`
}

fs.mkdirSync(OUT, { recursive: true })
const records = new Map()
let pages = 0
for (const category of report.categories) {
  for (const row of category.rows) {
    const record = loadRecord(category, row)
    records.set(`${category.category}:${row.slug}`, record)
    fs.writeFileSync(path.join(OUT, `${publicSlug(row.slug)}.md`), renderPage(category, row, record))
    pages += 1
  }
}

const legacy = [
  ["baby-cereals-dry", "Baby cereals — dry", [
    { slug: "baby-cereals-dry-rice-based", label: "Rice-based dry baby cereals" },
    { slug: "baby-cereals-dry-non-rice", label: "Non-rice dry baby cereals" },
  ]],
  ["mixed-meals", "Infant mixed meals", [
    { slug: "mixed-meals-rice-containing", label: "Rice-containing infant mixed meals" },
    { slug: "mixed-meals-non-rice", label: "Non-rice infant mixed meals" },
  ]],
  ["teething-and-snacks", "Infant teething foods and snacks", [
    { slug: "teething-and-snacks-rice-based", label: "Rice-based teething foods and snacks" },
    { slug: "teething-and-snacks-non-rice", label: "Non-rice teething foods and snacks" },
  ]],
]
for (const [slug, title, targets] of legacy) fs.writeFileSync(path.join(OUT, `${slug}.md`), legacyOverview(slug, title, targets))
fs.writeFileSync(path.join(OUT, "index.md"), renderIndex(records))

console.log(`build-government-standard-pages: wrote ${pages} governed row pages, ${legacy.length} formulation selectors, and the standards register`)
