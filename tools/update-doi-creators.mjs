#!/usr/bin/env node
// GET-only plan by default. Apply is a separate, explicit command; never mint here.
import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import { buildResearcherCreator, creatorDigest } from "./lib/datacite-creators.mjs"
import { DATACITE_API, applyUpdatePlan, createUpdateEntry, readPublicRecord } from "./lib/datacite-creator-updates.mjs"

const args = process.argv.slice(2)
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"))
const writeJson = async (file, data) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n")
}

async function* markdownFiles(folder) {
  for (const entry of (await fs.readdir(folder, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const file = path.join(folder, entry.name)
    if (entry.isDirectory()) yield* markdownFiles(file)
    else if (entry.isFile() && entry.name.endsWith(".md")) yield file
  }
}

async function publicClientInventory(clientId) {
  let url = `${DATACITE_API}/dois?client-id=${encodeURIComponent(clientId)}&page%5Bsize%5D=1000`
  const pages = []
  const records = []
  while (url) {
    const parsed = new URL(url)
    if (parsed.origin !== DATACITE_API || parsed.pathname !== "/dois" || pages.some((p) => p.url === url)) throw new Error("Unexpected client inventory pagination URL")
    const response = await fetch(url, { redirect: "error" })
    if (!response.ok) throw new Error(`Client inventory HTTP ${response.status}`)
    const page = await response.json()
    if (!Array.isArray(page.data) || page.data.some((d) => d.relationships?.client?.data?.id !== clientId)) throw new Error("Client inventory ownership mismatch")
    records.push(...page.data)
    pages.push({ url, response: page })
    url = page.links?.next || null
  }
  return { queriedAt: new Date().toISOString(), clientId, total: records.length, pages, records }
}

async function main() {
  const identity = await readJson("data/researcher-identity.json")
  const creator = buildResearcherCreator(identity)
  if (args.includes("--template")) {
    const file = "data/datacite-creator.json"
    if (args.includes("--check")) {
      if (creatorDigest(await readJson(file)) !== creatorDigest(creator)) throw new Error("Creator template is stale; run --template")
      console.log("DataCite creator template matches the researcher identity.")
    } else { await writeJson(file, creator); console.log(`Wrote ${file}`) }
    return
  }
  const config = await readJson("data/datacite-repository.json")
  if (args.includes("--apply")) {
    const file = value("plan")
    if (!file || !value("backup-dir")) throw new Error("Apply requires --plan=<reviewed-plan.json> and --backup-dir=<directory>")
    const plan = await readJson(file)
    // Credentials are read ONLY in explicit apply mode, never during template/inventory/plan.
    const results = await applyUpdatePlan(plan, {
      identity, config, backupDir: value("backup-dir"),
      credentials: { user: process.env.DATACITE_USER, password: process.env.DATACITE_PASSWORD },
    })
    await writeJson(`${file}.applied.json`, { at: new Date().toISOString(), results })
    console.log(results.map((r) => `${r.doi}: ${r.status}`).join("\n"))
    return
  }
  const inventory = new Map()
  for (const dir of config.directories) {
    const folder = path.join(config.contentRoot, dir)
    for await (const page of markdownFiles(folder)) {
      const fm = matter(await fs.readFile(page, "utf8")).data
      for (const field of config.doiFields) {
        if (!fm[field]) continue
        const doi = String(fm[field]).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "").trim().toLowerCase()
        if (!/^10\.\d{4,9}\/\S+$/.test(doi)) continue
        if (!inventory.has(doi)) inventory.set(doi, { doi, pages: [] })
        inventory.get(doi).pages.push({ page, field })
      }
    }
  }
  const plan = {
    format: "datacite-creators-v1", createdAt: new Date().toISOString(), api: DATACITE_API,
    clientId: config.clientId, identityDigest: creatorDigest(creator),
    scope: "Existing owned DOI records named in local frontmatter, cross-checked with public client inventory. Creator metadata only; no edition or content revision implied. Private/unlisted drafts require a separate authorized inventory.",
    entries: [], held: [],
  }
  const out = value("out") ?? "reports/datacite/creator-update-plan.json"
  const clientInventory = await publicClientInventory(config.clientId)
  const clientSnapshot = out.replace(/\.json$/, "") + ".public-client-inventory.json"
  await writeJson(clientSnapshot, clientInventory)
  const unmapped = clientInventory.records.filter((record) => !inventory.has(record.id.toLowerCase()))
  plan.publicInventory = { queriedAt: clientInventory.queriedAt, total: clientInventory.total, snapshot: clientSnapshot, unmapped: unmapped.map((r) => r.id) }
  for (const record of unmapped) plan.held.push({ doi: record.id, url: record.attributes.url, reason: "Owned public DOI absent from configured local own-DOI fields; review landing and authorship before planning an update" })
  for (const item of inventory.values()) {
    if (!config.prefixes.includes(item.doi.split("/")[0])) {
      plan.held.push({ ...item, reason: "External/legacy repository DOI; do not update through this account" })
      continue
    }
    try {
      const record = await readPublicRecord(item.doi)
      const entry = createUpdateEntry(record, identity, config)
      const snapshot = path.join(path.dirname(out), "public-records", `${item.doi.replaceAll(/[^a-zA-Z0-9.-]/g, "_")}.json`)
      await writeJson(snapshot, record)
      plan.entries.push({ ...entry, pages: item.pages, snapshot })
    } catch (e) { plan.held.push({ ...item, reason: e.message }) }
  }
  await writeJson(out, plan)
  console.log(`Wrote ${out}: ${plan.entries.filter((e) => e.status === "update").length} updates, ${plan.entries.filter((e) => e.status === "unchanged").length} unchanged, ${plan.held.length} held. GET only; no credentials read.`)
}

main().catch((error) => { console.error(error.message); process.exitCode = 1 })
