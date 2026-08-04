# SITEWIDE — the three moves, in order

Entry point. Read this first, then `COMPONENTS.md`. `METHOD.md` is the method,
`CONTENT-RULES.md` is the mapping and the objection channel, `FIDELITY.md` is the gate.

Everything before now has been one surface at a time — hero, header, rail. That
approach cannot go sitewide, because each surface re-litigates the same cascade
fight and each result is verified by judgement. Three moves fix that. They are
strictly ordered: **1 makes 2 meaningful, 2 makes 3 verifiable.** Do not start 3
before 1 and 2 have landed.

Each move below is a task prompt in the `METHOD.md` §6 shape — branch, scope fence,
deletion, addition, gate. Paste one at a time.

**Standing constraints, all three moves:**
- `git.deploymentEnabled` is `false` in `vercel.json`. Nothing auto-deploys. End every
  move with an explicit preview deploy and look at it before promoting.
- Do not touch `wiki/**`, `data/**`, or `raw/**`.
- Report findings outside the scope fence rather than silently fixing them.
- The ~32 emitted body sections are **out of scope for all three moves.** They
  regenerate every build (`METHOD.md` §3). They are F-16, a separate project. If a
  move appears to require them, stop and log it.

---

---

## Where this stands — end of session, 2026-08-01

**Landed:** cascade layer + deletion ledger (f3e8140c0) · sitewide gate, scope buckets
(c91930d9f) · burgundy assertion corrected (db4a9f030) · References made conditional
(08763baeb) · `.hmi-product-brief` flattened, gradient assertion green (eba183fb3) ·
mega-menu left rail (c22cd3bc1) · 254px horizontal overflow fixed and asserted
(c00926f4c). Branch `feat/v3-mega-menu`. Gate: chrome 251/265, f16 7/26.

**Golden pages now in the artifact** — `metal` (15 blocks) and `ingredient` (10), both
built from the live page with repo data, plus the three index screens. These are literal
diff targets, not mockups. `regulation`, `source`, `product`, `finding` still render
invented content and are NOT yet golden.

**Next, in order:** mega-menu Cross-cuts + the Foods/ingredients naming → breadcrumb
duplication and the `METAL PROFILE` badge on `/metals` (one fix: type badge inherits page
kind instead of screen type) → redeploy and verify at 1280 and 1440 → ingredient body,
contamination profile first.

**Sequence by data availability, not by page.** The two golden pages are not equivalent
work: the ingredient components read `contamination_profile` / `contamination.json`
(229 records) and can be built today; the metal components mostly restructure prose and
need extraction first. `regulation` needs `limit_value` parsed into (value, unit, basis)
before any chart or timeline can render — that is evidence work, scoped separately.

---

## MOVE 1 — one cascade order, and the losers deleted

**The problem this solves.** Quartz emits component CSS *after* `custom.scss`, so
component stylesheets win on equal specificity against the design layer (F-18). Every
fidelity fix so far has been a specificity patch on top of that, which leaves both
rules alive. Until the order is settled, any sitewide rule decays into a patch the
first time a component stylesheet disagrees with it. **This move ships no new visual
work.** Its output is a build where the design layer can win by being correct.

**Branch:** `fix/cascade-order`

**Scope:** `quartz/styles/**`, the Quartz CSS emission path, `vercel.json` untouched.

**Delete first** — the ledger from `METHOD.md` §1, all in this one commit:

| Delete | Where |
|---|---|
| the whole `.hero-*` run | `quartz/styles/proof-design.scss` ~251–285, from `/* ── microbiomemedicine-style hero band ── */` through its `@media (max-width: 1080px)` tail |
| `999px` radius on the shared input class | `quartz/styles/search.scss` |
| `text-transform` on the corpus-ledger label cell | wherever it still applies |
| the three provenance cards | `Rail()` — "Researched by", "Page Snapshot", "Page provenance" are *replaced*, not supplemented |

**Then the root fix.** Establish one explicit order — a cascade layer declaration, or
a deterministic emission order in the Quartz build. Either is acceptable; pick the one
that is fewer moving parts in this repo and say which you picked and why. The
requirement is that it is declared in **one place** and that a new component stylesheet
cannot silently outrank the design layer by existing.

**Do not** convert any value to a CSS custom property while doing this. Token renaming
mid-flight makes the diff unreadable (`METHOD.md` §4).

**Gate.** After the deletions, `npm run check:v3` must still exit 0 on the hero — and
the three `absent: true` assertions (`.hero-glyph`, `.hero-pill`, `.hero-right`) must
be passing because the markup is *gone*, not restyled. Paste the output.

**Report:** which mechanism you chose for the ordering, and any rule you found that was
only surviving because of the old order.

---

## MOVE 2 — the gate goes sitewide

**The problem this solves.** `v3-acceptance.json` is hero-shaped. A sitewide design
system needs sitewide assertions, or "conforms to v3" goes back to being an opinion on
every page that isn't the hero. This move writes no CSS either. It makes the next move
checkable.

**Branch:** `test/acceptance-sitewide`

**Scope:** `v3-acceptance.json`, the `check:v3` script, `package.json`. No `quartz/`
changes — if an assertion fails, that is the *finding*, not a thing to fix here.

**Addition.** Extend the spec to one entry per surface in the screen map:

```
/                          home
/metals/lead               metal detail
/ingredients/<slug>        ingredient detail
/products/<slug>           product detail
/regulations/<slug>        regulation detail
/sources/<slug>            source record
/search                    search
```

Per surface, assert the chrome that is supposed to be identical everywhere — this is
what "sitewide" actually means, and it is where drift is invisible today:

```
header    height 68px · background #fffdfb · border-bottom 1px #e8e1db
wordmark  Lora 22px #8b2a4a · letter-spacing -0.015em
section   h2 Lora 30px #2b1f24 · border-bottom 1px #e8e1db · padding-bottom 10px
body      16.5px · line-height 1.78 · #3f3a3f
footer    background #4a1526 · color rgba(255,255,255,0.76)
link      #1c43ad
radii     2–3px everywhere · no box-shadow outside modals · no gradient anywhere
```

Assertion shape, unchanged from the existing file — cite the v3 line for every value:

```json
{ "sel": ".hero-act", "prop": "border-radius", "want": "2px", "v3": 1420 }
{ "sel": ".hero-glyph", "absent": true }
```

Add four **negative sitewide assertions**, checked on every surface. They are cheap
and they catch the class of regression that specificity patches produce:

- no element has a `box-shadow` outside a modal or the source drawer
- no element has a `background-image: linear-gradient(...)`
- no burgundy other than `#8b2a4a` / `#6f2139` / `#571a2c` / `#4a1526` appears as a
  computed colour (`#9a2852` shipped in `middleware.ts` for months)
- **every distinct scorecard grade computes to a distinct treatment**, and `NOT-READY` /
  `flag` are the solid-burgundy pair. Fails both when `NOT-READY` renders like `OK` and
  when two grades collapse into each other — a plain colour-value check is gameable, and
  a false green on a standards-readiness audit is the worst failure this site can ship.
  **Write it when the scorecard is built, not before** — an assertion for a component that
  does not exist is the same no-op as the claim underline.
- **no computed `border-radius` above 3px**, with one exemption: `50%` on an element
  whose width is ≤16px (the timeline dots, `COMPONENTS.md` §5). This is the assertion
  the 20 surviving `999px` rules belong to — reporting them rather than sweeping them
  was right; the pill is a sitewide property, not eleven local bugs.

**`absent: true` is the important half.** A change that adds v3's markup while leaving
the old markup alive looks complete in a diff and renders as the old build.

### Scope, and what the exit code is allowed to mean

Assertions covering the ~32 emitted body sections are real and must stay in the file —
but they are F-16, and this project cannot fix them. They must not gate.

**Do not use a boolean `f16: true` flag.** A flag that removes a failure from the report
produces the exact thing the gate exists to prevent: something that looks complete and
isn't. Use a **scope** field instead, and make the runner *always print both buckets*:

```json
{ "sel": "...", "prop": "...", "want": "...", "v3": 0, "scope": "chrome" }
{ "sel": "...", "prop": "...", "want": "...", "v3": 0, "scope": "f16" }
```

Default `scope` is `chrome`. The summary line is mandatory on every run, pass or fail:

```
chrome   38/38 pass   ✓ gating
f16       0/20 pass   ✗ not gating — 20 known gaps
```

Exit code reflects **`chrome` only.** Two properties follow, and both matter:

- "unfinished until it exits 0" recovers its meaning for the work that is in scope.
- The f16 count is never suppressed, so a green gate can never be misread as "v3
  landed." It reads as "the chrome is right and 20 body sections are still missing."

That count is also the F-16 backlog metric — when that project starts, it burns down in
public. **An assertion may not move from `f16` to `chrome` except by F-16 landing it,**
and moving one between scopes follows the same rule as loosening one: separate commit,
with justification.

**Gate.** Run it. **It is expected to fail** — that is the deliverable. Paste the full
failure list as `selector · prop · want · got`, grouped by surface and by scope. Do not
fix anything in this branch, and do not loosen an assertion to make it pass. If an
assertion is genuinely wrong, change it in a **separate commit** with the v3 line
number as justification.

**Report:** the failure list is the sitewide work queue. It replaces "which pages look
off."

---

## MOVE 3 — build from the vocabulary, one component across all pages

**The problem this solves.** Moves 1 and 2 get correct values rendering the old
structure. Only this move produces reorganization. v3 is an information architecture,
not a stylesheet — the unit of work is **the component, not the page.**

**Branch:** one per component, `feat/v3-<component>`.

**Scope:** `quartz/components/**`, `quartz/styles/**`. Not the emitter.

**Order — leverage descending** (`COMPONENTS.md` §How to codify):

1. ~~burgundy-header table~~ *(landed, 788b6fde1)*
2. ~~claim underline~~ — **deferred. OBJECTION 1 upheld.** There is no `data-claim` to
   match, so the rule is correct and inert. It re-enters the queue only after
   `claims.jsonl` is populated against `claim.schema.json` and a generator emits the
   spans — that chain starts in evidence work, not here. The CSS is last in it, not first.
3. **citation marker + source drawer** — now first. The affordance that defines the product.
4. **caption + caveat callout** — both have a second variant, see `COMPONENTS.md` §9–10.
5. **grid-of-records** — replaces bulleted registries
6. chart / timeline / anchor panel / findings row → **F-16, stop and log**

**Per component, the loop** (`CONTENT-RULES.md` §3): name the tier → name the layer →
name the repo field that feeds it → delete the old presentation in the same commit →
add assertions including `absent: true` → paste the exit code.

**The two rules that matter more than the specs:**

- **Map by function, not by name.** v3 almost never shares a label with the current
  build. `Quick read` does not exist in v3 — the block's *job* is stating the page's
  conclusion once, up front, which is the **assertion block**. Do not search v3 for a
  label; ask what job the block does for a reader.
- **Unmapped content is a question, not a default.** No v3 component for the job → do
  not keep the old styling silently. File it in the objection format
  (`CONTENT-RULES.md` §4) in `docs/findings.md` and surface it in your reply.

**Authority, so nothing stalls** (`CONTENT-RULES.md` §5): grounds **A** (function),
**B** (data), **C** (layer) are **yours — decide and keep moving.** Ground **D**
(unmapped) and any Tier 1 objection come back to design; leave that element untouched,
log it, continue the batch.

**One component across many pages beats one page across many components.** Do not
perfect `/metals/lead` and then start again on `/ingredients/rice` — that is the
diffing habit wearing new clothes.

**Gate.** Per component: `npm run check:v3` exits 0, output pasted, objections listed.

---

## Failure signatures — stop and re-read

- A fix described as "increased specificity" or "added `!important`" → Move 1 did not
  land, or landed and was undone.
- "Matches v3" with no exit code → Move 2 exists precisely to make this unnecessary.
- Conformance reported from reading a `.scss` file → source-reading cannot detect a
  cascade loss.
- Work described as *which CSS values differ* rather than *which component this data
  belongs in* → a diff converges on the old build in new colours; it cannot produce
  reorganization.
- A measured value sitting inside a prose sentence → the dotted key–value row exists
  for exactly this.
- A body-copy section being hand-edited in `wiki/**` → it regenerates. F-16.
- A new CSS custom property appearing during any of these three moves → not now.
