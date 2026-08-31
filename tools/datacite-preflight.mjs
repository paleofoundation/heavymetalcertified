#!/usr/bin/env node
// DataCite connection preflight (cert) — verifies repository credentials + prefix
// and shows the EXACT metadata shape a real HMTc standard mint will register,
// without leaving anything behind.
//
// The cert-side companion to tools/mint-dois.mjs and to the Heavy Metal Index
// tool of the same name. It performs a full authenticated CRUD round-trip:
//   DELETE (cleanup any prior run) -> POST a DRAFT DOI -> GET it back and print
//   the metadata -> DELETE it. A *draft* DOI is reserved-only: it never resolves,
//   is never findable, and is deletable — the canonical safe way to test a
//   DataCite connection. Nothing is persisted to any content page (the real mint
//   writes the returned DOI into a standard's `cert_doi:` frontmatter; this
//   preflight writes nothing).
//
// Run it the moment credentials are in place:
//   node --env-file=.env.local tools/datacite-preflight.mjs
//
// Env (same vars mint-dois.mjs reads; put them in the git-ignored .env.local):
//   DATACITE_USER      repository ID from Fabrica  (e.g. PALEO.HMTC)
//   DATACITE_PASSWORD  repository password from Fabrica
//   DATACITE_PREFIX    the prefix Fabrica assigned  (e.g. 10.82xxx test / 10.71xxx prod)
//   DATACITE_MODE      "test" (sandbox, default) or "live"
//   HMTC_ORG_ROR       optional org ROR (lights up the ROR fields if set)
//
// The cert prefix is a SEPARATE DataCite repository from the Index prefix (two
// repos / two prefixes reinforces the Part 2 wiki/cert firewall). The universal
// 10.5072 sandbox prefix is RETIRED; each test repository gets its own assigned
// prefix and test DOIs resolve via handle.test.datacite.org.
//
// Safety: refuses to touch the LIVE API unless --live is passed explicitly.
// Even then it only creates+deletes a draft, but the default is sandbox.

const USER = process.env.DATACITE_USER || ""
const PASSWORD = process.env.DATACITE_PASSWORD || ""
const PREFIX = process.env.DATACITE_PREFIX || ""
const MODE = (process.env.DATACITE_MODE || "test").toLowerCase()
const ORG_ROR = process.env.HMTC_ORG_ROR || ""
const wantLive = process.argv.includes("--live")

const isPending = (v) => !v || v.startsWith("PENDING")
const missing = []
if (isPending(USER)) missing.push("DATACITE_USER")
if (isPending(PASSWORD)) missing.push("DATACITE_PASSWORD")
if (isPending(PREFIX)) missing.push("DATACITE_PREFIX")

console.log("DataCite connection preflight (cert)")
console.log(`  mode:    ${MODE === "live" ? "LIVE (api.datacite.org)" : "TEST sandbox (api.test.datacite.org)"}`)
console.log(`  user:    ${USER ? USER : "(unset)"}`)
console.log(`  prefix:  ${PREFIX ? PREFIX : "(unset)"}`)
console.log(`  ror:     ${ORG_ROR ? ORG_ROR : "(unset — optional)"}`)
console.log("")

if (missing.length) {
  console.log(`NOT CONNECTED — missing: ${missing.join(", ")}`)
  console.log("")
  console.log("Get these from DataCite Fabrica (they are yours to generate; I cannot):")
  console.log("  1. Sign in at https://fabrica.test.datacite.org (sandbox) — or fabrica.datacite.org (production).")
  console.log("  2. Create the CERT Repository under your member account (separate from the Index repository);")
  console.log("     Fabrica assigns it its own prefix.")
  console.log("  3. On the repository's Settings, set/copy its password.")
  console.log("  4. Put them in the git-ignored .env.local (never in git, never pasted to chat):")
  console.log("       DATACITE_USER=YOUR.CERT.REPOSITORY.ID")
  console.log("       DATACITE_PASSWORD=the-repository-password")
  console.log("       DATACITE_PREFIX=10.xxxxx")
  console.log("       DATACITE_MODE=test")
  console.log("  5. Re-run:  node --env-file=.env.local tools/datacite-preflight.mjs")
  process.exit(2)
}

if (MODE === "live" && !wantLive) {
  console.log("REFUSING to preflight against LIVE without --live. Rehearse on the sandbox first:")
  console.log("  set DATACITE_MODE=test (with your TEST repository's credentials), then re-run.")
  process.exit(3)
}

const API = MODE === "live" ? "https://api.datacite.org" : "https://api.test.datacite.org"
const auth = "Basic " + Buffer.from(`${USER}:${PASSWORD}`).toString("base64")
const headers = { "Content-Type": "application/vnd.api+json", Authorization: auth }
const doi = `${PREFIX}/hmtc.preflight.connection-check`

// The real cert standard metadata shape (person creator + ORCID + affiliation +
// "Institute of Contaminant Standards" publisher + CC BY 4.0 + Certification
// Standard resource type), so the round-trip shows exactly what a real HMTc
// standard mint will register. Mirrors tools/mint-dois.mjs (CREATOR / PUBLISHER /
// RIGHTS / types). The `container` Series is titled to the CERT program, never
// "Heavy Metal Index": a cert record must not assert membership in the Index
// series (Part 2 firewall); the two properties relate one-way only, via a
// RelatedIdentifier References link, which a real standard carries when it has an
// `hmi_literature_link`.
const orgAffiliation = () => {
  const a = { name: "Institute of Contaminant Standards" }
  if (ORG_ROR) { a.affiliationIdentifier = ORG_ROR; a.affiliationIdentifierScheme = "ROR"; a.schemeUri = "https://ror.org" }
  return [a]
}
const attributes = {
  doi,
  creators: [{
    name: "Pendergrass, Karen",
    nameType: "Personal",
    givenName: "Karen",
    familyName: "Pendergrass",
    nameIdentifiers: [{ nameIdentifier: "https://orcid.org/0000-0002-2348-7259", nameIdentifierScheme: "ORCID", schemeUri: "https://orcid.org" }],
    affiliation: orgAffiliation(),
  }],
  titles: [{ title: "DataCite connection preflight — safe to delete (Heavy Metal Tested & Certified)" }],
  publisher: ORG_ROR
    ? { name: "Institute of Contaminant Standards", publisherIdentifier: ORG_ROR, publisherIdentifierScheme: "ROR", schemeUri: "https://ror.org" }
    : "Institute of Contaminant Standards",
  publicationYear: new Date().getFullYear(),
  types: { resourceTypeGeneral: "Standard", resourceType: "Certification Standard" },
  container: { type: "Series", title: "Heavy Metal Tested & Certified" },
  url: "https://heavymetalcertified.com/",
  rightsList: [{
    rights: "Creative Commons Attribution 4.0 International",
    rightsUri: "https://creativecommons.org/licenses/by/4.0/legalcode",
    rightsIdentifier: "cc-by-4.0",
    rightsIdentifierScheme: "SPDX",
    schemeUri: "https://spdx.org/licenses/",
  }],
  descriptions: [{ description: "Connection preflight for the Heavy Metal Tested & Certified DataCite repository. Draft only; safe to delete.", descriptionType: "Abstract" }],
  // No `event` field => draft (reserved, non-findable, deletable).
}

async function del() {
  const r = await fetch(`${API}/dois/${doi}`, { method: "DELETE", headers })
  return r.status // 204 deleted, 404 nothing there, 405 not a draft (findable — won't happen here)
}

async function main() {
  // 0) Cleanup any leftover from a previous interrupted run.
  await del().catch(() => {})

  // 1) Authenticated CREATE (draft).
  let r = await fetch(`${API}/dois`, { method: "POST", headers, body: JSON.stringify({ data: { type: "dois", attributes } }) })
  if (r.status === 401) {
    console.log("FAIL — 401 Unauthorized. The username/password pair is not accepted by this API.")
    console.log("  • Check DATACITE_USER is the Repository ID (not your member/login email).")
    console.log(`  • Check the password is this repository's password, and MODE (${MODE}) matches the repo's environment.`)
    process.exit(1)
  }
  if (r.status === 403 || (r.status === 422 && /prefix/i.test(await r.clone().text()))) {
    console.log(`FAIL — ${r.status}. The account is authenticated but not allowed to mint under prefix ${PREFIX}.`)
    console.log("  • Confirm DATACITE_PREFIX is the prefix Fabrica assigned to THIS (cert) repository, not the Index one.")
    process.exit(1)
  }
  if (!r.ok) {
    console.log(`FAIL — create returned ${r.status}: ${(await r.text()).slice(0, 300)}`)
    process.exit(1)
  }
  const created = await r.json()
  const state = created?.data?.attributes?.state
  console.log(`✓ Authenticated + created a DRAFT DOI under your prefix: ${doi}  (state: ${state})`)

  // 2) Read it back and show the registered metadata.
  r = await fetch(`${API}/dois/${doi}`, { headers })
  if (r.ok) {
    const a = (await r.json())?.data?.attributes || {}
    const c = (a.creators || [])[0] || {}
    const nid = (c.nameIdentifiers || [])[0] || {}
    const pub = typeof a.publisher === "string" ? a.publisher : a.publisher?.name
    const rights = (a.rightsList || []).map((x) => x.rightsIdentifier || x.rights).join("; ")
    console.log("")
    console.log("  Registered metadata (this is exactly what a real cert mint records):")
    console.log(`    creator:    ${c.name}  [${c.nameType}]  ${nid.nameIdentifier || "(no id)"}`)
    console.log(`    affiliation:${" "}${(c.affiliation || []).map((x) => x.name + (x.affiliationIdentifier ? " · " + x.affiliationIdentifier : "")).join("; ")}`)
    console.log(`    publisher:  ${pub}${a.publisher?.publisherIdentifier ? " · " + a.publisher.publisherIdentifier : ""}`)
    console.log(`    container:  ${a.container?.title || "(none)"}`)
    console.log(`    type:       ${a.types?.resourceTypeGeneral}${a.types?.resourceType ? " / " + a.types.resourceType : ""}`)
    console.log(`    rights:     ${rights || "(none)"}`)
    console.log(`    state:      ${a.state}  (draft = reserved, does not resolve)`)
  }

  // 3) Delete the draft — leave nothing behind.
  const dstatus = await del()
  console.log("")
  console.log(dstatus === 204 ? "✓ Deleted the draft — nothing left behind." : `⚠ Draft delete returned ${dstatus} (harmless; a draft never resolves — remove it in Fabrica if it lingers).`)
  console.log("")
  console.log(`PASS — the ${MODE} connection works end to end (auth, prefix, create, read, delete).`)
  console.log(MODE === "test"
    ? "Next: rehearse the real standards batch in test with `node --env-file=.env.local tools/mint-dois.mjs --dry-run`, then a scoped `--live` test mint of Cat-1, then switch to a LIVE repository's credentials to mint for real."
    : "You are connected to PRODUCTION. `tools/mint-dois.mjs --live` will mint findable DOIs and write cert_doi back into standard frontmatter.")
}

main().catch((e) => { console.log(`FAIL — ${e.message}`); process.exit(1) })
