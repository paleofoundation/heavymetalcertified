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
const SPEC_DIR = path.join(repoRoot, "data/articles/synthesis")
const OUT = path.join(repoRoot, "content/articles")
const BASE = "https://heavymetalcertified.com"

if (!fs.existsSync(SPEC_DIR)) {
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

// A reference row in the canonical grid. The [N] number carries id="ref-N" so the
// inline <sup class="cite"><a href="#ref-N"> citations resolve.
//
// LINK POLICY (integrity): only the one-way Heavy Metal Index synthesis reference
// (type "Reference") is hyperlinked. Primary studies, laws and standards are NAMED
// but NOT linked — their DOI-linked source records live on the Index, which this
// article cites one way. This is deliberate: a study DOI supplied by a drafting
// pass cannot be verified against the on-disk synthesis (which links sources by
// wiki-link, not raw DOI), so we do not publish an unverifiable external link.
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
      const linkable = r.href && r.type === "Reference"
      const titleEl = linkable
        ? `<a href="${r.href}" style="font-size:16.5px;line-height:1.4;color:#1c43ad;text-decoration:none">${r.title}</a>`
        : `<span style="font-size:16.5px;line-height:1.4;color:#2b1f1f">${r.title}</span>`
      const dom = linkable ? domainOf(r.href) : ""
      const domLink = dom
        ? ` &middot; <a href="${r.href}" style="color:#736b6b">${dom}<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;vertical-align:super">&#8599;</span></a>`
        : ""
      const meta =
        r.meta || domLink
          ? `<p style="font-size:13.5px;line-height:1.6;color:#736b6b;margin:6px 0 0">${r.meta || ""}${domLink}</p>`
          : ""
      return `    <div style="display:grid;grid-template-columns:42px minmax(0,1fr) 128px;gap:16px;align-items:start;padding:14px 0;border-bottom:1px dotted #f2ece7"><span id="ref-${r.n}" style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:#9f2727;white-space:nowrap">[${r.n}]</span><div style="min-width:0">${titleEl}${meta}</div><span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:#a9a1a1;text-align:right;white-space:nowrap">${r.type || ""}</span></div>`
    })
    .join("\n")
  return `  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">Works cited in this analysis&rsquo;s text, in first-appearance order. This is not the full evidence base for the finding; it is what the prose above draws on. The complete occurrence record and per-source pages live on the Heavy Metal Index &mdash; this analysis links to them rather than re-hosting them. Where a work carries a DOI its title links to it; primary legal documents and published standards are named but not linked to a corpus record.</p>
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
    spec.description ? `description: "${q(plain(spec.description)).slice(0, 200)}"` : null,
    spec.dek ? `dek_html: "${q(emph(spec.dek))}"` : null,
    "type: article",
    `section: "${q(spec.section || "Analysis")}"`,
    `author: "Karen Pendergrass"`,
    "orcid: 0000-0002-2348-7259",
    `date: "${date}"`,
    `updated: "${date}"`,
    "scholar_eligible: true",
    "scholar_pdf: true",
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
    `<div style="display:flex;gap:9px;flex-wrap:wrap;margin:0 0 44px"><a href="/articles/${slug}.pdf" download style="display:inline-block;background:#9f2727;color:#fff;font-family:'IBM Plex Mono',monospace;font-size:12.5px;letter-spacing:.02em;padding:10px 16px;border-radius:3px;text-decoration:none">Download PDF</a></div>`,
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
  return { slug, title, description: plain(spec.description || spec.dek || ""), metals: Array.isArray(spec.metals) ? spec.metals : [] }
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
  const rest = [...built].sort((a, b) => a.title.localeCompare(b.title))
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
  const body = `Analysis from the certification program, grounded in the independent evidence base. Every article cites the [Heavy Metal Index](https://heavymetalindex.com) one way: the index reports what the literature says, and these articles apply that evidence to the certification question. The index never cites back, which is what keeps it a disinterested reference. The full occurrence record and per-source pages live on the index; these articles link to it rather than re-hosting it.

<section style="margin:40px 0 8px">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 8px">Analyses</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 14px;max-width:84ch">${built.length + 1} analyses, each a citable page with a named author, a downloadable edition, and a one-way link to the Index finding it covers.</p>
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

The [Standards Briefings](../briefings/) are the program's positioning analysis: what HMTc is, why the analyte panel grew, what *Palmquist* changed for brand legal and finance, and the business case for certification.

---

*Analyses are added as the program covers newly published Index findings. Each is a distinct cert-site page that links to the index one way; none reproduces the index's evidence tables.*
`
  fs.writeFileSync(path.join(OUT, "index.md"), front + body, "utf8")
}

const specs = fs.readdirSync(SPEC_DIR).filter((f) => f.endsWith(".json"))
const built = []
for (const f of specs) {
  let spec
  try {
    spec = JSON.parse(fs.readFileSync(path.join(SPEC_DIR, f), "utf8"))
  } catch (e) {
    console.error(`build-cert-articles: bad JSON in ${f}: ${e.message}`)
    process.exit(1)
  }
  if (!spec.slug || !spec.title) {
    console.error(`build-cert-articles: ${f} missing slug/title`)
    process.exit(1)
  }
  built.push(build(spec))
}
writeIndex(built)
console.log(
  `build-cert-articles: stamped ${built.length} synthesis-coverage article(s) + generated index.md (chocolate long-form listed first; its .md untouched).`,
)
