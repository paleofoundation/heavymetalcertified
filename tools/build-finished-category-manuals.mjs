#!/usr/bin/env node
// Rebuild every MANUAL-ONLY category config (cat<N>-manual.json).
// Seafood, grains, and dairy stay on their *-pages.json calls in prebuild.

import fs from "node:fs"
import path from "node:path"
import { spawnSync } from "node:child_process"

const dir = path.join(process.cwd(), "data/standards")
const files = fs.readdirSync(dir)
  .filter((f) => /^cat\d+-manual\.json$/.test(f))
  .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]))

for (const file of files) {
  const r = spawnSync(process.execPath, ["tools/build-category-manual.mjs", `--pages=data/standards/${file}`], { stdio: "inherit" })
  if (r.status !== 0) process.exit(r.status || 1)
}
console.log(`build-finished-category-manuals: ${files.length} manual config(s)`)
