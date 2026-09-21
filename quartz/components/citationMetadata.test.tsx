import test from "node:test"
import assert from "node:assert/strict"
import { renderToString } from "preact-render-to-string"
import { CitationMetadata, citationMetadataIssues, normalizeCitationDate } from "./citationMetadata"

function render(frontmatter: Record<string, unknown>, slug = "articles/research-example") {
  return renderToString(
    <CitationMetadata
      frontmatter={frontmatter}
      slug={slug}
      title="Fallback title"
      socialUrl={`https://heavymetalcertified.com/${slug}`}
    />,
  )
}

const publication = {
  type: "article",
  scholar_eligible: true,
  title: "An actual research title — with its punctuation",
  author: "Karen Pendergrass",
  published: "2024-02-29",
}

test("rendered author tags preserve coauthors, normalize the shared identity and escape attributes", () => {
  const html = render({
    ...publication,
    authors: [" Karen Pendergrass ", 'O’Neil, A. & B. "Research" <script>alert(1)</script>'],
  })
  assert.equal((html.match(/name="citation_author"/g) ?? []).length, 2)
  assert.match(html, /name="citation_author" content="Pendergrass, Karen"/)
  assert.match(html, /O’Neil, A\. &amp; B\. &quot;Research&quot; &lt;script(?:>|&gt;)/)
  assert.doesNotMatch(html, /<script>/)
  assert.equal((html.match(/name="citation_author_institution"/g) ?? []).length, 1)
  assert.ok(html.indexOf('name="citation_author_institution"') < html.indexOf("O’Neil"))
  assert.match(html, /content="An actual research title — with its punctuation"/)
  assert.doesNotMatch(html, /citation_journal_title/)
})

test("a valid Date object keeps the actual day instead of falling back to its year", () => {
  const html = render({
    ...publication,
    published: new Date("2024-02-29T00:00:00.000Z"),
    updated: "2026-09-16",
  })
  assert.match(html, /name="citation_publication_date" content="2024\/02\/29"/)
  assert.doesNotMatch(html, /2026\/09\/16/)
})

test("authored date, briefing date and effective date work without invented precision", () => {
  for (const [field, value, expected] of [
    ["date", "August 2023", "2023"],
    ["briefing_date", "18 May 2022", "2022/05/18"],
    ["effective_date", "2021-07-04", "2021/07/04"],
  ]) {
    const html = render({
      ...publication,
      published: undefined,
      [field]: value,
    })
    assert.ok(html.includes(`name="citation_publication_date" content="${expected}"`))
  }
})

test("invalid calendar dates and incidental years are rejected", () => {
  for (const value of [
    "2023-02-29",
    "2024-02-30",
    "2024-13-01",
    "April 31, 2024",
    "2024-00",
    "revised during 2024",
    "0000",
    new Date(NaN),
  ]) {
    assert.equal(normalizeCitationDate(value), undefined, String(value))
  }
  assert.equal(normalizeCitationDate("February 29, 2024"), "2024/02/29")
  assert.equal(normalizeCitationDate("2024/2/29"), "2024/02/29")
  assert.equal(normalizeCitationDate("2024-02-29T23:45:00-05:00"), "2024/02/29")
  assert.equal(normalizeCitationDate("2024-02"), "2024")
  assert.equal(normalizeCitationDate(1998), "1998")
})

test("updated and created alone cannot manufacture a publication date", () => {
  const fm = {
    ...publication,
    published: undefined,
    updated: "2026-09-16",
    created: new Date("2024-01-01"),
  }
  assert.equal(render(fm), "")
  assert.ok(
    citationMetadataIssues("articles/research-example", fm).some(
      (issue) => issue.code === "missing-publication-date",
    ),
  )
})

test("missing authors are reported rather than attributed to the site owner", () => {
  const fm = { ...publication, author: undefined, authors: [null, {}, " "] }
  assert.equal(render(fm), "")
  assert.ok(
    citationMetadataIssues("articles/research-example", fm).some(
      (issue) => issue.code === "missing-authors",
    ),
  )
})

test("source pages retain real source authors, year, publication and source DOI", () => {
  const html = render(
    {
      type: "source",
      title: "Original paper",
      authors: ["Actual, Author", "Another, Author"],
      year: 1999,
      created: "2026-01-01",
      updated: "2026-09-16",
      publication: "Actual Journal",
      doi: "10.1000/original",
      cert_doi: "10.83138/hmtc.should-not-leak",
      scholar_eligible: false,
    },
    "sources/original",
  )
  assert.match(html, /citation_author" content="Actual, Author"/)
  assert.match(html, /citation_author" content="Another, Author"/)
  assert.match(html, /citation_publication_date" content="1999"/)
  assert.match(html, /citation_doi" content="10.1000\/original"/)
  assert.match(html, /citation_journal_title" content="Actual Journal"/)
  assert.doesNotMatch(html, /Pendergrass|should-not-leak|citation_technical_report_institution/)
})

test("owned documents emit only their current production DOI, never a cited source DOI", () => {
  assert.match(
    render({
      ...publication,
      cert_doi: "10.83138/hmtc.example",
      doi: "10.1000/source",
    }),
    /citation_doi" content="10.83138\/hmtc.example"/,
  )
  for (const cert_doi of [undefined, "not-a-doi", "10.5072/test", "10.84435/test"]) {
    assert.doesNotMatch(render({ ...publication, cert_doi, doi: "10.1000/source" }), /citation_doi/)
  }
})

test("a superseded manual DOI cannot become the current web edition DOI", () => {
  const html = render(
    { ...publication, type: "standard", cert_doi: "10.5281/zenodo.20771543" },
    "manuals/infant-and-child-foods",
  )
  assert.doesNotMatch(html, /citation_doi" content="10.5281/)
  assert.match(html, /citation_doi" content="10.83138\/hmtc.manual.infant-and-child-foods"/)
})

test("every /standards/{slug} page emits Highwire + ScholarlyArticle even when scholar_eligible is false", () => {
  const fm = {
    type: "standard",
    scholar_eligible: false,
    title: "Olive oil (virgin, refined, pomace) — HMTc Standard",
    effective_date: "2026-08-14",
    cert_doi: "10.83138/hmtc.std.30.olive-oil",
  }
  const html = render(fm, "standards/olive-oil")
  assert.match(html, /name="citation_title" content="Olive oil \(virgin, refined, pomace\) — HMTc Standard"/)
  assert.match(html, /name="citation_author" content="Pendergrass, Karen"/)
  assert.match(html, /name="citation_publication_date" content="2026\/08\/14"/)
  assert.match(html, /name="citation_journal_title" content="Heavy Metal Tested &amp; Certified Standards"/)
  assert.match(html, /name="citation_publisher" content="Institute of Contaminant Standards"/)
  assert.match(html, /name="citation_doi" content="10.83138\/hmtc.std.30.olive-oil"/)
  assert.match(
    html,
    /name="citation_fulltext_html_url" content="https:\/\/heavymetalcertified.com\/standards\/olive-oil"/,
  )
  assert.match(
    html,
    /name="citation_pdf_url" content="https:\/\/heavymetalcertified.com\/standards\/olive-oil.pdf"/,
  )
  assert.match(html, /name="citation_language" content="en"/)
  assert.doesNotMatch(html, /Paleo Certified|citation_online_date|creativecommons.org/)
  const json = JSON.parse(html.match(/data-standard-scholarly[^>]*>([\s\S]*?)<\/script>/)![1])
  assert.equal(json["@type"], "ScholarlyArticle")
  assert.equal(json.name, fm.title)
  assert.equal(json.publisher.name, "Institute of Contaminant Standards")
  assert.equal(json.identifier.value, "10.83138/hmtc.std.30.olive-oil")
  assert.equal(json.sameAs, "https://doi.org/10.83138/hmtc.std.30.olive-oil")
  assert.equal(json.encoding.contentUrl, "https://heavymetalcertified.com/standards/olive-oil.pdf")
  assert.equal(json.associatedMedia.contentUrl, json.encoding.contentUrl)
  assert.match(json.copyrightNotice, /All rights reserved/)
  assert.equal(citationMetadataIssues("standards/olive-oil", fm).length, 0)
  assert.equal(fm.scholar_eligible, false)
})

test("unminted standards emit Highwire without inventing a DOI", () => {
  const html = render(
    {
      type: "standard",
      scholar_eligible: false,
      title: "Cocoa and chocolate products (cocoa powder, dark, milk, chips) — HMTc Standard",
      effective_date: "2026-08-14",
      cert_doi: null,
    },
    "standards/chocolate",
  )
  assert.match(html, /name="citation_title"/)
  assert.match(html, /name="citation_author" content="Pendergrass, Karen"/)
  assert.match(html, /name="citation_pdf_url" content="https:\/\/heavymetalcertified.com\/standards\/chocolate.pdf"/)
  assert.doesNotMatch(html, /citation_doi/)
  const json = JSON.parse(html.match(/data-standard-scholarly[^>]*>([\s\S]*?)<\/script>/)![1])
  assert.equal(json["@type"], "ScholarlyArticle")
  assert.equal(json.identifier, undefined)
  assert.equal(json.sameAs, undefined)
})

test("marketing pages, manuals, and in-development standards still emit no Scholar chrome", () => {
  assert.equal(
    render(
      {
        title: "Certification services",
        type: "marketing",
        author: "Karen Pendergrass",
        date: "2026-09-16",
      },
      "certification",
    ),
    "",
  )
  assert.equal(
    render(
      {
        type: "standard-in-development",
        title: "Not yet a standard",
        author: "Karen Pendergrass",
        effective_date: "2026-08-14",
      },
      "standards/example-in-development",
    ),
    "",
  )
  const manual = render(
    {
      type: "standard",
      scholar_eligible: false,
      title: "Infant and Child Foods — Program Manual",
      effective_date: "2026-08-06",
    },
    "manuals/infant-and-child-foods",
  )
  assert.equal(manual, "")
  assert.doesNotMatch(manual, /citation_journal_title|data-standard-scholarly/)
})

test("scholar_eligible manuals emit Highwire + ScholarlyArticle without inventing a DOI", () => {
  const fm = {
    type: "standard",
    scholar_eligible: true,
    title: "Seafood: HMTc Program Manual",
    effective_date: "2026-08-06",
    author: "Karen Pendergrass",
    scholar_pdf: true,
  }
  const html = render(fm, "manuals/seafood")
  assert.match(html, /name="citation_title" content="Seafood: HMTc Program Manual"/)
  assert.match(html, /name="citation_author" content="Pendergrass, Karen"/)
  assert.match(html, /name="citation_journal_title" content="Heavy Metal Tested &amp; Certified Program Manuals"/)
  assert.doesNotMatch(html, /citation_doi/)
  const json = JSON.parse(html.match(/data-standard-scholarly[^>]*>([\s\S]*?)<\/script>/)![1])
  assert.equal(json["@type"], "ScholarlyArticle")
  assert.equal(json.identifier, undefined)
  assert.match(json.copyrightNotice, /All rights reserved/)
})

test("Cat-1 Manual v3 ScholarlyArticle carries abstract, image, dateModified, about, keywords, license, and BreadcrumbList", () => {
  const abstract =
    "The Infant and Child Foods Program Manual is the published Category 1 instrument of Heavy Metal Certified. ".repeat(8).trim()
  const html = render(
    {
      type: "standard",
      scholar_eligible: true,
      title: "Infant and Child Foods: HMTc Program Manual",
      breadcrumb_leaf: "Infant and Child Foods",
      category: 1,
      effective_date: "2026-09-19",
      updated: "2026-09-19",
      author: "Karen Pendergrass",
      cert_doi: "10.83138/hmtc.manual.infant-and-child-foods",
      scholar_abstract: abstract,
      socialImage: "/static/manuals/covers/infant-and-child-foods-v3-og.png",
      keywords: ["Infant and Child Foods", "Manual v3"],
    },
    "manuals/infant-and-child-foods",
  )
  assert.match(html, /name="citation_abstract"/)
  assert.match(html, /name="citation_keywords"/)
  const json = JSON.parse(html.match(/data-standard-scholarly[^>]*>([\s\S]*?)<\/script>/)![1])
  assert.equal(json["@type"], "ScholarlyArticle")
  assert.equal(json.abstract, abstract)
  assert.equal(json.description, abstract)
  assert.equal(json.dateModified, "2026-09-19")
  assert.equal(json.image, "https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3-og.png")
  assert.equal(json.about.name, "Category 1 Infant and Child Foods")
  assert.match(json.keywords, /Manual v3/)
  assert.match(json.license, /heavymetalcertified.com\/license/)
  assert.match(json.copyrightNotice, /All rights reserved/)
  assert.equal(json.identifier.value, "10.83138/hmtc.manual.infant-and-child-foods")
  assert.equal(json.sameAs, "https://doi.org/10.83138/hmtc.manual.infant-and-child-foods")
  const crumbs = JSON.parse(html.match(/data-manual-breadcrumbs[^>]*>([\s\S]*?)<\/script>/)![1])
  assert.equal(crumbs["@type"], "BreadcrumbList")
  assert.deepEqual(
    crumbs.itemListElement.map((i: { name: string }) => i.name),
    ["HMTc", "Manuals", "Infant and Child Foods"],
  )
})

test("a house-minted manual DOI becomes citation_doi after write-back", () => {
  const html = render(
    {
      type: "standard",
      scholar_eligible: true,
      title: "Infant and Child Foods: HMTc Program Manual",
      effective_date: "2026-09-19",
      author: "Karen Pendergrass",
      cert_doi: "10.83138/hmtc.manual.infant-and-child-foods",
    },
    "manuals/infant-and-child-foods",
  )
  assert.match(html, /name="citation_doi" content="10.83138\/hmtc.manual.infant-and-child-foods"/)
})
