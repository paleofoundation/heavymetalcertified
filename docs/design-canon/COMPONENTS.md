# COMPONENTS — v3's data-presentation vocabulary

The codification target. `METHOD.md` §4 is a **value system** (colours, geometries) and
that framing is itself the bug: it invites a diff against the current page, which can
only ever converge on the old build wearing new colours.

v3 is an **information architecture**. Its real content is a small set of repeatable
components, each of which is a decision about *how a kind of data should be presented*.
The unit of work is the component, not the page — codify one and every page holding
that data inherits it at once.

Every entry below is: **what a reader needs → data we already hold → what it renders as
today → exact spec.** Ordered by leverage.

---

## The atom: dotted key–value row

Not a component — the **primitive** three components below are built from. Learn it once.

```
display: grid · grid-template-columns: minmax(0,1fr) auto · gap: 16px
padding: 8px 0 · border-bottom: 1px dotted #f2ece7
key    13px · line-height 1.5 · #3f3a3f
value  IBM Plex Mono 12.5px · #8b2a4a · white-space: nowrap
```

Appears in the anchor-dataset panel, both of the citation drawer's value sections,
and the hero snapshot (at `10px 0` padding). **Any measured value paired with a label
uses this row.** Prose sentences containing a number are a defect, not a style choice.

---

## 1. Burgundy-header data table — *landed*

**18× in v3. Highest leverage in the build: every generated table on ~3,000 pages.**
Already codified by Claude Code on `feat/hero-v3` (commit 788b6fde1) via `.wiki-content table`.
Recorded here so the vocabulary is complete in one place.

Reader need: read values across bodies/instruments without re-learning a layout per page.
Data: every generated table. Today: plain markdown grid, `th` in Lora 13.5px, no zebra.

```
table   width 100% · font-size 13.5px · border 1px #e8e1db
thead   background #8b2a4a · color #fff
th      text-align left · padding 11px 15px
        IBM Plex Mono 10px · letter-spacing 0.1em · uppercase
td      padding 13px 15px · vertical-align top
zebra   #fdfaf8 · rules #f2ece7
```

Column conventions, from v3's regulatory-limits table: first column `white-space: nowrap`,
`#2b1f24`, carrying a mono superscript citation; type/qualifier column `#736b6e`; value
column `line-height 1.55` `#3f3a3f`; a trailing link column in mono 11.5px.

---

## 2. Citation superscript → source drawer

**The single most-repeated affordance in the corpus, and today it is a bare `[1]`.**

Reader need: check what a number rests on without leaving the sentence.
Data: source frontmatter + `data/evidence/values.jsonl` + the file hash already stored.
Today: a superscript that jumps to a footnote list at the bottom of the page.

**Marker** — `sup`, IBM Plex Mono 11px; the anchor `#8b2a4a`, `padding 1px 3px`,
`border-radius 2px`, hover `background #f6ecf0` with no underline.

**Drawer** — right-side panel, `width min(520px, 94vw)`, full height, `background #fffdfb`,
`box-shadow -10px 0 44px rgba(74,21,38,0.24)`, scrim `rgba(45,15,26,0.42)`.

- Header: `padding 22px 26px 18px`, `border-bottom 1px #e8e1db`. Kicker `SOURCE RECORD [n]`
  mono 10px `0.14em` uppercase `#8b2a4a`. Title Lora 21px `line-height 1.3` `#2b1f24`.
  Meta 12.5px `#736b6e`. Close `×` 22px `#b7aeb0`, hover `#8b2a4a`.
- Body `padding 20px 26px 34px`. **Two value sections, in this order** — the first is
  conditional, the second always renders.

  **`USED ON THIS PAGE`** — mono 9.5px `0.14em` uppercase `#8b2a4a`, dotted key–value
  rows at `padding 10px 0`, uncapped. Renders **only** when the marker carries a
  `value_id`. When it does not, this section is **absent entirely** — no empty state, no
  placeholder. An empty "used on this page" reads as *this source supports nothing here*,
  which is false.

  **`VALUES EXTRACTED FROM THIS DOCUMENT · <n>`** — mono 9.5px `0.14em` uppercase
  `#a9a1a2`, same rows, `max-height 220px` `overflow auto`. Filtered from
  `values.jsonl` by `source_id`, which exists today. The count is not decoration: it
  tells the reader whether the document is rich or thin before they scroll it.

  **Why this order and these labels.** The page↔value join does not exist, so the
  document — not the page — is what this drawer can honestly be *about*. Its load-bearing
  content is document identity: title, meta, integrity hash, and the route to the source
  record. The value list is corroborating detail underneath that, and capping it says so.
  When the join lands, the first section appears above and nothing else moves.

  **The upgrade path is one scoped ask, not F-16:** can the citation marker be emitted
  carrying the `value_id` it annotates? That is a marker-attribute question, not a
  page-level index. Log it as its own finding.
- **Document integrity** block: `background #fbf5f7`, `border 1px #eddfe4`, `padding 15px 17px`,
  `margin-top 24px`. Label mono 9.5px `0.12em` uppercase `#8b2a4a`. Hash mono 11px
  `line-height 1.75` `#5a4148` `word-break: break-all`.
- Note 14px `line-height 1.72`. Then three actions: filled *Open source record*
  (`#8b2a4a`, `9px 15px`, radius 3px, hover `#6f2139`), outlined *Original document* and
  *Copy citation* (`#8b2a4a` on `1px #eddfe4`, hover `#fbf5f7`).

**This is what makes the Index an index rather than an article.** The hash is already in
the evidence tree; not surfacing it is the largest unforced loss in the current build.

---

## 3. Claim underline — *deferred, not cancelled*

**OBJECTION 1 upheld (ground B).** `data-claim` appears zero times in the repo and zero
times across 3,884 built pages; `claims.jsonl` is a 1-byte file behind a real schema and
nothing mints the keys. The rule below is correct and would match nothing. It is not the
first move in this chain, it is the last: populate `claims.jsonl` against
`claim.schema.json` → emit spans from the generator (F-16) → *then* one line of CSS.

Do **not** delete `_legacy-all.scss:242–258` in anticipation. It reads like a predecessor
and is not — it styles the citation `<a>`, live on 1,494 anchors in `metals/lead`
(`METHOD.md` §1 guard).

Reader need: see which words are a traceable claim and which are connective prose.
Data: `data-claim` cite keys, **not yet minted** (`<firstauthor><year>-<slug>` per `docs/conventions.md`).
Today: nothing — claims are visually identical to surrounding prose.

```
span[data-claim]  border-bottom: 1px dotted #cbb4bc
                  id="claim-<cNN>" · data-claim="<citekey>-<cNN>"
```

v3 carries this as an inline style per span (v3:461) — there is no source CSS block to
port, so it is a translation, not a copy. When it does land it converts every synthesis
page from an essay into a claim-bearing record, and it is the visual precondition for
the claim ledger in Index Pro.

---

## 4. ppb-normalized comparison chart

Reader need: compare instruments of different legal weight on one basis, without
implying they are equivalent.
Data: `regulations.json` `limit_value` + body + instrument type.
Today: a list of numbers in prose.

Framed box `border 1px #e8e1db` `background #fffdfb` `margin-bottom 26px`:

- Head `display flex` `align-items baseline` `justify-content space-between`,
  `padding 13px 18px`, `border-bottom 1px #e8e1db`. Title Lora 18px `#2b1f24`;
  right kicker mono 9.5px `0.1em` uppercase `#a9a1a2` — states the basis
  (*"Three instruments · same basis"*).
- Rows `padding 18px 18px 14px`, each `display grid` `grid-template-columns: 270px 1fr 78px`
  `gap 16px` `align-items center` `padding 6px 0`.
  Label 13px `#3f3a3f` with ellipsis; beneath it the body in mono 9.5px `0.06em` uppercase `#b7aeb0`.
  Track `height 16px` `background #f4f0ec`, bar filled burgundy. Value mono 12.5px
  `#2b1f24` right-aligned.
- Footnote strip `padding 12px 18px`, `border-top 1px #e8e1db`, `background #fbf8f5`,
  11.5px `line-height 1.55` `#736b6e` — **states legal status per body.** Non-optional:
  the normalization is only honest if the caveat travels with it.

---

## 5. Regulatory timeline

Reader need: see that a limit tightened, and by how much, without reading six dates.
Data: regulation frontmatter — year, value, body.
Today: prose paragraphs.

Framed box `border 1px #e8e1db` `background #fffdfb` `padding 26px 22px 18px`:

- Track: `display flex` `align-items stretch`, `border-bottom 2px solid #e0c9d1`.
  Each stop `flex 1` `padding 0 12px 18px 0` — year mono 11px `#8b2a4a` `0.06em`;
  value mono **18px** `#2b1f24`; description 12px `line-height 1.55` `#736b6e`.
- Dots: a second flex row at `margin-top -7px`, each `flex 1` containing an 11px circle,
  `border-radius 50%`, `background #8b2a4a`, `border 2px solid #fffdfb`.
- Caption 11.5px `#a9a1a2` — names any figure that is not a health-based threshold.

---

## 6. Anchor-dataset panel

Reader need: judge whether independent datasets agree, dataset by dataset.
Data: source records routed to a synthesis finding + their extracted values.
Today: prose, with the datasets' numbers buried in sentences.

Panel `border 1px #e8e1db` `background #fffdfb` `margin-bottom 16px`, `id="anchor-<slug>"`:

- Head `display flex` `align-items baseline` `justify-content space-between` `gap 20px`,
  `padding 14px 18px`, `border-bottom 1px #e8e1db`, `background #fbf8f5`.
  Kicker mono 9.5px `0.14em` uppercase `#8b2a4a` `margin-bottom 6px` — **`Anchor 01 · pan-European`**,
  i.e. ordinal plus scope. Title Lora 20px `line-height 1.3`. Right: attribution mono 10.5px
  `#a9a1a2` `white-space nowrap`.
- Body `padding 16px 18px 14px`: one 15px `line-height 1.72` paragraph, then dotted
  key–value rows.

Each panel is a **nested rail item**, not a top-level section — see the `rails` arrays
at v3:1815.

---

## 7. Grade badge, grade key, findings row

Reader need: know how strongly a conclusion is supported before reading it.
Data: finding grade + source counts + tags, already in frontmatter.
Today: undifferentiated list.

**Key cards** — `grid-template-columns: repeat(4, minmax(0,1fr))` `gap 20px`; each
`border 1px #e8e1db` `background #fffdfb` `padding 14px 16px`; badge + Lora 17px title
in a `gap 10px` flex row; 12.5px `line-height 1.6` `#736b6e` description.

**Findings row** — `grid-template-columns: 52px minmax(0,1fr) 190px` `gap 22px`
`align-items start` `padding 22px 0` `border-bottom 1px #f2ece7`.
Badge · title (Lora 21px `#8b2a4a`) + 14px description + tag chips · right column with
source count (mono 12.5px `#2b1f24`) over date (mono 10px `0.08em` uppercase `#a9a1a2`).

**Tag chip** — mono 9.5px `0.08em` uppercase `#8b2a4a`, `border 1px #eddfe4`,
`background #fbf5f7`, `border-radius 2px`, `padding 3px 8px`.

**Assertion block** (finding pages, above the fold) — `border 1px #eddfe4`
`background #fbf5f7` `padding 24px 26px` `margin-bottom 44px`. Row of: `GRADE A` in mono
15px on `#8b2a4a`, radius 3px, `padding 7px 13px`; a mono 10px `0.12em` uppercase
provenance line; a review-state chip (`#a8496a` on `1px #e0c9d1`). Then the claim itself
as **Lora 24px `line-height 1.45`** — the conclusion stated once, in full, at the top.

---

## 8. Grid-of-records via 1px gap

Reader need: scan a registry without table chrome.
Data: any list of records with a count and a one-line description.
Today: bulleted links.

```
display: grid · grid-template-columns: repeat(N, minmax(0, 1fr))
gap: 1px · background: #e8e1db · border: 1px solid #e8e1db
```

Rules come from the **gap**, not from per-cell borders — cells sit on `#fffdfb`.
`N` is 2 for categories/downstream, 4 for governing metals.

---

## 9. Caveat callout — two states

Reader need: know where the page is thin, without hunting.
Data: **heading-driven, not frontmatter-driven.** `uncertainty` / `gaps` do not exist
among the repo's 375 frontmatter keys (OBJECTION 2, upheld). The real signal is
`## Limitations` (191 pages) + `## Open questions` (14).
Today: an ordinary paragraph, indistinguishable from findings.

**Present state** — the page has a written limitations section:

```
border-left: 3px solid #8b2a4a · background: #fbf5f7 · padding: 18px 22px
copy 15.5px · line-height 1.75 · #5a4148
```

**Absent state** — new, and the answer to the 735 ingredient / product-category /
regulation pages that carry no limitations section at all.

My original line — *"every detail screen has one"* — was false, and the fix is not to
render nothing. A page with no caveat block reads as *no caveats exist*, which is a
stronger and less true claim than *nobody has written this yet*. The Index's whole
posture is stating where it is thin; silence is the one thing it cannot do here.

So: a different treatment, because it is a different epistemic claim. Lower contrast,
no burgundy bar — the burgundy bar means *a reviewed limitation exists* and must keep
meaning only that.

```
border: 1px dotted #e8e1db · background: #faf7f4 · padding: 15px 18px
kicker  IBM Plex Mono 9.5px · 0.14em · uppercase · #a9a1a2 · margin-bottom 7px
        NO REVIEWED LIMITATIONS SECTION
copy    13px · line-height 1.65 · #a9a1a2
        "This page has no reviewed limitations section yet. That is a gap in the
         record, not a statement that none apply."
link    13px · #1c43ad — "Suggest a correction", targeting the rail's Found an error? block
```

Renders on **Tier 1 evidence pages only** — metals, ingredients, products, regulations,
sources, synthesis. Never on registries, category indexes, or search. An absence is only
worth stating where a reader had reason to expect presence.

---

## 10. Caption — two positions, both valid

```
11.5px · line-height 1.55 · #a9a1a2
below  margin-top 10–16px      (v3's default)
above  margin-bottom 10–16px   (equally valid — see below)
```

Attaches to every table, chart and timeline, and carries the thing that would otherwise
be a misreading — the basis, the legal status, or the fact that a number is a population
percentile rather than a safety threshold.

**OBJECTION 3 resolved without an F-16 item.** Generated table notes are emitted *above*
the table, and 227 ingredient pages carry a frozen note in `wiki/` that no checked-in
generator produces — so the position cannot be changed from the component layer, and for
those 227 it cannot be changed at all without content edits.

Rather than log debt that can never be paid: **caption-above is a legitimate variant, not
a deviation.** A note before a table functions as a basis statement (*values are ppb, wet
weight*) and reads correctly there; a note after functions as a qualifier on what was
just read. Both are real typographic forms. Same type spec, margin flips.

Style notes as captions **in place**. No reposition, no F-16 entry.

---

## How to codify

One component per commit, in this order — leverage descending:

1. ~~Burgundy table~~ *(landed)*
2. ~~Claim underline~~ *(deferred — no `data-claim` exists to match; see §3)*
3. Citation marker + source drawer — the affordance that defines the product
4. Caption + caveat callout — cheap, and they stop misreadings; both have a second
   state/position (§9–10) and the absent-state caveat is the higher-value half, since
   it covers 735 pages that would otherwise render nothing
5. Grid-of-records — replaces bulleted registries
6. Chart / timeline / anchor panel / findings row — these need **generator** work (F-16),
   because they replace emitted prose with emitted structure

Items 3–5 are chrome or CSS and land against `quartz/`. Item 6 is the emitter, and per
`METHOD.md` §3 it is a separate project. **Name the layer before starting.**

For each: state the reader need, name the data source in the repo, delete the old
presentation (`METHOD.md` §1), add assertions to `v3-acceptance.json`, and do not report
it done without an exit code (`METHOD.md` §2).
