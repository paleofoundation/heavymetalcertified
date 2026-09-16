import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"
import matter from "gray-matter"
import { KAREN_PERSON } from "../lib/researcher-schema.mjs"
import {
  jsonLdScript, publicationAuthors, publicationDate, publicationMetadata, replacePublicationGraphs,
} from "../lib/publication-jsonld.mjs"

test("publication dates preserve known precision and reject impossible calendar dates", () => {
  for (const [input, expected] of [
    ["2026", "2026"], [2026, "2026"], ["August 2026", "2026-08"],
    ["2026-08", "2026-08"], ["2024/02/29", "2024-02-29"],
    ["September 16, 2026", "2026-09-16"], ["16 September 2026", "2026-09-16"],
    ["2026-09-16T10:15:00Z", "2026-09-16"],
    [new Date("2026-09-16T10:15:00Z"), "2026-09-16"],
  ]) assert.equal(publicationDate(input), expected)
  for (const invalid of ["0000", "2026-00", "2026-13", "2026-02-29", "2024-02-30", "April 31, 2026", "updated during 2026", new Date(NaN)]) {
    assert.equal(publicationDate(invalid), undefined)
  }
})

test("actual publication and modification fields remain distinct, including YAML Date objects", () => {
  const fm = matter("---\npublished: 2026-08-10\nupdated: 2026-09-16\n---\n").data
  assert.ok(fm.published instanceof Date)
  assert.deepEqual(publicationMetadata(fm), { datePublished: "2026-08-10", dateModified: "2026-09-16" })
  assert.deepEqual(publicationMetadata({ updated: "August 2026", created: "2020-01-01" }), { dateModified: "2026-08" })
  assert.deepEqual(publicationMetadata({ briefing_date: "June 2026" }), { datePublished: "2026-06" })
  assert.deepEqual(publicationMetadata({ effective_date: "2026" }), { datePublished: "2026" })
  assert.deepEqual(publicationMetadata({ published: "2026-02-30" }), {})
})

test("authors retain order and names without inheriting another author's ORCID", () => {
  const authors = publicationAuthors({ authors: ["Other Researcher", "Pendergrass, Karen"], author: "Karen Pendergrass", orcid: "0000-0002-2348-7259" })
  assert.deepEqual(authors[0], { "@type": "Person", name: "Other Researcher" })
  assert.equal(authors[1], KAREN_PERSON)
  assert.deepEqual(publicationAuthors({}), [])
  assert.deepEqual(publicationAuthors({ authors: [], author: "Karen Pendergrass" }), [])
  assert.deepEqual(publicationAuthors({ authors: "Other Researcher" }), [{ "@type": "Person", name: "Other Researcher" }])
  assert.throws(() => publicationAuthors({ author: "Other Researcher", orcid: "0000-0002-2348-7259" }), /different named author/)
  const named = publicationAuthors({ authors: [{ name: "Other Researcher", orcid: "0000-0001-5109-3700" }, "Karen Pendergrass"] })
  assert.equal(named[0].identifier.value, "0000-0001-5109-3700")
})

test("script serialization blocks closing-script injection and graph refresh preserves unrelated nodes", () => {
  const graph = { "@id": "https://example.test/article#article", author: { name: 'A & B "</script><script>bad()' } }
  const script = jsonLdScript(graph)
  assert.equal((script.match(/<script/g) || []).length, 1)
  assert.deepEqual(JSON.parse(script.slice(script.indexOf(">") + 1, script.lastIndexOf("</script>"))), graph)
  const other = { "@id": "https://example.test/#organization", name: "Unrelated" }
  const before = `<html><head>${jsonLdScript({ "@context": "https://schema.org", "@graph": [{ ...graph, old: true }, other] })}</head></html>`
  const after = replacePublicationGraphs(before, [graph], [graph["@id"]])
  assert.ok(after.includes('"name":"Unrelated"'))
  assert.ok(!after.includes('"old":true'))
  assert.equal(replacePublicationGraphs(after, [graph], [graph["@id"]]), after)
  assert.throws(() => replacePublicationGraphs("<html></html>", [graph], [graph["@id"]]), /no head/)
})

function graphs(html) {
  return [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
}

for (const fixture of [
  { label: "article", script: "postbuild-article-jsonld.mjs", specDir: "data/articles/synthesis", section: "articles", type: "research-analysis" },
  { label: "rationale", script: "postbuild-why-limited-jsonld.mjs", specDir: "data/why-limited", section: "why-we-limit", type: "rationale" },
  { label: "briefing", script: "postbuild-cert-briefing-jsonld.mjs", section: "briefings", type: "public-briefing" },
]) {
  test(`${fixture.label} emitter reads actual page authors/dates and refreshes only its metadata`, (t) => {
    // Isolated fixtures only: no writes to the repository's built public directory.
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "publication-jsonld-"))
    t.after(() => fs.rmSync(cwd, { recursive: true, force: true }))
    const write = (relative, value) => {
      const dest = path.join(cwd, relative)
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.writeFileSync(dest, value)
    }
    const slug = "actual-page"
    const url = `https://heavymetalcertified.com/${fixture.section}/${slug}`
    const fm = {
      title: "Actual publication", type: fixture.type, briefing_slug: slug,
      authors: ['Other " & </script> Researcher', "Pendergrass, Karen"],
      author: "Karen Pendergrass", orcid: "0000-0002-2348-7259",
      published: "August 2026", updated: new Date("2026-09-16T00:00:00Z"),
    }
    const contentPath = `content/${fixture.section}/${slug}.md`
    const htmlPath = `public/${fixture.section}/${slug}.html`
    write(contentPath, matter.stringify("Actual visible article.", fm))
    if (fixture.specDir) write(`${fixture.specDir}/${slug}.json`, JSON.stringify({ slug, title: "Actual publication", date: "1999", published: "1999-01-01" }))
    const unrelated = { "@type": "Organization", "@id": "https://example.test/#organization", name: "Preserved" }
    const stale = jsonLdScript({ "@type": "Article", "@id": `${url}#article`, datePublished: "1999-01-01" })
    const legacy = fixture.label === "briefing"
      ? `<!-- CERT-BRIEFING-JSONLD-START -->\n${stale}\n<!-- CERT-BRIEFING-JSONLD-END -->`
      : stale
    write(htmlPath, `<html><head>${jsonLdScript(unrelated)}${legacy}</head><body>Article</body></html>`)
    const script = fileURLToPath(new URL(`../${fixture.script}`, import.meta.url))
    const run = () => execFileSync(process.execPath, [script], { cwd, encoding: "utf8" })
    run()
    const result = fs.readFileSync(path.join(cwd, htmlPath), "utf8")
    const parsed = graphs(result)
    const articles = parsed.filter(g => g["@type"] === "Article")
    assert.equal(articles.length, 1)
    assert.equal(articles[0].datePublished, "2026-08")
    assert.equal(articles[0].dateModified, "2026-09-16")
    assert.equal(articles[0].author.length, 2)
    assert.equal(articles[0].author[0].name, fm.authors[0])
    assert.equal(articles[0].author[0].identifier, undefined)
    assert.equal(articles[0].author[1]["@id"], KAREN_PERSON["@id"])
    assert.deepEqual(parsed.find(g => g["@id"] === unrelated["@id"]), unrelated)
    run()
    assert.equal(fs.readFileSync(path.join(cwd, htmlPath), "utf8"), result)
    // A future page with only an update date must not acquire a publication date or author.
    write(contentPath, matter.stringify("Updated page.", { title: "Actual publication", type: fixture.type, briefing_slug: slug, updated: "2026" }))
    run()
    const refreshed = graphs(fs.readFileSync(path.join(cwd, htmlPath), "utf8")).find(g => g["@type"] === "Article")
    assert.equal(refreshed.datePublished, undefined)
    assert.equal(refreshed.author, undefined)
    assert.equal(refreshed.dateModified, "2026")
  })
}
