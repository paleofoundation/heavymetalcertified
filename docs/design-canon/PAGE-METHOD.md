# PAGE-METHOD — how a live page becomes a v3 page

Companion to `SITEWIDE.md`. That file says what order to do the work in. This one says
what I actually do to convert one page, written after doing `/metals`, `/products`, and
`/regulations`. Worked examples: `Metals Index.dc.html`, `Products Index.dc.html`,
`Regulations Index.dc.html`.

---

## 0. The one move that explains the rest

**I never look at the current page's CSS.** I fetch the page as *text* and work from that
plus `COMPONENTS.md`. The old stylesheet is never in front of me, so the output cannot be
a modified version of it — there is nothing to modify.

That is the whole asymmetry between us. You open `proof-design.scss`, see the current
rules, and edit them; the current rules are therefore always in frame, and the result
converges on the old build in new colours. Not a taste failure — a **framing** failure.
Whatever is on screen while you work is what you will produce a variation of.

So the transferable instruction is procedural, not aesthetic:

> **Separate the read of *what content is here* from the read of *how it is styled now*,
> and do the first one alone.** Build the page from the rendered text plus the component
> vocabulary. Open the SCSS only afterwards, and only to find what to delete.

Concretely: `curl` the built page (or read the rendered DOM's text), work from that, and
do not open the page's stylesheet until step 6.

---

## 1. Inventory the content by kind, not by heading

Walk the page top to bottom and label every block by *what shape the data is*, ignoring
what the heading calls it:

```
prose          connective narrative, no countable members
list           countable members, no shared fields
record set     countable members WITH shared fields   ← always a component
table          already tabular
warning        a statement about how to read the data
meta           provenance, history, citation scaffolding
```

Record sets are where all the value is. `/regulations` renders 61 record sets as prose;
`/products` renders 34; `/metals` renders two lists of 17 and 19.

**Never search v3 for the heading's name.** "Quick read", "Full index", "Auto-linked
stubs" — none of these are v3 component names. Ask what job the block does.

## 2. Count everything

Every list, every record set, every group. `/metals`: 36 elements, 17 core, 19 stubs, 4
species splits. `/products`: 34 categories, 357 subcategories (summed from the cards),
largest 29, smallest 2. `/regulations`: 61 instruments, 10 jurisdictions, 44 in force, 11
superseded or withdrawn.

Two payoffs. The counts *are* the hero snapshot and the rail badges — no invention
needed. And **the count is the tell**: if you can count it and the members share fields,
it is a component, not a paragraph. That single test catches most of the remapping work
without any judgement about taste.

Only use numbers you can compute from the page. Three metals have no page count anywhere
in the source; those cells ship blank.

## 3. Look for metadata that has been concatenated

The highest-leverage thing on `/regulations` is this string:

```
European CommissionEUNiin-forceUpdated Jun 22, 2026
```

That is not a string. It is five fields — body, jurisdiction, metals, status, date —
rendered with no separator because the template drops them adjacent. **The data is
already structured; the render is destroying the structure.** Recognizing that turns 61
paragraphs into one burgundy table with a standing chip.

Whenever you see run-together metadata, a trailing "Updated <date>", or a description
that ends in a status word, you have found a record set wearing prose. Check the
frontmatter — the fields are almost certainly named there already.

## 4. Assign a component per block, from the vocabulary only

Use the `CONTENT-RULES.md` §2 table. If nothing fits, that is an OBJECTION (ground D),
not a licence to invent a layout.

What I assigned, as a reference:

| Content shape | Component |
|---|---|
| record set, 4+ shared fields | burgundy-header table (§1) |
| record set, 2–3 fields, browsable | grid-of-records, 1px gap (§8) |
| a warning about reading the data | caveat callout, burgundy bar (§9) |
| a qualifier on a table or grid | caption (§10) |
| label + measured value | dotted key–value row (the atom) |
| status / classification word | tag chip (§7) |

Two judgement calls worth copying. On `/regulations` the 17 distinct status strings
collapse into three chip treatments — in force, historical, provisional — because the
distinction a reader needs is *can I rely on this*, and 17 chips answer nothing. On
`/products` the category cards keep their four sample subcategories as dotted rows
instead of being flattened to a name and a count, because the samples are what let a
reader tell "Beverages" from "Water and Water-Based Products".

## 5. Let absence be an answer

Three blocks I deliberately did **not** render:

- No References section on any of the three — none of them cite anything. (Same finding
  as `aas-injectable.md`.) The left rail states why, in one line, instead of leaving a hole.
- No absent-state caveat callout on `/metals` — it is a registry, and `COMPONENTS.md` §9
  scopes that block to Tier 1 evidence pages.
- Blank count cells for the three metals with no count in the source.

"No component fires here" is a valid, reportable result. It is not the same as skipping
the block.

## 6. NOW open the stylesheet — only to find the deletion

With the target built, the old CSS has exactly one use: identifying which rules must die
so the new ones can win without a specificity fight (`METHOD.md` §1, and its guard —
confirm the rule is actually a predecessor before deleting).

## 7. Copy chrome verbatim. Never estimate a value you could have read.

Header, hero, rail, footer are identical across all three pages, lifted from
`Heavy Metal Index v3.dc.html`.

**And this is where I failed, so it is worth your attention.** On `/metals` I read v3's
header *markup* (lines 37–60) but not the *logic class* that supplies its computed styles
(lines 1989–2005). Four values I could have copied, I inferred instead:

| I wrote | v3 actually says |
|---|---|
| `box-shadow: inset 0 -2px 0` on the active nav item | `border-bottom: 2px solid` |
| nav padding `0 13px` | `0 14px` |
| search box `#faf7f4` / `#ebe4de`, no height | `#fbf8f5` / `#e6ded8`, `height: 36px` |
| breakpoint `>= 1180` | `>= 1150` |

Every one of them is a value that existed in a file I had open. The box-shadow one was
worse than cosmetic: it made the reference artifact fail `SITEWIDE.md`'s own "no
box-shadow outside a modal" assertion.

The lesson generalizes past me: **if a value can be read, reading it is not optional.**
When a spec cites a line number, open the line. When the markup is in one place and the
computed style is in another, read both — markup alone will make you invent the half you
didn't see.

---

## The loop, condensed

```
1. Fetch the page as text.        Do not open its stylesheet.
2. Label every block by shape.    prose / list / record set / table / warning / meta.
3. Count every countable set.     Counts become snapshot rows and rail badges.
4. Un-concatenate the metadata.   Run-together fields are a schema in disguise.
5. Assign components from         COMPONENTS.md only. No fit → OBJECTION, ground D.
   the vocabulary.
6. Render absence explicitly.     No refs, no caveat, blank cell — say so, don't hide it.
7. Open the SCSS. Find the        Same commit as the addition.
   predecessor. Delete it.
8. Copy chrome verbatim from      Markup AND logic class. Never estimate.
   the v3 artifact.
9. Assert it, run the gate,       Exit code, not prose.
   paste the exit code.
```

Steps 1–6 are page work and produce the target. Steps 7–9 are repo work and make it land.
Doing 7 before 6 is what produces the old build in new colours.
