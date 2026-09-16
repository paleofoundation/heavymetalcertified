import assert from "node:assert/strict"
import identity from "../data/researcher-identity.json" with { type: "json" }
import template from "../data/datacite-creator.json" with { type: "json" }
import { buildResearcherCreator, normalizeOrcid, requireRealText } from "./lib/datacite-creators.mjs"

assert.deepEqual(template, buildResearcherCreator(identity), "DataCite template drifted from shared identity")
assert.equal(identity.profiles.orcid, normalizeOrcid(identity.orcid))
for (const field of ["jobTitle", "description"]) requireRealText(identity[field], field)
assert.equal(new URL(identity.personId).hash, "#person", "Person ID must identify a person node")
assert.equal(identity.personId, `${identity.profileUrl}#person`)
assert.equal(identity.affiliations.length, 2, "The creator contract has two named affiliations")
assert.equal(identity.affiliations[0].id, "https://contaminantstandards.com/#organization", "ICS occupies the current institution slot")
assert.equal(identity.affiliations[0].name, "Institute of Contaminant Standards")
assert.equal(identity.affiliations[1].id, "https://paleofoundation.com/#organization", "Paleo Foundation occupies the co-founder affiliation slot")
assert.equal(identity.affiliations[1].name, "The Paleo Foundation")
assert.equal(new Set(identity.affiliations.map(a => a.id)).size, 2)
for (const [name, value] of Object.entries(identity.profiles)) {
  const url = new URL(value)
  assert.equal(url.protocol, "https:", `${name}: profile must use HTTPS`)
  assert.ok(!url.username && !url.password && url.pathname !== "/", `${name}: expected a person-specific profile URL`)
}
const scholar = new URL(identity.profiles.scholar)
assert.equal(scholar.hostname, "scholar.google.com")
assert.equal(scholar.pathname, "/citations")
assert.ok(scholar.searchParams.get("user"), "Scholar needs the exact profile ID")
for (const organization of identity.affiliations) {
  assert.notEqual(organization.id, identity.personId)
  assert.equal(new URL(organization.url).origin, new URL(organization.id).origin)
}
console.log("researcher-identity: creator template, ORCID, profile URLs and organization IDs pass")
