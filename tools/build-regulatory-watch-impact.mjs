#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const repo = process.cwd()
const input = path.join(repo, "data/regulations/cert-regulatory-watch-snapshot.json")
const output = path.join(repo, "data/regulations/cert-regulatory-watch-impact.json")
if (!fs.existsSync(input)) throw new Error(`Missing ${path.relative(repo, input)}. Export the firewall-clean HMI snapshot first.`)
const snapshot = JSON.parse(fs.readFileSync(input, "utf8"))

const analyteLinks = {
  Pb: "/analytes/lead", Cd: "/analytes/cadmium", iAs: "/analytes/inorganic-arsenic",
  tAs: "/analytes/arsenic", MeHg: "/analytes/methylmercury", tHg: "/analytes/mercury",
  Ni: "/analytes/nickel", Al: "/analytes/aluminum", "Cr-VI": "/analytes/hexavalent-chromium",
  "Cr-total": "/analytes/chromium", Sn: "/analytes/tin",
}

function standardLinks(event) {
  const text = `${event.title} ${(event.product_scopes || []).join(" ")}`.toLowerCase()
  const links = new Set(["/standards"])
  if (/baby|infant|young child/.test(text)) { links.add("/standards/baby-cereals-dry"); links.add("/standards/infant-formula-powder") }
  if (/seafood|fish|crustace|bivalve|cephalopod/.test(text)) {
    links.add("/standards/canned-seafood")
    links.add("/standards/shellfish")
    links.add("/standards/fish-marine-non-predatory")
    links.add("/standards/fish-marine-predatory")
  }
  if (/cereal|rice|grain/.test(text)) links.add("/standards/rice-bulk-grain")
  if (/cocoa|chocolate/.test(text)) links.add("/standards/chocolate")
  if (/packag|food.contact/.test(text)) links.add("/standards/food-packaging-flexible-pouches-films")
  return [...links]
}

function classify(event) {
  if (event.verification.state !== "verified-primary") return "insufficient-evidence"
  if (["proposed", "consultation", "litigation", "monitor-only"].includes(event.status)) return "context-with-no-direct-hmtc-change"
  if (event.event_type === "testing-method") return "testing-panel-or-analytical-method-change"
  if (event.event_type === "disclosure") return "disclosure-reporting-requirement"
  if (event.event_type === "market-restriction" || event.event_type === "alignment") return "supply-chain-or-market-access-consequence"
  if (event.event_type === "limit-change" && event.status === "adopted-not-effective") return "future-binding-limit-candidate"
  if (event.event_type === "limit-change" && (event.hmi_routes.regulatory_limit_ids || []).length) return "current-binding-limit-change"
  return "context-with-no-direct-hmtc-change"
}

function rationale(event, impactClass) {
  if (impactClass === "insufficient-evidence") return "The neutral record is incomplete or only partially verified, so no program action can be inferred until the named evidence gap is closed."
  if (impactClass === "future-binding-limit-candidate") return "The instrument is adopted with a future application date. It belongs in readiness and governance review, not in the current-limit compiler before that date."
  if (impactClass === "current-binding-limit-change") return "The verified in-force instrument has structured HMI limit rows. Existing standards can be compared through the normal compiled-regulation process without copying numbers into this tracker."
  if (impactClass === "testing-panel-or-analytical-method-change") return "The verified change affects what must be measured or how evidence is produced; it does not by itself establish a new certification concentration limit."
  if (impactClass === "disclosure-reporting-requirement") return "The verified change creates testing, disclosure, inventory, or communication duties that may affect evidence packages and market claims even where the concentration limit is unchanged."
  if (impactClass === "supply-chain-or-market-access-consequence") return "The verified change affects formulation, packaging, authorization, alignment, or access to a jurisdiction. It should inform market-readiness review, not silently rewrite a standard."
  return "The event is verified context, monitoring, or a non-final proposal. It is visible for planning but has no direct program change at this stage."
}

const impacts = snapshot.events.map((event) => {
  const impact_class = classify(event)
  const deadline = event.dates.transition || event.dates.effective || event.dates.consultation_close || event.dates.next_review || null
  return {
    event_id: event.event_id,
    impact_class,
    affected_analytes: event.analytes,
    affected_product_categories: event.product_scopes,
    deadline,
    analyte_urls: event.analytes.map((item) => analyteLinks[item]).filter(Boolean),
    related_standard_urls: standardLinks(event),
    rationale: rationale(event, impact_class),
    what_does_not_change: "No published HMTc threshold changes automatically. Numerical revisions require the existing evidence compiler and governance approval.",
    governance_queue: ["current-binding-limit-change", "future-binding-limit-candidate", "testing-panel-or-analytical-method-change"].includes(impact_class),
  }
})

const result = { schema_version: 1, generated: snapshot.generated, source_snapshot: "data/regulations/cert-regulatory-watch-snapshot.json", impact_count: impacts.length, impacts }
fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n")
console.log(`regulatory:watch:impact wrote ${impacts.length} impact records -> ${path.relative(repo, output)}`)
