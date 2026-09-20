#!/usr/bin/env node
// Render the Infant & Child Foods (Category 1) Program Manual v3 landing page.
// Thin TOC: Governing Principles, lifecycle, mark/MU/CAPA/ratchet, Lot Testing
// Schedule, Cat-1 Standards Register (generated from the compiled corpus).
// Does not reprint per-analyte master-table walls. Numbers on the register are
// DOIs and HOLD reasons, not invented ppb.

import fs from "node:fs"
import path from "node:path"
import {
  buildRegister,
  snapshotFromRegister,
  EDITION,
  EDITION_DATE,
  DOI_SUFFIX,
  ZENODO_VERSION_DOI,
  ZENODO_CONCEPT_DOI,
  PDF_FILE,
  PDF_HREF,
  CITATION_TITLE,
  readExistingHouseDoi,
} from "./lib/cat1-manual-v3.mjs"
import { renderManualV3Page } from "./lib/manual-v3-page.mjs"

const REPO = process.cwd()
const OUT = path.join(REPO, "content/manuals/infant-and-child-foods.md")
const pdfServed = fs.existsSync(path.join(REPO, "content/static/manuals", PDF_FILE))

const register = buildRegister()
const snap = snapshotFromRegister(register)
const certDoi = readExistingHouseDoi()

const railBody = pdfServed
  ? `${EDITION} current (${EDITION_DATE}, Method v2.0). Live pages ${snap.live_pages}; cert-ready ${snap.cert_ready}. The v3 PDF is downloadable here. House DOI is minted under prefix 10.83138 after CEO PASS. The earlier Zenodo deposit ${ZENODO_VERSION_DOI} is an earlier deposited edition only.`
  : `${EDITION} current (${EDITION_DATE}, Method v2.0). Live pages ${snap.live_pages}; cert-ready ${snap.cert_ready}. The v3 PDF is in preparation. House DOI is minted under prefix 10.83138 after CEO PASS. The earlier Zenodo deposit ${ZENODO_VERSION_DOI} is an earlier deposited edition only.`

const page = renderManualV3Page({
  title: CITATION_TITLE,
  category: 1,
  manualSlug: "infant-and-child-foods",
  categoryName: "Infant and Child Foods",
  description: "The Method v2 governing instrument for Category 1.",
  pdfCover: pdfServed ? "/static/manuals/covers/infant-and-child-foods-v3.png" : null,
  editionChip: "Manual v3 · Method v2",
  snapshot: snap.snapshot,
  connections: [
    { label: "The standards register", href: "/standards" },
    { label: "How limits are derived", href: "/program/structure" },
    { label: "Verify a certificate", href: "/verify" },
    { label: "All Program Manuals", href: "/manuals" },
    { label: "Heavy Metal Index: literature baseline", href: "https://heavymetalindex.com" },
  ],
  pdfHref: pdfServed ? PDF_HREF : null,
  pdfLabel: `Download PDF · ${EDITION}`,
  railBody,
  effectiveDate: EDITION_DATE,
  updated: EDITION_DATE,
  certDoi,
  reportNumber: DOI_SUFFIX,
  extraFm: [
    "scholar_pdf: true",
    `doi_suffix: "${DOI_SUFFIX}"`,
    `earlier_edition_doi: "${ZENODO_VERSION_DOI}"`,
    `edition: "${EDITION}"`,
    "methodology_version: \"Method v2.0: government-limit default (CLAUDE.md Part 19, Governing Principles v2.0)\"",
  ],
  register,
})

fs.writeFileSync(OUT, page)
console.log(
  `build-cat1-manual: wrote ${path.relative(REPO, OUT)} (${EDITION}, ${snap.live_pages} live pages, ${snap.cert_ready} cert-ready, ${snap.hold} HOLD, pdf ${pdfServed ? "served" : "pending"})`,
)
console.log(`  earlier deposited edition (not current): ${ZENODO_VERSION_DOI}  concept ${ZENODO_CONCEPT_DOI}`)
