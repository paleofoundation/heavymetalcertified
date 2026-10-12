// cat26-manual.mjs — live SoT for the Category 26 Program Manual (Manual v1).
//
// The standards register is generated from:
//   data/standards/cat26-pages.json
//   data/standards/cat26-compiled/*.json
//   content/standards/<slug>.md  (cert_doi)
//
// No analyte ceiling is authored here. Aluminium and the seven-metal
// read-across are read back from the compiled cells.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import { houseApaCite, HOUSE_COPYRIGHT } from "./house-cite.mjs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const COMPILED = path.join(REPO, "data/standards/cat26-compiled")
const PAGES = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/cat26-pages.json"), "utf8"))
const STD_DIR = path.join(REPO, "content/standards")

export const EDITION = "Manual v1"
export const EDITION_DATE = "2026-10-12"
export const MANUAL_SLUG = "peptides-sarms-and-research-chemicals"
export const DOI_SUFFIX = "hmtc.manual.peptides-sarms-and-research-chemicals"
export const HOUSE_PREFIX = "10.83138"
export const PDF_FILE = "HMTc-Peptides-SARMs-and-Research-Chemicals-Program-Manual-v1.pdf"
export const PDF_HREF = `/static/manuals/${PDF_FILE}`
export const BASE_URL = "https://heavymetalcertified.com/manuals/peptides-sarms-and-research-chemicals"
export const CITATION_TITLE = "Peptides, SARMs, and Research Chemicals: HMTc Program Manual"
export const COPYRIGHT = HOUSE_COPYRIGHT

export const SLUG_ORDER = [
  "aas-injectable",
  "peptides-injectable-hormones",
  "peptides-nasal-sublingual",
  "research-chem-raw-powders",
  "sarms-oral",
]

const PARENTERAL = new Set(["aas-injectable", "peptides-injectable-hormones", "peptides-nasal-sublingual"])
const ORAL = new Set(["research-chem-raw-powders", "sarms-oral"])
const METALS = ["Pb", "Cd", "tAs", "tHg", "Ni", "Sn", "Cr"]
const HOUSE_DOI = /^10\.83138\//

const recCache = new Map()
export function readRec(slug) {
  if (!recCache.has(slug)) {
    const p = path.join(COMPILED, `${slug}.json`)
    recCache.set(slug, fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null)
  }
  return recCache.get(slug)
}

function pageCertDoi(slug) {
  const p = path.join(STD_DIR, `${slug}.md`)
  if (!fs.existsSync(p)) return null
  try {
    const fm = matter(fs.readFileSync(p, "utf8")).data
    const raw = fm.cert_doi
    if (typeof raw === "string" && HOUSE_DOI.test(raw.trim())) return raw.trim()
  } catch { /* unreadable frontmatter is a HOLD */ }
  return null
}

export function buildRegister() {
  const bySlug = new Map(PAGES.pages.map((p) => [p.slug, p]))
  const rows = SLUG_ORDER.map((slug) => {
    const page = bySlug.get(slug)
    const rec = readRec(slug)
    const certDoi = pageCertDoi(slug)
    const hold = []
    if (!page) hold.push("not in cat26-pages.json")
    if (!rec) hold.push("compiled record missing")
    if (!certDoi) hold.push("no house cert_doi (10.83138) on the live page")
    return {
      slug,
      name: page?.name || rec?.name || slug,
      href: `/standards/${slug}`,
      cert_doi: certDoi,
      cert_ready: hold.length === 0,
      hold_reason: hold.length ? hold.join("; ") : null,
      route_group: PARENTERAL.has(slug) ? "parenteral" : "oral",
    }
  })
  return { rows, pages: rows, orphans: [] }
}

export function limitGroups() {
  const groups = { parenteral: [], oral: [] }
  for (const slug of SLUG_ORDER) {
    const rec = readRec(slug)
    if (!rec?.cells) throw new Error(`cat26 limitGroups: missing cells for ${slug}`)
    const bucket = PARENTERAL.has(slug) ? "parenteral" : ORAL.has(slug) ? "oral" : null
    if (!bucket) throw new Error(`cat26 limitGroups: ${slug} is in neither route group`)
    const metals = {}
    for (const a of METALS) {
      const v = rec.cells[a]?.value
      if (typeof v !== "number") throw new Error(`cat26 limitGroups: ${slug} ${a} is not numeric`)
      metals[a] = v
    }
    const al = rec.cells.Al?.value
    if (typeof al !== "number") throw new Error(`cat26 limitGroups: ${slug} Al is not numeric`)
    for (const sp of ["iAs", "MeHg", "Cr-VI"]) {
      const c = rec.cells[sp]
      if (!c || c.value != null) throw new Error(`cat26 limitGroups: ${slug} ${sp} should be a capped species with no separate number`)
    }
    groups[bucket].push({ slug, metals, al })
  }
  for (const key of ["parenteral", "oral"]) {
    const [first, ...rest] = groups[key]
    for (const row of rest) {
      for (const a of METALS) {
        if (row.metals[a] !== first.metals[a]) {
          throw new Error(`cat26 limitGroups: ${key} ${a} diverged (${first.slug} ${first.metals[a]} vs ${row.slug} ${row.metals[a]})`)
        }
      }
      if (row.al !== first.al) throw new Error(`cat26 limitGroups: ${key} Al diverged`)
    }
  }
  return {
    metals: METALS,
    parenteralAl: groups.parenteral[0].al,
    oralAl: groups.oral[0].al,
    parenteralMetals: groups.parenteral[0].metals,
    oralMetals: groups.oral[0].metals,
  }
}

export function apaCite(doi) {
  return houseApaCite({ title: CITATION_TITLE, year: EDITION_DATE.slice(0, 4), doi, kind: "manual" })
}

export function readExistingHouseDoi() {
  const pagePath = path.join(REPO, "content/manuals", `${MANUAL_SLUG}.md`)
  if (fs.existsSync(pagePath)) {
    try {
      const fm = matter(fs.readFileSync(pagePath, "utf8")).data
      for (const key of ["cert_doi", "manual_doi"]) {
        if (typeof fm[key] === "string" && HOUSE_DOI.test(fm[key].trim())) return fm[key].trim()
      }
    } catch { /* unreadable page is not an invented DOI */ }
  }
  try {
    const man = JSON.parse(fs.readFileSync(path.join(REPO, "data/manuals/manifest.json"), "utf8"))
    const row = (man.manuals || []).find((m) => m.slug === MANUAL_SLUG)
    if (row && typeof row.doi === "string" && HOUSE_DOI.test(row.doi.trim())) return row.doi.trim()
  } catch { /* manifest miss is not an invented DOI */ }
  return null
}
