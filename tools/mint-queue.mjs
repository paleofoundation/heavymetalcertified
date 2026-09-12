#!/usr/bin/env node
// mint-queue.mjs — the DOI mint queue runner for heavymetalcertified (S-DOI-QUEUE-1).
//
// REPORT mode (default): classifies every published standard page as MINTED / ELIGIBLE /
// BLOCKED and prints the queue length, the top-N eligible slugs, and the top-N blockers with
// reasons. Read-only — no credentials, no deposit.
//
// A page is ELIGIBLE to mint iff (mirrors the mint-dois gate, per-slug — never a corpus-global
// abort):
//   1. claim-surface PASS         — slug not in tools/claim-surface-lint.mjs offenders
//   2. readiness COMPLETE+CORRECTED — from data/standards/readiness-manifest.json
//   3. species <= parent          — panel-coherence holds (compiled; enforced corpus-wide, so a
//                                    green panel-coherence-lint means every eligible slug passes)
//   4. PDF = house react-pdf      — content/static/standards/<slug>.pdf exists and is react-pdf
//   5. NOT already minted         — cert_doi is null in the page frontmatter
//
// MINT mode: --mint[=N] mints the next N eligible slugs (default N=1) under the env credentials
// (VAJU.HDAWAI / 10.83138 — never 10.5072, never VAJU.HMI), one --slug at a time via mint-dois,
// then rebuilds that page + its scholarly PDF (APA cite, cert_doi preserved). Requires
// DATACITE_USER/PASSWORD/PREFIX in env; refuses if absent. Never mass-mints: N is explicit.
//
// Usage:
//   node tools/mint-queue.mjs                 # report (top 10)
//   node tools/mint-queue.mjs --top=25 --json # report, more rows / machine-readable
//   node tools/mint-queue.mjs --mint          # mint next 1 eligible (needs creds + intent)
//   node tools/mint-queue.mjs --mint=3        # mint next 3
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"
import { checkPdfProducer } from "./pdf-producer-lint.mjs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const CONTENT = path.join(REPO, "content/standards")
const STATIC = path.join(REPO, "content/static/standards")
const MANIFEST = path.join(REPO, "data/standards/readiness-manifest.json")

const args = process.argv.slice(2)
const JSON_OUT = args.includes("--json")
const TOP = Number((args.find((a) => a.startsWith("--top=")) || "").split("=")[1]) || 10
const mintArg = args.find((a) => a === "--mint" || a.startsWith("--mint="))
const MINT_N = mintArg ? (mintArg.includes("=") ? Math.max(1, Number(mintArg.split("=")[1]) || 1) : 1) : 0

const fmField = (raw, key) => {
  const m = raw.match(new RegExp(`^${key}:\\s*(.*)$`, "m"))
  return m ? m[1].replace(/^["']|["']$/g, "").trim() : null
}

// readiness: slug -> { complete, corrected }
function readinessMap() {
  const map = new Map()
  if (!fs.existsSync(MANIFEST)) return map
  const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  for (const c of m.categories || []) for (const r of c.records || c.pages || []) {
    if (r && r.slug) map.set(r.slug, { complete: !!r.complete, corrected: !!r.corrected, claim_empty: r.claim_empty || [], rice_missing_ias: !!r.rice_missing_ias })
  }
  return map
}

function classify() {
  const ready = readinessMap()
  const rows = []
  for (const f of fs.readdirSync(CONTENT)) {
    if (!f.endsWith(".md") || f === "index.md") continue
    const raw = fs.readFileSync(path.join(CONTENT, f), "utf8")
    if (fmField(raw, "type") !== "standard") continue
    const slug = fmField(raw, "product_slug") || f.replace(/\.md$/, "")
    const certDoi = fmField(raw, "cert_doi")
    const minted = certDoi && certDoi.toLowerCase() !== "null"
    const rd = ready.get(slug)
    const pdfPath = path.join(STATIC, `${slug}.pdf`)
    const pdfReact = fs.existsSync(pdfPath) ? checkPdfProducer(fs.readFileSync(pdfPath)).ok : false

    let status, reason = ""
    if (minted) { status = "MINTED" }
    else if (!rd) { status = "BLOCKED"; reason = "no readiness record" }
    else if (!rd.complete) { status = "BLOCKED"; reason = "readiness not COMPLETE (empty cells)" }
    else if (!rd.corrected) { status = "BLOCKED"; reason = "not CORRECTED (confidence pass)" }
    else if (rd.rice_missing_ias || (rd.claim_empty && rd.claim_empty.length)) { status = "BLOCKED"; reason = "claim-surface FAIL (empty claim cell)" }
    else if (!fs.existsSync(pdfPath)) { status = "BLOCKED"; reason = "no committed PDF" }
    else if (!pdfReact) { status = "BLOCKED"; reason = "PDF not react-pdf (Chromium/unknown)" }
    else { status = "ELIGIBLE" }
    rows.push({ slug, status, reason, doi: minted ? certDoi : null })
  }
  return rows.sort((a, b) => a.slug.localeCompare(b.slug))
}

function report(rows) {
  const eligible = rows.filter((r) => r.status === "ELIGIBLE")
  const blocked = rows.filter((r) => r.status === "BLOCKED")
  const minted = rows.filter((r) => r.status === "MINTED")
  if (JSON_OUT) { console.log(JSON.stringify({ counts: { published: rows.length, minted: minted.length, eligible: eligible.length, blocked: blocked.length }, eligible, blocked }, null, 2)); return { eligible } }
  console.log(`mint-queue: ${rows.length} published standard(s) — ${minted.length} minted · ${eligible.length} ELIGIBLE (queue) · ${blocked.length} blocked`)
  console.log(`\n  QUEUE LENGTH: ${eligible.length}`)
  console.log(`\n  Top ${Math.min(TOP, eligible.length)} ELIGIBLE:`)
  for (const r of eligible.slice(0, TOP)) console.log(`    ${r.slug}`)
  // group blockers by reason for the top-N
  const byReason = {}
  for (const b of blocked) (byReason[b.reason] ||= []).push(b.slug)
  console.log(`\n  Blockers by reason:`)
  for (const [reason, slugs] of Object.entries(byReason).sort((a, b) => b[1].length - a[1].length)) console.log(`    ${String(slugs.length).padStart(4)}  ${reason}`)
  console.log(`\n  Top ${Math.min(TOP, blocked.length)} BLOCKED (slug — reason):`)
  for (const b of blocked.slice(0, TOP)) console.log(`    ${b.slug.padEnd(40)} ${b.reason}`)
  return { eligible }
}

const rows = classify()
const { eligible } = report(rows)

if (MINT_N > 0) {
  const haveCreds = process.env.DATACITE_USER && process.env.DATACITE_PASSWORD && process.env.DATACITE_PREFIX
  if (!haveCreds) { console.error(`\n!! --mint requested but DATACITE_USER/PASSWORD/PREFIX are not set. Refusing to mint.`); process.exit(1) }
  const targets = eligible.slice(0, MINT_N)
  console.log(`\n=== MINT: next ${targets.length} of ${eligible.length} eligible ===`)
  for (const t of targets) {
    console.log(`\n-- ${t.slug} --`)
    execFileSync("node", [path.join(REPO, "tools/mint-dois.mjs"), "--types=standards", `--slug=${t.slug}`, "--live"], { cwd: REPO, stdio: "inherit", env: process.env })
    execFileSync("node", [path.join(REPO, "tools/build-standard-pdf.mjs"), t.slug], { cwd: REPO, stdio: "inherit" })
    // page cite (APA) is refreshed by the category renderer on the next prebuild; the generator
    // preserves cert_doi from the rendered page. Callers commit + PR per the existing Ship path.
    console.log(`STATUS ${t.slug} | minted+pdf-rebuilt | commit/PR per Ship path`)
  }
}
