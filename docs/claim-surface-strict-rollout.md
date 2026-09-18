# WARN → STRICT rollout — claim-surface empty cells (ORDER S-DOI-FORCE-1)

This is the fail list for flipping `standard-readiness-lint` from honest classification
to a corpus-wide `--strict-corpus` fail. **subsumed / monitored / control / not-material
with `value: null` is EMPTY, never COMPLETE.** Reflex speciation does not blank a claim.

## What is already fail-closed (prebuild)

`package.json` `prebuild` runs:

```
node tools/standard-readiness-lint.mjs --strict
node tools/claim-surface-lint.mjs
```

`--strict` (not `--strict-corpus`) fails the build when any of these hold:

1. A **rice / infant-cereal canary** (`*rice*` except `*non-rice*`, `baby-cereals-dry`,
   baby-cereal rice variants) has an empty claim-surface cell or non-numeric iAs.
2. A standard is marked **ready** but is not COMPLETE (impossible state).
3. A page **claims full completeness** ("Every analyte carries a firm ceiling") while
   a claim-surface analyte is empty.

`claim-surface-lint.mjs` fails the same canary, plus sitewide `7/8` and
`N/M analytes with a published limit` headers where N is below the required
claim-surface panel (8 totals; 9 on rice / infant cereal).

Totals-only culinary oils (`olive-oil`, `cooking-oils-other`) are also
fail-closed: the eight totals must be numeric on the Master Limit Table;
iAs/MeHg must be omitted or numeric ≤ parent (never bounded/monitored/blank);
any published species > parent total fails. See `docs/S-DOI-OLIVE-1.md`.

`tools/mint-dois.mjs` refuses claim-surface FAIL. `--include-incomplete` cannot
override that. **No DOI is minted by this change.**

## Claim-surface panel (PANEL-CLAIM-1)

Always numeric: **Pb, tAs, Cd, tHg, Ni, Sn, Al, Cr**.

Species numeric when they define a pathway or a species-only ML.
Rice / infant cereal: **iAs is mandatory numeric**.

## Destination

```
node tools/standard-readiness-lint.mjs --strict-corpus
node tools/claim-surface-lint.mjs --strict-corpus
```

That pair fails every remaining empty cell in
`data/standards/claim-surface-fail-list.json`. Do not flip until that file is empty
(or each leftover row has a disclosed numeric ceiling on the cell itself).

## How to regenerate the fail list

```
node tools/standard-readiness-lint.mjs --strict
```

The lint rewrites `data/standards/readiness-manifest.json` and
`data/standards/claim-surface-fail-list.json`. Counts after MINT-FINISH-ALL-1
(2026-09-18):

| Metric | Count |
|---|---:|
| Compiled standards | 323 |
| COMPLETE (claim-surface numeric) | 265 |
| Incomplete (claim-surface empty) | 58 |
| Empty cells (full panel, incl. species) | 876 |
| Empty claim-surface cells (8 totals ± required iAs) | 174 |
| Rice / infant-cereal canary FAIL | 0 |
| REGISTERED / READY | 4 |

`--strict` (prebuild) **passes**. `--strict-corpus` would fail all 58 incomplete
standards / 876 empty cells. Do not flip until the fail list is empty. Living
SCORECARD: `reports/SCORECARD.md`. True gaps: `docs/HARD-BLOCKERS.md`.

## How to verify

```
node --test tools/tests/claim-surface.test.mjs
node tools/standard-readiness-lint.mjs --strict
node tools/claim-surface-lint.mjs
node tools/mint-dois.mjs --types=standards   # dry-run only; must not mint
```

A rice canary with `iAs: { type: "subsumed", value: null }` must fail both lints
and must not appear in a mint batch.
