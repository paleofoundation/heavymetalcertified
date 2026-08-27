# CONTENT RULES — mapping the current build onto v3

For Claude Code. `COMPONENTS.md` says what v3's components *are*. This file says
**which content goes in which one**, and — as importantly — **how to disagree**.

---

## 0. Why this file exists

The `Quick read` block on `/metals/lead` kept its old styling through several passes.
That was not defiance. It is the predictable result of a real gap:

> **v3 contains no component called "Quick read."**

Given an element with no counterpart in the spec, and no channel for saying so, the
safest available move is to leave it alone. Claude Code did the correct thing with an
incomplete spec. The spec was incomplete.

Two rules follow, and they fix most of what has gone wrong:

1. **Map by function, not by name.** v3 will almost never share a label with the current
   build. Do not search v3 for `Quick read`. Ask *what job does this block do for a
   reader* — then find the v3 component that does that job. §2 is the lookup table.
2. **Unmapped content is a question, not a default.** If no v3 component does the job,
   do not keep the old styling silently. Raise an objection (§4). Silence reads as
   completion and it is the failure mode that has cost the most time.

Name the failure when you catch yourself in it: *unmapped content defaulting to status quo.*

---

## 1. Scope — three tiers, and only one is mandatory

Karen's constraint, stated plainly: **core and critical content should be reconfigured;
design elements do not necessarily require it.** So:

**TIER 1 — MUST remap.** Content that carries evidence: measured values, limits, claims,
sources, grades, dates, counts. If a reader could cite it, it gets a v3 component. This
is the entire point of the redesign and it is not negotiable on aesthetic grounds.

**TIER 2 — SHOULD remap, objectionable.** Navigational and structural content: registries,
category lists, related-page links, section ordering. Remap by default; a well-grounded
objection (§4) can keep it.

**TIER 3 — LEAVE ALONE unless asked.** Chrome and incidental design: iconography, spacing
of non-evidence blocks, decorative rules, anything with no data behind it. **Do not spend
effort here.** If a Tier 3 element already reads acceptably in the new palette, it is done.

When in doubt about tier, ask: *does this block contain a number, a date, a source, or a
claim?* Yes → Tier 1. No → Tier 2 or 3.

---

## 2. The mapping table

Current content → v3 component (all specs in `COMPONENTS.md`).

| Current build | Job it does | v3 component | Tier |
|---|---|---|---|
| **Quick read** / summary block | states the page's conclusion once, up front | **assertion block** — Lora 24px `line-height 1.45` on `#fbf5f7` / `1px #eddfe4`, `padding 24px 26px`, with the grade + provenance chip row above it | 1 |
| any markdown table | values across bodies | **burgundy-header table** | 1 |
| `[1]` footnote superscript | trace a number to its document | **citation marker + source drawer** | 1 |
| claim sentence in prose | mark what is traceable | **claim underline**, `1px dotted #cbb4bc` | 1 |
| limits listed in prose | compare instruments on one basis | **ppb-normalized chart** + caption stating legal status | 1 |
| regulatory history in prose | show tightening over time | **timeline** | 1 |
| dataset described in prose | judge independent agreement | **anchor-dataset panel** | 1 |
| label-and-number in a sentence | read a measured value | **dotted key–value row** | 1 |
| limitations paragraph | find where the page is thin | **caveat callout**, `border-left 3px #8b2a4a` | 1 |
| **no** limitations section | know the gap is a gap, not an all-clear | **caveat callout, absent state** — dotted `#e8e1db` on `#faf7f4`, 13px `#a9a1a2` (`COMPONENTS.md` §9). Tier 1 evidence pages only | 1 |
| table/chart with no note | prevent a misreading | **caption**, 11.5px `#a9a1a2` — above or below, both valid | 1 |
| bulleted registry / link list | scan what exists | **grid-of-records**, 1px-gap rules | 2 |
| "Researched by" block | attribution | hero meta row (inline, real ORCID link) | 2 |
| page snapshot card | orient before reading | hero **snapshot box**, square, dotted rows, tabular-nums | 2 |
| related links | lateral navigation | rail **Connections** | 2 |
| section headings | structure | Lora 30px, `border-bottom 1px #e8e1db`, `mt 52px`, `pb 10px`, `mb 20px` | 2 |
| icons, dividers, non-evidence spacing | — | **leave alone** | 3 |

**Rule for anything not in this table:** it is unmapped. Objection, not silence.

---

## 3. Applying a mapping

Per element, in order. Stop at any step that fails and raise it.

1. **Name the tier.** Tier 3 → stop, leave it.
2. **Name the layer** (`METHOD.md` §3). Component/CSS → proceed. Generator → this is F-16;
   log it and stop. Content (`wiki/**`, `data/**`, `raw/**`) → stop, out of scope.
3. **Name the data.** Which repo field feeds it? If the data does not exist, that is a
   legitimate objection (§4, ground B) — do not invent it and do not fake the component
   with placeholder values.
4. **Delete the old presentation** in the same commit (`METHOD.md` §1). Not out-specified.
5. **Assert it** in `v3-acceptance.json`, including an `absent: true` for what you removed.
6. **Report the exit code.** Not prose (`METHOD.md` §2).

---

## 4. How to push back

You hold discernment over function and content. Objecting is expected and is not
failure — **silently keeping the old styling is failure.** Four grounds are legitimate:

- **A · Function.** Applying it breaks behaviour, accessibility, print, or a build step.
- **B · Data.** The component needs a field the repo does not hold. Say which field.
- **C · Layer.** It is generator or content work, not component work.
- **D · Unmapped.** No v3 component does this job. Describe the job.

Not legitimate on their own: *"the current version looks fine"*, *"this is a large diff"*,
*"the old rule is more specific."* Those are the status quo defending itself.

**Format — write these into `docs/findings.md` and surface them in your reply:**

```
OBJECTION <n> · <element> · ground <A|B|C|D>
Job the element does:
Why the mapping fails:
What I propose instead:
Tier: <1|2|3>
```

**Resolution, so nothing stalls:**

- Grounds **A** and **C** — **you decide, proceed on your judgement.** Function and layer
  are yours. Log it and keep moving; do not wait.
- Ground **B** — **you decide.** Missing data is dispositive. Note the field so it can be
  added to the evidence tree later.
- Ground **D** and any Tier 1 objection — **comes back to design.** Do not resolve it by
  keeping the old styling. Leave the element untouched, log the objection, continue with
  the rest of the batch. An unmapped Tier 1 element is a gap in the spec and I will close
  it with a component.

---

## 5. Division of authority

The reason this has been friction rather than collaboration is that neither side's
authority was stated. Stating it:

**Design owns** — visual system, component vocabulary, information architecture, what
kind of presentation a kind of data receives, cross-page coherence. When these are in
question, v3 wins and the current build is the thing that changes.

**Claude Code owns** — function, build integrity, data availability, generator behaviour,
performance, accessibility, what is safely shippable in one commit, and sequencing. When
these are in question, Claude Code wins and the design adapts.

**Neither owns alone** — Tier 1 content that has no v3 component. That is a genuine gap
and it needs both: Claude Code names the job, design supplies the component.

The practical test: *is the disagreement about how it looks, or about whether it works?*
Looks → design. Works → Claude Code. Nobody has to litigate the other's half.

---

## 6. What good progress looks like

A batch is: pick a component from `COMPONENTS.md`'s codify order, find every element in
the mapping table that feeds it, apply §3 across all of them in one commit, report the
exit code and any objections.

**One component across many pages beats one page across many components.** The burgundy
table was the right first move for exactly this reason — one rule, ~3,000 pages. Do not
perfect `/metals/lead` and then start again on `/ingredients/rice`; that is the diffing
habit wearing new clothes.

Expected order, leverage descending: claim underline → citation marker + drawer →
caption + caveat → grid-of-records → then F-16 for the emitted-prose components.

---

## 7. Sitewide invariants — no bold, one canonical table

Two rules hold on every page, and both are enforced so a session cannot quietly drop
them (the recurring failure §0 describes). They are invariants, not per-page choices.

**No bold on the reading surface.** Emphasis is the type system's job — Lora for
headings and titles, IBM Plex Mono for labels and measured values — never font-weight.
Semantic `<strong>`/`<b>` and markdown `**…**` render at **normal weight (400)**; the
only heavier weight allowed is **500**, reserved for mono labels and measured values
(table `th`, snapshot values, the "See also" kicker). A number, a heading, or a phrase
made to stand out with `font-weight: 600/700` is a defect, not a style choice. If a
value truly needs to be picked out, that is a *component* decision (a shaded cell, a
burgundy color, a badge), not a weight bump.

**One canonical table.** The burgundy data table (`COMPONENTS.md §1`) is defined **once**,
in `quartz/styles/cert-chrome.scss` (`.wiki-content table` — `#9f2727` head, IBM Plex
Mono 10px/500 uppercase, per-row rule, no zebra, no hover). Do not add a second
`.wiki-content table` block anywhere, and do not hand-roll a table's head styling inline
in a generator when the canonical rule already covers it. When a duplicate is found, the
fix is to **delete the loser, never out-specify it** (`FIDELITY.md §1` / `AGENTS.md §2`).
The burgundy data table is for measured values in columns; a navigation registry
("See also", downstream links) is **not** a data table — it is the grid-of-records
(`COMPONENTS.md §8`).

**Avoid em dashes** (the sitewide language agreement, per the Index `docs/writing-style`:
this holds for all of the projects, not just the Index). Use commas, semicolons, colons,
periods, or parentheticals instead. Em dashes are permitted only inside direct quotes and
citation text (a cited work's own title/detail). This is enforced at the content layer, not
by hand: `tools/dedash-content.mjs` runs last in `prebuild` and rewrites every em dash in
generated + authored prose to context-appropriate punctuation (a colon for the dominant
"term — expansion" use, commas for a parenthetical aside or before a coordinating
conjunction), leaving standalone "no value" table placeholders (`>—<`) and masked citation
rows untouched; `node tools/dedash-content.mjs --check` then fails the build if any em dash
survives in non-citation prose. So do not chase em dashes by hand and do not fight the
sweep: fix the generator/source prose if a replacement reads wrong, and let the sweep run.

**How these are enforced (two tiers, both required).**

1. `tools/design-lint.mjs` — deterministic, no browser, **build-blocking** in `prebuild`.
   It scans generated content (`content/standards`, `content/regulations` hard; prose
   surfaces advisory) for inline `font-weight: 600–900|bold` and raw `<strong>`/`<b>`,
   and reports the table-canonicalization backlog. This is the always-runs floor: prose
   canon does not block a build, a script does. Stage new surfaces with `--warn-only`
   while a backlog drains, then flip to blocking at zero (the repo's standard convention).
2. `npm run check:v3` — the rendered-truth gate (`FIDELITY.md`), assertions in
   `design/v3-acceptance.cert.json`. It catches what a source scan cannot: a cascade
   where the source is correct but an older rule wins in the browser. It needs a browser
   (`npm i -D playwright` once) and runs in the release/deploy path. **Report its exit
   code; "I checked the SCSS" is not a pass.**

Neither tier alone is sufficient. The lint cannot see the cascade; the rendered gate is
not always run. Together they make "the canon is quietly ignored" a build failure rather
than a thing a reviewer has to notice.

---

## 8. One idea per paragraph — the reading-surface paragraph cap

The reading surface is the prose a person actually reads in `<p>` blocks: `method_prose`,
the method and derivation intros, narrative sections. Those had drifted to 300, 600, even
**1,038-word** single unbroken paragraphs (one block for an entire section). Karen's
verdict on one of them: *"there are so many words there, I refuse to read them."* That is
the whole failure. A wall of text is not more rigorous. It is less usable and, on the
surfaces that now matter most, less **retrievable**.

**The rule. One idea per paragraph. On the reading surface a paragraph targets 40–100
words and never exceeds ~120 words (roughly five to six sentences). A block longer than
that is split at its natural idea boundaries** — the shift from mechanism to worked
example, from claim to consequence, from one analyte to the next. Split by regrouping
whole sentences; **never reword to hit a count.** These are legally-defensible numbers and
citations: the transformation adds paragraph breaks and changes nothing else.

**This is not in tension with the scholarly register.** The register we write in —
Cochrane review, EFSA scientific opinion, WHO monograph — is dense in *vocabulary and
citation*, not in *paragraph length*. Those bodies paragraph by idea; an EFSA opinion does
not run a thousand words without a break. Density lives in the precision of each sentence
and the provenance behind it, not in the size of the block. A wall of text actively
*weakens* the defensibility case §7 protects: when each claim sits in its own paragraph it
is independently quotable, auditable, and citable; buried in a 1,000-word block the
load-bearing sentence (the exact ML, the exact instrument) is unfindable.

**Why it matters more now than it used to — SEO and LLMO converge on the same shape.**

- *Search (SEO).* The optimal paragraph is three to five sentences on a single topic;
  blocks past ~600 characters are flagged to break up; content pitched at a grade 6–8
  reading level averages SERP position ~3.2 against ~8.4 for graduate-level density. White
  space and short paragraphs are ranking-adjacent signals, not decoration.
- *Answer engines (LLMO / AEO).* Retrieval runs at the *passage* level, not the page: a
  model pulls the 100–300-word section that semantically matches a query, and the
  extractable "answer blocks" that get cited are ~40–60 words placed right after a heading.
  The mechanism is **chunking** — a model lifts meaning from self-contained, one-idea
  blocks. A 1,000-word paragraph is a single low-precision chunk mixing a dozen ideas: the
  worst possible unit for a system trying to quote one answer and attribute it to us. Being
  the operator of the canonical reference is worth nothing if the reference is un-chunkable.

The same edit therefore serves three readers at once: the person gets breathing room, the
search engine gets scannable structure, the answer engine gets clean attributable chunks.
There is no trade-off to manage.

**Enforcement (the §7 two-tier pattern).** `tools/lint-method-prose-length.mjs` scans the
authored prose in `data/standards/*.json` `method_prose` arrays and reports every element
over 120 words with its file, location, and word count. It runs in `prebuild`, staged
`--warn-only` while the initial backlog drained (2026-08-27) and flipping to build-blocking
at zero per the repo convention. The lint governs the *authored source*, so the fix is
always to split the source prose (regroup its sentences), never to fight the renderer. The
generator already emits one `<p>` per array element, so splitting the source is the entire
change.

**Out of scope.** Dense reference *legends* — the mono 10.5px table footnotes that
enumerate every marker (`¹…⁵`) — are reference apparatus, read by lookup not by flow. The
paragraph cap does not apply to them; if one grows unwieldy the fix is a definition list or
a notes table, not a word count.

**Research basis.** SEO: [Paragraph Length and Readability](https://www.jamilhosain.com/paragraph-length-and-readability-optimization/),
[Content Readability in SEO](https://wellows.com/blog/content-readability-in-seo/),
[Ideal Content Length for SEO](https://www.clickrank.ai/ideal-content-length-for-seo/).
LLMO/AEO: [Content Chunking & AI Extractability (Lumar)](https://www.lumar.io/blog/best-practice/content-chunking-ai-extractability-geo-aeo-explainer/),
[Answer Engine Optimization (Frase)](https://www.frase.io/blog/what-is-answer-engine-optimization-the-complete-guide-to-getting-cited-by-ai),
[LLM-Optimized Content Structures (Averi)](https://www.averi.ai/how-to/llm%E2%80%91optimized-content-structures-tables-faqs-snippets).
