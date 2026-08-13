#!/usr/bin/env node
// Resolve the editorial navigation seed into the module TopNav imports.
//
// Two jobs:
//
//   1. **Fill in live numbers.** Source counts come from page frontmatter (kept
//      current by sync-source-counts.mjs), commodity-group counts from the side
//      channel build-ingredient-index.mjs writes, and hub totals from the shared
//      countMarkdownPages(). The nav and the pages it points at therefore cannot
//      quote different numbers.
//
//   2. **Refuse to emit a dead link.** Every seed slug is resolved against
//      wiki/ before anything is written, and a miss exits 1. The navigation is
//      on ~2,900 pages; a 404 there is worse than a red build, and slug churn in
//      this repo is constant (species splits, aliases, category renames).
//
// Emits a .ts module rather than JSON on purpose: quartz/cli/handlers.js watches
// **/*.ts but not **/*.json, so a JSON artifact would not hot-rebuild under
// `npm run serve`, and tsconfig's strict check would not see it.

import fs from "node:fs"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { countMarkdownPages, readPageFrontmatter } from "./lib/count-pages.mjs"

const repoRoot = process.cwd()
const wikiRoot = path.join(repoRoot, "wiki")
const seedPath = path.join(repoRoot, "quartz/components/navPanels.seed.ts")
const outPath = path.join(repoRoot, "quartz/components/generated/navPanels.ts")
const groupsPath = path.join(repoRoot, "data/nav/ingredient-groups.json")

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")

// ---------------------------------------------------------------------------
// Read the seed. It is TypeScript-with-types-only, so stripping the type layer
// with a regex pass and evaluating the remainder as a module avoids adding a
// tsx/esbuild dependency to a script that runs on every build.
// ---------------------------------------------------------------------------
const seedSource = fs.readFileSync(seedPath, "utf8")
const stripped = seedSource
  .replace(/^export interface[\s\S]*?^\}$/gm, "")
  .replace(/^\s*\/\/.*$/gm, "")
  .replace(/export const seedPanels: SeedPanel\[\] =/, "export const seedPanels =")
const tmpPath = path.join(repoRoot, "node_modules/.cache/hmi-nav-seed.mjs")
fs.mkdirSync(path.dirname(tmpPath), { recursive: true })
fs.writeFileSync(tmpPath, stripped, "utf8")
const { seedPanels } = await import(`${pathToFileURL(tmpPath).href}?v=${fs.statSync(seedPath).mtimeMs}`)

// ---------------------------------------------------------------------------
// Count sources
// ---------------------------------------------------------------------------
const frontmatterByDir = new Map()
function sourcesFor(slug) {
  const dir = slug.includes("/") ? slug.slice(0, slug.lastIndexOf("/")) : ""
  const name = slug.slice(slug.lastIndexOf("/") + 1)
  if (!dir) return null
  if (!frontmatterByDir.has(dir)) {
    frontmatterByDir.set(dir, readPageFrontmatter(path.join(wikiRoot, dir)))
  }
  const fm = frontmatterByDir.get(dir).get(name)
  const n = Number(fm?.sources ?? NaN)
  return Number.isFinite(n) && n > 0 ? n : null
}

const ingredientGroups = fs.existsSync(groupsPath)
  ? new Map(JSON.parse(fs.readFileSync(groupsPath, "utf8")).map((g) => [g.anchor, g.count]))
  : new Map()

// ---------------------------------------------------------------------------
// Resolve slugs. A wiki slug "metals/lead" is wiki/metals/lead.md; a hub slug
// "metals" is wiki/metals/index.md or wiki/metals.md (both shapes are in use).
// ---------------------------------------------------------------------------
function slugExists(slug) {
  return (
    fs.existsSync(path.join(wikiRoot, `${slug}.md`)) ||
    fs.existsSync(path.join(wikiRoot, slug, "index.md"))
  )
}

const dangling = []
function requireSlug(slug, where) {
  if (!slugExists(slug)) dangling.push(`${slug}   (${where})`)
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------
const panels = seedPanels.map((panel) => {
  requireSlug(panel.slug, `${panel.key} panel hub`)

  const groups = panel.groups.map((group) => ({
    heading: group.heading,
    children: group.children.map((child) => {
      requireSlug(child.slug, `${panel.key} › ${group.heading} › ${child.label}`)
      let count = null
      if (child.count === "sources") count = sourcesFor(child.slug)
      else if (child.count === "group") count = ingredientGroups.get(child.anchor ?? "") ?? null
      else if (typeof child.count === "string" && child.count.startsWith("dir:")) {
        count = countMarkdownPages(path.join(repoRoot, child.count.slice(4)), ["index.md"])
      }
      return {
        label: child.label,
        slug: child.slug,
        ...(child.anchor ? { anchor: child.anchor } : {}),
        ...(count ? { count } : {}),
      }
    }),
  }))

  // Hub total for the "All N …" footer link. Directory hubs count their pages;
  // section hubs (Evidence → trust) have no single directory, so their seed
  // label carries no {n} and none is computed.
  const hubDir = path.join(wikiRoot, panel.slug)
  const total = fs.existsSync(hubDir) ? countMarkdownPages(hubDir, ["index.md"]) : null
  const allLabel = panel.allLabel.includes("{n}")
    ? panel.allLabel.replace("{n}", total === null ? "" : total.toLocaleString("en-US"))
    : panel.allLabel

  return {
    key: panel.key,
    label: panel.label,
    panelLabel: panel.panelLabel ?? panel.label,
    slug: panel.slug,
    blurb: panel.blurb,
    ...(panel.extraPrefixes ? { extraPrefixes: panel.extraPrefixes } : {}),
    groups,
    allLabel,
  }
})

if (dangling.length) {
  console.error("build-nav-panels: FAIL — seed slugs with no page on disk:")
  for (const d of dangling) console.error(`  ${d}`)
  console.error(
    "\n  Global navigation renders on every page, so a dangling entry is a site-wide 404." +
      "\n  Fix the slug in quartz/components/navPanels.seed.ts or restore the page.",
  )
  process.exit(1)
}

const module = `// GENERATED by tools/build-nav-panels.mjs — do not edit.
// Editorial source: quartz/components/navPanels.seed.ts
// Counts are live at build time; see that file for why selection is curated.

export interface NavChild {
  label: string
  slug: string
  anchor?: string
  count?: number
}

export interface NavGroup {
  heading: string
  children: NavChild[]
}

export interface NavPanel {
  key: string
  label: string
  panelLabel: string
  slug: string
  blurb: string
  extraPrefixes?: string[]
  groups: NavGroup[]
  allLabel: string
}

export const navPanels: NavPanel[] = ${JSON.stringify(panels, null, 2)}
`

const prev = fs.existsSync(outPath) ? fs.readFileSync(outPath, "utf8") : ""
const childCount = panels.reduce((n, p) => n + p.groups.reduce((m, g) => m + g.children.length, 0), 0)

if (prev === module) {
  console.log(`build-nav-panels: unchanged (${panels.length} panels, ${childCount} links).`)
} else if (dryRun) {
  console.log(`build-nav-panels: DRY-RUN would update ${path.relative(repoRoot, outPath)}.`)
} else {
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, module, "utf8")
  console.log(`build-nav-panels: wrote ${panels.length} panels, ${childCount} links.`)
}
