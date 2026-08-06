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
  // jurisdiction -> { binding:Set<analyte>, readacross:Set<analyte> }
  const used = new Map()
  const add = (jur, analyte, role) => {
    if (!jur || !REG[jur]) return
    if (!used.has(jur)) used.set(jur, { binding: new Set(), readacross: new Set() })
    used.get(jur)[role].add(analyte)
  }
  for (const v of page.variants) {
    const rec = JSON.parse(fs.readFileSync(path.join(COMPILED, `${v.record}.json`), "utf8"))
    const cells = rec.variants[v.variant]
    for (const a of PANEL) {
      const c = cells[a]
      if (!c) continue
      if (c.type === "gov") add(c.binding_jurisdiction, a, "binding")
      else if (c.type === "read_across") add(c.source_jurisdiction, a, "readacross")
    }
  }
  return used
}

function humanList(analytes) {
  const names = [...analytes].sort((a, b) => PANEL.indexOf(a) - PANEL.indexOf(b)).map((a) => ANALYTE_NAME[a])
  if (names.length === 1) return names[0].charAt(0).toUpperCase() + names[0].slice(1)
  const s = names.join(", ")
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function sourcesBlock(used) {
  const jurs = JUR_ORDER.filter((j) => used.has(j))
  const rows = jurs.map((j, i) => {
    const r = REG[j]
    const u = used.get(j)
    const parts = []
    if (u.binding.size) parts.push(`${humanList(u.binding)} — binding maximum level${u.binding.size > 1 ? "s" : ""}`)
    if (u.readacross.size) parts.push(`${humanList(u.readacross)} — read-across`)
    return `| ${i + 1} | [${r.cite}](/regulations/${r.slug}) | ${r.year} | ${r.type} | ${parts.join("; ")} |`
  }).join("\n")
  return `${BEGIN}
## Sources

The published government regulations this standard derives from. Each maximum level is a sovereign limit and each read-across the nearest applicable government value; follow a reference for the source document and its per-analyte limits. Mercury and, in non-dairy matrices, chromium carry no direct government limit for these products and are handled by the read-across and reflex-speciation rules described above.

| # | Citation | Year | Type | Used on this page for |
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
  if (/<section id="cite"/.test(raw)) raw = raw.replace(/(<section id="cite")/, `${block}\n$1`)
  else if (raw.includes("<!-- BEGIN: hmtc-version-history -->")) raw = raw.replace("<!-- BEGIN: hmtc-version-history -->", `${block}\n\n<!-- BEGIN: hmtc-version-history -->`)
  else raw = `${raw.replace(/\n+$/, "")}\n\n${block}\n`
  fs.writeFileSync(absF, raw, "utf8")
  n++
}
console.log(`build-cert-sources: wrote Sources section on ${n} standard page(s)`)
