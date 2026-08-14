# findings — out-of-scope defects observed during other work

Log-and-surface, per AGENTS.md §4. Do not silently fix in an unrelated commit.

## 2026-08-07 — committed generated pages drift stale on disk (harmless; NOT a deploy blocker)

Observed while building the nickel analyte occurrence pilot.

Running the lints against the *committed* tree in isolation shows failures
(`design-lint`: `font-weight:600` on `content/standards/infant-formula-powder.md`
and `…-ready-to-feed.md`; `firewall-cert-lint`: `FIRM_VALUE_MISMATCH 14 vs 1`).
**These are stale-committed-page artifacts, not real defects.** The committed
`content/standards/*.md` files were generated from an older catalog/generator state
and never re-committed. The real `prebuild` regenerates them first
(`build-cat1-standard-pages`, `build-standards-pages`, …), so by the time
`firewall-cert-lint` and `design-lint` run they pass:

```
build-standards-pages: wrote 15 row pages + index; 1 firm cells across 1 rows.
firm-value integrity OK: 1 firm value(s) == 1 published cell(s)
firewall-cert-lint: OK … method-drift-lint: OK
npm run prebuild → exit 0
```

Vercel `buildCommand` is `npm run build` (which runs `prebuild`), so the deploy is
**not** blocked and the live site renders the current, correct standards pages.

The only real issue is repo hygiene: ~19 committed `content/standards/*.md` pages are
out of sync with their generators (a `git diff` appears the moment anyone runs
`prebuild`). Low priority. The clean fix is a regenerate-and-commit pass over
`content/standards/` on its own commit — deliberately out of scope for the analyte
pilot, which touches only `content/analytes/`, the analyte data, the generator, and
the nav.

## 2026-08-08 — briefings up-to-dateness audit: taxonomy-count drift vs published manual (Karen's call)

Full audit of all 11 briefings (`data/briefings/*.md` + `featured/`). `hmtc-primer`
read in full; the rest swept for the high-risk staleness vectors (methodology
framework language, percentile framing, category/metal/analyte counts, banned
superlatives, non-profit misstatements, entity naming).

**Clean bill — current and internally consistent:**
- Methodology matches Method v2.0 (government-limit default; Tier-1 "stricter-of"
  occurrence; P97/P45). No stale P90/P10/80th-percentile/"30 percent" framing anywhere.
- 8 metals / 10 analytes; Tier 1 = Pb, Cd, iAs, MeHg; Tier 2 = Ni, Sn, Al, Cr-VI;
  statuses A–E; 150% Tier-2 allowance — all correct and consistent across briefings.
- No banned superlatives ("first and only", etc.). The only "nonprofit" strings refer
  to the Non-GMO Project (a factual historical reference), not to ICS/HMTc.
- Entity naming, DOI (`zenodo.20270512` = 2026 Edition), USPTO serial, ISO 17025 —
  consistent and unchanged.

**One systematic staleness finding — awaiting Karen's decision (deliberately NOT auto-fixed):**
Three briefings state a **"23-category framework"** —
`data/briefings/hmtc-primer.md:17`, `after-palmquist.md:63`,
`defense-counsel-briefing.md:47` — and `hmtc-primer.md:23` alone states Category 1 has
**"Fifteen specific product chapters."**

The current canonical taxonomy
(`heavy-metal-index/data/taxonomy/hmtc-v2.json`, v2.2 dated 2026-06-09) has **35
categories** and recut **Category 1 to 9 subcategories.**

Not auto-corrected because these figures match the **published, DOI'd 2026 Program
Manual** (`zenodo.20270512`), which the primer names as "the controlling text."
Flipping the briefings to 35/9 while the cited manual says 23/15 would make these
defense-counsel documents contradict their own controlling source — the exact attack
surface they are written to avoid. Reconciliation is a positioning + manual-versioning
call for Karen:
- (a) update the published manual's framework scope, then propagate 23→35 and 15→9; or
- (b) reframe to version-proof phrasing ("a multi-category framework, infant and child
  food first") that pins no number — removes the maintenance liability entirely; or
- (c) leave as-is (conservative understatement; not a false claim).

Recommendation: (b) for the framework count; hold 15→9 for the Cat-1 chapters until the
9-subcategory web edition of the manual ships. Everything else in the briefings is
current.

**Resolved 2026-08-08 (option b), per Karen's delegation.** All three briefings reworded
to "a planned multi-category framework" and the primer's chapter count dropped ("the
product-subcategory chapters …") — accurate, non-contradicting, maintenance-free. Source
+ generated `content/briefings/` updated via `import-briefings`. **Still open:** the three
briefing PDFs (`hmtc-primer`, `after-palmquist`, `defense-counsel-briefing`) were NOT
regenerated — that needs `npm i -D @react-pdf/renderer` + `build-briefing-pdf.mjs`, which
is risky here (cert `node_modules` is symlinked to the index's, and the repo has parallel
WIP). Regenerate those three PDFs in a clean pass so the downloads match the pages.

## 2026-08-14 — Cat 26 tin (Sn) Q3D PDE anchor corrupted in all 5 compiled records (FIXED)

Surfaced by the Cat 26 number-derivation analysis (see
`docs/methodology/2026-08-14-cat26-number-derivation.md`). The tin toxicological
escalation anchor `tox_anchor.pde_ug_day` in `data/standards/cat26-compiled/*.json` was
wrong in every file — `6400` (parenteral ×3), `64000` (`sarms-oral`), `64`
(`peptides-nasal-sublingual`) — none matching any ICH Q3D(R2) value. Correct route values
are parenteral **600**, oral **6000**, inhalation/mucosal **60** µg/day (the class-3
10× oral:parenteral:inhalation cascade).

Why no lint caught it: the anchor is an **internal escalation flag** — tin renders as
`control`, so no product-content number is published and no page output depends on it.
The corrupt value silently made the tin investigation trigger ~10× too lenient (implied
Sn intake compared against 6400/64000 instead of 600/6000). Every other Cat 26 anchor
verified correct against Q3D(R2) for its route; `Cd`=2 mucosal and `Cr-VI`=3 are
deliberate conservative `min()` choices, not errors.

**Fixed** in a dedicated commit (route-appropriate values, cert-side only). **Still open:**
the identical corruption exists in the `heavy-metal-index` compiled source (the one-way
index→cert copy origin, currently on the `codex/methodology-sync` dead-lane) and should be
reconciled there separately so a future re-copy does not re-introduce it.
