#!/usr/bin/env node
// postbuild-cert-jsonld.mjs — inject the cross-site Organization graph into the
// cert homepage (plan 6.B / Step 7).
//
// Shared stable IDs express the author/operator relationships. These statements
// do not guarantee indexing, Knowledge Graph inclusion, or ranking outcomes.

import fs from "node:fs"
import path from "node:path"

import {
  CERT_BASE,
  CERT_ORGANIZATION,
  CERT_ORGANIZATION_ID,
  CERT_SERVICE_ID,
  CERT_WEBSITE_ID,
  ICS_ORGANIZATION,
  KAREN_PERSON,
  KAREN_PERSON_ID,
  PALEO_ORGANIZATION,
  HMI_BASE,
  HMI_WEBSITE_ID,
  ICS_ORGANIZATION_ID,
} from "./lib/entity-graph.mjs"

const PUBLIC = path.join(process.cwd(), "public")

const orgGraph = {
  "@context": "https://schema.org",
  "@graph": [
    ICS_ORGANIZATION,
    CERT_ORGANIZATION,
    KAREN_PERSON,
    PALEO_ORGANIZATION,
    {
      "@type": "WebSite",
      "@id": HMI_WEBSITE_ID,
      name: "Heavy Metal Index",
      url: HMI_BASE,
      description: "A public evidence system for heavy metal occurrence, exposure pathways, and regulatory sources.",
      creator: { "@id": KAREN_PERSON_ID },
      publisher: { "@id": ICS_ORGANIZATION_ID },
    },
    // WebSite node names the entity + head terms for the search/AI graph and lets
    // Google treat the domain as one site rather than a bag of pages.
    {
      "@type": "WebSite",
      "@id": CERT_WEBSITE_ID,
      name: "Heavy Metal Tested & Certified",
      alternateName: "HMTc",
      url: CERT_BASE,
      description:
        "Published heavy-metal testing limits for the Big 8 and third-party certification for food and supply-chain products.",
      inLanguage: "en",
      publisher: { "@id": CERT_ORGANIZATION_ID },
    },
    // Service node puts the transactional head terms ("heavy metal testing and
    // certification") into structured data, mapped to the actual program.
    {
      "@type": "Service",
      "@id": CERT_SERVICE_ID,
      serviceType: "Heavy metal testing and certification",
      name: "Heavy Metal Tested & Certified (HMTc) certification",
      url: `${CERT_BASE}/for-brands`,
      description:
        "Third-party certification of food, supplements, and supply-chain products against published numeric heavy-metal limits, verified by accredited-laboratory testing on a ten-analyte panel in the product's native basis.",
      provider: { "@id": CERT_ORGANIZATION_ID },
      areaServed: "US",
    },
  ],
}

const homepage = path.join(PUBLIC, "index.html")
if (!fs.existsSync(homepage)) {
  console.error("postbuild-cert-jsonld: public/index.html not found; run the build first.")
  process.exit(1)
}

let html = fs.readFileSync(homepage, "utf8")
const tag = `<script type="application/ld+json" data-cert-entity-graph>${JSON.stringify(orgGraph).replace(/</g, "\\u003c")}</script>`
// Refresh the owned graph, including legacy unmarked output. Preserve unrelated
// JSON-LD blocks and make reruns update changed identity data without duplication.
html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (block, json) => {
  try {
    const graph = JSON.parse(json)
    return graph["@graph"]?.some(node => node["@id"] === CERT_WEBSITE_ID) ? "" : block
  } catch { return block }
})
if (!html.includes("</head>")) throw new Error("Homepage has no head for entity metadata")
html = html.replace("</head>", `${tag}</head>`)
fs.writeFileSync(homepage, html, "utf8")
console.log("postbuild-cert-jsonld: refreshed author, organization and website graph.")
