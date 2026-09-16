import test from "node:test"
import assert from "node:assert/strict"
import identity from "../data/researcher-identity.json" with { type: "json" }
import { KAREN_PERSON, PALEO_ORGANIZATION, personEntity } from "./lib/researcher-schema.mjs"

test("one stable person connects the actual profiles and two distinct organizations", () => {
  assert.equal(KAREN_PERSON["@id"], identity.personId)
  assert.equal(new URL(identity.personId).hash, "#person")
  assert.deepEqual(KAREN_PERSON.affiliation.map(a => a["@id"]), identity.affiliations.map(a => a.id))
  assert.equal(KAREN_PERSON.identifier.value, "0000-0002-2348-7259")
  for (const url of KAREN_PERSON.sameAs) assert.notEqual(new URL(url).pathname, "/")
  assert.equal(PALEO_ORGANIZATION.founder["@id"], identity.personId)
  assert.equal(KAREN_PERSON.alumniOf, undefined)
  assert.notEqual(PALEO_ORGANIZATION["@id"], identity.personId)
})

test("author lookup preserves another author's credit and detects conflicting identifiers", () => {
  assert.equal(personEntity(), KAREN_PERSON)
  assert.equal(personEntity("Pendergrass, Karen"), KAREN_PERSON)
  assert.equal(personEntity("Karen Pendergrass", identity.profiles.orcid), KAREN_PERSON)
  assert.deepEqual(personEntity("Another Author"), { "@type": "Person", name: "Another Author" })
  assert.throws(() => personEntity("Another Author", identity.orcid), /different named author/)
  assert.throws(() => personEntity("Karen Pendergrass", "0000-0001-5109-3700"), /conflicting ORCID/)
})
