# Outstanding ledger

Human-gated decisions and findings that a build cannot resolve on its own. No
`tools/outstanding/log.mjs` exists yet, so entries are recorded here as inline
`OUTSTANDING` sentinels (greppable by the `OUTSTANDING` token).

> This ledger receives entries from more than one branch. The remediation
> reconciliation (`claude/remediation-governance-reconcile`) also adds an entry
> here; on integration the entries union (keep one header, concatenate blocks).

---

<!-- OUTSTANDING
id: home-hero-motif-reframe
repo: cert
scope_class: human-gated
type: decision
opened: 2026-08-13
branch: claude/brand-journey-hero-preview
owner: Karen Pendergrass
title: Promote — or decline — the control-led homepage hero reframe
-->

## OUTSTANDING · homepage hero motif (decision)

- **repo:** cert
- **scope_class:** human-gated
- **type:** decision
- **opened:** 2026-08-13
- **branch:** `claude/brand-journey-hero-preview`
- **owner:** Karen

**What it is.** A hero-motif change — a brand-identity fork, genuinely Karen's
call — built and previewed but **not promoted**. It demotes *"World's Strictest
Heavy-Metal Certification for the Big 8"* from the emotional lead to a
substantiation line, and leads instead with control / privacy / predictability:
*"Find out where your products stand before the market makes you."* "Strictest"
survives as a defensible substantiation line (the strictest applicable government
floor, tightened, never loosened — cert-only per program marketing policy). The
hero snapshot box is reframed from stale counts to what the reconciled journey
delivers: *See the standard → Before you test · What you learn → Stays yours ·
The decision → Rule-based · Consequences → Known in advance · If limits tighten →
Grandfathered.*

**Where.** Branch `claude/brand-journey-hero-preview`, built on top of the
reconciliation branch `claude/brand-journey-reconcile`. The reconciliation work
does **not** depend on the reframe — it can merge on its own, keeping the current
"World's Strictest" lead. Only the preview branch carries the new motif.

**Decision needed (Karen's).** Promote the reframe (merge the hero change to the
live homepage) or keep the current lead. Chrome is untouched, so the homepage
`check:v3` assertions hold either way.
<!-- /OUTSTANDING -->

<!-- OUTSTANDING
id: brand-journey-live-claims-reconciled
repo: cert
scope_class: human-gated
type: finding
opened: 2026-08-13
branch: claude/brand-journey-reconcile
owner: Karen Pendergrass
title: Live claims removed or weakened by the honest brand-journey reconciliation
-->

## OUTSTANDING · live claims changed by the reconciliation (finding batch)

- **repo:** cert
- **scope_class:** human-gated
- **type:** finding
- **opened:** 2026-08-13
- **branch:** `claude/brand-journey-reconcile`
- **owner:** Karen

The brand-journey reconciliation removed or weakened claims that are **live on the
site today**. Each is now traced to a ratified rule; this is the list so the change
is visible, not silent.

**A · Pricing — the panel is no longer "included."** `content/apply.md` listed
*"Ten-analyte panel, per product form — included"* under *What the fee covers*.
Removed. Laboratory testing is a **separate, un-marked-up pass-through paid
directly to the accredited lab** — Program Manual Part 4 ("at the brand's
expense"), Part 5.6 licensing, `hmtc-primer`, `brief-4`, and `mark.md:135` all
agree; apply.md:74 was the lone outlier. Propagated to apply.md (fee section +
new cost-architecture block) and the `index.md` pricing FAQ. **A brand that reads
"included" today will read "separate pass-through" after this — the single most
noticeable change.**

**B · Category openness — "15 subcategories open" is gone.** The site framed
standards as *open* / *open for application*: `apply.md` snapshot "Subcategories
open: 15", `index.md` FAQ "Fifteen … locked … eligible the moment a standard
exists", `verify.md` snapshot "Standards available: 15". Reconciled to the honest
distinction: a **published standard lets a brand begin (Private Readiness); it is
not a category being open for certification.** The new `/category-readiness` map,
driven from the real on-disk standards data, shows **zero categories open**; only
1/3/6/9 (+ partial 34) have published standards (→ Private Readiness), and
24/30/31/32/33 are `standard-in-development` (→ Evidence review). *Note: the task's
assumed "LIVE" set included 24/30/34, which in fact carry 0–1 firm analytes.*

**C · Stale counts — flagged, not fully fixed.** Standard/limit counts are stale
and inconsistent across surfaces: homepage snapshot "12 / 3 firm", register
"15 / 1 firm", `program/structure` "15 across 8 categories" — versus ~37 published
`standard` pages on disk with 100+ firm cells (Cat 3 alone = 120). The
reconciliation removed the misleading "open: 15" but did **not** rewrite every
count (out of scope; the standards register is a build-blocking surface). Follow-up:
the **single-source-counts refactor** the `/category-readiness` page prescribes —
homepage / register / apply / portal should consume one generated readiness object.
(The homepage snapshot 12/3 still shows on the reconciliation branch; the hero
preview replaces that box entirely.)

**D · Superlatives — kept, basis noted.** "World's Strictest" is retained as
substantiation per policy. `index.md`'s *"the only food certification worldwide
that sets a published limit for all eight metals"* is unchanged but rests on an
uncited competitor comparison — flagged so the substantiation basis is a conscious
choice, not an oversight.

**E · Deferred — the interactive Private Readiness self-check.** The browser-only
`BrandReadinessCheck` component from the reverted branch was **not** ported this
pass: it is gated to a `/readiness` slug that the minimize-surface rule disallowed,
and porting it means generalizing the slug gate and shipping client TSX onto a live
deploy. The concept is served by `/category-readiness` and apply.md's Private
Readiness framing; port the widget onto `/apply` later if the interactive
self-assessment is wanted.

**Not human-gated, informational.** `check:v3` requires Playwright (a repo setup
step, `npm i -D playwright`), which is not installed in this environment; it was
not run here. My changes touch none of its asserted selectors (the five asserted
pages are unchanged in the properties it checks), and the canonical `#9f2727`
table head + no-bold were verified directly on the new pages via computed styles.
Run `npm run build && npm run check:v3` in the standard environment as the final
gate.
<!-- /OUTSTANDING -->
