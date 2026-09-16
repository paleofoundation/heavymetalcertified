import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { buildCreators, buildResearcherCreator, creatorDigest, normalizeOrcid, updateMatchingCreators } from "../lib/datacite-creators.mjs"
import { applyUpdatePlan, createUpdateEntry, creatorStateDigest, DATACITE_API } from "../lib/datacite-creator-updates.mjs"

const identity = JSON.parse(await fs.readFile(new URL("../../data/researcher-identity.json", import.meta.url), "utf8"))
const config = { clientId: "fixture.repo", prefixes: ["10.99999"] }
const canonical = buildResearcherCreator(identity)
const coauthor = { name: "Garcia, Sofia", nameType: "Personal", nameIdentifiers: [{ nameIdentifier: "https://orcid.org/0000-0001-5727-2427", nameIdentifierScheme: "ORCID" }], affiliation: [{ name: "University", affiliationIdentifier: "https://ror.org/03yrm5c26", affiliationIdentifierScheme: "ROR" }], lang: "en" }
const legacy = { name: "Karen Pendergrass", affiliation: ["Institute of Contaminant Standards"] }
const record = () => ({ data: { type: "dois", id: "10.99999/existing", attributes: {
  doi: "10.99999/existing", creators: [structuredClone(legacy), structuredClone(coauthor)],
  titles: [{ title: "Existing edition" }], url: "https://example.org/edition", publicationYear: 2025,
  version: "1.0", state: "findable", dates: [{ dateType: "Issued", date: "2025" }],
  relatedIdentifiers: [{ relatedIdentifier: "10.99999/other", relatedIdentifierType: "DOI", relationType: "References" }],
}, relationships: { client: { data: { id: config.clientId, type: "clients" } } } } })
const planFor = (r) => ({ format: "datacite-creators-v1", api: DATACITE_API, clientId: config.clientId,
  identityDigest: creatorDigest(canonical), entries: [createUpdateEntry(r, identity, config)] })

test("ORCID accepts bare/full identifiers and checks checksum, not just shape", () => {
  assert.equal(normalizeOrcid(identity.orcid), identity.profiles.orcid)
  assert.equal(normalizeOrcid(identity.profiles.orcid), identity.profiles.orcid)
  for (const value of ["0000-0002-2348-7258", "0000-0000-0000-0001", "PENDING_ORCID", "https://example.org/0000-0002-2348-7259", "https://orcid.org/0000-0002-2348-7259?x=1"]) assert.throws(() => normalizeOrcid(value))
})

test("canonical template has full relational identity and no invented organization IDs", async () => {
  const saved = JSON.parse(await fs.readFile(new URL("../../data/datacite-creator.json", import.meta.url), "utf8"))
  assert.deepEqual(saved, canonical)
  assert.deepEqual(canonical.affiliation, [{ name: "Institute of Contaminant Standards" }, { name: "The Paleo Foundation" }])
  for (const replacement of [{ orcid: "TODO" }, { givenName: "<given name>" }, { affiliations: [{ name: "PENDING" }] }]) assert.throws(() => buildResearcherCreator({ ...identity, ...replacement }))
})

test("preserves coauthor order, extra identifiers, affiliation registry IDs and unknown metadata", () => {
  const karen = { ...legacy, nameIdentifiers: [{ nameIdentifier: "1234", nameIdentifierScheme: "ISNI" }], affiliation: [
    { name: "Paleo Foundation", affiliationIdentifier: "existing-registry-id", affiliationIdentifierScheme: "ISNI", extra: "retained" },
    "Prior institution", { name: "Institute of Contaminant Standards", affiliationIdentifier: "another-id", affiliationIdentifierScheme: "ISNI" },
  ], lang: "en" }
  const original = [coauthor, karen]
  const updated = updateMatchingCreators(original, identity)
  assert.deepEqual(updated[0], coauthor)
  assert.equal(updated[1].lang, "en")
  assert.deepEqual(updated[1].nameIdentifiers[0], karen.nameIdentifiers[0])
  assert.deepEqual(updated[1].affiliation, [
    { name: "Institute of Contaminant Standards", affiliationIdentifier: "another-id", affiliationIdentifierScheme: "ISNI" },
    { name: "The Paleo Foundation", affiliationIdentifier: "existing-registry-id", affiliationIdentifierScheme: "ISNI", extra: "retained" },
    { name: "Prior institution" },
  ])
  assert.equal(original[1].name, "Karen Pendergrass", "input must not be mutated")
})

test("non-Karen and institution records remain unchanged; explicit empty authors fail closed", () => {
  const org = { name: "Institute of Contaminant Standards", nameType: "Organizational" }
  assert.deepEqual(updateMatchingCreators([coauthor, org], identity), [coauthor, org])
  assert.deepEqual(buildCreators({}, identity, { fallback: [org] }), [org])
  assert.deepEqual(buildCreators({ authors: [coauthor, "Karen Pendergrass"] }, identity)[0], coauthor)
  assert.deepEqual(buildCreators({ author: coauthor }, identity), [coauthor])
  assert.deepEqual(buildCreators({}, identity), [canonical])
  for (const fm of [{ authors: [] }, { author: null }, { author: "TBD" }]) assert.throws(() => buildCreators(fm, identity))
  assert.deepEqual(updateMatchingCreators([{ name: "K. Pendergrass" }], identity), [{ name: "K. Pendergrass" }])
})

test("ambiguous researcher or conflicting ORCID cannot be overwritten", () => {
  assert.throws(() => updateMatchingCreators([legacy, canonical], identity), /Multiple researcher/)
  assert.throws(() => updateMatchingCreators([{ ...legacy, nameIdentifiers: coauthor.nameIdentifiers }], identity), /Conflicting ORCID/)
})

test("frontmatter ORCID shorthands are validated and attached to their actual author only", () => {
  const authors = buildCreators({ author: "Karen Pendergrass", author_orcid: identity.orcid, authors: ["Karen Pendergrass", { name: "Garcia, Sofia", orcid: "0000-0001-5727-2427" }] }, identity)
  assert.equal(authors[0].nameIdentifiers[0].nameIdentifier, identity.profiles.orcid)
  assert.equal(authors[1].nameIdentifiers[0].nameIdentifier, "https://orcid.org/0000-0001-5727-2427")
  assert.equal(Object.hasOwn(authors[1], "orcid"), false)
  assert.throws(() => buildCreators({ author: "Karen Pendergrass", orcid: "0000-0001-5727-2427" }, identity), /Conflicting ORCID/)
  assert.throws(() => buildCreators({ author: "Karen Pendergrass", author_orcid: "PENDING" }, identity))
})

async function fixture(t, r = record()) {
  const backupDir = await fs.mkdtemp(path.join(os.tmpdir(), "datacite-creators-test-"))
  t.after(() => fs.rm(backupDir, { recursive: true, force: true }))
  const state = { record: structuredClone(r), puts: [], gets: 0, status: 200, mutateAfterPut: null }
  const fetcher = async (_url, options = {}) => {
    if (options.method === "PUT") {
      const backups = await fs.readdir(backupDir)
      assert.ok(backups.length, "backup must exist before PUT")
      const backup = JSON.parse(await fs.readFile(path.join(backupDir, backups.at(-1)), "utf8"))
      assert.deepEqual(backup, state.record)
      assert.equal((await fs.stat(path.join(backupDir, backups.at(-1)))).mode & 0o777, 0o600)
      const payload = JSON.parse(options.body)
      assert.deepEqual(Object.keys(payload.data.attributes), ["creators"])
      assert.equal(payload.data.id, state.record.data.id)
      state.puts.push(payload)
      state.record.data.attributes.creators = payload.data.attributes.creators.map((c) => ({ ...c, ...(c.affiliation ? { affiliation: c.affiliation.map((a) => Object.keys(a).length === 1 ? a.name : a) } : {}) }))
      state.record.data.attributes.updated = "service timestamp"
      state.record.data.attributes.metadataVersion = 2
      state.mutateAfterPut?.(state.record)
      return { ok: true, status: 200 }
    }
    state.gets++
    return { ok: state.status === 200, status: state.status, json: async () => structuredClone(state.record) }
  }
  return { state, options: { identity, config, credentials: { user: config.clientId, password: "fixture-<>${opaque-password}" }, backupDir, fetcher } }
}

test("apply backs up fresh metadata, sends only creators, and repeating it performs zero further PUTs", async (t) => {
  const original = record(), plan = planFor(original)
  const { state, options } = await fixture(t, original)
  state.record.data.attributes.url = "https://example.org/new-landing" // unrelated change after planning survives
  const result = await applyUpdatePlan(plan, options)
  assert.equal(result[0].status, "updated")
  assert.equal(state.puts.length, 1)
  assert.equal(state.record.data.attributes.url, "https://example.org/new-landing")
  assert.equal(state.record.data.attributes.version, "1.0")
  assert.equal(creatorStateDigest(state.record.data.attributes.creators), plan.entries[0].afterDigest)
  assert.equal((await applyUpdatePlan(plan, options))[0].status, "already-current")
  assert.equal(state.puts.length, 1)
})

test("stale coauthor changes reject the entire plan before any PUT", async (t) => {
  const original = record(), plan = planFor(original)
  const { state, options } = await fixture(t, original)
  state.record.data.attributes.creators.push({ name: "Later coauthor" })
  await assert.rejects(applyUpdatePlan(plan, options), /Stale creator plan/)
  assert.equal(state.puts.length, 0)
})

test("missing DOI and ownership mismatch cannot trigger PUT upserts", async (t) => {
  const { state, options } = await fixture(t)
  const plan = planFor(record())
  state.status = 404
  await assert.rejects(applyUpdatePlan(plan, options), /HTTP 404/)
  state.status = 200
  state.record.data.relationships.client.data.id = "other.repo"
  await assert.rejects(applyUpdatePlan(plan, options), /Ownership mismatch/)
  assert.equal(state.puts.length, 0)
})

test("tampered coauthor changes are rejected even if the plan digest was recomputed", async (t) => {
  const { state, options } = await fixture(t)
  const plan = planFor(record())
  plan.entries[0].afterCreators.pop()
  plan.entries[0].afterDigest = creatorStateDigest(plan.entries[0].afterCreators)
  await assert.rejects(applyUpdatePlan(plan, options), /unapproved creator changes/)
  assert.equal(state.gets, 0)
  assert.equal(state.puts.length, 0)
})

test("post-write verification detects unrelated metadata changes and lost coauthors", async (t) => {
  for (const mutate of [
    (r) => { r.data.attributes.url = "https://example.org/wrong" },
    (r) => { r.data.attributes.state = "registered" },
    (r) => { r.data.attributes.creators.pop() },
  ]) {
    const { state, options } = await fixture(t)
    state.mutateAfterPut = mutate
    await assert.rejects(applyUpdatePlan(planFor(record()), options), /verification failed|Unrelated metadata changed/)
  }
})
