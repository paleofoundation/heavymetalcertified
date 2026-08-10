#!/usr/bin/env node
// crosslink-lint.mjs — cross-property authority regression guard for the cert
// site (heavymetalcertified.com). Deterministic.
//
// The cert corpus earns cross-property authority two ways: (1) the CrossPropertyLink
// transformer auto-links the first prose mention of a sibling property (Heavy
// Metal Index, Institute of Contaminant Standards) out to it, and (2) the Related
// blocks / frontmatter carry structured links. Both are firewall-ALLOWED
// directions (cert→index, cert→ICS, cert→tested). The cert site has no forbidden
// outbound direction, so — unlike the index — this lint blocks nothing on a link
// TARGET. What it guards is that the machinery does not silently regress:
//
//   1. TRANSFORMER REGISTERED (blocking) — if CrossPropertyLink is dropped from
//      quartz.config.ts or the plugins barrel, EVERY in-content cross-property
//      link vanishes site-wide with no error (the same class of silent failure as
//      a Quartz component dropped from the layout). This asserts it is wired.
//
//   2. BARE PRIMARY-SOURCE CITATION (warn) — a DOI printed in content prose with
//      no accompanying doi.org / href link. Authoritative pages should link the
//      primary source they cite (an answer-engine + Daubert signal). Warn-only:
//      internal regulation identifiers (GB 2762, 2023/915, CXS 193 …) are already
//      auto-linked to /regulations/ by AutoLink, so only unlinked DOIs are flagged.

import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const errors = []
const warnings = []

function walk(dir, cb, filter) {
  if (!fs.existsSync(dir)) return
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) walk(full, cb, filter)
    else if (!filter || filter(full)) cb(full)
  }
}

// ---- 1. transformer registered (blocking) ---------------------------------
const configFile = path.join(root, "quartz.config.ts")
const barrelFile = path.join(root, "quartz/plugins/transformers/index.ts")
const pluginFile = path.join(root, "quartz/plugins/transformers/crosspropertylink.ts")

if (!fs.existsSync(pluginFile)) {
  errors.push(`MISSING_PLUGIN: quartz/plugins/transformers/crosspropertylink.ts does not exist — the cross-property autolinker is gone.`)
} else {
  const config = fs.existsSync(configFile) ? fs.readFileSync(configFile, "utf8") : ""
  const barrel = fs.existsSync(barrelFile) ? fs.readFileSync(barrelFile, "utf8") : ""
  if (!/export\s*\{\s*CrossPropertyLink\s*\}/.test(barrel)) {
    errors.push(`UNEXPORTED_PLUGIN: quartz/plugins/transformers/index.ts no longer exports CrossPropertyLink.`)
  }
  if (!/Plugin\.CrossPropertyLink\s*\(/.test(config)) {
    errors.push(
      `UNREGISTERED_PLUGIN: quartz.config.ts no longer calls Plugin.CrossPropertyLink() — every in-content cross-property link would silently disappear.`,
    )
  }
}

// ---- 2. bare primary-source citation (warn) -------------------------------
const DOI = /\b10\.\d{4,9}\/[^\s"'<>)\]]+/g
walk(
  path.join(root, "content"),
  (f) => {
    const text = fs.readFileSync(f, "utf8")
    const rel = path.relative(root, f)
    text.split("\n").forEach((line, i) => {
      // skip YAML frontmatter-ish lines and obvious link lines
      DOI.lastIndex = 0
      let m
      while ((m = DOI.exec(line)) !== null) {
        if (!/doi\.org|href|\]\(|<https?:/.test(line)) {
          warnings.push(`BARE_PRIMARY_SOURCE: ${rel}:${i + 1} cites DOI "${m[0]}" without a doi.org link.`)
          break
        }
      }
    })
  },
  (f) => f.endsWith(".md"),
)

// ---- report ---------------------------------------------------------------
const WARN_CAP = 25
warnings.slice(0, WARN_CAP).forEach((w) => console.warn(`  ⚠ ${w}`))
if (warnings.length > WARN_CAP) console.warn(`  ⚠ … and ${warnings.length - WARN_CAP} more warning(s).`)

if (errors.length) {
  console.error(`crosslink-lint: ${errors.length} violation(s):`)
  for (const e of errors) console.error(`  ✗ ${e}`)
  process.exit(1)
}
console.log(
  `crosslink-lint: OK (CrossPropertyLink registered${warnings.length ? `; ${warnings.length} bare-DOI warning(s)` : ""}).`,
)
process.exit(0)
