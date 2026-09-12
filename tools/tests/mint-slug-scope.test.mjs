// Guards the slug-scoped mint preflight (ORDER S-DOI-OLIVE-FINISH-1 §2 + addendum):
// `mint-dois --slug=<slug>` must be able to plan/mint one COMPLETE standard even while
// the corpus-wide claim-surface backlog is non-empty (it must NOT abort corpus-global),
// AND the per-slug claim-surface gate must still reject an incomplete slug. This is an
// integration test: it spawns the real tool against the current repo state.
import test from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")

function runMint(slug) {
  try {
    return execFileSync("node", ["tools/mint-dois.mjs", "--types=standards", `--slug=${slug}`],
      { cwd: REPO, encoding: "utf8" })
  } catch (e) {
    return `${e.stdout || ""}${e.stderr || ""}` // dry-run planning report; capture whatever printed
  }
}
const claimFailCount = (out) => { const m = out.match(/(\d+)\s+claim-surface FAIL/); return m ? Number(m[1]) : 0 }
const eligibleTotal = (out) => { const m = out.match(/eligible total:\s*(\d+)/); return m ? Number(m[1]) : null }

// Pick a currently-incomplete standard that still has a published page, from the manifest.
function anIncompleteSluggedPage() {
  const p = path.join(REPO, "data/standards/readiness-manifest.json")
  if (!fs.existsSync(p)) return null
  const m = JSON.parse(fs.readFileSync(p, "utf8"))
  for (const c of m.categories || []) for (const r of c.records || c.pages || []) {
    if (r && r.complete === false && r.slug && fs.existsSync(path.join(REPO, "content/standards", `${r.slug}.md`))) return r.slug
  }
  return null
}

test("slug scope isolates olive-oil from the corpus backlog (no corpus-global abort, no claim-surface fail)", () => {
  const out = runMint("olive-oil")
  // The tool produced a planning report rather than aborting on the corpus.
  assert.match(out, /eligible total:\s*\d/, "scoped run should reach the planning summary, not abort corpus-global")
  // olive-oil itself is claim-complete: scoping to it yields ZERO claim-surface failures,
  // whether it is currently mintable (eligible >= 1) or already deposited (post-mint).
  assert.equal(claimFailCount(out), 0, "olive-oil must not be a claim-surface failure when scoped")
})

test("per-slug gate integrity: scoping to an incomplete slug still rejects it", () => {
  const slug = anIncompleteSluggedPage()
  if (!slug) { assert.ok(true, "backlog empty — no incomplete slug to test; gate integrity vacuously holds"); return }
  const out = runMint(slug)
  assert.equal(eligibleTotal(out), 0, `incomplete slug ${slug} must not be eligible`)
  assert.ok(claimFailCount(out) >= 1, `incomplete slug ${slug} must be rejected by the per-slug claim-surface gate`)
})
