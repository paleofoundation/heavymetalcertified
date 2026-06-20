#!/usr/bin/env node
// ============================================================================
// RELOCATED FROM heavymetalindex.com — DO NOT WIRE AS-IS.
//
// This generator built brand-facing "Certification Defense Dossier" pages into
// wiki/dossiers/ on the INDEX domain — a Part-12 firewall breach (a certification
// surface on the independent literature index; plan finding B1). It was removed
// from the index build on 2026-06-20 and relocated here, to the cert plane, where
// brand-facing certification surfaces belong.
//
// It is NOT yet runnable on the cert repo: it reads wiki/static/*.json (the
// defense-dossier / change-watch / risk-map indexes) and writes wiki/dossiers/,
// none of which exist in this repo's content/ + data/ layout. Wiring the cert-side
// dossier feature depends on the HMI literature API delivering those indexes
// one-way (the api/defense-dossier.mjs relocation is finding #1, Karen's trigger)
// and on the brand-intelligence build (CLAUDE.md Part 3 / docs/hmtc-brand-
// intelligence-build-plan.md, in the separate paleo-foundation repo, auth-gated).
// Preserved here verbatim so the asset is not lost. Re-point paths to content/
// and the cert published-plane before enabling.
//
// Original header follows.
// ============================================================================
// Assemble the brand-facing Certification Defense Dossier SURFACE: one
// human-readable, version-pinned, citable page per locked HMTc product row that
// ties together the four instruments built for brands —
//   1. the defense dossier        (wiki/static/defense-dossier-index.json)
//   2. the change-watch feed      (wiki/static/change-watch-index.json)
//   3. the supply-chain risk map  (wiki/static/category-risk-maps.json)
//   4. the Lab Result Comparator  (/certification/lab-result-comparator)
// plus the machine-verifiable downloads (/api/defense-dossier, /api/evidence-packet).
//
// These are the GC-ready surface. They are marked noindex: the decision to
// expose them publicly vs behind certification auth is a positioning call for
// Karen (OPERATING.md Part 4), so this generator does not link them from the
// public index — only from the brand hub (wiki/for-brands.md) and the dossiers
// index. They render through Quartz like any page and are printable as an exhibit.
//
// Output: wiki/dossiers/<slug>.md  + wiki/dossiers/index.md (hub)
// Usage:  node tools/build-brand-dossier-pages.mjs   (npm run dossier-pages)

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dossierIndexPath = path.join(repoRoot, "wiki/static/defense-dossier-index.json")
const changeWatchPath = path.join(repoRoot, "wiki/static/change-watch-index.json")
const riskMapsPath = path.join(repoRoot, "wiki/static/category-risk-maps.json")
const outDir = path.join(repoRoot, "wiki/dossiers")

const loadJson = (p, fb) => {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"))
  } catch {
    return fb
  }
}

const dossierIndex = loadJson(dossierIndexPath, { records: [] })
const changeWatch = loadJson(changeWatchPath, { by_category: {} })
const riskMaps = loadJson(riskMapsPath, { records: [] })
const riskBySlug = new Map((riskMaps.records || []).map((r) => [r.category, r]))
const changeByCategory = changeWatch.by_category || {}

function slugLeaf(slug) {
  return slug.replace(/^products\//, "")
}

function renderDossierPage(d) {
  const slug = d.product.slug // products/<x>
  const leaf = slugLeaf(slug)
  const pin = d.product.content_pin || {}
  const ev = d.evidence_base || {}
  const caps = d.regulatory_caps || {}
  const def = d.defensibility || {}
  const cw = changeByCategory[slug]
  const risk = riskBySlug.get(slug)

  const lines = []
  lines.push("---")
  lines.push(`title: "Defense dossier — ${escapeYaml(d.product.title)}"`)
  lines.push("type: brand-dossier")
  lines.push("noindex: true")
  lines.push("audience: [regulator, brand-legal, commercial]")
  lines.push(`category: ${slug}`)
  if (d.product.hmtc_category != null) lines.push(`hmtc_category: ${d.product.hmtc_category}`)
  if (d.product.hmtc_row != null) lines.push(`hmtc_row: ${d.product.hmtc_row}`)
  lines.push("generated: true")
  lines.push("---")
  lines.push("")
  lines.push(`# Certification defense dossier — ${d.product.title}`)
  lines.push("")
  lines.push(
    "This page assembles the Heavy Metal Index evidence behind one product category into a single, version-pinned record. It reports what the cited literature and the applicable regulations say. It does not state an HMTc certification threshold or a pass/fail determination; those are policy choices that live in the certification program, not in this evidence base.",
  )
  lines.push("")

  // Cite-as-of pin
  lines.push("## Cite this dossier as published")
  lines.push("")
  if (pin.last_commit_sha) {
    lines.push(
      `The page this dossier summarizes is pinned at commit \`${pin.last_commit_sha}\` (${pin.last_commit_date || "date on record"}). The body hashes to \`sha256:${(pin.content_sha256 || "").slice(0, 32)}…\`. Any party can clone the repository at that commit, hash the named page, and confirm the match.`,
    )
    lines.push("")
    lines.push(
      `Machine-verifiable downloads: the full per-category packet is at \`/api/defense-dossier?slug=${leaf}&download=1\`, and the single-page evidence packet (with the Daubert attestation block) is at \`/api/evidence-packet?slug=${slug}&download=1\`.`,
    )
  } else {
    lines.push("A git content pin is not yet recorded for this page; it will appear after the next build.")
  }
  lines.push("")

  // Evidence base
  lines.push("## Evidence base")
  lines.push("")
  lines.push(
    `This category is supported by ${ev.contributing_source_count || 0} contributing literature source${ev.contributing_source_count === 1 ? "" : "s"} mapped by the routing layer, of which ${ev.sources_with_structured_values || 0} carry structured concentration values. The page makes ${def.total_claims || 0} numerical claim${def.total_claims === 1 ? "" : "s"}; ${def.cited_claims || 0} of them trace to an in-section cited source` +
      (def.provenance_complete
        ? ", so every numerical claim on the page is source-traceable."
        : `, leaving ${def.uncited_claims || 0} that do not yet trace to an in-section source and are flagged for synthesis.`),
  )
  lines.push("")
  lines.push(
    `The claim-by-claim provenance report is generated at \`data/evidence/defensibility-reports/products/${leaf}.md\`.`,
  )
  lines.push("")

  // Regulatory caps
  lines.push("## Applicable regulatory ceilings")
  lines.push("")
  if (caps.caps && caps.caps.length) {
    lines.push("| Regulation | Agency | Metals | Limit | Status |")
    lines.push("|---|---|---|---|---|")
    for (const c of caps.caps) {
      const limit = c.limit_value != null ? `${c.limit_value} ${c.limit_unit || ""}`.trim() : "see page"
      lines.push(
        `| [[${c.slug}\\|${escapePipe(c.title || c.slug)}]] | ${c.agency || "—"} | ${(c.metals || []).join(", ") || "—"} | ${limit} | ${c.status || "—"} |`,
      )
    }
  } else {
    lines.push(
      caps.note ||
        "This category declares no category-specific numeric regulatory ceiling. The absence of a finished-product cap for this exact matrix is itself defense-relevant context.",
    )
  }
  lines.push("")

  // Supply-chain risk drivers
  lines.push("## Where the risk comes from")
  lines.push("")
  if (risk && risk.metals_ranked && risk.metals_ranked.length) {
    lines.push(
      "Ranked by the literature-reported concentration of this category's declared ingredient inputs. This is ingredient-level evidence for defensive sourcing, not a finished-product measurement.",
    )
    lines.push("")
    lines.push("| Metal | Dominant ingredient driver | Share of ranked risk |")
    lines.push("|---|---|---|")
    for (const m of risk.metals_ranked) {
      const mm = risk.metals[m]
      lines.push(`| ${mm.label || m} | ${mm.top_driver} | ${Math.round((mm.top_driver_share || 0) * 100)}% |`)
    }
    lines.push("")
    lines.push(`The full driver ranking is available at \`/api/risk-map?category=${leaf}\`.`)
  } else {
    lines.push(
      `This category's ingredient inputs are not yet characterized for a driver ranking. Query an arbitrary bill of materials at \`/api/risk-map?ingredients=...\` in the meantime.`,
    )
  }
  lines.push("")

  // Change-watch
  lines.push("## Recent regulatory and literature changes")
  lines.push("")
  if (cw && cw.recent_events && cw.recent_events.length) {
    lines.push("What has moved in the regulation or the cited literature that touches this category, newest first.")
    lines.push("")
    for (const e of cw.recent_events.slice(0, 8)) {
      lines.push(`- **${e.date}** — ${escapeInline(e.detail || e.kind)}`)
    }
    lines.push("")
    lines.push(`The live feed for this category is at \`/api/change-watch?category=${leaf}\`.`)
  } else {
    lines.push(
      `No tracked regulatory or literature changes touch this category yet. The watch is live at \`/api/change-watch?category=${leaf}\`.`,
    )
  }
  lines.push("")

  // Lab comparator
  lines.push("## Compare a laboratory result")
  lines.push("")
  lines.push(
    `Position a finished-product lab value inside the cited literature for this matrix, against the applicable regulatory cap, with basis conversion shown if applied, in the [Lab Result Comparator](/certification/lab-result-comparator?category=${leaf}). The public evidence page for this category is [[${slug}]].`,
  )
  lines.push("")

  return lines.join("\n") + "\n"
}

function renderHub(records) {
  const byCat = new Map()
  for (const d of records) {
    const cat = d.product.category_label || "Other"
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat).push(d)
  }
  const lines = []
  lines.push("---")
  lines.push("title: Certification defense dossiers")
  lines.push("noindex: true")
  lines.push("audience: [regulator, brand-legal, commercial]")
  lines.push("generated: true")
  lines.push("---")
  lines.push("")
  lines.push("# Certification defense dossiers")
  lines.push("")
  lines.push(
    "One version-pinned evidence dossier per certified product category, assembling the contributing literature, the applicable regulatory ceilings, the supply-chain risk drivers, and the recent regulatory and literature changes. See [[for-brands]] for what each instrument is and how a brand uses it.",
  )
  lines.push("")
  for (const cat of [...byCat.keys()].sort()) {
    lines.push(`## ${cat}`)
    lines.push("")
    for (const d of byCat.get(cat).sort((a, b) => a.product.title.localeCompare(b.product.title))) {
      const leaf = slugLeaf(d.product.slug)
      const n = d.evidence_base?.contributing_source_count || 0
      lines.push(`- [[dossiers/${leaf}|${escapeInline(d.product.title)}]] — ${n} contributing source${n === 1 ? "" : "s"}`)
    }
    lines.push("")
  }
  return lines.join("\n") + "\n"
}

function escapeYaml(s) {
  return String(s).replace(/"/g, '\\"')
}
function escapePipe(s) {
  return String(s).replace(/\|/g, "\\|")
}
function escapeInline(s) {
  return String(s).replace(/\|/g, "\\|").replace(/\n/g, " ")
}

const records = (dossierIndex.records || []).slice().sort((a, b) => a.product.slug.localeCompare(b.product.slug))
fs.mkdirSync(outDir, { recursive: true })
for (const d of records) {
  fs.writeFileSync(path.join(outDir, `${slugLeaf(d.product.slug)}.md`), renderDossierPage(d), "utf8")
}
fs.writeFileSync(path.join(outDir, "index.md"), renderHub(records), "utf8")

console.error(`[brand-dossier-pages] wrote ${records.length} category dossier pages + index to ${path.relative(repoRoot, outDir)}`)
