// A deposited manual DOI has to survive the landing-page regen. The check uses a
// temp copy and a fake DOI. It does not write the live pages and it does not deposit.

import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { resolveManualCertDoi } from "../lib/manual-doi.mjs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const FAKE = "10.83138/hmtc.manual.fake-deposit-check"
const CAT1 = "10.83138/hmtc.manual.infant-and-child-foods"
const CAT17_STD = "10.83138/hmtc.std.17.pet-food-dry-kibble"

function regen({ configSrc, slug, doiOn }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "manual-doi-"))
  const config = path.join(dir, "manual.json")
  fs.copyFileSync(path.join(REPO, configSrc), config)
  const manifest = path.join(dir, "manifest.json")
  fs.copyFileSync(path.join(REPO, "data/manuals/manifest.json"), manifest)
  const existing = path.join(dir, "existing.md")
  const vh = path.join(dir, "vh.json")
  fs.writeFileSync(existing, "---\ncert_doi: null\n---\n")
  fs.writeFileSync(vh, JSON.stringify({ versions: [{ status: "current", doi: null, doi_pending: "not yet deposited" }] }))
  if (doiOn === "cert_doi") fs.writeFileSync(existing, `---\ncert_doi: "${FAKE}"\n---\n`)
  if (doiOn === "config") {
    const cfg = JSON.parse(fs.readFileSync(config, "utf8"))
    cfg._meta.cert_doi = FAKE
    fs.writeFileSync(config, JSON.stringify(cfg))
  }
  if (doiOn === "manifest") {
    const man = JSON.parse(fs.readFileSync(manifest, "utf8"))
    const row = man.manuals.find((m) => m.slug === slug)
    assert.ok(row, `manifest row ${slug}`)
    row.doi = FAKE
    fs.writeFileSync(manifest, JSON.stringify(man))
  }
  if (doiOn === "version") {
    fs.writeFileSync(vh, JSON.stringify({ versions: [{ status: "current", doi: FAKE }] }))
  }
  const out = path.join(dir, "page.md")
  const r = spawnSync(process.execPath, [
    "tools/build-category-manual.mjs",
    `--pages=${config}`,
    `--out=${out}`,
    `--manifest=${manifest}`,
    `--existing=${existing}`,
    `--version-history=${vh}`,
  ], { cwd: REPO, encoding: "utf8" })
  assert.equal(r.status, 0, `${doiOn || "null"}\n${r.stdout}\n${r.stderr}`)
  return fs.readFileSync(out, "utf8")
}

function assertShows(page, label) {
  const escaped = FAKE.replace(/[.]/g, "\\.")
  assert.match(page, new RegExp(`cert_doi:\\s*"${escaped}"`), `${label} frontmatter`)
  assert.match(page, new RegExp(`House DOI ${escaped}`), `${label} visible DOI`)
  assert.doesNotMatch(page, /not deposited/i, label)
  assert.doesNotMatch(page, /stays empty/i, label)
  assert.doesNotMatch(page, /not yet assigned/i, label)
  assert.doesNotMatch(page, /DOI pending/i, label)
  assert.doesNotMatch(page, /reserved for deposit/i, label)
}

test("disagreeing DOI sources are refused", () => {
  assert.throws(
    () => resolveManualCertDoi({
      pageDoi: FAKE,
      manifestDoi: "10.83138/hmtc.manual.other",
    }),
    /disagree/,
  )
  assert.equal(resolveManualCertDoi({ pageDoi: "null", configDoi: null, manifestDoi: null }), null)
})

test("a fake DOI in a temp copy is on the regenerated page", () => {
  for (const src of ["cert_doi", "manifest", "config", "version"]) {
    assertShows(regen({
      configSrc: "data/standards/cat26-manual.json",
      slug: "peptides-sarms-and-research-chemicals",
      doiOn: src,
    }), src)
  }
  const live = fs.readFileSync(path.join(REPO, "content/manuals/peptides-sarms-and-research-chemicals.md"), "utf8")
  assert.match(live, /^cert_doi: null$/m)
  assert.match(live, /not deposited yet/)
})

test("a temp copy with no DOI still says not deposited", () => {
  const page = regen({
    configSrc: "data/standards/cat26-manual.json",
    slug: "peptides-sarms-and-research-chemicals",
    doiOn: null,
  })
  assert.match(page, /^cert_doi: null$/m)
  assert.match(page, /not deposited yet/)
  assert.doesNotMatch(page, new RegExp(FAKE.replace(/[.]/g, "\\.")))
})

test("Cat 1 still renders its house DOI", () => {
  const page = fs.readFileSync(path.join(REPO, "content/manuals/infant-and-child-foods.md"), "utf8")
  assert.match(page, new RegExp(`cert_doi:\\s*"${CAT1.replace(/[.]/g, "\\.")}"`))
  assert.match(page, /Current house DOI 10\.83138\/hmtc\.manual\.infant-and-child-foods/)
})

test("Cat 17 still renders its standard DOIs, and a deposited manual DOI is kept", () => {
  const std = fs.readFileSync(path.join(REPO, "content/standards/pet-food-dry-kibble.md"), "utf8")
  assert.match(std, new RegExp(`cert_doi:\\s*"${CAT17_STD.replace(/[.]/g, "\\.")}"`))
  const canned = fs.readFileSync(path.join(REPO, "content/standards/pet-food-canned-wet.md"), "utf8")
  assert.match(canned, /cert_doi:\s*"10\.83138\/hmtc\.std\.17\.pet-food-canned-wet"/)
  assertShows(regen({
    configSrc: "data/standards/cat17-manual.json",
    slug: "pet-foods",
    doiOn: "manifest",
  }), "cat17 manifest")
  assertShows(regen({
    configSrc: "data/standards/cat17-manual.json",
    slug: "pet-foods",
    doiOn: "cert_doi",
  }), "cat17 cert_doi")
  const live = fs.readFileSync(path.join(REPO, "content/manuals/pet-foods.md"), "utf8")
  assert.match(live, /^cert_doi: null$/m)
})
