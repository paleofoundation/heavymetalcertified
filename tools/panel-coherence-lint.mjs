#!/usr/bin/env node
// Panel-coherence lint — two guarantees that must hold for every compiled standard record.
//
// (1) SPECIES <= PARENT TOTAL, always. Inorganic arsenic is a physical subset of total arsenic;
//     methylmercury of total mercury; hexavalent chromium of total chromium. A published cell with
//     iAs > tAs (or MeHg > tHg, or Cr-VI > Cr) is physically impossible and was the exact defect the
//     wf2uta7ck audit found on the two Cat-1 rice records (iAs 100 vs tAs 50). This invariant holds
//     across every category and is cheap to check, so it runs on the whole compiled corpus.
//
// (2) GOLDEN VALUES for the six Cat-1 cells corrected by that audit. These corrections live in the
//     cert repo's committed compiled JSON, applied as a reviewed transform, because the upstream
//     heavy-metal-index register is mid-reconciliation (see docs ticket
//     CAT1-ARSENIC-UPSTREAM-RECONCILIATION.md). Until the upstream compiler reproduces them, a manual
//     re-copy of the compiled records from the index repo would silently revert the audited values.
//     This block is the tripwire against that. REMOVE THIS BLOCK once the upstream compiler emits
//     these values natively and the ticket is closed — coherence (1) is the permanent guard.

import fs from "node:fs"
import path from "node:path"

const REPO = process.cwd()
const BASE = path.join(REPO, "data/standards")
const PAIRS = [["iAs", "tAs"], ["MeHg", "tHg"], ["Cr-VI", "Cr"]]

const fail = []
let variantsChecked = 0

// Compiled schemas differ by vintage: cat1/seafood use { variants: { key: cells } }; the newer
// per-category compilers emit a flat { cells }. Normalise both to a list of cell-maps.
function cellMaps(j) {
  if (j && j.variants && typeof j.variants === "object") return Object.entries(j.variants)
  if (j && j.cells && typeof j.cells === "object") return [["-", j.cells]]
  return []
}

for (const dir of fs.readdirSync(BASE).filter((d) => d.endsWith("-compiled"))) {
  const dp = path.join(BASE, dir)
  if (!fs.statSync(dp).isDirectory()) continue
  for (const fn of fs.readdirSync(dp).filter((f) => f.endsWith(".json"))) {
    let j
    try { j = JSON.parse(fs.readFileSync(path.join(dp, fn), "utf8")) } catch { continue }
    for (const [vk, cells] of cellMaps(j)) {
      if (!cells || typeof cells !== "object") continue
      variantsChecked++
      for (const [sp, tot] of PAIRS) {
        const a = cells[sp], b = cells[tot]
        if (a && b && a.value != null && b.value != null && Number(a.value) > Number(b.value)) {
          fail.push(`${dir}/${fn.replace(".json", "")}[${vk}]: ${sp}=${a.value} > ${tot}=${b.value} — a species cell cannot exceed its parent total`)
        }
      }
    }
  }
}

// (2) Golden values — TEMPORARY; see header. record -> variant -> analyte -> expected value.
const GOLDEN = {
  "baby-cereals-dry-rice-based": { both: { iAs: 20 } },
  "teething-and-snacks-rice-based": { both: { iAs: 20 } },
  "baby-cereals-dry-non-rice": { both: { iAs: 20 } },
  "teething-and-snacks-non-rice": { both: { iAs: 20 } },
  "fruit-juice": { both: { iAs: 20 } },
  "infant-formula-powder": { soy: { Cd: 20 } },
  "infant-formula-rtf-liquid": { soy: { Cd: 10 } },
}
const CAT1 = path.join(BASE, "cat1-compiled")
for (const [rec, vars] of Object.entries(GOLDEN)) {
  const fp = path.join(CAT1, `${rec}.json`)
  if (!fs.existsSync(fp)) { fail.push(`GOLDEN: ${rec}.json missing`); continue }
  const j = JSON.parse(fs.readFileSync(fp, "utf8"))
  for (const [vk, analytes] of Object.entries(vars)) {
    for (const [an, want] of Object.entries(analytes)) {
      const got = j.variants?.[vk]?.[an]?.value
      if (got !== want) fail.push(`GOLDEN: ${rec}[${vk}] ${an} expected ${want}, got ${got} — an upstream re-copy may have reverted the audited correction (see CAT1-ARSENIC-UPSTREAM-RECONCILIATION.md)`)
    }
  }
}

if (fail.length) {
  console.error(`\npanel-coherence-lint: ${fail.length} FAILURE(S):`)
  for (const f of fail) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`panel-coherence-lint: OK — ${variantsChecked} compiled variant(s) coherent (species <= parent total), Cat-1 golden values intact.`)
