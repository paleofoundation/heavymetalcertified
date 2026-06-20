#!/usr/bin/env node
// postbuild-cert-jsonld.mjs — inject the cross-site Organization graph into the
// cert homepage (plan 6.B / Step 7).
//
// The cert program declares parentOrganization: ICS — the REVERSE edge of the
// parent's subOrganization declaration. With one stable @id per entity referenced
// from both sites, Google fuses them into one cluster and reads "the program
// (child) and the body behind it (parent)" — structurally child-#1 / parent-#2 on
// the transactional term. The cert site uses its OWN @id (heavymetalcertified.com
// /#organization) — the same @id the parent points its subOrganization edge at.

import fs from "node:fs"
import path from "node:path"

const PUBLIC = path.join(process.cwd(), "public")
const CERT_BASE = "https://heavymetalcertified.com"
const PARENT_BASE = "https://contaminantstandards.com"

const orgGraph = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${CERT_BASE}/#organization`,
  name: "Heavy Metal Tested & Certified",
  alternateName: "HMTc",
  url: CERT_BASE,
  description:
    "The certification program and published standards for heavy metals in food and the supply chain. Standards are set against the complete literature and published per subcategory.",
  // the reverse edge: this program is governed by the parent standards body.
  parentOrganization: {
    "@type": "Organization",
    "@id": `${PARENT_BASE}/#organization`,
    name: "The Institute for Contaminant Standards",
    url: PARENT_BASE,
  },
}

const homepage = path.join(PUBLIC, "index.html")
if (!fs.existsSync(homepage)) {
  console.error("postbuild-cert-jsonld: public/index.html not found; run the build first.")
  process.exit(1)
}

let html = fs.readFileSync(homepage, "utf8")
const tag = `<script type="application/ld+json">${JSON.stringify(orgGraph)}</script>`

if (html.includes(`${CERT_BASE}/#organization`)) {
  console.log("postbuild-cert-jsonld: org graph already present; skipping.")
} else {
  html = html.replace("</head>", `${tag}</head>`)
  fs.writeFileSync(homepage, html, "utf8")
  console.log("postbuild-cert-jsonld: injected Organization graph (parentOrganization=ICS) into homepage.")
}
