// page-record-join.mjs — shared page→record join resolver (ORDER S-DOI-P0-AGG-1).
//
// Some taxonomy-row STANDARD pages are AGGREGATES: the public page slug is not itself a
// compiled record, it groups one or more compiled records (variants) that the page renders
// together. The canonical example is Cat-1's infant-food rows — e.g. page `baby-cereals-dry`
// groups records `baby-cereals-dry-rice-based` + `baby-cereals-dry-non-rice`, and page
// `fruit-purees` renders record `fruit-purees-general`. The join lives in
// data/standards/<cat>-pages.json as `pages[].variants[] = {label, variant, record}`; the same
// file drives the page renderer (tools/build-cat1-standard-pages.mjs and the category renderers).
//
// Before this resolver, the DOI + PDF tooling keyed strictly off a compiled record whose slug
// EQUALS the page slug (build-standard-pdf.mjs findRecord(slug); mint-dois completeSlugs). That
// works for the common case where page slug == record slug, but an aggregate page slug has no
// such record, so it could never get a react-pdf and never resolve COMPLETE. This module exposes
// the join so both tools can resolve an aggregate page to its child records:
//   * build-standard-pdf renders ONE react-pdf per aggregate page from the joined records, and
//   * mint-dois resolves an aggregate page COMPLETE only when EVERY child record is COMPLETE
//     (and FAILS the page if any child is a claim-surface FAIL).
//
// It is a read-only view of the *-pages.json files; it authors no numbers and no mappings. A page
// that already has its own compiled record (page slug == record slug — the overwhelming majority)
// is left to the direct path; callers check that first so this never overrides a real record.

import fs from "node:fs"
import path from "node:path"

// Map<pageSlug, { pagesFile, variants: [{label, variant, record}] }>.
// Scans every data/standards/*-pages.json. First definition of a slug wins (stable, sorted scan).
export function loadPageJoins(dataDir) {
  const map = new Map()
  if (!fs.existsSync(dataDir)) return map
  for (const f of fs.readdirSync(dataDir).sort()) {
    if (!/-pages\.json$/.test(f)) continue
    let j
    try { j = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8")) } catch { continue }
    for (const p of j.pages || []) {
      if (!p || !p.slug || !Array.isArray(p.variants)) continue
      const variants = p.variants
        .filter((v) => v && v.record)
        .map((v) => ({ label: v.label || v.variant || "all", variant: v.variant || "default", record: v.record }))
      if (!variants.length) continue
      if (!map.has(p.slug)) map.set(p.slug, { pagesFile: f, variants })
    }
  }
  return map
}

// Ordered, de-duplicated child record slugs an aggregate page groups.
// Returns null when the slug is not a join page.
export function pageChildRecords(pageSlug, dataDirOrJoins) {
  const joins = dataDirOrJoins instanceof Map ? dataDirOrJoins : loadPageJoins(dataDirOrJoins)
  const j = joins.get(pageSlug)
  if (!j) return null
  return [...new Set(j.variants.map((v) => v.record))]
}
