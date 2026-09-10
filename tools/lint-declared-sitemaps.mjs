#!/usr/bin/env node
// Fail the build if a robots-declared sitemap is missing, empty, or not
// well-formed XML. This is the always-runs floor for the 2026-09-10
// intermittent 500s on /sitemap.xml and /sitemap-scholarly.xml: a deploy that
// cannot serve those URLs as static XML must not ship.

import path from "node:path"

import { validateDeclaredSitemaps } from "./lib/sitemaps.mjs"

const PUBLIC = path.join(process.cwd(), "public")
const errors = validateDeclaredSitemaps(PUBLIC)

if (errors.length) {
  console.error(`lint-declared-sitemaps: FAILED (${errors.length} issue(s))`)
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log("lint-declared-sitemaps: PASS — declared sitemaps exist and are well-formed")
