// cat1-manual-v3.mjs — live SoT for Manual v3 (Infant and Child Foods).
//
// The Cat-1 Standards Register is generated from:
//   data/standards/cat1-pages.json          (live pages)
//   data/standards/cat1-compiled/*.json     (compiled records)
//   content/standards/<slug>.md             (cert_doi on the page)
//   tools/lib/claim-surface.mjs             (cert-ready vs HOLD)
//
// No ppb is authored here. Incomplete / unjoined records stay listed as HOLD.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import matter from "gray-matter"
import {
  evaluateClaimSurface,
  cellMaps,
  CLAIM_TOTALS,
} from "./claim-surface.mjs"
import { houseApaCite, HOUSE_COPYRIGHT } from "./house-cite.mjs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..")
const COMPILED = path.join(REPO, "data/standards/cat1-compiled")
const PAGES = JSON.parse(fs.readFileSync(path.join(REPO, "data/standards/cat1-pages.json"), "utf8"))
const STD_DIR = path.join(REPO, "content/standards")

export const EDITION = "Manual v3"
export const EDITION_DATE = "2026-09-19"
export const MANUAL_SLUG = "infant-and-child-foods"
export const DOI_SUFFIX = "hmtc.manual.infant-and-child-foods"
export const HOUSE_PREFIX = "10.83138"
export const ZENODO_VERSION_DOI = "10.5281/zenodo.20771543"
export const ZENODO_CONCEPT_DOI = "10.5281/zenodo.20270511"
export const ZENODO_V0_DOI = "10.5281/zenodo.20270512"
export const PDF_FILE = "HMTc-Infant-and-Child-Foods-Program-Manual-v3.pdf"
export const PDF_HREF = `/static/manuals/${PDF_FILE}`
export const BASE_URL = "https://heavymetalcertified.com/manuals/infant-and-child-foods"
export const CITATION_TITLE = "Infant and Child Foods: HMTc Program Manual"

/** Hero dek (`description`). Entity-first: Cat-1 program, not Method version. */
export const HERO_DEK =
  "Heavy metals certification for infant and child foods: limits, lot testing, and the Category 1 program."

/** Body lead. What this Manual does for Category 1 brands, labs, and retailers. */
export const MANUAL_LEAD =
  "This Manual governs Heavy Metal Certified for Category 1 infant and child foods. It binds brands, laboratories, and retailers to published limits, lot testing, the 90% stay-in-program gate, and the live Cat-1 Standards Register."

/** Dense Scholar / OG / JSON-LD abstract. Not the hero dek (`description`). */
export const SCHOLAR_ABSTRACT =
  "The Infant and Child Foods Program Manual is the Category 1 governing document for Heavy Metal Certified. The publisher is the Institute of Contaminant Standards. This edition is identified by DOI 10.83138/hmtc.manual.infant-and-child-foods. The Manual binds the live subcategory standard pages; those pages remain the derivation of each cell. Certification requires every published limit analyte to sit at or below 100 percent of its government floor or disclosed read-across. There is no band above a published limit that still earns the mark. The five Governing Principles are co-equal: drive down contamination, protect consumers, protect brands who enter, remain legally defensible, and become the de facto standard. None may be sacrificed to advance another. Totals are run on every completing lot. Speciation is a pathway reflex. After application, the Program Operator writes a lab-informed Lot Testing Schedule from the brand's laboratory capability. The program certifies only when there is at least 90 percent confidence the brand can remain in the program. The live Cat-1 Standards Register lists every subcategory page with its house DOI when cert-ready, or a HOLD reason when the claim-surface is incomplete. Incomplete cells are not cert-ready. Manual v3 uses Method v2 as its methodology; the v1 to v2 record is at https://heavymetalcertified.com/program/method. All rights reserved."

export const SCHOLAR_KEYWORDS = [
  "Infant and Child Foods",
  "Category 1",
  "Manual v3",
  "Method v2",
  "Heavy Metal Certified",
  "Institute of Contaminant Standards",
  "government floor",
  "read-across",
  "Lot Testing Schedule",
  "10.83138/hmtc.manual.infant-and-child-foods",
]

export const PRINCIPLES = [
  { k: "Drive down contamination", v: "The program exists to lower heavy-metal burden in products that reach people, not to decorate a label." },
  { k: "Protect consumers", v: "Limits, testing, and the mark are instruments of consumer protection. A certificate that cannot be trusted does not protect anyone." },
  { k: "Protect brands who enter", v: "A brand that enters in good faith, tests honestly, and stays inside the published rules is not set up to fail. Certification is offered only when the program has high confidence the brand can remain in the program." },
  { k: "Remain legally defensible", v: "Every published number traces to a named sovereign government maximum or a disclosed read-across. Nothing is invented. Incomplete claim-surface cells are not cert-ready." },
  { k: "Become the de facto standard", v: "The program is written to be the instrument the market, retailers, and regulators can actually use." },
]

const HOUSE_DOI = /^10\.83138\//
const ANY_DOI = /10\.\d{4,9}\/\S+/

const recCache = new Map()
function readRec(slug) {
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
  } catch { /* unreadable frontmatter is a HOLD, not an invented DOI */ }
  return null
}

function evaluateRecord(slug) {
  const rec = readRec(slug)
  if (!rec) return { slug, present: false, complete: false, reasons: ["compiled record missing"] }
  const reasons = []
  let complete = true
  for (const [variant, cells] of cellMaps(rec)) {
    const ev = evaluateClaimSurface({ slug, name: rec.name || slug, cells })
    if (!ev.complete) {
      complete = false
      if (ev.claim_empty.length) reasons.push(`${variant}: claim-surface empty ${ev.claim_empty.join(", ")}`)
      if (ev.rice_missing_ias) reasons.push(`${variant}: rice/infant cereal missing numeric iAs`)
      if (ev.species_parent_hits.length) {
        reasons.push(`${variant}: species>parent ${ev.species_parent_hits.map((h) => `${h.species}>${h.parent}`).join(", ")}`)
      }
    }
  }
  return { slug, name: rec.name || slug, present: true, complete, reasons, rice: /rice/i.test(slug) && !/non-rice/i.test(slug) }
}

export function buildRegister() {
  const joined = new Set()
  const pages = PAGES.pages.map((p) => {
    const children = [...new Set((p.variants || []).map((v) => v.record).filter(Boolean))]
    children.forEach((c) => joined.add(c))
    const childEvs = children.map(evaluateRecord)
    const missing = childEvs.filter((c) => !c.present)
    const incomplete = childEvs.filter((c) => c.present && !c.complete)
    const certDoi = pageCertDoi(p.slug)
    const holdReasons = []
    if (missing.length) holdReasons.push(`missing compiled: ${missing.map((c) => c.slug).join(", ")}`)
    if (incomplete.length) {
      holdReasons.push(incomplete.flatMap((c) => c.reasons.length ? c.reasons : [`${c.slug}: claim-surface FAIL`]).join("; "))
    }
    if (!certDoi) holdReasons.push("no house cert_doi (10.83138) on the live page")
    const certReady = holdReasons.length === 0
    return {
      kind: "page",
      slug: p.slug,
      name: p.name,
      href: `/standards/${p.slug}`,
      children,
      cert_doi: certDoi,
      cert_ready: certReady,
      hold_reason: certReady ? null : holdReasons.join("; "),
    }
  })

  const compiled = fs.readdirSync(COMPILED)
    .filter((f) => f.endsWith(".json") && !f.startsWith("derivation"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort()

  const orphans = compiled.filter((slug) => !joined.has(slug)).map((slug) => {
    const ev = evaluateRecord(slug)
    return {
      kind: "compiled-orphan",
      slug,
      name: ev.name || slug,
      href: null,
      children: [slug],
      cert_doi: null,
      cert_ready: false,
      hold_reason: "compiled record not joined to a live /standards/ page",
    }
  })

  return { pages, orphans, rows: [...pages, ...orphans] }
}

export function snapshotFromRegister(reg = buildRegister()) {
  const live = reg.pages.length
  const ready = reg.pages.filter((r) => r.cert_ready).length
  const hold = reg.rows.filter((r) => !r.cert_ready).length
  return {
    live_pages: live,
    cert_ready: ready,
    hold,
    compiled: live + reg.orphans.length,
    snapshot: [
      { k: "Live standard pages", v: String(live) },
      { k: "Cert-ready", v: `${ready} of ${live}` },
      { k: "Method", v: "v2.0 gov_floor | read_across" },
      { k: "Edition", v: `${EDITION} · ${EDITION_DATE}` },
    ],
  }
}

export function apaCite(doi) {
  return houseApaCite({ title: CITATION_TITLE, year: EDITION_DATE.slice(0, 4), doi })
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
  } catch { /* manifest optional */ }
  try {
    const vh = JSON.parse(fs.readFileSync(path.join(REPO, `data/standards/version-history/${MANUAL_SLUG}.json`), "utf8"))
    const cur = (vh.versions || []).find((v) => v.status === "current")
    if (cur && typeof cur.doi === "string" && HOUSE_DOI.test(cur.doi.trim())) return cur.doi.trim()
  } catch { /* version history optional */ }
  return null
}

export const COPYRIGHT = HOUSE_COPYRIGHT

export const PANEL_NOTE = `Claim-surface panel: the eight totals (${CLAIM_TOTALS.join(", ")}). Species (iAs, MeHg, Cr-VI) are pathway reflexes and never replace the parent. Rice and rice-derived infant cereals require numeric iAs. A blank claim-surface cell is HOLD, not cert-ready.`

export { CLAIM_TOTALS }
