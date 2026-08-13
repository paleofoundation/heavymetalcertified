#!/usr/bin/env node
// postbuild-cert-data-jsonld.mjs — inject schema.org DataCatalog / Dataset /
// DataDownload markup into the rendered /data page so answer engines and
// dataset indexers can discover and cite the published HMTc standards data.
//
// Built from content/static/data/catalog.json (produced by
// build-standards-export.mjs), so the counts, version, byte sizes, and download
// URLs it advertises are exactly the files on disk — it cannot drift from them.
//
// Mirrors postbuild-cert-jsonld.mjs (homepage org graph): runs after the Quartz
// build, marker-bounded, idempotent.

import fs from "node:fs"
import path from "node:path"

const PUBLIC = path.join(process.cwd(), "public")
const CATALOG = path.join(process.cwd(), "content/static/data/catalog.json")
const CERT_BASE = "https://heavymetalcertified.com"

const PUBLISHER = {
  "@type": "Organization",
  "@id": `${CERT_BASE}/#organization`,
  name: "Institute of Contaminant Standards",
}

if (!fs.existsSync(CATALOG)) {
  console.log("postbuild-cert-data-jsonld: content/static/data/catalog.json not found (skipping; run build-standards-export.mjs).")
  process.exit(0)
}
const htmlPath = [path.join(PUBLIC, "data", "index.html"), path.join(PUBLIC, "data.html")].find((p) => fs.existsSync(p))
if (!htmlPath) {
  console.log("postbuild-cert-data-jsonld: rendered /data page not found (skipping).")
  process.exit(0)
}

const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"))

const datasets = (catalog.datasets || []).map((d) => ({
  "@type": "Dataset",
  "@id": `${CERT_BASE}/data#${d.id}`,
  name: d.name,
  description: d.description,
  url: d.landing_page || `${CERT_BASE}/data`,
  identifier: `${CERT_BASE}/data#${d.id}`,
  version: d.version,
  dateModified: d.date_modified,
  isAccessibleForFree: true,
  creator: PUBLISHER,
  publisher: PUBLISHER,
  ...(d.unit ? { unitText: d.unit } : {}),
  distribution: (d.distributions || []).map((dist) => ({
    "@type": "DataDownload",
    encodingFormat: dist.format,
    contentUrl: dist.content_url,
    ...(dist.content_size ? { contentSize: `${dist.content_size}` } : {}),
  })),
}))

const graph = {
  "@context": "https://schema.org",
  "@type": "DataCatalog",
  "@id": `${CERT_BASE}/data#catalog`,
  name: catalog.name || "Heavy Metal Tested & Certified — standards open data",
  description: catalog.description,
  url: `${CERT_BASE}/data`,
  publisher: PUBLISHER,
  dateModified: (catalog.generated_at || "").slice(0, 10) || undefined,
  dataset: datasets,
}

let html = fs.readFileSync(htmlPath, "utf8")
if (html.includes("HMTC-DATA-JSONLD-START")) {
  console.log("postbuild-cert-data-jsonld: DataCatalog JSON-LD already present; skipping.")
  process.exit(0)
}
const block =
  `<!-- HMTC-DATA-JSONLD-START -->` +
  `<script type="application/ld+json">${JSON.stringify(graph)}</script>` +
  `<!-- HMTC-DATA-JSONLD-END -->`
html = html.replace("</head>", `${block}</head>`)
fs.writeFileSync(htmlPath, html, "utf8")
console.log(`postbuild-cert-data-jsonld: injected DataCatalog JSON-LD (${datasets.length} dataset) into ${path.relative(PUBLIC, htmlPath)}`)
