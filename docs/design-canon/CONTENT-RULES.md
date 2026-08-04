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
| section headings | structure | Lora 30px, `border-bottom 1px #e8e1db`, `pb 10px` | 2 |
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
