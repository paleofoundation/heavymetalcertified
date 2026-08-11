#!/usr/bin/env node
// regulatory-link-lint.mjs — build-blocking guard: a standards page must not name a
// known regulatory instrument in its PROSE without linking it to the instrument's
// regulation-reference page. This is the regression guard for build-standards-reg-
// links.mjs: after the linkifier runs in prebuild, every prose citation of a
// registered instrument resolves to its page, so this lint passes; it fails only if
// a citation slips the linkifier (e.g. a new instrument added to a page but not yet
// to the shared register in tools/lib/regulatory-instruments.mjs).
//
// SCOPE. The register (tools/lib/regulatory-instruments.mjs) is precise by design —
// unambiguous instrument identifiers only, test methods excluded — so this lint
// never flags a substance word or a measurement method, only a genuine sovereign
// instrument named without its link. It reads the SAME prose region the linkifier
// writes: the rendered body, minus frontmatter and minus marker-bounded blocks
// (the Sources table links its own instruments).
//
// Composes with firewall-cert-lint (corpus/firewall) and design-lint (no-bold),
// each guarding a different invariant on the same reading surface.
//
// Flags:  --warn-only   report but never exit non-zero (staged rollout).

import fs from "node:fs"
import path from "node:path"
import { auditStandardsContent } from "./lib/regulatory-instruments.mjs"

const repoRoot = process.cwd()
const STD_DIR = path.join(repoRoot, "content", "standards")
const WARN_ONLY = process.argv.includes("--warn-only")

const findings = []
let scanned = 0

if (fs.existsSync(STD_DIR)) {
  for (const f of fs.readdirSync(STD_DIR)) {
    if (!f.endsWith(".md") || f === "index.md") continue
    scanned++
    const abs = path.join(STD_DIR, f)
    const missing = auditStandardsContent(fs.readFileSync(abs, "utf8"), repoRoot)
    for (const m of missing) {
      findings.push(`content/standards/${f}  names ${m.slug} in prose but does not link it (expected → ${m.url})`)
    }
  }
}

if (findings.length) {
  console.error(`regulatory-link-lint: ${findings.length} unlinked instrument citation(s) on the standards reading surface:`)
  for (const x of findings) console.error(`  ✗ ${x}`)
  console.error(
    `\nregulatory-link-lint: run \`node tools/build-standards-reg-links.mjs\` to linkify these, or add the\n` +
      `instrument to the shared register in tools/lib/regulatory-instruments.mjs if it is new.`,
  )
  if (!WARN_ONLY) process.exit(1)
  console.error("regulatory-link-lint: (--warn-only) not failing the build.")
}

console.log(`regulatory-link-lint: OK — ${scanned} standards page(s) scanned, every registered instrument cited in prose is linked.`)
process.exit(0)
