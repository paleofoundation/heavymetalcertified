# METHOD — how to reproduce the v3 design work in the repo

Three files, three jobs. `FIDELITY.md` is the **gate** (catches drift after the fact).
This file is the **method** (prevents it). `COMPONENTS.md` is the **vocabulary** — v3's
data-presentation components, which is what actually gets built. Read all three before
touching `quartz/`.

**If you read only one thing, read `COMPONENTS.md`.** v3 is an information architecture,
not a stylesheet. The value system in §4 below is necessary and insufficient: it lets you
match v3's colours while still rendering the old build's structure. The components are
the work.

---

## 0. The diagnosis, stated plainly

The design artifact (`Heavy Metal Index v3.dc.html`) looks unified for one reason
that has nothing to do with taste: **it is a closed system with no competing sources
of truth.** Every value is written inline at the element. Nothing loads before it.
Nothing regenerates under it. There is no cascade to lose.

The repo is the opposite: `custom.scss`, `proof-design.scss`, per-component SCSS,
and a static-site generator that rewrites 11 page bodies on every build. Four
sources of truth, resolved at three different times (author time, build time,
cascade time).

So the repo work is **harder than the design work was**, and the failures so far
are not competence failures. They are failures of a specific method. Three habits
fix them.

---

## 1. Delete, don't out-specify

Restated from `FIDELITY.md` because it is the single highest-value rule.

Every confirmed fidelity miss so far was "fixed" by adding a more specific
selector. That leaves both rules alive and guarantees the next stylesheet does it
again. `search.scss`'s `999px` pill beat the hero's `3px`; the answer was never a
fourth specificity patch.

**Rule:** if a fix takes the form *add a more specific selector*, it is the wrong
fix. Find the losing rule and delete it.

**Guard — verify the target is actually a predecessor.** The ledger below is a
hypothesis written from the design side; it can name a rule that is not the one in the
way. Before deleting, check what currently matches the selector in the built site. If
it has live matches that the new component does not replace, it is not a predecessor —
report it and leave it. `_legacy-all.scss:242–258` looked like the claim underline's
ancestor and is in fact the live citation anchor style on 1,494 anchors in
`metals/lead`; deleting it would have been a regression executed with confidence.
"Delete, don't out-specify" is a rule about *how* to remove the right rule, never a
licence to remove a rule that hasn't been confirmed as the wrong one.

### Deletion ledger

Before writing any new component style, delete its predecessor. Nothing lands
until the old rule is gone in the same commit.

| New surface | Delete first |
|---|---|
| `heroBand.scss` | the `.hero-*` run in `proof-design.scss` (~251–285, from `/* ── microbiomemedicine-style hero band ── */` through its `@media (max-width: 1080px)` tail) — every `.hero-band`, `.hero-wrap`, `.hero-left`, `.hero-glyph`, `.hero-center`, `.hero-crumb`, `.hero-title`, `.hero-desc`, `.hero-actions`, `.hero-pill`, `.hero-right`, `.hero-researched*`, `.hero-author`, `.hero-orcid`, `.hero-updated`, `.hero-snapshot*` |
| hero search bar | `search.scss`'s `999px` radius on the shared input class |
| corpus ledger labels | whatever still applies `text-transform` to the ledger label cell |
| rail blocks | the three provenance cards currently in `Rail()` — "Researched by", "Page Snapshot", "Page provenance" — are *replaced*, not supplemented |

Then fix the root cause once, per **F-18**: Quartz emits component CSS *after*
`custom.scss`, so components silently win on equal specificity. One cascade layer
or one explicit emission order settles it permanently.

---

## 2. Verify in the DOM, not in the source

The recurring report — "conforms to v3" while the browser shows the old build —
comes from reading SCSS back and believing it. The source *was* correct. The
render was wrong. **Source-reading cannot detect a cascade loss.**

`npm run check:v3` (spec in `v3-acceptance.json`) is the only acceptable evidence.
Rules for using it:

- **`absent: true` assertions are the important half.** A change that *adds* v3's
  markup while leaving the old markup in place looks complete in a diff and renders
  as the old build. `.hero-glyph`, `.hero-pill`, `.hero-right` must be **gone**.
- **Never report a surface as matching v3 until it passes.** Not "I believe it
  matches" — the exit code.
- If an assertion is wrong, change the assertion in a separate commit with the v3
  line number as justification. Never loosen it to make a build pass.

---

## 3. Know which layer owns the thing you are changing

This is where the last session lost the most time. Three layers, three different
kinds of work:

**Chrome — components.** Header, footer, hero, rail, nav. Pure `quartz/components/**`.
Editable by hand, verifiable by `check:v3`, shippable today.

**Body content — the generator.** The ~32 interior sections across the 11 detail
screens (`How it enters food`, `Regulatory timeline`, `Where this page is thin`, the
graded-findings grid, the anchor-dataset blocks). These **regenerate every build**.
No amount of component work changes them; edit the output and the next build
reverts it. This is **F-16**, an emitter/generator task, and it is a different
project from the component work.

**Content — off limits.** `wiki/**`, `data/**`, `raw/**`. The redesign changes
components and tokens only. Critical information lives in frontmatter and the
evidence tree.

Before starting any block, say out loud which layer it is in. If the answer is
"generator", stop and schedule it as F-16 rather than trying to reach it from a
component.

---

## 4. The closed value system

**Necessary, not sufficient — see `COMPONENTS.md` first.** These are the values a
component is built *from*; they do not tell you what to build. A page can pass every
assertion here and still present its data as prose.

Copy these verbatim. Every value below is read off `Heavy Metal Index v3.dc.html`.
Where the repo currently differs, the repo is wrong.

```
burgundy       #8b2a4a      pressed  #6f2139     deep  #571a2c    footer  #4a1526
page bg        #faf7f4      card     #fffdfb     blush #fbf5f7    tint    #f6ecf0
rule           #e8e1db      pink rule #eddfe4    strong rule #cfc4c6
ink display    #2b1f24      ink body #3f3a3f     muted #736b6e    faint   #a9a1a2
callout ink    #5a4148      link     #1c43ad     claim underline #cbb4bc (1px dotted)
```

Display and headings **Lora**. Body and UI **Inter**. Values, IDs, labels, kickers
**IBM Plex Mono**, uppercase, `0.14em` tracking at 9–10px.
Radii **2–3px**. No shadows except modals. No gradients anywhere.

Recurring compositions, exact:

```
header       sticky · 68px · #fffdfb · border-bottom 1px #e8e1db
             inner: max-width 1760 · padding 0 48px · gap 22px
wordmark     Lora 22px #8b2a4a · letter-spacing -0.015em · line-height 1.15
section h2   Lora 30px #2b1f24 · border-bottom 1px #e8e1db · pb 10px · mb 20px
body copy    16.5px · line-height 1.78 · #3f3a3f
caption      11.5px · line-height 1.55 · #a9a1a2
callout      border-left 3px #8b2a4a · background #fbf5f7 · padding 18px 22px
grid tables  gap 1px on a #e8e1db background + 1px #e8e1db border (rules via gap)
footer       #4a1526 · text rgba(255,255,255,0.76) · max-width 1900
             padding 76px 56px 40px · grid minmax(0,1.5fr) repeat(4, minmax(0,1fr)) · gap 72px
```

**Do not convert these to CSS custom properties.** Token alignment is a value
change, not a refactor — a rename mid-flight makes the diff unreadable and hides
whether the value actually changed.

---

## 5. The three rail blocks — ready to build

Pure component work, no `wiki/**`, no generator. The current rail's three
provenance cards are replaced by these three, in this order.
Source: `Heavy Metal Index v3.dc.html:1453–1478`.

**Connections** — label: mono 9.5px, `0.14em`, uppercase, `#a9a1a2`, `padding-bottom 9px`,
`border-bottom 1px #e8e1db`, `margin-bottom 12px`. Then a flex column, `gap 9px`,
`margin-bottom 30px`, of links at 13.5px `#1c43ad`, `line-height 1.45`.
Data is already on the page — see the `connections` arrays at v3:1794, 1814, 1834,
1857, 1874, 1890, 1899, 1907, 1915, 1924 for the shape: `[label, targetKind]`.

**Reuse this page** — box: `border 1px #e8e1db`, `background #fffdfb`, `margin-bottom 24px`.
Header strip: `padding 11px 15px`, `border-bottom 1px #e8e1db`, `background #fbf5f7`,
mono 9.5px `0.12em` uppercase `#8b2a4a`. Body: `padding 14px 15px`, flex column `gap 9px`,
links 12.5px `#1c43ad` — *Copy citation (APA, Vancouver, BibTeX)*, *Structured evidence
export (JSON)*, a JSON-LD disclosure toggle, *Licensing and downstream use*.
The disclosure panel: `border 1px #e8e1db`, `background #fbf8f5`, `padding 11px 12px`,
`max-height 300px`, `overflow auto`, mono 9.5px `line-height 1.55` `#5a4148`,
`white-space pre-wrap`.

**Found an error?** — `border 1px #eddfe4`, `background #f6ecf0`, `padding 16px`.
Title Lora 17px `#8b2a4a`, `margin-bottom 8px`. Body 12.5px `line-height 1.65`
`#5a4148`, `margin-bottom 13px`: *"Corrections are logged publicly with the date, the
affected value, and the source that resolved it."* Button: `background #8b2a4a`,
`#fff`, 12px, `padding 8px 13px`, `radius 3px`, hover `#6f2139`.

---

## 6. The prompt shape that works

Every value Claude Code can copy verbatim, it gets right. Every value it has to
infer, it drifts on. So a good task prompt is mostly transcription.

A working prompt has five parts, in order:

1. **Branch name.**
2. **Scope fence** — the exact files that may change, and the sentence *"Do not touch
   `wiki/**`, `data/**`, or `raw/**`."*
3. **The deletion** — which existing rule dies, by file and line range, named before
   the addition is described.
4. **The addition** — verbatim values, not adjectives. `padding: 11px 15px`, never
   "tighter padding".
5. **The gate** — *"Run `npm run check:v3`. Paste the output. Do not report this as
   matching v3 until it exits 0."*

And two standing constraints that apply to every task:

- `git.deploymentEnabled` is `false` in `vercel.json`. Nothing auto-deploys. Every
  step ends with an explicit preview deploy and a look at it before promotion.
- Report what you found rather than silently fixing it, whenever the finding is
  outside the scope fence.

---

## 7. Failure signatures — stop and re-read this file

- A fix described as "increased specificity" or "added `!important`" → §1.
- Conformance reported from reading a `.scss` file → §2.
- A body-copy section being hand-edited in `wiki/**` → §3, it will regenerate.
- A new CSS custom property appearing during token alignment → §4.
- A colour that is *close to* `#8b2a4a` but not equal to it (`#9a2852` shipped in
  `middleware.ts` for months) → §4, copy verbatim.
- "Matches v3" with no exit code attached → §2.
- Work described as *which CSS values differ* rather than *which component this data
  belongs in* → `COMPONENTS.md`. A diff converges on the old build in new colours; it
  cannot produce reorganization.
- A measured value sitting inside a prose sentence → `COMPONENTS.md`, the dotted
  key–value row exists for exactly this.
