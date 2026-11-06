import assert from "node:assert/strict"
import test from "node:test"
import { auditPdfText } from "../audit-standard-pdfs.mjs"

const bytes = Buffer.from("%PDF-1.3\n/Producer (react-pdf)\n%%EOF")

test("a house PDF with a named basis and the ORCID digits is clean", () => {
  const text = [
    "Karen Pendergrass · 0000-0002-2348-7259 · Heavy Metal Tested & Certified",
    "government maximum level in the product's native basis",
    "every value traces to a named sovereign maximum level, disclosed",
    "Lead (Pb)",
    "80",
    "government maximum level (GSO)",
    "Inorganic arsenic (iAs)",
    "≤ tAs",
    "This standard is published",
  ].join("\n")
  const cells = { iAs: { type: "subsumed", value: null, subsumed_by: "tAs" } }
  assert.deepEqual(auditPdfText(text, bytes, cells), [])
})

test("tier, empty ORCID, briefing, generic basis, and a numeric subsumed species are stale", () => {
  const text = [
    "Karen Pendergrass ·  · Heavy Metal Tested & Certified",
    "ANALYTE TIER HMTC LIMIT",
    "Lead (Pb)",
    "Tier 1",
    "human-grade read-across (EU)",
    "Inorganic arsenic (iAs)",
    "100",
    "This briefing is published",
  ].join("\n")
  const cells = { iAs: { type: "subsumed", value: null, subsumed_by: "tAs" } }
  const flags = auditPdfText(text, bytes, cells)
  for (const f of ["tier", "orcid", "briefing", "generic-basis", "species-number"]) assert.ok(flags.includes(f), f)
})

test("a firm numeric iAs ceiling is not a species-number defect", () => {
  const text = ["Inorganic arsenic (iAs)", "100", "0000-0002-2348-7259"].join("\n")
  const cells = { iAs: { type: "gov", value: 100 } }
  assert.deepEqual(auditPdfText(text, bytes, cells), [])
})
