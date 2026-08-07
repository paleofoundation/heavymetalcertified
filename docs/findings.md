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
