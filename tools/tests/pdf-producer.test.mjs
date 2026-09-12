// Guards the standards-PDF producer invariant (ORDER S-DOI-OLIVE-FINISH-1 addendum):
// a committed per-slug standard PDF must be house @react-pdf output, never a
// Chromium/Skia browser print. Backs tools/pdf-producer-lint.mjs (wired into prebuild).
import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { checkPdfProducer } from "../pdf-producer-lint.mjs"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

test("react-pdf producer bytes PASS", () => {
  const r = checkPdfProducer(Buffer.from("%PDF-1.3\n... /Producer (react-pdf) ...\n%%EOF"))
  assert.equal(r.ok, true)
  assert.equal(r.hasReactPdf, true)
  assert.equal(r.browserHit, null)
})

test("Chromium/Skia browser-print FAILS (the S-DOI-OLIVE-PDF-1 root failure)", () => {
  const skia = checkPdfProducer(Buffer.from("%PDF-1.4\n/Producer (Skia/PDF m123)\n/Creator (Chromium)\n%%EOF"))
  assert.equal(skia.ok, false)
  assert.ok(skia.browserHit) // names Skia or Chromium
  // even if a browser print somehow also embedded the string, a browser marker still fails
  const both = checkPdfProducer(Buffer.from("react-pdf ... /Producer (Skia/PDF)"))
  assert.equal(both.ok, false)
})

test("a PDF with no producer signature at all FAILS", () => {
  const none = checkPdfProducer(Buffer.from("%PDF-1.7\n/Producer (Acme Widgets)\n%%EOF"))
  assert.equal(none.ok, false)
  assert.equal(none.hasReactPdf, false)
})

test("the real olive-oil.pdf is house @react-pdf output", () => {
  const p = path.join(REPO, "content/static/standards/olive-oil.pdf")
  if (!fs.existsSync(p)) return // canary PDF not built in this checkout — nothing to assert
  const r = checkPdfProducer(fs.readFileSync(p))
  assert.equal(r.ok, true, "olive-oil.pdf must be react-pdf, not a browser print")
})
