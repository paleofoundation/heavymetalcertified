# AGENTS.md — how any session must build pages on this site

This repo builds **heavymetalcertified.com**. Its visual system is not a matter of
taste per session; it is a **fixed canon** that lives in [`docs/design-canon/`](docs/design-canon/).
Read this file before touching any page's presentation. It exists because the same
design drift has happened repeatedly, and the cause is always the same: a session
re-derives the look by eyeballing one existing page instead of building to the canon,
then verifies by reading its own SCSS instead of the rendered result.

## 1. The canon is authoritative — port it, do not re-derive it

The design specification is [`docs/design-canon/`](docs/design-canon/):

- `COMPONENTS.md` — the component vocabulary (the exact spec for tables, citation
  markers, reference rows, findings rows, grids, callouts, captions). **This is the
  answer for "how should this data look."**
- `CHROME-SPEC.md` — header, hero band, three-column shell, rails, footer.
- `CONTENT-RULES.md` — which content maps to which component, the three-tier scope,
  and how to object. Read §2 (the mapping table) and §5 (division of authority).
- `FIDELITY.md` — why design keeps not landing, and the gate that fixes it. Read it.
- `heroBand.scss`, `HeroBand.tsx` — verbatim source to port, not to reinterpret.
- `v3-acceptance.json` — the index's computed-style assertions (reference form).

**When a page needs a treatment, find the component in `COMPONENTS.md` and port its
exact values.** Do not copy another content page and adjust by eye — that only ever
converges on "the old build wearing new colours" (`COMPONENTS.md` opening; the
chocolate-article references drifted this exact way in Aug 2026).

## 2. Verify by the RENDERED page, never by source-reading

This is the load-bearing rule (`FIDELITY.md`). Reading your own SCSS back and reporting
conformance is the failure mode: the source is correct, an older rule wins in the
cascade, and the browser disagrees. So:

- **Run `npm run check:v3` and report its exit code.** Do not claim a page matches the
  canon until it passes. "I checked the CSS" is not a pass; the gate is.
- When you change any page's presentation, **add or update its assertions** in
  `design/v3-acceptance.cert.json` (including `absent: true` for markup you removed).
- **Delete the losing rule; do not out-specify it.** If a fix takes the form "add a more
  specific selector," it is the wrong fix — find the old rule and remove it
  (`FIDELITY.md` §1). Quartz emits component CSS after `custom.scss`, so old rules win on
  equal specificity.

## 3. Cert palette (this site, not the Index)

The canon was authored against the Index (`#8b2a4a` accent). **This site substitutes the
HMTc palette** — do not copy the Index hex values:

- Accent / burgundy: **`#9f2727`** (`--secondary`; dark-mode `#e08a8a`)
- Paper: `#fffdfb` · Footer ground: `#4a1526` · Line: `#e8e1db`
- Type: **Lora** (headings/titles), **IBM Plex Mono** (labels, stamps, measured values),
  system sans (body). Measured values are mono; a number inside a prose sentence is a
  defect, not a style choice (`COMPONENTS.md` atom).

## 4. Authority (from `CONTENT-RULES.md` §5)

- **Design owns** the visual system, component vocabulary, and information architecture.
  When "how it looks" is in question, the canon wins and this build changes.
- **This session owns** function, build integrity, data availability, accessibility, and
  what is safely shippable in one commit. When "whether it works" is in question, you win.
- **Unmapped Tier-1 content** (evidence with no canon component) is a genuine gap:
  do not silently keep old styling — log an objection to `docs/findings.md` (§4 format)
  and leave the element untouched.

## 5. Briefings and research articles are the same document class

`content/briefings/` (program positioning) and `content/articles/` (research coverage of
Index findings) share **one** format and **one** apparatus: hero band, snapshot,
connections, `sup.cite` citations → `#ref-N`, the canonical reference rows, a
`scholar_eligible`/`scholar_pdf` PDF, and a **Download PDF button**. Both link one-way to
heavymetalindex.com and never the reverse (Part 2 firewall; `tools/firewall-cert-lint.mjs`
enforces it). Do not fork their styling or their PDF handling.

## 6. Deploy posture

Pushing to `main` **auto-deploys to production**. Never report a page live until it is
both pushed *and* `check:v3` passes. A page that only exists in a local build (as the
briefing PDFs did) is not live.
