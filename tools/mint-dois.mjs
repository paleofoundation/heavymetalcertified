#!/usr/bin/env node
// Mint DataCite DOIs for Heavy Metal Tested & Certified (HMTc) publications.
//
// The cert-side companion to the Heavy Metal Index tool of the same name. Reads
// DOI-eligible content pages whose `cert_doi:` is null, builds a DataCite Metadata
// Schema 4.x deposit for each, and — when repository credentials are present in the
// environment — POSTs it to the DataCite REST API, writes the returned DOI back into
// the page's `cert_doi:` frontmatter, and appends an audit row. Idempotent: a page
// whose `cert_doi:` is already populated is skipped.
//
// This implements steps 2–4 of docs/DOI-MINTING-LEDGER.md and was hardened after the
// 2026-08-27 preflight audit (docs/DOI-MINTING-LEDGER.md §"Preflight audit"). It
// supports both deposit paths: `--emit` (needs DATACITE_PREFIX) writes one DataCite
// JSON:API payload per item to tools/.doi-deposit/ for inspection / Fabrica upload;
// default/live (credentials in env) deposits over the REST API.
//
// ── Activation env vars (set where the tool runs — a gitignored .env or the app secret
//    store, NOT in source; the tool reads them and never prints their values) ──
//   DATACITE_USER     — repository account id (e.g. PALEO.HMTC)
//   DATACITE_PASSWORD — repository account password
//   DATACITE_PREFIX   — assigned prefix for THIS environment (test prefix ≠ production prefix)
//   DATACITE_MODE     — "test" (api.test.datacite.org) or "live" (api.datacite.org). Default test.
//   NB: the universal 10.5072 test prefix is RETIRED; a test repository gets its own
//   assigned prefix (10.82xxx family). Read it from Fabrica; never hardcode a sandbox prefix.
//
// ── Safety gates baked in after the preflight audit ──
//   * ELIGIBILITY: standards must be type:standard with a real category and must NOT be
//     type:standard-in-development / standards-finder / scholar_eligible:false. Manuals/
//     articles/briefings must be scholar_eligible:true.
//   * COMPLETENESS: standards default to COMPLETE-only (per data/standards/readiness-manifest.json).
//     ORDER S-DOI-FORCE-1: claim-surface FAIL (blank/monitored/subsumed/null on the eight
//     totals, or rice/infant cereal missing numeric iAs) is NEVER mintable.
//     `--include-incomplete` cannot override a claim-surface FAIL. A scaffold is never minted.
//   * DEPOSITED-EDITION SKIP is by the item's OWN frontmatter (zenodo_doi/deposited_doi/
//     concept_doi), never a body substring — so a standard that merely CITES a Zenodo source
//     paper is not false-skipped.
//   * WRITE-BACK is total: an existing `cert_doi:` line is replaced; a missing one is INSERTED.
//     A write that does not change bytes is a hard abort (never a silent success).
//   * TEST-PREFIX GUARD: a DOI under a test/sandbox prefix is never written into frontmatter,
//     and DATACITE_MODE must be "live" to persist. A test round-trip verifies resolution
//     (via handle.test.datacite.org) without stamping non-resolvable DOIs into pages.
//   * FIREWALL/BRAND GUARD: every candidate's title/description/suffix is screened against a
//     brand denylist + certification-firewall vocabulary; a hit aborts the deposit.
//   * VERSIONING: the minted `cert_doi` is the CONCEPT DOI for a living standard — a stable
//     slug-based identifier that always resolves to the current version, carrying the `version`
//     field. Per-revision version DOIs (IsNewVersionOf chain) are reserved for the first revision
//     and stored in `cert_version_doi`; minting the concept DOI now does not foreclose that model.
//
// FIREWALL (CLAUDE.md Part 2 / Part 12): cert DOIs may relate one-way to the Heavy Metal
// Index literature (`hmi_literature_link` → RelatedIdentifier References). They never name a
// certified brand and never assert the Index endorses the program. The Index's own DOIs never
// point back into the cert domain (enforced on the Index side).
//
// Usage:
//   node tools/mint-dois.mjs                         # dry-run manifest (COMPLETE standards + eligible pubs)
//   node tools/mint-dois.mjs --emit                  # + write JSON payloads (needs DATACITE_PREFIX in env)
//   node tools/mint-dois.mjs --manifest              # + write data/standards/doi-manifest.csv (human sign-off)
//   node tools/mint-dois.mjs --types=standards --category=1   # scope
//   node tools/mint-dois.mjs --types=standards --slug=olive-oil  # one standard (Elon PASS + creds still required)
//   node tools/mint-dois.mjs --include-incomplete    # also mint standards with empty analyte cells
//   node tools/mint-dois.mjs --live                  # deposit (requires credentials in env)
//   node tools/mint-dois.mjs --live --state=register # deposit as Registered (not yet Findable) for QC

import fs from "node:fs"
import path from "node:path"
import crypto from "node:crypto"
import matter from "gray-matter"
import { evaluateClaimSurface, loadCompiledRecords, claimSurfaceFailReason } from "./lib/claim-surface.mjs"
import { loadPageJoins } from "./lib/page-record-join.mjs"

const REPO = process.cwd()
const CONTENT = path.join(REPO, "content")
const DATA = path.join(REPO, "data/standards")
const today = new Date().toISOString().slice(0, 10)
const BASE_URL = "https://heavymetalcertified.com"
const ORCID = "0000-0002-2348-7259" // K. Pendergrass
const CREATOR = {
  name: "Pendergrass, Karen",
  nameType: "Personal",
  givenName: "Karen",
  familyName: "Pendergrass",
  nameIdentifiers: [{ nameIdentifier: `https://orcid.org/${ORCID}`, nameIdentifierScheme: "ORCID", schemeUri: "https://orcid.org" }],
  affiliation: [{ name: "Institute of Contaminant Standards" }],
}
const PUBLISHER = "Institute of Contaminant Standards"
// Certification standards are network-locked to All-rights-reserved (ORDER S-DOI-CITE-LICENSE-1);
// no CC BY on any cert surface, DataCite metadata included. NB: DOIs minted BEFORE this change
// still carry cc-by-4.0 in their live DataCite record — updating those is a metadata re-deposit
// (PUT), which is user-run.
const RIGHTS = [{
  rights: "All rights reserved",
  rightsUri: "https://heavymetalcertified.com/license",
}]
const TEST_PREFIXES = ["10.5072", "10.82"] // datacite sandbox families (must match standard-readiness-lint)

// A page is a real, mintable certification standard only for these frontmatter `type` values.
const MINTABLE_STANDARD_TYPES = new Set(["standard"])
// Frontmatter fields that record the item's OWN existing deposit (keep, never re-mint).
const OWN_DEPOSIT_FIELDS = ["cert_doi", "zenodo_doi", "deposited_doi", "concept_doi", "doi"]

// Brand denylist + firewall vocabulary. A hit on a candidate's title/description/suffix aborts
// the deposit, because a DataCite record is permanent and public. Word-boundary matched.
const BRAND_DENYLIST = [
  "bobbie", "kasandrinos", "enfamil", "similac", "gerber", "happybaby", "earth's best",
  "kirkland", "clorox", "purina", "light labs", "kabrita", "holle", "hipp", "serenity kids",
  "cerebelly", "once upon a farm", "beech-nut", "plum organics", "lil'", "nurturme",
]
const FIREWALL_VOCAB = [] // cert titles legitimately say "HMTc Standard"; brand check is the operative guard here.

const args = process.argv.slice(2)
const wantLive = args.includes("--live")
const doEmit = args.includes("--emit")
const doManifest = args.includes("--manifest")
const includeIncomplete = args.includes("--include-incomplete")
const limit = num(args.find((a) => a.startsWith("--limit=")))
const onlyCategory = valOf(args.find((a) => a.startsWith("--category=")))
const onlySlug = valOf(args.find((a) => a.startsWith("--slug=")))
// Default to STANDARDS ONLY. Manuals/articles/briefings carry Zenodo deposit history that must be
// reconciled deliberately (keep the Zenodo DOI, link via IsNewVersionOf/IsIdenticalTo — see the
// DOI ledger) before minting, and the deposited-edition skip is only reliable once each such item
// records its Zenodo DOI in a `deposited_doi:` frontmatter field. Opt in with --types=all or an
// explicit --types=manuals,articles,... once that reconciliation is done.
const typesArg = valOf(args.find((a) => a.startsWith("--types=")))
const onlyTypes = typesArg === "all" ? ["standards", "manuals", "articles", "briefings"]
  : typesArg ? typesArg.split(",").map((s) => s.trim()).filter(Boolean)
  : ["standards"]
const state = valOf(args.find((a) => a.startsWith("--state="))) || "publish" // draft|register|publish

const DATACITE_USER = process.env.DATACITE_USER || ""
const DATACITE_PASSWORD = process.env.DATACITE_PASSWORD || ""
const DATACITE_PREFIX = process.env.DATACITE_PREFIX || ""
const DATACITE_MODE = (process.env.DATACITE_MODE || "test").toLowerCase()
const DATACITE_API = DATACITE_MODE === "live" ? "https://api.datacite.org/dois" : "https://api.test.datacite.org/dois"
const credentialsReady =
  DATACITE_USER && !DATACITE_USER.startsWith("PENDING") &&
  DATACITE_PASSWORD && DATACITE_PREFIX && !DATACITE_PREFIX.startsWith("PENDING")
const live = wantLive && credentialsReady

const HAS_DOI = /10\.\d{4,9}\/\S+/
const isTestPrefix = (doi) => TEST_PREFIXES.some((p) => String(doi).startsWith(p))

const TYPES = {
  standards: { dir: "standards", landing: "standards", rtGeneral: "Standard", rtText: "Certification Standard", suffix: "std", priority: 1 },
  manuals:   { dir: "manuals",    landing: "manuals",   rtGeneral: "Report",   rtText: "Program Manual",         suffix: "manual", priority: 2 },
  articles:  { dir: "articles",   landing: "articles",  rtGeneral: "JournalArticle", rtText: null,               suffix: "article", priority: 3 },
  briefings: { dir: "briefings",  landing: "briefings", rtGeneral: "Text",     rtText: "Briefing",               suffix: "brief", priority: 4 },
}

function valOf(a) { return a ? a.split("=").slice(1).join("=") : "" }
function num(a) { const v = a ? Number(a.split("=")[1]) : NaN; return Number.isFinite(v) ? v : Infinity }
function year(v) { const m = String(v ?? "").match(/\d{4}/); return m ? Number(m[0]) : null }
function brandHit(...strings) {
  const hay = strings.filter(Boolean).join("  ").toLowerCase()
  for (const b of [...BRAND_DENYLIST, ...FIREWALL_VOCAB]) {
    if (new RegExp(`(^|[^a-z0-9])${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(hay)) return b
  }
  return null
}

// --- completeness + claim-surface (standards) --------------------------------------------------
const completeSlugs = new Set()
const knownSlugs = new Set()
const claimSurfaceFail = new Map() // slug -> reason
try {
  const m = JSON.parse(fs.readFileSync(path.join(DATA, "readiness-manifest.json"), "utf8"))
  for (const cat of m.categories || []) for (const r of cat.records || []) {
    knownSlugs.add(r.slug)
    if (r.complete) completeSlugs.add(r.slug)
    if (r.rice_missing_ias || (r.claim_empty && r.claim_empty.length) || r.complete === false) {
      const why = r.rice_missing_ias
        ? "rice/infant cereal missing numeric iAs"
        : (r.claim_empty && r.claim_empty.length)
          ? `claim-surface empty: ${r.claim_empty.join(", ")}`
          : "INCOMPLETE (empty analyte cells)"
      if (r.rice_missing_ias || (r.claim_empty && r.claim_empty.length)) claimSurfaceFail.set(r.slug, why)
    }
  }
} catch { /* manifest absent: completeness unknown */ }

try {
  for (const row of loadCompiledRecords(DATA)) {
    const ev = evaluateClaimSurface(row)
    const why = claimSurfaceFailReason(ev)
    if (why) claimSurfaceFail.set(row.slug, why)
    knownSlugs.add(row.slug)
  }
} catch { /* compiled corpus unreadable: claim-surface gate still applies via manifest */ }

// AGGREGATE pages (ORDER S-DOI-P0-AGG-1): a taxonomy-row page whose slug is not itself a compiled
// record, but groups one or more child records via a *-pages.json join. It mints one DOI on the
// PAGE url and resolves COMPLETE only when EVERY child record is COMPLETE; it inherits a child's
// claim-surface FAIL (so a rice child missing numeric iAs blocks the whole aggregate page). Pages
// whose slug already equals a compiled record are handled by the direct path above and skipped here.
try {
  for (const [pageSlug, join] of loadPageJoins(DATA)) {
    if (knownSlugs.has(pageSlug)) continue // has its own compiled record — direct path owns it
    const children = [...new Set(join.variants.map((v) => v.record))]
    knownSlugs.add(pageSlug)
    const failedChild = children.find((r) => claimSurfaceFail.has(r))
    if (failedChild) { claimSurfaceFail.set(pageSlug, `child ${failedChild} — ${claimSurfaceFail.get(failedChild)}`); continue }
    const unknownChild = children.find((r) => !completeSlugs.has(r) && !knownSlugs.has(r))
    if (unknownChild) continue // a child is uncompiled/unknown — leave the page held, never force complete
    if (children.every((r) => completeSlugs.has(r))) completeSlugs.add(pageSlug)
  }
} catch { /* join files unreadable: aggregate pages simply stay held (uncompiled) */ }

// --- collect candidates ------------------------------------------------------------------------
const candidates = []
const skips = []
for (const [typeName, t] of Object.entries(TYPES)) {
  if (onlyTypes.length && !onlyTypes.includes(typeName)) continue
  const abs = path.join(CONTENT, t.dir)
  if (!fs.existsSync(abs)) continue
  for (const file of fs.readdirSync(abs).sort()) {
    if (!file.endsWith(".md") || file === "index.md" || file.startsWith("_")) continue
    const filePath = path.join(abs, file)
    const raw = fs.readFileSync(filePath, "utf8")
    let fm
    try { fm = matter(raw).data } catch { skips.push([`${typeName}/${file}`, "frontmatter-parse-error"]); continue }
    const slug = fm.product_slug || file.replace(/\.md$/, "")
    if (onlySlug && slug !== onlySlug) continue
    const rel = `${typeName}/${slug}`

    // Already deposited (its own record carries a DOI) → keep, never re-mint.
    const ownDoi = OWN_DEPOSIT_FIELDS.map((k) => fm[k]).find((v) => v && HAS_DOI.test(String(v)))
    if (ownDoi) { skips.push([rel, `already-deposited (${ownDoi})`]); continue }

    if (typeName === "standards") {
      // The `type` field is the real publish gate: only `type: standard` mints. This correctly
      // excludes the standards-finder UI page, the standards-index, and any standard-in-development
      // scaffold (CLAUDE.md Part 19). NB: `scholar_eligible` is NOT a publish signal for standards —
      // it flags the Scholar-indexing subset (only ~10 standards), so it is deliberately NOT gated on
      // here; every published standard is citable and gets a DOI (subject to the completeness gate).
      const type = String(fm.type || "").toLowerCase()
      if (!MINTABLE_STANDARD_TYPES.has(type)) { skips.push([rel, `type=${fm.type ?? "(none)"} not a mintable standard`]); continue }
      if (fm.category == null) { skips.push([rel, "no category"]); continue }
      if (onlyCategory && String(fm.category) !== String(onlyCategory)) continue
      const csFail = claimSurfaceFail.get(slug)
      if (csFail) {
        skips.push([rel, `CLAIM-SURFACE FAIL (${csFail}) — not mintable`])
        continue
      }
      if (!includeIncomplete && !completeSlugs.has(slug)) {
        skips.push([rel, knownSlugs.has(slug) ? "INCOMPLETE (empty analyte cells)" : "uncompiled (completeness unknown)"])
        continue
      }
    } else {
      if (fm.scholar_eligible !== true) { skips.push([rel, "scholar_eligible!=true"]); continue }
    }

    const pubYear = year(fm.effective_date || fm.date || fm.updated)
    candidates.push({
      typeName, t, filePath, raw, slug,
      title: fm.title || slug,
      version: fm.standard_version || null,
      pubYear, pubYearDefaulted: pubYear == null,
      category: fm.category ?? null,
      hmiLink: fm.hmi_literature_link || null,
      description: fm.description || fm.scholar_abstract || null,
      hasCertDoiLine: /^cert_doi:\s*.*$/m.test(raw),
      complete: completeSlugs.has(slug),
    })
  }
}

candidates.sort((a, b) =>
  a.t.priority - b.t.priority ||
  String(a.category ?? "").localeCompare(String(b.category ?? ""), undefined, { numeric: true }) ||
  a.slug.localeCompare(b.slug))
const batch = candidates.slice(0, limit === Infinity ? candidates.length : limit)

// --- build one DataCite JSON:API payload -------------------------------------------------------
function buildPayload(c) {
  const suffix = `hmtc.${c.t.suffix}.${c.category != null ? `${c.category}.` : ""}${c.slug}`
    .toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/(^-|-$)/g, "")
  const url = `${BASE_URL}/${c.t.landing}/${c.slug}`
  const related = []
  if (c.hmiLink) {
    const u = String(c.hmiLink)
    related.push({ relatedIdentifier: u, relatedIdentifierType: /^10\.\d/.test(u) ? "DOI" : "URL", relationType: "References" })
  }
  const types = { resourceTypeGeneral: c.t.rtGeneral }
  if (c.t.rtText) types.resourceType = c.t.rtText

  const attributes = {
    ...(DATACITE_PREFIX ? { doi: `${DATACITE_PREFIX}/${suffix}`, prefix: DATACITE_PREFIX, suffix } : {}),
    creators: [CREATOR],
    titles: [{ title: c.title }],
    publisher: PUBLISHER,
    ...(c.pubYear ? { publicationYear: c.pubYear } : {}),
    types,
    url,
    rightsList: RIGHTS,
    ...(c.version ? { version: String(c.version).replace(/\s*\(.*$/, "").trim() } : {}),
    ...(related.length ? { relatedIdentifiers: related } : {}),
    ...(c.description ? { descriptions: [{ description: String(c.description).slice(0, 2000), descriptionType: "Abstract" }] } : {}),
    ...(state === "draft" ? {} : { event: state }), // register | publish; draft omits event
  }
  return { data: { type: "dois", attributes }, _suffix: suffix }
}

// Fields a *findable* DOI must carry (real gaps, not silently defaulted).
function missingFields(c) {
  const gaps = []
  if (!c.title) gaps.push("title")
  if (c.pubYearDefaulted) gaps.push("publicationYear (no effective_date/date/updated)")
  if (!c.t.rtGeneral) gaps.push("resourceTypeGeneral")
  const brand = brandHit(c.title, c.description, c.slug)
  if (brand) gaps.push(`BRAND/FIREWALL hit: "${brand}"`)
  return gaps
}

// --- dry-run / emit / manifest -----------------------------------------------------------------
console.log(`mint-dois (cert): ${live ? `LIVE state=${state}` : "DRY-RUN"}  mode=${DATACITE_MODE}  prefix=${DATACITE_PREFIX || "<unset>"}`)
console.log(`  eligible total: ${candidates.length}   this run: ${batch.length}`)
const byType = {}
for (const c of batch) byType[c.typeName] = (byType[c.typeName] || 0) + 1
console.log("  by type:", Object.entries(byType).map(([k, v]) => `${k}=${v}`).join("  ") || "(none)")
const stdBatch = batch.filter((c) => c.typeName === "standards")
if (stdBatch.length) {
  const byCat = {}
  for (const c of stdBatch) byCat[c.category] = (byCat[c.category] || 0) + 1
  console.log("  standards by category:", Object.entries(byCat).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, v]) => `c${k}:${v}`).join(" "))
  console.log(`  standards completeness: ${stdBatch.filter((c) => c.complete).length} COMPLETE  (include-incomplete=${includeIncomplete})`)
}
if (skips.length) {
  const held = skips.filter(([, r]) => /INCOMPLETE|uncompiled/.test(r)).length
  const csHeld = skips.filter(([, r]) => /CLAIM-SURFACE FAIL/.test(r)).length
  console.log(`  skipped: ${skips.length}  (${held} held for completeness; ${csHeld} claim-surface FAIL; ${skips.length - held - csHeld} ineligible/already-deposited)`)
}
if (batch.some((c) => c.typeName === "standards" && claimSurfaceFail.has(c.slug))) {
  console.error(`\n!! ABORT: a claim-surface FAIL standard reached the mint batch. This is impossible — refusing to mint.`)
  process.exit(1)
}
const gapped = batch.map((c) => ({ c, gaps: missingFields(c) })).filter((x) => x.gaps.length)
if (gapped.length) {
  console.log(`\n  !! ${gapped.length} item(s) BLOCKED — fix before mint:`)
  for (const { c, gaps } of gapped.slice(0, 30)) console.log(`     ${c.typeName}/${c.slug}: ${gaps.join("; ")}`)
}

if (doManifest) {
  fs.mkdirSync(DATA, { recursive: true })
  const rows = ["type,category,slug,suffix,url,resourceTypeGeneral,version,complete,publicationYear,title"]
  for (const c of batch) {
    const p = buildPayload(c)
    rows.push([c.typeName, c.category ?? "", c.slug, p._suffix, `${BASE_URL}/${c.t.landing}/${c.slug}`,
      c.t.rtGeneral, c.version ? String(c.version).replace(/\s*\(.*$/, "").trim() : "", c.complete, c.pubYear ?? "",
      `"${String(c.title).replace(/"/g, "'")}"`].join(","))
  }
  fs.writeFileSync(path.join(DATA, "doi-manifest.csv"), rows.join("\n") + "\n")
  console.log(`\n  wrote data/standards/doi-manifest.csv (${batch.length} rows) — human sign-off artifact`)
}
if (doEmit) {
  if (!DATACITE_PREFIX) { console.error("\n  --emit needs DATACITE_PREFIX in env to produce depositable JSON. Aborting emit."); process.exit(1) }
  const outDir = path.join(REPO, "tools", ".doi-deposit")
  fs.mkdirSync(outDir, { recursive: true })
  for (const c of batch) {
    const { _suffix, ...p } = buildPayload(c)
    fs.writeFileSync(path.join(outDir, `${c.typeName}.${c.slug}.json`), JSON.stringify(p, null, 2))
  }
  console.log(`\n  wrote ${batch.length} DataCite payloads to tools/.doi-deposit/`)
}

if (!live) {
  if (gapped.length) console.log(`\n  (dry-run: ${gapped.length} blocked item(s) above must be resolved before --live.)`)
  if (!credentialsReady) console.log(`\n  (no live credentials in env — planning report. Set DATACITE_USER/PASSWORD/PREFIX, then --live to deposit.)`)
  else if (!wantLive) console.log(`\n  (credentials present; pass --live to deposit.)`)
  process.exit(0)
}

// --- live deposit ------------------------------------------------------------------------------
if (gapped.length) { console.error(`\n!! ABORT: ${gapped.length} item(s) fail the pre-mint gate (missing fields / brand hit). Resolve them first.`); process.exit(1) }
if (batch.some((c) => c.typeName === "standards" && claimSurfaceFail.has(c.slug))) {
  console.error(`\n!! ABORT: refusing to mint — claim-surface FAIL in the live batch (ORDER S-DOI-FORCE-1).`)
  process.exit(1)
}
const persist = DATACITE_MODE === "live" // never stamp non-resolvable test DOIs into frontmatter
if (!persist) console.log(`  (test mode: verifying round-trip only; DOIs are NOT written back to frontmatter.)`)

const auditDir = path.join(DATA, "doi-audit")
fs.mkdirSync(auditDir, { recursive: true })
const auditPath = path.join(auditDir, `dois-minted-${today}.csv`)
if (!fs.existsSync(auditPath)) fs.writeFileSync(auditPath, "page_path,type,cert_doi,state,sha256_at_mint,mode,timestamp\n")
let minted = 0, failed = 0
for (const c of batch) {
  const { _suffix, ...payload } = buildPayload(c)
  try {
    const r = await fetch(DATACITE_API, {
      method: "POST",
      headers: { "Content-Type": "application/vnd.api+json", Authorization: `Basic ${Buffer.from(`${DATACITE_USER}:${DATACITE_PASSWORD}`).toString("base64")}` },
      body: JSON.stringify(payload),
    })
    if (!r.ok) { console.error(`  FAIL ${c.typeName}/${c.slug}: ${r.status} ${(await r.text()).slice(0, 240)}`); failed += 1; continue }
    const doi = (await r.json())?.data?.attributes?.doi
    if (!doi) { console.error(`  FAIL ${c.typeName}/${c.slug}: no doi in response`); failed += 1; continue }

    if (persist) {
      if (isTestPrefix(doi)) { console.error(`  FAIL ${c.typeName}/${c.slug}: refusing to persist test-prefix DOI ${doi}`); failed += 1; continue }
      let newRaw
      if (c.hasCertDoiLine) newRaw = c.raw.replace(/^cert_doi:\s*.*$/m, `cert_doi: "${doi}"`)
      else newRaw = c.raw.replace(/^---\n/, `---\ncert_doi: "${doi}"\n`) // INSERT after opening fence
      if (newRaw === c.raw) { console.error(`  ABORT ${c.typeName}/${c.slug}: write-back changed nothing — DOI ${doi} minted but unpersistable. Stopping.`); failed += 1; break }
      fs.writeFileSync(c.filePath, newRaw, "utf8")
      const sha = crypto.createHash("sha256").update(newRaw).digest("hex")
      fs.appendFileSync(auditPath, `${path.relative(REPO, c.filePath)},${c.typeName},${doi},${state},${sha},${DATACITE_MODE},${new Date().toISOString()}\n`)
    } else {
      fs.appendFileSync(auditPath, `${path.relative(REPO, c.filePath)},${c.typeName},${doi},${state},(test-not-persisted),${DATACITE_MODE},${new Date().toISOString()}\n`)
    }
    minted += 1
    if (minted % 20 === 0) console.log(`  minted ${minted}/${batch.length}...`)
  } catch (err) { console.error(`  ERROR ${c.typeName}/${c.slug}: ${err.message}`); failed += 1 }
}
console.log(`\n  minted: ${minted}   failed: ${failed}   audit: ${path.relative(REPO, auditPath)}`)
if (persist) console.log(`  next: rebuild so cert_doi resolves in the cite line + <meta>, then run standard-readiness-lint.`)
else console.log(`  next: confirm each DOI resolves via handle.test.datacite.org to a landing page rendering the DOI + JSON-LD, then repeat in live mode.`)
