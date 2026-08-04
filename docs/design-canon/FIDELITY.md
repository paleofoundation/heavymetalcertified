# Why v3 keeps not landing — and the gate that fixes it

## The failure mode

Claude Code edits SCSS, reads the new values back out of its own source, and
reports conformance. The browser disagrees, because the old rules are still
alive and still winning. Three confirmed instances in one session:

- `heroBand.scss` never shipped at all
- `search.scss`'s `999px` pill beat the hero search bar's `3px`
- the corpus-ledger labels stayed uppercase

All three were "fixed" by raising specificity, which leaves both rules in the
cascade and guarantees the next component stylesheet does it again.

**Verification by source-reading cannot catch this.** The source is correct.
The render is wrong.

## Two changes

### 1. Delete, don't out-specify

The `.hero-*` run in `quartz/styles/proof-design.scss` (~251–285, from
`/* ── microbiomemedicine-style hero band ── */` through its
`@media (max-width: 1080px)` tail) must be **removed**. Same for any old rule a
new component stylesheet is fighting. If a fix takes the form "add a more
specific selector," it is the wrong fix — find the losing rule and delete it.

Then fix the ordering at the root, per finding F-18: Quartz emits component CSS
after `custom.scss`, so components silently override the design layer on equal
specificity. A cascade layer or an explicit emission order fixes it once. A
fourth specificity patch fixes nothing.

### 2. Make fidelity a failing test, not an opinion

`v3-acceptance.json` lists ~25 computed-style assertions read off the v3
artifact at cited lines. Run them against the **rendered** page in a headless
browser and exit non-zero on mismatch.

Three of them are the ones that have been silently failing all along:

- `.hero-act { border-radius: 2px }` — reads `7px` or `999px` if the old pill
  rules are live
- `.hero-glyph` must be **absent** — not restyled, gone
- `.hero-snapshot { border-radius: 0 }` — the old card was `12px`

`absent: true` assertions are the important half. A redesign that *adds* v3's
markup while leaving the old markup in place looks finished in a diff and
renders as the old build.

## How to run it

Any headless browser the repo already has. If there is none:

```
npx --yes playwright@latest install chromium
```

Then a ~40-line script: for each page, `goto`, then for each assertion
`getComputedStyle(document.querySelector(sel))[prop]`, normalize `rgb()` to hex,
compare with 1px tolerance, collect failures, print them as
`selector · prop · want · got`, exit 1 if any.

Wire it as `npm run check:v3`. Do not report a surface as matching v3 until it
passes.

## The principle

Every gate this repo has responded to was mechanical — the DOI gate, the
wiki-edit audit barrier, the idempotency guard, the n_studies signature. Each one
replaced "I checked" with "it passes." Design fidelity is the last thing still
being verified by judgement, and it is the one that has failed most often.
