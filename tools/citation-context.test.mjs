import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { auditPages, buildIndex, extractPage, importBatch, inventory, makeBatch, parseJson, readRecords, safeUrl, validateRecord } from "./lib/citation-context.mjs"

const row = (number = "1", title = "Source &amp; evidence", urls = ["https://doi.org/10.1234/example"]) => `<div style="display:grid;grid-template-columns:42px minmax(0,1fr) 128px"><span>[${number}]</span><div><span>${title}</span><p style="font-family:monospace">Authors. Journal, 2025.</p><p>Finding with ${urls.map((href) => `<a href="${href}">document</a>`).join(" and ")}.</p></div><span>Journal</span></div>`
const markdown = (prose = "First source supports this claim [1].") => `---\ntitle: Test page\n---\n## Finding\n\n${prose}\n\n## References\n\n<div data-no-cite>\n${row()}\n</div>\n`
const recordFor = (page, number = "1") => {
  const source = page.refs.find((ref) => ref.number === number)
  return { page: page.page, reviewed: "2026-09-15", refs: { [number]: {
    referenceTitle: source.referenceTitle, citation: "Authors. Example (2025).", summary: "This study measured the named samples.",
    establishes: "The result applies to the measured sample, with limited generalizability.", relevance: "The page uses this result to explain its testing rationale.",
    links: structuredClone(source.links), pageDigest: page.pageDigest, sourceDigest: source.sourceDigest,
    review: { reviewer: "Test reviewer", date: "2026-09-15", evidence: source.links.map((link) => ({ url: link.href, note: "Methods and results checked against this source; scope limited to the sampled products." })) },
  } } }
}

test("real Markdown/HTML parsing finds row titles, nearby prose and all three citation forms", () => {
  const page = extractPage(markdown('Plain citation [1].\n\nExplicit <sup class="cite"><a href="#ref-1">1</a></sup>.\n\nExisting <sup class="hmtc-cite">[1]</sup>.\n\n`skip [90]` and [link [91]](https://example.org).'), "articles/example")
  assert.equal(page.refs.length, 1)
  assert.equal(page.refs[0].referenceTitle, "Source & evidence")
  assert.equal(page.citations.length, 3)
  assert.equal(page.refs[0].citation, "Authors. Journal, 2025.")
  assert.ok(page.refs[0].contexts[0].context.includes("Plain citation"))
  assert.equal(page.refs[0].contexts[0].section, "Finding")
  assert.equal(page.refs[0].contexts[0].line, 6)
  assert.equal(page.unresolvedCitations.length, 0)
  assert.equal(page.outboundLinks.length, 0)
})

test("audit separates unresolved citations, standalone source links and unsupported reference anchors", () => {
  const page = extractPage(markdown('Supported [1]; missing [9].\n\n<a href="https://doi.org/10.1234/other">Other source</a>.\n\n<a href="https://heavymetalindex.com/sources/study">Indexed study</a>.\n\n<div id="ref-9">A reference in an unsupported layout.</div>'), "example")
  const report = auditPages([page], [recordFor(page)])
  assert.equal(report.totals.bibliographyRefs, 1)
  assert.equal(report.totals.reviewedRefs, 1)
  assert.equal(report.totals.pendingRefs, 0)
  assert.equal(report.totals.unresolvedCitationUses, 1)
  assert.equal(report.totals.outboundDoiOrHmiUses, 2)
  assert.equal(report.totals.pagesWithSupportGaps, 1)
  assert.equal(report.pages[0].unresolvedCitations[0].number, "9")
})

test("any page prose change or source identity change invalidates reviewed content", () => {
  const original = extractPage(markdown(), "example")
  const record = recordFor(original)
  assert.equal(validateRecord(record, original), record)
  const newProse = extractPage(markdown("A materially different program claim [1]."), "example")
  assert.throws(() => validateRecord(record, newProse), /stale page context/)
  const newSource = extractPage(markdown().replace("10.1234/example", "10.1234/changed"), "example")
  record.refs[1].pageDigest = newSource.pageDigest
  assert.throws(() => validateRecord(record, newSource), /stale source identity/)
})

test("title, number, URL, reviewer and evidence validation fail closed", () => {
  const page = extractPage(markdown(), "example")
  const change = (mutate) => { const record = recordFor(page); mutate(record); return () => validateRecord(record, page) }
  assert.throws(change((record) => { record.refs[1].referenceTitle = "Another source" }), /title does not match/)
  assert.throws(change((record) => { record.refs[2] = record.refs[1]; delete record.refs[1] }), /orphan/)
  assert.throws(change((record) => { record.refs[1].links[0].href = "javascript:alert(1)" }), /unsafe/)
  const cleanPage = extractPage(markdown(), "example")
  for (const url of ["javascript:alert(1)", "data:text/html,test", "//example.org", "https://user:pass@example.org", "https://example.org/a\n"]) assert.equal(safeUrl(url), false)
  assert.equal(safeUrl("https://example.org/report.pdf?q=1#page=4"), true)
  const noReviewer = recordFor(cleanPage); delete noReviewer.refs[1].review.reviewer
  assert.throws(() => validateRecord(noReviewer, cleanPage), /reviewer/)
  const noEvidence = recordFor(cleanPage); noEvidence.refs[1].review.evidence = []
  assert.throws(() => validateRecord(noEvidence, cleanPage), /evidence notes/)
  const unmatched = recordFor(cleanPage); unmatched.refs[1].review.evidence[0].url = "https://example.org/different"
  assert.throws(() => validateRecord(unmatched, cleanPage), /matching evidence/)
})

test("grouped records retain all documents and same-title incomplete identity is ambiguous", () => {
  const grouped = ["https://doi.org/10.1234/a", "https://doi.org/10.1234/b"]
  const a = extractPage(`Page A cites [1].\n\n${row("1", "Grouped documents", grouped)}`, "a")
  const b = extractPage(`Page B cites [7].\n\n${row("7", "Grouped documents", grouped)}`, "b")
  const c = extractPage(`Page C cites [1].\n\n${row("1", "Grouped documents", [grouped[0]])}`, "c")
  const d = extractPage(`Page D cites [1].\n\n${row("1", "Grouped documents", [])}`, "d")
  assert.equal(a.refs[0].links.length, 2)
  assert.equal(a.refs[0].sourceKey, b.refs[0].sourceKey)
  assert.notEqual(a.refs[0].sourceKey, c.refs[0].sourceKey)
  const reviewed = recordFor(a)
  const batch = makeBatch([a, b, c, d], [reviewed], { limit: 3 })
  assert.equal(batch.jobs[0].page, "b")
  assert.equal(batch.jobs[0].suggestions.length, 1)
  assert.equal(batch.jobs[0].suggestions[0].relevance, undefined)
  assert.equal(batch.jobs[1].suggestions.length, 0)
  assert.equal(batch.jobs[2].suggestions.length, 0)
  const audit = auditPages([a, b, c, d], [reviewed])
  assert.equal(audit.ambiguousTitles.length, 1)
  assert.equal(audit.exactSourceGroups.find((group) => group.uses.length === 2).uses.length, 2)
})

test("duplicate bibliography numbers and JSON keys fail, including escaped duplicate keys", () => {
  const page = extractPage(`Claim [1].\n\n${row()}\n${row()}`, "example")
  assert.throws(() => validateRecord(recordFor(page), page), /duplicate bibliography numbers/)
  assert.throws(() => parseJson('{"refs":{"1":{},"1":{}}}'), /Duplicate JSON key/)
  assert.throws(() => parseJson('{"refs":{"1":{},"\\u0031":{}}}'), /Duplicate JSON key/)
  assert.deepEqual(parseJson('{"one":[true, {"label":"{not a key}"}, 1.2e3]}'), { one: [true, { label: "{not a key}" }, 1200] })
})

test("dry-run/import/build roundtrip publishes only compact reviewed context and rejects later drift", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "citation-context-test-"))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.mkdir(path.join(root, "content/articles"), { recursive: true })
  await fs.writeFile(path.join(root, "content/articles/example.md"), markdown())
  const pages = await inventory(root)
  const batch = makeBatch(pages, [], { limit: 1 })
  batch.records = [recordFor(pages[0])]
  const dryRun = await importBatch(root, batch)
  assert.equal(dryRun.write, false)
  await assert.rejects(fs.stat(path.join(root, "data/source-panels/articles/example.json")), /ENOENT/)
  await importBatch(root, batch, { write: true })
  const index = await buildIndex(root)
  assert.equal(index["articles/example"].refs[1].summary, batch.records[0].refs[1].summary)
  assert.equal(index["articles/example"].refs[1].review, undefined)
  assert.equal(index["articles/example"].refs[1].pageDigest, undefined)
  assert.equal(index["articles/example"].refs[1].sourceDigest, undefined)
  assert.equal(index["articles/example"].refs[1].pageBody, undefined)
  await fs.writeFile(path.join(root, "content/articles/example.md"), markdown("The program changed its use of this evidence [1]."))
  await assert.rejects(buildIndex(root), /stale page context/)
  await assert.rejects(importBatch(root, batch, { write: true }), /stale page context/)
})

test("imports reject unmatched manifests and duplicate pages before writing", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "citation-context-manifest-"))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const page = extractPage(markdown(), "example")
  const batch = makeBatch([page])
  batch.records = [recordFor(page)]
  batch.jobs[0].sourceDigest = "wrong"
  await assert.rejects(importBatch(root, batch, { pages: [page], write: true }), /job manifest/)
  await assert.rejects(fs.stat(path.join(root, "data")), /ENOENT/)
  batch.jobs[0].sourceDigest = page.refs[0].sourceDigest
  batch.records.push(recordFor(page))
  await assert.rejects(importBatch(root, batch, { pages: [page], write: true }), /Duplicate imported page/)
  await assert.rejects(fs.stat(path.join(root, "data")), /ENOENT/)
})

test("a stale six-reference page refreshes in bounded batches while archiving old evidence", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "citation-context-refresh-"))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.mkdir(path.join(root, "content"), { recursive: true })
  const content = `Prose claim [1][2][3][4][5][6].\n\n${Array.from({ length: 6 }, (_, i) => row(String(i + 1))).join("\n")}`
  await fs.writeFile(path.join(root, "content/example.md"), content)
  let pages = await inventory(root)
  let batch = makeBatch(pages, [], { limit: 6 })
  const complete = recordFor(pages[0])
  for (let number = 2; number <= 6; number++) Object.assign(complete.refs, recordFor(pages[0], String(number)).refs)
  batch.records = [complete]
  await importBatch(root, batch, { write: true })
  await fs.writeFile(path.join(root, "content/example.md"), content.replace("Prose claim", "Changed page claim"))
  pages = await inventory(root)
  batch = makeBatch(pages, await readRecords(root))
  assert.equal(batch.jobs.length, 5)
  const partial = recordFor(pages[0])
  for (let number = 2; number <= 5; number++) Object.assign(partial.refs, recordFor(pages[0], String(number)).refs)
  batch.records = [partial]
  const result = await importBatch(root, batch, { write: true })
  assert.deepEqual(result.retiredStaleRefs, [{ page: "example", number: "6" }])
  assert.equal(result.archivedRecords.length, 1)
  const archived = JSON.parse(await fs.readFile(path.join(root, result.archivedRecords[0]), "utf8"))
  assert.equal(Object.keys(archived.refs).length, 6)
  assert.equal(archived.refs[1].pageDigest, complete.refs[1].pageDigest)
  const index = await buildIndex(root)
  assert.equal(Object.keys(index.example.refs).length, 5)
  const remaining = makeBatch(pages, await readRecords(root))
  assert.deepEqual(remaining.jobs.map((job) => job.number), ["6"])
})

test("nested index pages roundtrip; only the root generated index is excluded", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "citation-context-nested-index-"))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.mkdir(path.join(root, "content/briefings"), { recursive: true })
  await fs.writeFile(path.join(root, "content/briefings/index.md"), markdown())
  const pages = await inventory(root)
  const batch = makeBatch(pages)
  batch.records = [recordFor(pages[0])]
  await importBatch(root, batch, { write: true })
  const index = await buildIndex(root)
  assert.equal(Object.keys(index["briefings/index"].refs).length, 1)
  assert.equal((await readRecords(root)).length, 1)
  const rootIndex = extractPage(markdown(), "index")
  assert.throws(() => validateRecord(recordFor(rootIndex), rootIndex), /reserved/)
})

test("legacy approval binds exact seed and body; full fresh review can migrate a stale seed", async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "citation-context-legacy-"))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const original = JSON.parse(await fs.readFile(new URL("../data/source-panels/briefings/the-big-8.json", import.meta.url), "utf8"))
  const body = await fs.readFile(new URL("../content/briefings/the-big-8.md", import.meta.url), "utf8")
  const page = extractPage(body, original.page)
  assert.equal(validateRecord(original, page), original)
  const edited = structuredClone(original)
  edited.refs[1].summary += " This was changed without review."
  assert.throws(() => validateRecord(edited, page), /stale page context/)
  const updated = extractPage(`${body}\nAdditional page context.\n`, original.page)
  assert.throws(() => validateRecord(original, updated), /legacy page context is stale/)
  const batch = makeBatch([updated], [original], { limit: 5 })
  assert.equal(batch.jobs.length, 15)
  assert.equal(batch.notices.length, 1)
  const revised = { page: original.page, reviewed: "2026-09-15", refs: {} }
  for (const job of batch.jobs) {
    const ref = structuredClone(original.refs[job.number])
    revised.refs[job.number] = { ...ref, pageDigest: job.pageDigest, sourceDigest: job.sourceDigest,
      review: { reviewer: "Migration test", date: "2026-09-15", evidence: ref.links.map((link) => ({ url: link.href, note: "Test fixture for a completed fresh source review." })) } }
  }
  await fs.mkdir(path.join(root, "data/source-panels/briefings"), { recursive: true })
  await fs.writeFile(path.join(root, "data/source-panels/briefings/the-big-8.json"), JSON.stringify(original))
  const partial = structuredClone(revised)
  delete partial.refs[15]
  batch.records = [partial]
  await assert.rejects(importBatch(root, batch, { pages: [updated], write: true }), /every existing reference/)
  batch.records = [revised]
  await importBatch(root, batch, { pages: [updated], write: true })
  const index = await buildIndex(root, { pages: [updated] })
  assert.equal(Object.keys(index[original.page].refs).length, 15)
})
