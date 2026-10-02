#!/usr/bin/env node
// build-standards-reg-links.mjs — linkify regulatory-instrument citations in the
// PROSE of every standards page, using the same register→page mapping the Sources
// table already uses. Closes the highest-frequency broken internal link on the
// reading surface: an instrument named in the narrative or a per-analyte rationale
// (e.g. "EU REACH Annex XVII entry 72", "Directive 2009/48/EC", "EU Regulation
// 10/2011") that rendered as plain text while the structured Sources table linked
// the very same instrument.
//
// Runs in the cert prebuild AFTER every standards generator and after
// build-cert-sources / build-cert-version-history, so it linkifies the final prose
// and leaves the marker-bounded Sources/version-history blocks untouched. It is a
// POST-PROCESSOR of the generated .md — the same posture as build-cert-sources.mjs
// — which is what lets it cover the frozen, generator-not-in-repo Cat-9 pages and
// the in-repo catalog/seafood/grains pages alike, from ONE resolver.
//
// Idempotent: an instrument already linked in the prose (a prior run, or a
// hand-authored link) is left alone, and each instrument is linked at its first
// prose mention only (no over-linking). Firewall-clean: cert→index is a one-way
// cite; an instrument with a cert-side /regulations/ page links internally instead.

import fs from "node:fs"
import path from "node:path"
import { linkifyStandardsContent } from "./lib/regulatory-instruments.mjs"

const repoRoot = process.cwd()

// Linkify regulatory-instrument citations in the prose of the standards pages AND of
// the other claim-bearing reading surfaces whose rationale names sovereign instruments
// (analytes, why-we-limit, requirements). One resolver, one pass. For analytes /
// why-we-limit / requirements this doubles as the HMTC-BIG8-DRAIN-27 citation drain:
// a /regulations/ link the resolver emits is the citation-coverage gate's accepted
// no-invent claim-surface cite for those pages. It only links instruments the prose
// already names, so no reference is invented and no µg/kg value is touched.
const LINK_DIRS = ["standards", "analytes", "why-we-limit", "requirements"].map((d) =>
  path.join(repoRoot, "content", d),
)

let pages = 0
let links = 0
for (const dir of LINK_DIRS) {
  if (!fs.existsSync(dir)) continue
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".md") || f === "index.md") continue
    const abs = path.join(dir, f)
    const raw = fs.readFileSync(abs, "utf8")
    const { content, count } = linkifyStandardsContent(raw, repoRoot)
    if (content !== raw) {
      fs.writeFileSync(abs, content, "utf8")
      pages++
      links += count
    }
  }
}

console.log(`build-standards-reg-links: linked ${links} prose instrument citation(s) across ${pages} page(s) (standards + analytes + why-we-limit + requirements).`)
