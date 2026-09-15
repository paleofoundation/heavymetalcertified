# ECOSYSTEM-NAV-1

## Scope and source

Add network wayfinding to the existing HMTc navigation. The homepage hero, primary CTA, certification identity, and existing navigation sections remain unchanged.

The five ecosystem pages adapt the user's Astra ecosystem marketing draft supplied on 15 September 2026. They cover the proof problem, moving failure spend upstream, and the evidence-to-decision chain. The proposed `/join` destination is mapped to the existing `/apply` route.

The work uses an isolated `codex/ecosystem-nav-1` worktree based on main. It does not change the Desktop repository's mint checkout or its uncommitted work.

## Routes

- `/ecosystem`: overview and paper index.
- `/ecosystem/hmi`: public knowledge and government floors.
- `/ecosystem/tecrid`: checkable laboratory evidence and free core trust.
- `/ecosystem/vle`: qualification of bounded lots before reservation or trade.
- `/ecosystem/hmtc`: finished-product certification and separate mark authorization.

The dropdown contains four columns, each with a blurb of at most twenty words and two to four links. It reuses the existing hover, keyboard, touch disclosure, and SPA cleanup behavior.

## Verification

- `npm run build:design-review`
- `npm run check`
- `node tools/design-lint.mjs`
- `node tools/firewall-cert-lint.mjs`
- `npm run check:v3`: 472 rendered assertions.
- `node tools/check-ecosystem-nav.mjs`: thirteen browser scenarios, screenshots, and timing measurements in `output/ecosystem-nav/`.

For deployed checks, set `ECOSYSTEM_BASE_URL` and optionally `ECOSYSTEM_OUTPUT_DIR` before running the ecosystem browser check. Timing records describe observed element visibility, not a general performance guarantee.

## Preview packaging

The existing `postbuild-document-editions.mjs` reads Git history. A Vercel CLI source upload omits that history and fails in the document-edition step. This preview therefore packages the completed local build with `vercel build`, then uses `vercel deploy --prebuilt`. A temporary, ignored local configuration skips installation and reruns design lint while packaging the already-built `public` output. The committed Vercel configuration is unchanged.
