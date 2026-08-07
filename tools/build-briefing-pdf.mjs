#!/usr/bin/env node
// build-briefing-pdf.mjs — render cert Standards Briefings to the Heavy Metal
// Index "Content Page PDF v2" scholarly design (ported to tools/pdf/), recoloured
// to HMTc red, at content/static/briefings/<slug>.pdf.
//
// These are COMMITTED static artifacts: import-briefings.mjs turns the Download-PDF
// button on and sets scholar_eligible when the file exists, and the deploy just
// serves it — so this runs locally, not on the Vercel builder (which has no
// @react-pdf/renderer). The design/fonts/parsing live in tools/pdf/scholarly-pdf.mjs;
// this driver only feeds it the clean source markdown (data/briefings/<slug>.md)
// plus the curated abstract and reference rows from briefing-meta.json.
//
// Requires @react-pdf/renderer locally (present in node_modules). It is deliberately
// NOT declared in package.json so the Vercel `npm ci` stays in sync and the deploy
// never needs it; if node_modules is cleaned, run `npm i -D @react-pdf/renderer` to regenerate.
//
// Usage:  node tools/build-briefing-pdf.mjs [slug ...]   (default: the-prop-65-gap)

import { readFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { renderScholarlyPdf, parse } from "./pdf/scholarly-pdf.mjs"

const SRC = "data/briefings"
const OUT = "content/static/briefings"
const META = JSON.parse(readFileSync(join(SRC, "briefing-meta.json"), "utf8"))

// The reference rows and abstract in briefing-meta.json carry HTML entities and a
// little inline markup; strip them so real glyphs (not "&amp;") reach the page.
const decode = (s) =>
  String(s || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&micro;/g, "µ")
    .replace(/&middot;/g, "·")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&sect;/g, "§")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()

const mapRefs = (entry) =>
  (entry.references || []).map((r) => ({
    n: r.n,
    head: decode(r.title),
    meta: decode(r.meta_html),
    tag: r.type || "",
  }))

async function build(slug) {
  const entry = META.find((m) => m.slug === slug)
  if (!entry) throw new Error(`briefing-pdf: no briefing-meta entry for "${slug}"`)
  const { fm, body } = parse(readFileSync(join(SRC, `${slug}.md`), "utf8"))
  // The tinted Abstract block reads fm.dek; use the curated meta abstract.
  fm.dek = decode(entry.abstract_html)
  // buildModel's date label wants an ISO-ish date; briefing frontmatter carries a
  // human month ("August 2026"), so derive YYYY-MM from it for the masthead date.
  if (!/^\d{4}-\d{2}/.test(String(fm.updated || ""))) {
    const MO = ["january","february","march","april","may","june","july","august","september","october","november","december"]
    const m = String(fm.date || "").match(/([A-Za-z]+)\s+(\d{4})/)
    fm.updated = m ? `${m[2]}-${String(MO.indexOf(m[1].toLowerCase()) + 1).padStart(2, "0")}` : "2026-08"
  }
  mkdirSync(OUT, { recursive: true })
  await renderScholarlyPdf({
    fm,
    body,
    outPath: join(OUT, `${slug}.pdf`),
    cfg: {
      masthead: "Heavy Metal Certified  ·  Standards Briefing",
      slug,
      pathSeg: "briefings",
      references: mapRefs(entry),
    },
  })
  console.log(`briefing-pdf: wrote ${OUT}/${slug}.pdf (${(entry.references || []).length} refs)`)
}

const slugs = process.argv.slice(2)
const targets = slugs.length ? slugs : ["the-prop-65-gap"]
for (const s of targets) await build(s)
