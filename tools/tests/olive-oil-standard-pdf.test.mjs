import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { cellRow, derivRow, references } from "../lib/standard-pdf-rows.mjs"
import { backMatterBlocks } from "../lib/pdf-back-matter.mjs"

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..")
const cells = JSON.parse(fs.readFileSync(path.join(root, "data/standards/cat30-compiled/olive-oil.json"), "utf8")).variants.default

const limit = (k, label) => cellRow([k, label], cells[k])
const deriv = (k, label) => derivRow([k, label], cells[k])

test("olive-oil limit rows keep the locked numbers and name the real instruments", () => {
  const rows = {
    Pb: limit("Pb", "Lead (Pb)"),
    Cd: limit("Cd", "Cadmium (Cd)"),
    tAs: limit("tAs", "Total arsenic (tAs)"),
    tHg: limit("tHg", "Mercury, total (tHg)"),
    Ni: limit("Ni", "Nickel (Ni)"),
    Cr: limit("Cr", "Total chromium (Cr)"),
    "Cr-VI": limit("Cr-VI", "Hexavalent chromium (Cr-VI)"),
    Sn: limit("Sn", "Tin (Sn)"),
    Al: limit("Al", "Aluminium (Al)"),
  }
  assert.match(rows.Pb, /\| 80 \|/)
  assert.match(rows.Pb, /GSO/)
  assert.match(rows.Cd, /\| 30 \|/)
  assert.match(rows.Cd, /Israel/)
  assert.match(rows.tAs, /\| 100 \|/)
  assert.match(rows.tAs, /Codex/)
  assert.match(rows.tHg, /\| 20 \|/)
  assert.match(rows.tHg, /Israel/)
  assert.match(rows.Ni, /\| 100 \|/)
  assert.match(rows.Ni, /EU 2024\/1987/)
  assert.match(rows.Cr, /\| 300 \|/)
  assert.match(rows.Cr, /GB 2762/)
  assert.match(rows["Cr-VI"], /\| 10 \|/)
  assert.match(rows["Cr-VI"], /CA SWRCB/)
  assert.match(rows.Sn, /\| 200,000 \|/)
  assert.match(rows.Sn, /EU 2023\/915/)
  assert.match(rows.Al, /\| 1,000 \|/)
  assert.match(rows.Al, /EU 10\/2011/)
  for (const row of Object.values(rows)) assert.doesNotMatch(row, /Tier/)
})

test("olive-oil species print as parent inequalities, not the parent ceiling copied into the cell", () => {
  for (const row of [limit("iAs", "Inorganic arsenic (iAs)"), deriv("iAs", "Inorganic arsenic (iAs)")]) {
    assert.match(row, /≤ tAs/)
    assert.doesNotMatch(row, /\| 100 \|/)
  }
  for (const row of [limit("MeHg", "Methylmercury (MeHg)"), deriv("MeHg", "Methylmercury (MeHg)")]) {
    assert.match(row, /≤ tHg/)
    assert.doesNotMatch(row, /\| 20 \|/)
  }
})

test("olive-oil references are the eight real sources, gov and read-across alike", () => {
  const names = references(cells).map((r) => r.head)
  assert.deepEqual(names, ["GSO", "Israel", "Codex", "EU 2024/1987", "GB 2762", "CA SWRCB", "EU 2023/915", "EU 10/2011"])
  const israel = references(cells).find((r) => r.head === "Israel")
  assert.match(israel.meta, /Cd/)
  assert.match(israel.meta, /tHg/)
})

test("standard back matter does not call the document a briefing", () => {
  const blocks = backMatterBlocks({ pathSeg: "standards", isStandard: true, licenseLine: "© 2026", url: "https://heavymetalcertified.com/standards/olive-oil" })
  const text = blocks.map(([, t]) => t).join("\n")
  assert.match(text, /This standard is published/)
  assert.match(text, /standard page at/)
  assert.doesNotMatch(text, /briefing/i)
})

test("method v2 does not claim selective occurrence is a live limit", () => {
  const spec = JSON.parse(fs.readFileSync(path.join(root, "data/method/method-v2.json"), "utf8"))
  const statement = JSON.stringify(spec.statement)
  assert.doesNotMatch(spec.label, /selective occurrence/)
  assert.match(statement, /Not live/)
  assert.doesNotMatch(statement, /are set to min\(occurrence/)
  assert.doesNotMatch(statement, /use the occurrence value/)
  assert.doesNotMatch(statement, /unless no ML exists/)
})
