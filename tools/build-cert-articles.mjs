#!/usr/bin/env node
// build-cert-articles.mjs — stamp the canonical cert Article design onto the
// synthesis-coverage articles.
//
// These articles are the cert site's ONE-WAY coverage of the Heavy Metal Index
// synthesis findings (AGENTS.md §5: content/articles/ is "research coverage of
// Index findings"). The prose is a cert-audience REFRAME authored per finding —
// never a copy of the wiki page (Part 2 firewall). It lives in a data spec at
// data/articles/synthesis/<slug>.json; this generator supplies the fixed
// apparatus so the design does not drift article to article:
//
//   THE CLAIM callout · Download PDF · Abstract (LLM-extractable lede + the
//   one-way link to the Index synthesis page) · the argument sections · an FAQ
//   (which also drives the FAQPage JSON-LD in postbuild-article-jsonld.mjs) · a
//   first-appearance-order References grid · a compact Cite box.
//
// The hand-authored content/articles/lead-and-cadmium-in-dark-chocolate.md is
// NOT in the spec dir, so it is left untouched (same pattern as import-briefings
// leaving the-big-8.md alone). content/articles/index.md is hand-authored too.
//
// Design canon (docs/design-canon/): NO BOLD on the reading surface — this file
// emits font-weight 400 only (500 for a mono label), no <strong>/<b>. If you add
// markup here, keep it bold-free or design-lint (--all) will flag it.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SPEC_DIRS = [
  { dir: path.join(repoRoot, "data/articles/synthesis"), kind: "synthesis" },
  { dir: path.join(repoRoot, "data/articles/regulatory-watch"), kind: "regulatory-watch" },
]
const OUT = path.join(repoRoot, "content/articles")
const BASE = "https://heavymetalcertified.com"

if (!SPEC_DIRS.some(({ dir }) => fs.existsSync(dir))) {
  console.log("build-cert-articles: no data/articles/synthesis dir; nothing to build.")
  process.exit(0)
}
fs.mkdirSync(OUT, { recursive: true })

// Markdown emphasis (_x_ / *x*) -> <em> for the dek; plain() strips it for meta.
function emph(s) {
  return String(s || "").replace(/\s+/g, " ").replace(/[_*]([^_*\n]+)[_*]/g, "<em>$1</em>").trim()
}
function plain(s) {
  return String(s || "").replace(/\s+/g, " ").replace(/[_*]([^_*\n]+)[_*]/g, "$1").trim()
}
const q = (s) => String(s || "").replace(/"/g, '\\"')

// citation_abstract is a meta-tag value, so markdown link syntax has to come out
// or the abstract Scholar reads contains raw "[text](url)" noise.
const abstractText = (s) =>
  plain(
    String(s || "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/\[\[[^\]|]*\|([^\]]+)\]\]/g, "$1")
      .replace(/\[\[([^\]]+)\]\]/g, "$1"),
  )

// A reference row in the canonical grid. The [N] number carries id="ref-N" so the
// inline <sup class="cite"><a href="#ref-N"> citations resolve.
//
// LINK POLICY (integrity). The original policy named primary studies without
// linking them, because "a study DOI supplied by a drafting pass cannot be
// verified against the on-disk synthesis". That precondition no longer holds:
// each Journal/Preprint reference is now resolved to a specific Heavy Metal Index
// source record (via the paired synthesis page's `anchor_sources`), and that
// record's DOI is verified against Crossref under a two-factor gate — Crossref
// title identity with the corpus record, or the cite-key author appearing in
// Crossref's author list. Only references carrying a `doi` that passed that gate
// are hyperlinked, and their `title`, `authors`, `journal`, `year`, `volume` and
// `pages` are Crossref's authoritative values rather than a drafting paraphrase.
//
// A reference WITHOUT a `doi` field failed verification or has no corpus record.
// It is still NAMED but NOT linked, exactly as before — the rule remains that an
// unverifiable external link is never published. Legislation, Standard and
// Government references are named, not linked, because they are primary
// instruments rather than corpus records.
function domainOf(href) {
  if (!href) return ""
  try {
    return new URL(href).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}
function renderRefs(refs) {
  if (!refs || !refs.length) return ""
  const rows = refs
    .map((r) => {
      // A verified DOI (see LINK POLICY above) or the one-way Index synthesis
      // reference may be linked; nothing else is.
      const href = r.doi
        ? `https://doi.org/${r.doi}`
        : r.type === "Reference" || r.official === true
          ? r.href
          : null
      const titleEl = href
        ? `<a href="${href}" style="font-size:16.5px;line-height:1.4;color:#1c43ad;text-decoration:none">${r.title}</a>`
        : `<span style="font-size:16.5px;line-height:1.4;color:#2b1f1f">${r.title}</span>`

      // Formal citation line, from Crossref's authoritative record. Present only
      // for verified works, so a reader can tell a verified citation from a named
      // one at a glance.
      let cite = ""
      if (r.doi) {
        const vol = r.volume ? ` ${r.volume}` : ""
        const iss = r.volume && r.issue ? `(${r.issue})` : ""
        const pp = r.pages ? `:${r.pages}` : ""
        const where = r.journal ? `${r.journal}${vol}${iss}${pp}` : ""
        // join with ". " but never produce ".." when a segment already ends in "."
        const bits = [r.authors, where, r.year ? `(${r.year})` : ""]
          .filter(Boolean)
          .map((b) => b.replace(/\.\s*$/, ""))
          .join(". ")
        cite =
          `<p style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;line-height:1.65;color:#5a4141;margin:6px 0 0">${bits}. ` +
          `<a href="https://doi.org/${r.doi}" style="color:#1c43ad;text-decoration:none">doi:${r.doi}</a></p>`
      }

      const dom = !r.doi && href ? domainOf(href) : ""
      const domLink = dom
        ? ` &middot; <a href="${r.href}" style="color:#736b6b">${dom}<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;vertical-align:super">&#8599;</span></a>`
        : ""
      const meta =
        r.meta || domLink
          ? `<p style="font-size:13.5px;line-height:1.6;color:#736b6b;margin:6px 0 0">${r.meta || ""}${domLink}</p>`
          : ""
      return `    <div style="display:grid;grid-template-columns:42px minmax(0,1fr) 128px;gap:16px;align-items:start;padding:14px 0;border-bottom:1px dotted #f2ece7"><span id="ref-${r.n}" style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#9f2727;white-space:nowrap">[${r.n}]</span><div style="min-width:0">${titleEl}${cite}${meta}</div><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#a9a1a1;text-align:right;white-space:nowrap">${r.type || ""}</span></div>`
    })
    .join("\n")
  const verified = refs.filter((r) => r.doi).length
  const lede =
    `Works cited in this analysis&rsquo;s text, in first-appearance order. This is not the full evidence base for the finding; it is what the prose above draws on. ` +
    `The complete occurrence record and per-source pages live on the Heavy Metal Index &mdash; this analysis links to them rather than re-hosting them. ` +
    (verified
      ? `${verified} of ${refs.length} references carry a DOI verified against Crossref and are linked to it; `
      : ``) +
    `works without a verified DOI, and primary legal instruments and published standards, are named but not linked.`
  return `  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">${lede}</p>
  <div style="border-top:1px solid #e8e1db">
${rows}
  </div>`
}

function renderClaim(claim, date) {
  const kicker = `Research analysis &middot; Heavy Metal Certified${date ? " &middot; " + date : ""}`
  return `<div style="border:1px solid #f2dcda;background:#fdf4f3;padding:24px 26px;margin-bottom:52px">
  <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-bottom:14px"><span style="font-family:'IBM Plex Mono',monospace;font-size:15px;color:#fff;background:#9f2727;border-radius:3px;padding:7px 13px">THE CLAIM</span><span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727">${kicker}</span></div>
  <p style="font-family:Lora,serif;font-size:24px;line-height:1.45;color:#2b1f1f;margin:0">${claim}</p>
</div>`
}

function renderFaq(faq) {
  if (!faq || !faq.length) return ""
  const blocks = faq.map((f) => `### ${f.q}\n\n${f.a.trim()}`).join("\n\n")
  return `## Frequently asked questions\n\n${blocks}\n\n`
}

function renderCite(title, year, url) {
  return `## Cite this analysis

  <div style="border:1px solid #e8e1db;background:#fffdfb">
    <div style="padding:11px 15px;border-bottom:1px solid #e8e1db;background:#fdf4f3;font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;color:#9f2727">Reuse this analysis</div>
    <div style="padding:14px 15px">
      <p style="font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;color:#5a4141;margin:0 0 14px">Pendergrass, K. (${year}). <em style="font-style:normal">${title}</em>. Heavy Metal Certified, Institute of Contaminant Standards (ICS). ${url}</p>
      <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0">Prose under CC BY 4.0. The underlying evidence base is the independent Heavy Metal Index, cited one way; this analysis applies that evidence to the certification question.</p>
    </div>
  </div>
`
}

function build(spec) {
  const slug = spec.slug
  const title = spec.title
  const date = spec.date || "August 2026"
  const year = (String(date).match(/\d{4}/) || ["2026"])[0]
  const url = `${BASE}/articles/${slug}`
  const metals = Array.isArray(spec.metals) ? spec.metals.join(", ") : String(spec.metals || "")
  const refs = spec.references || []

  const front = [
    "---",
    `title: "${q(title)}"`,
    spec.seoTitle ? `seoTitle: "${q(plain(spec.seoTitle))}"` : null,
    spec.description ? `description: "${q(plain(spec.description)).slice(0, 200)}"` : null,
    spec.socialDescription ? `socialDescription: "${q(plain(spec.socialDescription)).slice(0, 300)}"` : null,
    spec.dek ? `dek_html: "${q(emph(spec.dek))}"` : null,
    "type: article",
    `section: "${q(spec.section || "Analysis")}"`,
    `author: "Karen Pendergrass"`,
    "orcid: 0000-0002-2348-7259",
    `date: "${date}"`,
    `updated: "${spec.modified || date}"`,
    spec.evidence_verified ? `evidence_verified: "${spec.evidence_verified}"` : null,
    // Verifiable first-publication date (read from git once, committed as spec
    // data). Gives Scholar a full YYYY-MM-DD instead of a bare year.
    spec.published ? `published: "${spec.published}"` : null,
    spec.report_number ? `report_number: "${q(spec.report_number)}"` : null,
    `scholar_eligible: ${spec.scholar_eligible === false ? "false" : "true"}`,
    `scholar_pdf: ${spec.scholar_pdf === false ? "false" : "true"}`,
    spec.series ? `series: "${q(spec.series)}"` : null,
    spec.series_url ? `series_url: "${q(spec.series_url)}"` : null,
    Array.isArray(spec.jurisdictions) && spec.jurisdictions.length
      ? `jurisdictions: [${spec.jurisdictions.map((item) => `"${q(item)}"`).join(", ")}]`
      : null,
    Array.isArray(spec.instruments) && spec.instruments.length
      ? `instruments: [${spec.instruments.map((item) => `"${q(item)}"`).join(", ")}]`
      : null,
    Array.isArray(spec.event_ids) && spec.event_ids.length
      ? `event_ids: [${spec.event_ids.map((item) => `"${q(item)}"`).join(", ")}]`
      : null,
    Array.isArray(spec.related_standard_urls) && spec.related_standard_urls.length
      ? `related_standard_urls: [${spec.related_standard_urls.map((item) => `"${q(item)}"`).join(", ")}]`
      : null,
    // Scholar reads these off the page: the abstract, and the author keywords.
    spec.abstract ? `scholar_abstract: "${q(abstractText(spec.abstract))}"` : null,
    Array.isArray(spec.keywords) && spec.keywords.length
      ? `keywords: [${spec.keywords.map((k) => `"${q(k)}"`).join(", ")}]`
      : null,
    // The PDF edition is declared in frontmatter and rendered by the right-rail
    // (Rail.tsx reads `pdf`); the download card is NOT emitted inline in the body.
    spec.scholar_pdf === false ? null : `pdf: "/articles/${slug}.pdf"`,
    "audience: [regulator, brand-legal, brand-finance, retailer-compliance]",
    "snapshot:",
    `  - { k: "Document type", v: "Research analysis" }`,
    `  - { k: "Published", v: "${date}" }`,
    metals ? `  - { k: "Metals", v: "${q(metals)}" }` : null,
    `  - { k: "References", v: "${refs.length}" }`,
    "connections:",
    ...(spec.connections || []).map(
      (c) => `  - { label: "${q(c.label)}", href: "${q(c.href)}" }`,
    ),
    "---",
    "",
  ].filter((l) => l !== null)

  const sections = (spec.sections || [])
    .map((s) => `## ${s.h2}\n\n${String(s.body).trim()}`)
    .join("\n\n")

  const body = [
    renderClaim(spec.claim, date),
    "",
    "## Abstract",
    "",
    String(spec.abstract).trim(),
    "",
    sections,
    "",
    renderFaq(spec.faq),
    "## References",
    "",
    renderRefs(refs),
    "",
    renderCite(title, year, url),
  ].join("\n")

  fs.writeFileSync(path.join(OUT, `${slug}.md`), front.join("\n") + "\n" + body, "utf8")
  return { slug, title, description: plain(spec.description || spec.dek || ""), metals: Array.isArray(spec.metals) ? spec.metals : [], kind: spec.article_kind || "synthesis" }
}

// content/articles/index.md — GENERATED here so every synthesis-coverage article
// is linked (no orphan) and the directory never goes stale as articles are added.
// The hand-authored long-form (chocolate) is listed first, then the reframes A→Z.
// Bold-free (design canon); a real body <a> per row feeds the internal link graph.
function metalChips(metals) {
  return (metals || []).slice(0, 3).join(" &middot; ")
}
function card(slug, title, description, metals) {
  return `    <a href="/articles/${slug}" style="display:grid;grid-template-columns:minmax(0,1fr) 148px;gap:22px;align-items:start;padding:22px 0;border-bottom:1px solid #f2ece7;text-decoration:none">
      <span style="min-width:0">
        <span style="display:block;font-family:Lora,serif;font-size:20px;line-height:1.3;color:#9f2727">${title}</span>
        <span style="display:block;font-size:14px;line-height:1.6;color:#3f3a3a;max-width:66ch;margin-top:7px">${description}</span>
      </span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;text-align:right">${metalChips(metals)}</span>
    </a>`
}
function writeIndex(built) {
  // The flagship long-form article is hand-authored (no spec); list it first.
  const chocolate = {
    slug: "lead-and-cadmium-in-dark-chocolate",
    title: "Lead and Cadmium in Dark Chocolate: A Decade of Divergence",
    description:
      "One metal fell under a decade of Proposition 65 pressure; the other did not — and where each enters the cocoa supply chain explains why.",
    metals: ["Lead", "Cadmium"],
  }
  const watch = built.filter((item) => item.kind === "regulatory-watch").sort((a, b) => a.title.localeCompare(b.title))
  const rest = built.filter((item) => item.kind !== "regulatory-watch").sort((a, b) => a.title.localeCompare(b.title))
  const watchRows = watch.map((a) => card(a.slug, a.title, a.description, a.metals)).join("\n")
  const rows = [chocolate, ...rest].map((a) => card(a.slug, a.title, a.description, a.metals)).join("\n")
  const front = [
    "---",
    'title: "Articles"',
    "type: articles-index",
    'description: "Research analyses from the Heavy Metal Tested & Certified program. Each one covers a finding from the independent Heavy Metal Index, cited one way, and applies it to the certification question."',
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "---",
    "",
  ].join("\n")
  const body = `Analysis from the certification program, grounded in the independent evidence base. Every article cites the [Heavy Metal Index](https://heavymetalindex.com) one way: the index reports what the literature says, and these articles apply that evidence to the certification question. The index never cites back, which is what keeps it a disinterested reference. The full occurrence and regulatory records live on the index; these articles link to them rather than re-hosting them.

<section style="margin:40px 0 8px">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 8px">Regulatory Watch</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 14px;max-width:84ch">A living evidence-to-action series. Start with the <a href="/articles/regulatory-watch">21-cluster tracker</a>, then use the citable analyses for questions that require a full legal and certification treatment.</p>
  <div style="display:flex;flex-direction:column">
${watchRows}
  </div>
</section>

<section style="margin:40px 0 8px">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 8px">Analyses</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 14px;max-width:84ch">${rest.length + 1} evidence analyses, each a citable page with a named author, a downloadable edition, and a one-way link to the Index finding it covers.</p>
  <div style="display:flex;flex-direction:column">
${rows}
  </div>
</section>

## Evidence anchors on the index

- Lead in food — the occurrence record and the metal review: [heavymetalindex.com/metals/lead](https://heavymetalindex.com/metals/lead)
- Cadmium — distribution and exposure: [heavymetalindex.com/metals/cadmium](https://heavymetalindex.com/metals/cadmium)
- Inorganic arsenic — speciation and the rice/seaweed signal: [heavymetalindex.com/metals/arsenic](https://heavymetalindex.com/metals/arsenic)
- Mercury — total versus methylmercury in seafood: [heavymetalindex.com/metals/mercury](https://heavymetalindex.com/metals/mercury)

## Program briefings

The [Standards Briefings](../briefings) are the program's positioning analysis: what HMTc is, why the analyte panel grew, what *Palmquist* changed for brand legal and finance, and the business case for certification.

---

*Analyses are added as the program covers newly published Index findings. Each is a distinct cert-site page that links to the index one way; none reproduces the index's evidence tables.*
`
  fs.writeFileSync(path.join(OUT, "index.md"), front + body, "utf8")
}

const built = []
for (const { dir, kind } of SPEC_DIRS) {
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir).filter((name) => name.endsWith(".json"))) {
  let spec
  try {
    spec = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))
  } catch (e) {
    console.error(`build-cert-articles: bad JSON in ${f}: ${e.message}`)
    process.exit(1)
  }
  if (!spec.slug || !spec.title) {
    console.error(`build-cert-articles: ${f} missing slug/title`)
    process.exit(1)
  }
    if (!spec.article_kind) spec.article_kind = kind
    built.push(build(spec))
  }
}
writeIndex(built)
console.log(
  `build-cert-articles: stamped ${built.length} research article(s) across ${SPEC_DIRS.length} spec families + generated index.md.`,
)
