#!/usr/bin/env node
// Generate both crawler sitemaps declared in robots.txt from the built HTML.
//
// SCOPE (load-bearing). Every published standard row carries citation_* metadata,
// so keying the scholarly sitemap on "has citation_title" swept ~150 per-row
// specification pages into it alongside ~44 actual documents. A specification is
// not a scholarly work: Google Scholar's inclusion guidelines cover articles,
// technical reports and their drafts, and exclude catalog-style listings. A corpus
// that is 78% specification rows gives Scholar's classifier a weak signal on a
// domain that also serves /apply and /for-brands.
//
// The scholarly sitemap therefore carries only the document-shaped sections below.
// Nothing is hidden by this: the standards rows stay in the main sitemap and
// remain fully indexable by ordinary Googlebot.
//
// RELIABILITY. Quartz ContentIndex also writes public/sitemap.xml, but that file
// has no XML prolog and is a second source of truth from the crawl audit. This
// script overwrites BOTH declared sitemaps from the same HTML walk so a missing
// or malformed file fails the build instead of shipping as an intermittent 500.

import path from "node:path"

import { SCHOLARLY_SECTIONS, writeSitemaps } from "./lib/sitemaps.mjs"

const PUBLIC = path.join(process.cwd(), "public")

const { indexable, scholarly } = writeSitemaps(PUBLIC)

console.log(
  `postbuild-cert-sitemaps: wrote sitemap.xml (${indexable.length} indexable URLs) ` +
    `and sitemap-scholarly.xml (${scholarly.length} scholarly URLs; sections: ${SCHOLARLY_SECTIONS.join(", ")})`,
)
