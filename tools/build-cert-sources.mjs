#!/usr/bin/env node
// Emit the canonical "Sources" section on each Category-1 standard page — the same design as
// heavymetalindex.com's source legend (# | Citation | Year | Type | Used on this page for), rendered
// as a markdown table so it inherits the cert site's canonical `.wiki-content table` styling (red
// header), and populated from the page's compiled record: which government regulation supplies each
// analyte's binding maximum level or read-across, and what it is used for here.
//
// Runs after build-cat1-standard-pages (which rewrites the 8 rendered pages) and before
// build-cert-version-history, so the section sits between the derivation and the version history and
// survives the page re-render. Marker-bounded and idempotent.

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const COMPILED = path.join(REPO, "data/standards/cat1-compiled")
const PAGES = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/cat1-pages.json"), "utf8"))
const STD_DIR = path.join(REPO, "content/standards")
const BEGIN = "<!-- BEGIN: hmtc-sources -->"
const END = "<!-- END: hmtc-sources -->"

// jurisdiction -> regulation reference page + a short, recognizable citation + instrument type.
const REG = {
  EU: { slug: "eu-2023-915", cite: "Commission Regulation (EU) 2023/915", year: 2023, type: "Maximum levels" },
  UK: { slug: "uk-1881-2006", cite: "Contaminants in Food (retained Reg. 1881/2006)", year: 2006, type: "Maximum levels" },
  CODEX: { slug: "codex-cxs-193", cite: "Codex General Standard CXS 193-1995", year: 1995, type: "Codex standard" },
  CA: { slug: "canada-contaminants", cite: "Health Canada — List of Contaminants and Adulterating Substances", year: 2016, type: "Maximum/action levels" },
  CN: { slug: "china-gb-2762", cite: "GB 2762 — National Food Safety Standard", year: 2022, type: "Maximum levels" },
  IN: { slug: "india-fssai", cite: "FSSAI (Contaminants, Toxins and Residues) Regulations", year: 2011, type: "Maximum levels" },
  BR: { slug: "brazil-anvisa", cite: "ANVISA RDC — Inorganic Contaminant Limits", year: 2022, type: "Maximum levels" },
  GSO: { slug: "gso-193", cite: "GSO 193 — Gulf Technical Regulation", year: 2021, type: "Maximum levels" },
  "AU-NZ": { slug: "au-nz-fsanz", cite: "FSANZ Food Standards Code — Schedule 19", year: 2015, type: "Maximum levels" },
  US: { slug: "us-fda-c2z", cite: "US FDA — Closer to Zero action levels", year: 2020, type: "Guidance action levels" },
}
const JUR_ORDER = ["EU", "UK", "CODEX", "CA", "CN", "IN", "BR", "GSO", "AU-NZ", "US"]
const ANALYTE_NAME = { Pb: "lead", iAs: "inorganic arsenic", tHg: "mercury", Cd: "cadmium", Cr: "total chromium", Ni: "nickel", Sn: "tin", Al: "aluminium" }
const PANEL = ["Pb", "iAs", "tHg", "Cd", "Cr", "Ni", "Sn", "Al"]

function pagesToRender() {
  const out = [{ slug: "infant-formula-powder", variants: [{ record: "infant-formula-powder", variant: "cow" }, { record: "infant-formula-powder", variant: "soy" }] }]
  for (const p of PAGES.pages) out.push({ slug: p.slug, variants: p.variants })
  return out
}

function sourcesFor(page) {
  // jurisdiction -> { binding, readacross, evaluated } sets of analytes. A
  // government is a source whether its limit binds, supplies a read-across, or
  // was one of the values weighed but not selected (a comparator). The full set
  // is what "evaluated against each other" means and what the Derivation table
  // shows; listing only the binders would understate the work behind the number.
  const used = new Map()
  const ensure = (jur) => {
    if (!used.has(jur)) used.set(jur, { binding: new Set(), readacross: new Set(), evaluated: new Set() })
    return used.get(jur)
  }
  for (const v of page.variants) {
    const rec = JSON.parse(fs.readFileSync(path.join(COMPILED, `${v.record}.json`), "utf8"))
    const cells = rec.variants[v.variant]
    for (const a of PANEL) {
      const c = cells[a]
      if (!c) continue
      if (c.type === "gov") {
        const binder = c.binding_jurisdiction
        if (binder && REG[binder]) ensure(binder).binding.add(a)
        // every other government that sets a value for this analyte is a comparator
        if (c.per_country)
          for (const jur of Object.keys(c.per_country)) {
            if (jur === binder || !REG[jur]) continue
            ensure(jur).evaluated.add(a)
          }
      } else if (c.type === "read_across") {
        if (c.source_jurisdiction && REG[c.source_jurisdiction]) ensure(c.source_jurisdiction).readacross.add(a)
      }
    }
  }
  return used
}

function humanList(analytes) {
  // Analyte common-nouns stay lowercase — they sit mid-sentence after "Binds "/
  // "Comparator for ", so the leading capital belongs to the role word, not here.
  return [...analytes]
    .sort((a, b) => PANEL.indexOf(a) - PANEL.indexOf(b))
    .map((a) => ANALYTE_NAME[a])
    .join(", ")
}

function roleText(u) {
  const parts = []
  if (u.binding.size) parts.push(`Binds ${humanList(u.binding)}`)
  if (u.readacross.size) parts.push(`Read-across for ${humanList(u.readacross)}`)
  // A government that binds or supplies an analyte in one variant is not also
  // listed as a comparator for that same analyte (binding/read-across wins).
  const evalOnly = [...u.evaluated].filter((a) => !u.binding.has(a) && !u.readacross.has(a))
  if (evalOnly.length) parts.push(`Comparator for ${humanList(evalOnly)}`)
  return parts.join("; ")
}

function sourcesBlock(used) {
  // Binding regulations first, then read-across suppliers, then comparators;
  // stable within each tier by the canonical jurisdiction order.
  const tier = (j) => {
    const u = used.get(j)
    return u.binding.size ? 0 : u.readacross.size ? 1 : 2
  }
  const jurs = JUR_ORDER.filter((j) => used.has(j)).sort(
    (a, b) => tier(a) - tier(b) || JUR_ORDER.indexOf(a) - JUR_ORDER.indexOf(b),
  )
  const rows = jurs
    .map((j, i) => {
      const r = REG[j]
      return `| ${i + 1} | [${r.cite}](/regulations/${r.slug}) | ${r.year} | ${r.type} | ${roleText(used.get(j))} |`
    })
    .join("\n")
  return `${BEGIN}
## Source regulations

Every published government regulation weighed to set this standard, evaluated against each other. The strictest applicable maximum level binds each analyte; the rest are comparators, and where no government regulates the exact product the value is read across from the nearest government limit. Follow a reference for the source document and its per-analyte limits — the Derivation table above shows every value side by side.

| # | Regulation | Year | Instrument | Role in this standard |
| --- | --- | --- | --- | --- |
${rows}
${END}`
}

let n = 0
for (const page of pagesToRender()) {
  const absF = path.join(STD_DIR, `${page.slug}.md`)
  if (!fs.existsSync(absF)) continue
  let raw = fs.readFileSync(absF, "utf8")
  const block = sourcesBlock(sourcesFor(page))
  const reMarker = new RegExp(`\\n*${BEGIN}[\\s\\S]*?${END}\\n*`, "g")
  raw = raw.replace(reMarker, "\n") // strip prior block (idempotent)
  // Insert before the "Cite this standard" section; else before the version-history block; else append.
  // A blank line MUST precede the block: without it the markdown "## Source regulations" heading is
  // absorbed into the preceding raw-HTML <section> block (CommonMark HTML-block continuation) and
  // renders as literal "## ..." text. The \n\n on both sides guarantees the boundary.
  if (/<section id="cite"/.test(raw)) raw = raw.replace(/\n*(<section id="cite")/, `\n\n${block}\n\n$1`)
  else if (raw.includes("<!-- BEGIN: hmtc-version-history -->")) raw = raw.replace(/\n*(<!-- BEGIN: hmtc-version-history -->)/, `\n\n${block}\n\n$1`)
  else raw = `${raw.replace(/\n+$/, "")}\n\n${block}\n`
  fs.writeFileSync(absF, raw, "utf8")
  n++
}
console.log(`build-cert-sources: wrote Sources section on ${n} standard page(s)`)
