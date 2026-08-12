# Heavy Metal Certified

The standards / certification authority surface for the **Heavy Metal Tested & Certified (HMTc)** program. Deployed at `heavymetalcertified.com` (permanent + indexed).

This is a **separate deploy** from the independent literature index ([heavymetalindex.com](https://heavymetalindex.com)): separate repo, separate `baseUrl`, separate Vercel project. That separation is the firewall invariant. The cert site one-way-cites the index and never imports its corpus — *fork the toolchain, not the content*.

## What's here

| Surface | Path | Source |
|---|---|---|
| **Standards** | `content/standards/` | Generated from `data/standards/hmtc_standards_catalog.json` by `tools/build-standards-pages.mjs` |
| **Standards Briefings** | `content/briefings/` | Imported from `data/briefings/*.md` by `tools/import-briefings.mjs` |
| **Program Structure** | `content/program/` | Hand-written cornerstone (government-limit method, five gates, native basis, versioning) |
| **Articles** | `content/articles/` | HMI-fed, one-way citation |

## Firewall posture

- The cert site **is** where HMTc limits, government-source crosswalks, read-across decisions, and status rules live. The literature index remains contextual and never publishes HMTc compliance values.
- A standards page renders a firm `published_limit_ppb` **only** for an analyte cell the catalog marks `status: published`; everything else shows an honest evidence-state note and the gate that holds it (the two-tier firm / in-development model).
- `tools/firewall-cert-lint.mjs` (build-blocking) guards the inverse risks: no corpus re-hosting, no `citation_journal_title` overclaim, firm values must match the catalog, self-canonical only.
- Standards + briefings are Scholar-eligible as **technical reports**, never journal articles.

## Build

```bash
npm install
npm run build      # prebuild: standards + briefings + firewall lint, then Quartz build -d content -o public
npm run serve      # local dev server
```

## Data sync

`data/standards/hmtc_standards_catalog.json` is a certification-repository publication artifact: every firm initial value must resolve to a sovereign-government maximum or disclosed sovereign read-across, and unregulated exact cells remain `n/m` or in development. `data/briefings/*.md` are certification-site briefing sources. Descriptive occurrence evidence may be refreshed one way from the Heavy Metal Index for context, but it never selects a limit or certification status and never enters the certified-lot Standards Ratchet.

## Governance

The program is independently governed by **The Institute for Contaminant Standards** ([contaminantstandards.com](https://contaminantstandards.com)).
