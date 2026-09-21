import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { lintAnalyteTierStatus } from "../lib/analyte-tier-status-lint.mjs"
import { wordCount, sentenceCount, HERO_DEK_MAX_WORDS, HERO_DEK_MAX_SENTENCES } from "../lib/design-tokens.mjs"
import { METHOD_PAGE_HREF, METHOD_POINTER_HTML, METHOD_EDITION_POINTER_HTML, withMethodConn } from "../lib/method-change.mjs"

const REPO = process.cwd()
const PAGE = path.join(REPO, "content/program/method.md")

test("canonical method page exists at /program/method and names v2 as current", () => {
  const raw = fs.readFileSync(PAGE, "utf8")
  assert.match(raw, /^title: Method$/m)
  assert.match(raw, /^type: program$/m)
  assert.match(raw, /^scholar_eligible: false$/m)
  assert.match(raw, /Method v2\.0 is current/)
  assert.match(raw, /Method v1 is retired/)
  assert.doesNotMatch(raw, /cert_doi:|citation_doi|10\.83138\/hmtc\.method/)
  assert.match(raw, /10\.83138\/hmtc\.manual\.infant-and-child-foods/)
  assert.match(raw, /All rights reserved/)
  assert.match(raw, /MaxPoL/)
  assert.match(raw, /retired/)
  assert.doesNotMatch(raw, /Status A–E|A-E ladder|transitional allowance/)
})

test("hero dek is one job, not a word pile", () => {
  const raw = fs.readFileSync(PAGE, "utf8")
  const m = raw.match(/^description:\s*"([^"]+)"/m)
  assert.ok(m, "frontmatter description is the hero dek")
  assert.ok(wordCount(m[1]) <= HERO_DEK_MAX_WORDS, `dek ${wordCount(m[1])} words`)
  assert.ok(sentenceCount(m[1]) <= HERO_DEK_MAX_SENTENCES)
})

test("method page does not revive analyte-class status architecture", () => {
  const raw = fs.readFileSync(PAGE, "utf8")
  assert.deepEqual(lintAnalyteTierStatus(raw, "content/program/method.md"), [])
})

test("pointer helper is one sentence and one URL", () => {
  assert.equal(METHOD_PAGE_HREF, "/program/method")
  assert.match(METHOD_POINTER_HTML, /href="\/program\/method"/)
  assert.match(METHOD_EDITION_POINTER_HTML, /href="\/program\/method"/)
  assert.match(METHOD_EDITION_POINTER_HTML, /This edition uses Method v2/)
  assert.equal(withMethodConn([]).length, 1)
  assert.equal(withMethodConn([{ label: "x", href: "/program/method" }]).length, 1)
})

test("structure and manuals generators link instead of reprinting the autopsy", () => {
  const structure = fs.readFileSync(path.join(REPO, "content/program/structure.md"), "utf8")
  assert.match(structure, /\/program\/method/)
  assert.doesNotMatch(structure, /MaxPoL/)
  const manualsGen = fs.readFileSync(path.join(REPO, "tools/build-manuals-page.mjs"), "utf8")
  assert.match(manualsGen, /\/program\/method/)
  assert.doesNotMatch(manualsGen, /retired V1 Zenodo dump/)
  const edition = fs.readFileSync(path.join(REPO, "tools/lib/manual-v3-page.mjs"), "utf8")
  assert.match(edition, /METHOD_EDITION_POINTER_HTML/)
  assert.doesNotMatch(edition, /V1 is retired/)
  assert.doesNotMatch(edition, /Method v2 governing instrument/)
})
