import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { buildResearcherCreator, creatorDigest, updateMatchingCreators } from "./datacite-creators.mjs"

export const DATACITE_API = "https://api.datacite.org"
const doiKey = (doi) => String(doi).toLowerCase()

// Public responses sometimes turn name-only affiliation objects into legacy strings.
// Compare those equivalent forms while retaining every identifier and other field.
export function creatorStateDigest(creators) {
  return creatorDigest(creators.map((c) => ({ ...c, ...(c.affiliation ? {
    affiliation: c.affiliation.map((a) => typeof a === "string" ? { name: a } : a),
  } : {}) })))
}

export function unrelatedMetadataDigest(record) {
  // XML is DataCite's generated serialization of the metadata, so a creator change changes it.
  // Service revision/usage counters can change independently. Bibliographic fields and state cannot.
  const { creators, updated, xml, metadataVersion, viewCount, viewsOverTime, downloadCount,
    downloadsOverTime, referenceCount, citationCount, citationsOverTime, partCount, partOfCount,
    versionCount, versionOfCount, ...attributes } = record.data.attributes
  return creatorDigest({ attributes, relationships: record.data.relationships })
}

export async function readPublicRecord(doi, fetcher = fetch) {
  if (!/^10\.\d{4,9}\/[^\s?#]+$/i.test(doi)) throw new Error("Invalid DOI")
  const response = await fetcher(`${DATACITE_API}/dois/${encodeURIComponent(doi)}`, { redirect: "error" })
  if (!response.ok) throw new Error(`GET ${doi}: HTTP ${response.status}; no update permitted`)
  const record = await response.json()
  if (doiKey(record.data?.id) !== doiKey(doi) || doiKey(record.data?.attributes?.doi) !== doiKey(doi)) throw new Error(`Record identity mismatch: ${doi}`)
  return record
}

export function assertOwned(record, config) {
  const a = record.data.attributes
  if (!config.prefixes.includes(a.doi.split("/")[0]) || record.data.relationships?.client?.data?.id !== config.clientId) throw new Error(`Ownership mismatch: ${a.doi}`)
  if (!["findable", "registered"].includes(a.state)) throw new Error(`Only existing registered/findable records can be updated: ${a.doi}`)
}

export function createUpdateEntry(record, identity, config) {
  assertOwned(record, config)
  const a = record.data.attributes
  const beforeCreators = structuredClone(a.creators)
  const afterCreators = updateMatchingCreators(beforeCreators, identity)
  return {
    doi: a.doi, clientId: config.clientId,
    metadata: { titles: a.titles, publicationYear: a.publicationYear, version: a.version ?? null, url: a.url, state: a.state, registered: a.registered, updated: a.updated },
    beforeDigest: creatorStateDigest(beforeCreators), afterDigest: creatorStateDigest(afterCreators),
    beforeCreators, afterCreators,
    status: creatorStateDigest(beforeCreators) === creatorStateDigest(afterCreators) ? "unchanged" : "update",
  }
}

// Partial PUT preserves every attribute outside creators, including URL, titles, and dates.
// DataCite replaces the entire creators array, so it must retain every coauthor in order.
export function creatorUpdatePayload(doi, creators) {
  return { data: { type: "dois", id: doi, attributes: { creators: structuredClone(creators) } } }
}

export function validateUpdatePlan(plan, identity, config) {
  if (plan.format !== "datacite-creators-v1" || plan.api !== DATACITE_API || plan.clientId !== config.clientId) throw new Error("Plan repository/API mismatch")
  if (plan.identityDigest !== creatorDigest(buildResearcherCreator(identity))) throw new Error("Researcher identity changed; regenerate the plan")
  if (!Array.isArray(plan.entries)) throw new Error("Plan entries must be an array")
  const seen = new Set()
  for (const entry of plan.entries) {
    if (seen.has(doiKey(entry.doi))) throw new Error("Duplicate DOI in plan")
    seen.add(doiKey(entry.doi))
    if (!config.prefixes.includes(entry.doi.split("/")[0]) || entry.clientId !== config.clientId) throw new Error("Plan DOI ownership mismatch")
    if (creatorStateDigest(entry.beforeCreators) !== entry.beforeDigest || creatorStateDigest(entry.afterCreators) !== entry.afterDigest) throw new Error("Plan creator digest mismatch")
    if (creatorStateDigest(updateMatchingCreators(entry.beforeCreators, identity)) !== entry.afterDigest) throw new Error("Plan includes unapproved creator changes")
  }
}

export async function applyUpdatePlan(plan, { identity, config, credentials, backupDir, fetcher = fetch }) {
  validateUpdatePlan(plan, identity, config)
  // Credentials are opaque secrets, not metadata text; valid passwords may contain any punctuation.
  for (const name of ["user", "password"]) {
    const value = credentials?.[name]
    if (typeof value !== "string" || !value.trim() || /^(?:pending|todo|tbd|placeholder|your[_ -])/i.test(value)) throw new Error(`DataCite ${name} is missing or a placeholder`)
  }
  if (credentials.user.toLowerCase() !== config.clientId.toLowerCase()) throw new Error("Credentials must be for the planned repository")
  if (!backupDir) throw new Error("A backup directory is required")
  // Check the whole batch before any mutation. Recheck each record immediately before PUT as well.
  const check = async (entry) => {
    const current = await readPublicRecord(entry.doi, fetcher)
    assertOwned(current, config)
    const digest = creatorStateDigest(current.data.attributes.creators)
    if (digest !== entry.beforeDigest && digest !== entry.afterDigest) throw new Error(`Stale creator plan: ${entry.doi}; regenerate and review`)
    return current
  }
  for (const entry of plan.entries) await check(entry)
  await fs.mkdir(backupDir, { recursive: true, mode: 0o700 })
  const results = []
  for (const entry of plan.entries) {
    const current = await check(entry)
    if (creatorStateDigest(current.data.attributes.creators) === entry.afterDigest) {
      results.push({ doi: entry.doi, status: "already-current" })
      continue
    }
    const stem = entry.doi.replaceAll(/[^a-zA-Z0-9.-]/g, "_")
    const backup = path.join(backupDir, `${stem}-${Date.now()}-${crypto.randomUUID()}.json`)
    await fs.writeFile(backup, JSON.stringify(current, null, 2) + "\n", { flag: "wx", mode: 0o600 })
    const response = await fetcher(`${DATACITE_API}/dois/${encodeURIComponent(entry.doi)}`, {
      method: "PUT", redirect: "error",
      headers: { "Content-Type": "application/vnd.api+json", Authorization: `Basic ${Buffer.from(`${credentials.user}:${credentials.password}`).toString("base64")}` },
      body: JSON.stringify(creatorUpdatePayload(entry.doi, entry.afterCreators)),
    })
    if (!response.ok) throw new Error(`PUT ${entry.doi}: HTTP ${response.status}; backup: ${backup}. Inspect the record before retrying`)
    const saved = await readPublicRecord(entry.doi, fetcher)
    assertOwned(saved, config)
    // The API may normalize affiliation objects to strings. Compare the requested update semantically.
    if (creatorStateDigest(saved.data.attributes.creators) !== entry.afterDigest) throw new Error(`Creator verification failed: ${entry.doi}; inspect backup ${backup}`)
    if (unrelatedMetadataDigest(saved) !== unrelatedMetadataDigest(current)) throw new Error(`Unrelated metadata changed: ${entry.doi}; inspect backup ${backup}; no automatic rollback`)
    results.push({ doi: entry.doi, status: "updated", backup })
  }
  return results
}
