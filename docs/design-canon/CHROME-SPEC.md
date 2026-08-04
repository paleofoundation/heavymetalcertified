# CHROME-SPEC — the complete shared chrome, verbatim

Supersedes the nav-and-menu-only version. Every value below was read off
`Heavy Metal Index v3.dc.html` at the cited line. **Copy them. Do not re-derive them from
a screenshot, and do not estimate any value that appears in this file.**

---

## 0. The mandate — read this before deciding anything is out of scope

**Everything in this document is chrome. None of it is F-16. No content is at stake.**

That sentence exists because the last three sessions each lost time to a scope fence that
did not apply. `METHOD.md` §3 scopes F-16 to the **~32 emitted body sections** — the prose
inside `<article>`. It does not scope the header, the mega menu, the hero band, the two
rails, the footer, the breadcrumb, the type badge, or the section-header treatment. A
generator that emits chrome is chrome (`tools/build-nav-panels.mjs` is the standing
example). If a chrome element is emitted by a generator, **edit the generator.**

The leverage here is the whole point:

> There are 15 screens and **6 shared chrome components.** Build each component once and
> it lands on all 15 screens simultaneously. Six commits change every page on the site.

No screen needs bespoke chrome. What differs per screen is five strings and a rail list,
and §3 tabulates all of them.

**Standing rule, unchanged:** structure, geometry, hierarchy, labels and copy come from
v3. Every number, count, date and legal entity name comes from the repo (§1.6 has the one
case where v3 is actively wrong and the repo must win).

---

## 1. The six shared chrome components

### 1.1 Header bar (v3:37–63)

```
header  position: sticky; top: 0; z-index: 80; background: #fffdfb;
        border-bottom: 1px solid #e8e1db;
inner   display: flex; align-items: stretch; flex-wrap: nowrap; gap: 22px;
        max-width: 1760px; margin: 0 auto; padding: 0 48px; height: 68px;
```

Children in order, left to right — the flex spacer is load-bearing, do not replace it
with `margin-left: auto`:

```
1 wordmark    display: flex; align-items: center; flex: 0 0 auto; white-space: nowrap;
              text-decoration: none; padding-right: 8px;
   text       Lora 22px · line-height 1.15 · #8b2a4a · letter-spacing -0.015em
              "Heavy Metal Index"
2 nav         display: flex; align-items: stretch; flex: 0 1 auto; min-width: 0;
              overflow: hidden; gap: 2px;
              onMouseLeave closes the panel  ← required, or the panel traps the pointer
3 spacer      <div style="flex: 1 1 auto; min-width: 0;"></div>
4 actions     display: flex; align-items: center; flex: 0 1 auto; min-width: 0; gap: 12px;
5 progress    <div style="height: 2px; background: #f2ece7;"> holding the scroll bar
```

`min-width: 0` on the nav and on the actions group is what prevents the 254px horizontal
overflow (fixed in c00926f4c). It is not optional and it is not decoration.

**Nav triggers** — five, in this order: **Metals · Foods · Products · Regulations · Evidence.**

```
display: flex; align-items: center; padding: 0 14px; font-size: 13.5px;
text-decoration: none; white-space: nowrap;
border-bottom: 2px solid <#8b2a4a when open, transparent otherwise>;
color: <#8b2a4a when open, #3f3a3f otherwise>;
```

**No chevron, no caret, no disclosure glyph.** The 2px bottom border is the entire
affordance. Opens on `mouseenter`, toggles on click. Keep the accessible name on the
control; remove only the glyph.

**Actions group**, in order:

```
search box   wide (vw >= 1150):
             display: flex; align-items: center; gap: 9px; height: 36px; padding: 0 13px;
             border: 1px solid #e6ded8; border-radius: 3px; background: #fbf8f5;
             flex: 0 1 260px; min-width: 60px; overflow: hidden;
             narrow:
             display: flex; align-items: center; justify-content: center;
             height: 36px; width: 36px; border: 1px solid #e6ded8; border-radius: 3px;
             background: #fbf8f5; flex: 0 0 auto; cursor: pointer;
  glyph      IBM Plex Mono 12px #b7aeb0 · "⌕" · flex: 0 0 auto
  label      12.5px #a9a1a2 · "Search the index" · nowrap · ellipsis · min-width: 0
  kbd        margin-left: auto · Mono 10px #b7aeb0 · 1px solid #ebe4de · radius 2px
             · padding 1px 4px · "/"                      (both label and kbd: wide only)
"Ask the Index"  12.5px #736b6e · flex: 0 0 auto · nowrap
"Log in"         12.5px #736b6e · flex: 0 0 auto         (both: wide only)
"Index Pro"      12.5px #fff on #8b2a4a · radius 3px · padding 8px 15px
                 · flex: 0 0 auto · nowrap · hover background #6f2139
```

Breakpoint is **1150**, not 1180.

### 1.2 Mega menu panel (v3:71–95)

```
panel   position: absolute; left: 0; right: 0; top: 70px; background: #fffdfb;
        border-bottom: 1px solid #e8e1db;
        box-shadow: 0 22px 44px -24px rgba(90, 28, 48, 0.26);
        onMouseLeave closes
inner   max-width: 1760px; margin: 0 auto; padding: 32px 48px 38px;
        display: grid; grid-template-columns: 280px 1fr; gap: 56px;
```

> That shadow is the **one** legitimate exception to the no-box-shadow assertion, with
> modals and the source drawer. Add the panel selector to the exemption list in
> `v3-acceptance.json` in the same commit.

**Left rail** — three children, in flow, in this order:

```
container  border-right: 1px solid #efe9e3; padding-right: 40px;
title      Lora 20px #8b2a4a · margin-bottom 10px
blurb      margin: 0 0 16px · 13px · line-height 1.65 · #736b6e
all-link   Mono 11px · letter-spacing 0.06em · uppercase · #8b2a4a · text "<all> →"
```

**Link columns** — three, never two:

```
wrapper    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 40px;
col head   Mono 9.5px · 0.14em · uppercase · #a9a1a2
           padding-bottom 9px · border-bottom 1px solid #efe9e3 · margin-bottom 11px
col body   display: flex; flex-direction: column;      ← no gap; the dotted rules separate
item       display: flex; align-items: baseline; justify-content: space-between;
           gap: 12px; padding: 6px 0; font-size: 13.5px; color: #3f3a3f;
           border-bottom: 1px dotted #f2ece7;      hover: color #8b2a4a
count      Mono 10.5px #b7aeb0                     ('' renders nothing — that is fine)
```

Row density and column heads are **already conformant in the repo** — measured. Do not
touch that CSS. Column heads are `<p class="hmi-nav-colhead">`, not headings, so any
assertion keyed to `h3`/`h4` reports zero columns on a correct panel. Key on the class.

A three-column grid with two populated columns computes to `repeat(3, 1fr)` and passes a
geometry check while being wrong. **Assert the populated column count, not the template.**

**Menu data model** (v3:2147–2180) — `{ id, label, title, all, blurb, cols: [{ h, items }] }`:

| Menu | `label` | `title` | `all` | Column heads |
|---|---|---|---|---|
| metals | Metals | Metals | All *n* metals | Most referenced · By regulated species · Cross-cuts |
| foods | **Foods** | **Foods & ingredients** | All *n* ingredients | Most studied · By commodity group · Cross-cuts |
| products | Products | Product categories | All *n* categories | Infant & child · Other categories · Cross-cuts |
| regulations | Regulations | Regulations | All *n* regulations | Key instruments · Bodies · Cross-cuts |
| evidence | Evidence | Evidence & methods | The trust center | Methods · The evidence base · Cross-cuts |

**Foods/ingredients, resolved:** the bar says **Foods**, the panel title says **Foods &
ingredients**, the panel id and the all-link follow whatever the panel actually links to.
Three names for one thing in the site's most-used navigation is the defect; this is the fix.

Counts come from the repo. Six items per column in the first two columns, three to four in
Cross-cuts. Cross-cuts ships only where every item resolves to a real page; below two
surviving items, hand it back rather than pad it (metals is currently in that position).

### 1.3 Hero band (v3:364–402) — every screen except Home and Ask

```
section  background: #8b2a4a; color: #fff;
inner    wide:   max-width: 1760px; margin: 0 auto; padding: 34px 48px 40px;
                 display: grid; grid-template-columns: minmax(0, 1fr) 380px;
                 gap: 72px; align-items: start;
         narrow: max-width: 1760px; margin: 0 auto; padding: 28px 24px 34px;
                 display: grid; grid-template-columns: minmax(0, 1fr); gap: 30px;
```

**Left column**, in order:

```
breadcrumb  display: flex; align-items: center; gap: 9px; margin-bottom: 18px;
            Mono 10.5px · letter-spacing 0.08em · rgba(255,255,255,0.68)
            "Index" / <crumb> / <crumbLeaf>      leaf is #fff, separators are plain "/"
title row   display: flex; align-items: baseline; gap: 16px; flex-wrap: wrap;
  h1        Lora 44px · line-height 1.12 · letter-spacing -0.018em · #fff
  kind pill Mono 11px · 0.1em · uppercase · rgba(255,255,255,0.72)
            · 1px solid rgba(255,255,255,0.34) · radius 2px · padding 4px 9px
dek         margin: 18px 0 0 · max-width 72ch · 16px · line-height 1.7
            · rgba(255,255,255,0.88)
meta row    margin-top 26px · display: flex; flex-wrap: wrap; gap: 12px 28px;
            align-items: center; font-size: 12.5px; color: rgba(255,255,255,0.8)
  author    "Author <name> · ORCID <id>"   name #fff, underline rgba(255,255,255,0.42)
  updated   Mono 11px rgba(255,255,255,0.72) · "UPDATED <iso>"
  rev       Mono 11px rgba(255,255,255,0.72) · "REV <n>"
  buttons   Mono 10.5px · 0.08em · uppercase · radius 2px · padding 5px 11px
            ghost:   #fff · 1px solid rgba(255,255,255,0.38)
                     hover background rgba(255,255,255,0.14)
            solid:   #6f2139 on #fff · 1px solid #fff · hover background #f6ecf0
            order:   Cite this page (ghost) · Version history (ghost) · Download PDF (solid)
```

**Right column — page snapshot** (omit only where a screen has no counts):

```
box     border: 1px solid rgba(255,255,255,0.22);
head    padding: 12px 17px; background: rgba(0,0,0,0.13);
        Lora 16px #fff · "Page snapshot"
body    padding: 6px 17px 14px;
row     display: flex; align-items: baseline; justify-content: space-between; gap: 14px;
        padding: 10px 0; border-bottom: 1px dotted rgba(255,255,255,0.22);
  key   12.5px rgba(255,255,255,0.84)
  val   Mono 14px #fff
```

Four rows is the norm. Every value is a repo count.

**Two live defects this section fixes.**

*Breadcrumb duplication.* `/metals` currently renders `Index / Metals / Metals`. The
breadcrumb is `Index / <section> / <leaf>` where **leaf is the page, not the section**. On
an index page the leaf is the collection's own name for itself, never a repeat of the
crumb — `Index / Metals / All metals`. §3 gives the leaf for all 15.

*Type badge.* `/metals` currently wears `METAL PROFILE`, which is the badge for a *page
about one metal*. The badge is a function of **screen type, not page kind** — it says what
kind of document you are reading. `/metals` is a registry of metal pages, so it reads
`REFERENCE LAYER`. §3 gives the badge for all 15; they are the `KIND` map at v3:2680.

### 1.4 Three-column shell and left rail (v3:404–434)

```
shell    wide:   max-width: 1760px; margin: 0 auto; padding: 0 48px; display: grid;
                 grid-template-columns: 236px minmax(0, 1fr) 312px; gap: 56px;
                 align-items: start;
         narrow: max-width: 1760px; margin: 0 auto; padding: 0 24px; display: grid;
                 grid-template-columns: minmax(0, 1fr); gap: 8px;
left     wide: position: sticky; top: 92px; padding: 34px 0 48px;
         narrow: position: static; padding: 26px 0 8px;
main     padding: 38px 0 88px; min-width: 0;          ← min-width: 0 is required
right    wide: position: sticky; top: 92px; padding: 38px 0 48px;
         narrow: position: static; padding: 8px 0 48px;
```

Left rail, "On this page":

```
head      display: flex; align-items: baseline; justify-content: space-between;
          padding-bottom 9px · border-bottom 1px solid #e8e1db · margin-bottom 4px
  label   Mono 9.5px · 0.14em · uppercase · #a9a1a2 · "On this page"
  count   Mono 9px · 0.1em · uppercase · #c3b9bb · "<n> rails"
nav       display: flex; flex-direction: column;
item      display: flex; align-items: baseline; gap: 10px; padding: 7px 0 7px 11px;
          font-size: 13px; line-height: 1.4; text-decoration: none;
          border-left: 2px solid <#8b2a4a active, #e8e1db otherwise>;
          color: <#8b2a4a active, #3f3a3f otherwise>;
  num     Mono 9.5px · 0.04em · <#8b2a4a active, #c3b9bb otherwise> · flex: 0 0 auto
  label   flex: 1
  badge   Mono 9.5px #a9a1a2 · flex: 0 0 auto
children  margin: 2px 0 6px 26px; border-left: 1px solid #ece5e0;
  item    padding: 5px 0 5px 11px; font-size: 12px; line-height: 1.4;
          color: <#8b2a4a active, #736b6e otherwise>;
  more    padding: 5px 0 5px 11px; Mono 10px · 0.06em · uppercase · #8b2a4a
          cap children at 3; the overflow link reads "+ n more" / "Show fewer"
note      margin: 22px 0 0; padding-top: 14px; border-top: 1px solid #e8e1db;
          font-size: 11.5px; line-height: 1.6; color: #a9a1a2;
```

The left border is the active indicator, not a background fill. Rail numbers are the
stable two-digit scheme in §3 — `01`, `02`, … `09` for update history — and they are
**positional identity, not sequence**: a screen with no references still numbers its
history rail `09`. Gaps in the numbering are correct and intentional.

### 1.5 Right rail (v3:2022–2048) — identical on every detail screen

```
head        Mono 9.5px · 0.14em · uppercase · #a9a1a2
            padding-bottom 9px · border-bottom 1px solid #e8e1db · margin-bottom 12px
            "Connections"
links       display: flex; flex-direction: column; gap: 9px; margin-bottom: 30px;
  item      13.5px #1c43ad · line-height 1.45

reuse box   border: 1px solid #e8e1db; background: #fffdfb; margin-bottom: 24px;
  head      padding: 11px 15px; border-bottom: 1px solid #e8e1db; background: #fbf5f7;
            Mono 9.5px · 0.12em · uppercase · #8b2a4a · "Reuse this page"
  body      padding: 14px 15px; display: flex; flex-direction: column; gap: 9px;
  links     12.5px #1c43ad — Copy citation (APA, Vancouver, BibTeX) ·
            Structured evidence export (JSON) · View JSON-LD ·
            Licensing and downstream use
  ld panel  border: 1px solid #e8e1db; background: #fbf8f5; padding: 11px 12px;
            max-height: 300px; overflow: auto; Mono 9.5px · line-height 1.55 · #5a4148;
            white-space: pre-wrap; word-break: break-word;

error box   border: 1px solid #eddfe4; background: #f6ecf0; padding: 16px;
  title     Lora 17px #8b2a4a · margin-bottom 8px · "Found an error?"
  body      margin: 0 0 13px; 12.5px; line-height 1.65; #5a4148
  button    display: inline-block; background: #8b2a4a; color: #fff; font-size: 12px;
            padding: 8px 13px; border-radius: 3px;   hover background #6f2139
```

**This box replaces the three provenance cards** — "Researched by", "Page Snapshot", "Page
provenance" (`METHOD.md` §1 ledger). Replaced, not supplemented. The author and updated
date now live in the hero meta row; the snapshot is the hero's right column.

### 1.6 Footer (v3:2052–2076)

```
footer   background: #4a1526; color: rgba(255,255,255,0.76);
grid     max-width: 1900px; margin: 0 auto; padding: 76px 56px 40px; display: grid;
         grid-template-columns: minmax(0, 1.5fr) repeat(4, minmax(0, 1fr)); gap: 72px;
brand    Lora 24px #fff · margin-bottom 14px
  body   13.5px · line-height 1.7 · rgba(255,255,255,0.7) · max-width 42ch · two paragraphs
col head Mono 9.5px · 0.16em · uppercase · rgba(255,255,255,0.52)
         padding-bottom 12px · border-bottom 1px solid rgba(255,255,255,0.18)
         · margin-bottom 14px
col body display: flex; flex-direction: column; gap: 9px;
  link   13px rgba(255,255,255,0.76) · hover #fff
bar      max-width: 1900px; margin: 0 auto; padding: 22px 56px 40px;
         border-top: 1px solid rgba(255,255,255,0.16);
         display: flex; flex-wrap: wrap; gap: 12px 40px; align-items: baseline;
  item   Mono 10px · 0.08em · rgba(255,255,255,0.5)
```

Four columns: **Explore · Evidence · Institute · Legal.**

> **The one place v3 is wrong and the repo must win.** The artifact's bottom bar reads
> `© 2026 INSTITUTE OF CONTAMINATION STANDARDS`. That is a typo for *Contaminant*, and
> it also attributes copyright to the wrong entity. **Ship the repo's line verbatim:**
>
> ```
> © {year} Paleo Certified, Inc.
> Operated by the Institute of Contaminant Standards.
> ```
>
> Two lines, two different jobs. Copyright belongs to the legal person; a dba cannot own
> property. Operator and editorial attribution belongs to the Institute. That split
> landed in the identity sweep (PRs #104/#105) and it is more correct than any value in
> this document — do not let a stale example in a design spec walk it back across 3,884
> pages. This is the one string on the site where being wrong is a checkable factual
> untruth about corporate form.
>
> Take the footer's geometry, type and column structure from v3; take every entity name
> from the repo. A legal attribution is data, not design.

---

## 2. Content-layer primitives — shared, and also chrome

These are not body sections. They are the treatments body content is rendered *in*, they
appear on every screen, and they are equally in scope.

```
section h2    Lora 30px · line-height 1.2 · #2b1f24
              border-bottom 1px solid #e8e1db · padding-bottom 10px · margin-bottom 20px
section gap   margin-bottom 52px between sections
body copy     16.5px · line-height 1.78 · #3f3a3f
lead-in copy  13.5–14px · line-height 1.7 · #736b6e · max-width 84ch
link          #1c43ad, underline on hover only

burgundy table
  table       width 100%; font-size 13.5px; border 1px solid #e8e1db;
              border-collapse: collapse
  thead tr    background #8b2a4a; color #fff
  th          text-align left; padding 11px 15px; Mono 10px; font-weight 500;
              letter-spacing 0.1em; text-transform uppercase
  td          padding 13px 15px; vertical-align top; border-bottom 1px solid #f2ece7
  zebra       odd rows #fdfaf8, even transparent
  secondary   a lighter variant exists for sub-tables (update history, peer review):
              thead background #fbf5f7, color #8b2a4a, border-bottom 1px solid #eddfe4,
              th padding 10px 15px, td padding 12px 15px, table font-size 13px

caption       11.5px · line-height 1.55 · #a9a1a2 · max-width 84ch
              below: margin-top 10–16px   ·   above: margin-bottom 10–16px
              both positions are valid; a note before a table is a basis statement,
              a note after is a qualifier

caveat callout, present
              border-left: 3px solid #8b2a4a; background: #fbf5f7; padding: 18px 22px
              copy 15.5px · line-height 1.75 · #5a4148
caveat callout, absent
              border: 1px dotted #e8e1db; background: #faf7f4; padding: 15px 18px
              kicker Mono 9.5px · 0.14em · uppercase · #a9a1a2 · margin-bottom 7px
              copy 13px · line-height 1.65 · #a9a1a2
              Tier 1 evidence pages only. Never the burgundy bar — that bar means
              "a reviewed limitation exists" and must keep meaning only that.

dotted key–value row
              display: flex; align-items: baseline; justify-content: space-between;
              gap: 20px; padding: 10px 0; border-bottom: 1px dotted #f2ece7
              key 13.5px #3f3a3f · value Mono 13px #2b1f24 right-aligned

grid-of-records
              display: grid; grid-template-columns: repeat(n, minmax(0, 1fr));
              gap: 1px; background: #e8e1db; border: 1px solid #e8e1db
              cell background #fffdfb; padding 16–19px
              The 1px gap over a #e8e1db ground is what draws the rules. Do not use
              borders on the cells.

chips         Mono 9.5px · 0.08em · uppercase · radius 2px · padding 3px 8px · nowrap
  affirmative #8b2a4a on #fbf5f7, 1px solid #eddfe4
  neutral     #736b6e on #fffdfb, 1px solid #e8e1db
  muted       #a9a1a2 on #faf7f4, 1px dotted #e8e1db
  emphatic    #fff on #8b2a4a, 1px solid #8b2a4a      (NOT-READY and equivalents only)
```

**Geometry, sitewide:** radii 2–3px everywhere. No box-shadow outside the mega-menu panel,
modals, and the source drawer. No gradients anywhere. Burgundy is exactly four values —
`#8b2a4a` `#6f2139` `#571a2c` `#4a1526` — plus the tints `#fbf5f7` `#f6ecf0` `#eddfe4` and
the grade ramp `#a8496a` `#c07f96` `#d6aebc` where a scale is genuinely needed.

---

## 3. The fifteen screens

Every screen carries §1.1, §1.2, §1.6. Every screen except Home and Ask carries §1.3, §1.4,
§1.5. What differs is five strings and a rail list.

| # | Screen | Crumb | Crumb leaf | Type badge | Hero snapshot |
|---|---|---|---|---|---|
| 1 | Home | — | — | — | no hero band; hero A layout |
| 2 | Ask | — | — | — | no hero band; ask layout |
| 3 | Metals index | Metals | All metals | `REFERENCE LAYER` | 4 rows |
| 4 | Products index | Products | All categories | `CATALOGUE` | 4 rows |
| 5 | Regulations index | Regulations | All instruments | `REGISTER` | 4 rows |
| 6 | Portal | Products | *portal name* | `PORTAL` | 4 rows |
| 7 | Category | Products | *category name* | `CATEGORY` | 4 rows |
| 8 | Subcategory | Products | *subcategory name* | `PRODUCT-CATEGORY` | 4 rows |
| 9 | Metal | Metals | *metal name* | `METAL` | 4 rows |
| 10 | Ingredient | Ingredients | *ingredient name* | `INGREDIENT` | 4 rows |
| 11 | Regulation | Regulations | *short instrument name* | `REGULATION` | 4 rows |
| 12 | Finding | Evidence | *finding short name* | `SYNTHESIS` | 4 rows |
| 13 | Synthesis | Evidence | All findings | `DIRECTORY` | 4 rows |
| 14 | Source | Sources | *citekey* | `SOURCE` | 4 rows |
| 15 | Search | Evidence | Search | `DIRECTORY` | 4 rows |

Badges are the `KIND` map at v3:2680, uppercased. **Note 3, 4, 5 and 13:** an index or
directory page never wears the badge of the thing it indexes. That single rule fixes the
`METAL PROFILE` defect and prevents its four siblings.

**Rail numbering, shared across all detail screens.** A screen uses the subset that applies
and keeps the numbers:

```
01  Overview                     02  Evidence            03  Limits
04  Interpretation               05  Uncertainty         06  Questions
07  References                   08  Sources             09  Update history
```

Detail nests under a rail; it never becomes one. Cap children at 3 with "+ n more".

**Screens with no References section:** Metals index, Products index, Regulations index —
none of them cite anything, so no References rail and no empty heading. The left-rail note
says why in one line. Same finding as `aas-injectable.md`, and the same rule: a page with
nothing to cite renders no section.

**Home and Ask** are the two screens without the detail shell. Home uses the hero-A layout
(`max-width 1760px; padding 96px 48px 88px; grid minmax(0,1.35fr) 400px; gap 96px`); Ask
uses the ask layout (`max-width 1180px; padding 56px 48px 88px; grid minmax(0,1fr) 320px;
gap 64px`). Both still carry the header, mega menu and footer unchanged.

---

## 4. Build order — six commits, sitewide effect

One component per commit, on `feat/v3-chrome-<n>`. Each is independently verifiable and
each lands on all 15 screens. Ordered by how visible the defect is today.

1. **Header bar** — §1.1. **Mostly landed:** overflow and the nav container rule in
   c00926f4c, chevrons removed in c22cd3bc1. What remains is the search box (§1.1
   actions group) and the flex spacer. The `zero <svg> inside the nav` assertion will
   pass on arrival — add it anyway; an assertion that passes on arrival is how a fix
   stops being undoable.
2. **Mega menu** — §1.2. Cross-cuts column where it resolves, Foods/ingredients naming,
   panel shadow exemption into `v3-acceptance.json`.
3. **Hero band** — §1.3. Includes both live defects: breadcrumb leaf, and type badge from
   screen type rather than page kind.
4. **Shell and left rail** — §1.4. The 236 / 1fr / 312 triad, sticky at 92px, rail numbering.
5. **Right rail** — §1.5. Deletes the three provenance cards in the same commit.
6. **Footer** — §1.6. Repo's legal line, not v3's typo.

Then §2's primitives, which mostly already exist and need auditing rather than building.

**Per commit:** delete the predecessor rule in the same commit (`METHOD.md` §1, and its
guard — confirm live matches before deleting; `_legacy-all.scss:242–258` is the standing
example of a rule that looks like a predecessor and is not). Add assertions including the
`absent: true` half. Run `npm run check:v3` and paste both scope buckets.

---

## 5. Assertions this adds

Per component, on all six surfaces:

```
header      height 68px · background #fffdfb · border-bottom 1px #e8e1db
            nav trigger border-bottom 2px on the active item
            zero <svg> inside the nav                       ← the chevron check
wordmark    Lora 22px #8b2a4a · letter-spacing -0.015em
mega menu   panel grid-template-columns computes to 280px + remainder
            left rail has exactly 3 children in order: title, blurb, all-link
            POPULATED column count === 3, keyed on .hmi-nav-colhead not on heading tags
hero        h1 Lora 44px #fff · kind pill present and matching the §3 table
            breadcrumb leaf !== breadcrumb crumb                ← the duplication check
shell       grid-template-columns computes to 236px + remainder + 312px
            documentElement.scrollWidth <= clientWidth at 1280 AND 1440
left rail   active item border-left-color #8b2a4a; inactive #e8e1db
right rail  .hmi-provenance-card absent: true          ← the deletion, not the addition
footer      background #4a1526 · four column heads · bar text matches the repo entity
negatives   no radius > 3px (except 50% on elements <= 16px wide)
            no box-shadow outside modal, drawer, mega-menu panel
            no linear-gradient anywhere
            no burgundy outside the approved set
```

All of these belong to `scope: "chrome"`. None of them is F-16. When all six commits land,
the exit code covers the entire visual system of the site — and the remaining 19 gaps are
body sections, which is exactly the distinction the scope buckets exist to preserve.
