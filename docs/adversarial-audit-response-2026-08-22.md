# Response to the adversarial audit of HMTc and the Heavy Metal Index

**Date:** 2026-08-22
**Scope of this document:** the `heavymetalcertified` repo only (the HMTc cert site). The
Heavy Metal Index lives in a separate repo (`heavy-metal-index` / heavymetalindex.com) and
is **not** attached to this session, so the audit's HMI-specific claims cannot be verified or
fixed here. See §5.
**Method:** every claim below was checked against the working tree at HEAD
(`claude/heavy-metal-audit-7jdvl4`, off `d860d29`). Quotes are verbatim; counts were computed
from `content/standards/*.md` front-matter and `data/standards/hmtc_standards_catalog.json`.

---

## 1. Bottom line

The audit is not a hit piece built on invented facts. Its concrete, checkable claims about the
HMTc site are **overwhelmingly accurate — because it is quoting our own published pages back to
us.** The 348/320/1,794 snapshot, the $5k/$10k rush fees, the P97/P45 pass-rate levers, the
"heavy-metal safety only" language on the peptide/SARM pages, the zero-numeric-limit standards,
the "Evidence a Jury Will See" briefing — all real, all on the live site, all cited correctly.

That means the useful question is **not** "is the audit right about what we say?" (mostly yes),
but "which of these actually land as damage, and which are already answered or overstated?" On
that reading the audit sorts into four piles:

| Pile | Count | What to do |
|---|---|---|
| **Genuine internal own-goals** — we contradict ourselves or make an unsubstantiated claim | ~7 | Fixable now, cheaply. §3 |
| **Accurate quote, but the audit overstates the harm** — a defense already exists on the site | ~6 | No code change; sharpen the framing. §2 |
| **Business / claims-architecture calls** — real strategic risk, but your decision, not a bug | ~8 | Surface + recommend, don't unilaterally change. §4 |
| **Out of scope here** — HMI-repo claims (incl. the "Infinity%" PRISMA point) | ~10 | Needs the other repo attached. §5 |

The audit's strategic thesis — *institution-shaped before market-proven; the two properties are
correlated risk, not a flywheel; comprehensiveness is being mistaken for demand* — is a
legitimate critique and is **not refuted by anything in this repo.** It is a business judgment,
not a defect. This document does not argue you out of it; it tells you which sentences on the
site a hostile reader can actually use, and which ones you can close before they do.

---

## 2. Where the audit is accurate but overstates the harm (a defense already exists)

These are real quotes, but the site already carries the answer the audit says is missing. The
fix here is *emphasis/proximity*, not correction.

- **"Thresholds are chosen to manufacture winners and losers" (audit I.6).** The pass-rate
  machinery (`content/program/two-pathways.md:18-21`, "The percentile is not the goal; the pass
  rate is") applies **only to occurrence-set cells** — the four Tier-1 toxics and the cells no
  government regulates — and Tier-1 toxics are floored at `min(occurrence, strictest government
  ML)` (`data/method/method-v2.json:10`). Most cells are a straight government-limit lookup.
  There is even a build-blocking anti-drift lint (`method-v2.json`, `method-drift-lint.mjs`)
  whose whole job is to stop the pass-rate framing being quoted "as the universal method." The
  audit does exactly what that lint exists to prevent. **Overstated.**
- **"Binary pass/fail obscures uncertainty" (audit I.6).** Not a naive binary:
  `content/briefings/brief-8-surveillance-protocol.md:88` applies the lab's *expanded
  measurement uncertainty* symmetrically (pass only if result + uncertainty ≤ limit; fail only
  if result − uncertainty > limit; in-between = confirmatory retest), on a 3-lot baseline taken
  from the worst lot. The guard band the audit demands is already the decision rule. **Overstated.**
- **"P45 reads as lowering standards where data is bad" (audit I.6).** The page pre-empts this
  verbatim: *"out of context it could read as the certifier lowering its standards where the
  data is bad. It is the opposite"* (`two-pathways.md:25`). **Already answered.**
- **"Confidential remediation increases the risk brands fear" (audit I.9).** The site concedes
  this openly rather than hiding it: *"The record is admissible for the brand and discoverable
  by the plaintiff, both at once"* (`defense-counsel-briefing.md:86`);
  *"Confidentiality … is not attorney-client privilege"* (`what-happens-to-your-data.md:53`,
  `program/remediation.md:29`). This is a strength, not a gap — it's the honest disclosure the
  audit assumes is absent. **Already answered.**
- **"Certification is a moving floor that punishes the cleanest customers" (audit I.13).** The
  mechanism is real and disclosed ("moving floor," `hmtc-primer.md:94`), with mitigations
  (≤20% reduction per event, 12–18 month transitions, grandfathering). What the site does *not*
  do is concede the specific tension the audit raises — that a clean brand's own Status-A/B lot
  data feeds the ratchet that later tightens on it. That concession is defensible to add, but
  the "punishes" framing is **overstated** given the grandfathering.
- **"Safety is simultaneously claimed and disclaimed" (audit I.4)** — *partly* overstated. Calling
  a document a "heavy-metal-safety standard" (its subject domain) is technically distinct from
  "this product is safe" (a health verdict), and the site disclaims the latter forcefully in six
  places (`mark.md:37,45,89`, `index.md:44,74`, `verify.md:60`, `brands.md:85`). **But** see §3.2
  — one specific pairing is a true contradiction, not a semantic quibble.

---

## 3. Genuine internal own-goals (accurate, damaging, and fixable now)

These are the audit's real teeth on this repo: places where we contradict ourselves or make a
claim we have already told ourselves not to make. Each is small, local, and closeable without
touching the business model. None is a matter of taste.

> **Update 2026-08-23:** §3.1, §3.2 and §3.3 are **fixed in this PR** (edits made at the
> source — `data/briefings/after-palmquist.md`, `data/standards/cat26-pages.json`, and
> `content/verify.md` — then regenerated and dedashed; all build-blocking lints pass). §3.6 is
> **reclassified** below (not a defect). §3.4, §3.5 and §3.7 are left for a decision — see notes.

### 3.1 Unsubstantiated insurance-premium claim — contradicts our own claim discipline
`content/briefings/after-palmquist.md:110`:
> "**Several major carriers are evaluating reduced-premium endorsements** for suppliers certified
> to recognized third-party heavy-metal standards. … certified suppliers **pay less than
> uncertified suppliers for the same coverage**."

No named carrier, no executed program, **no citation** (the surrounding loss figures cite `[10]`/
`[14]`; this sentence cites nothing). And it **contradicts our own more-disciplined page**:
`brief-4-cost-of-being-uncertified.md:47,52` labels the insurance effect *"Directional: no
published magnitude"* and states *"no published magnitude is asserted."* This is precisely the
Lanham §43(a) / FTC §5 substantiation exposure that `tools/claim-discipline-lint.mjs` was built
to prevent — the lint just doesn't cover this pattern (it only catches superiority superlatives).
**Recommended fix:** reword `:110` to match `brief-4` ("underwriters are repricing this exposure;
the direction is toward lower premiums for documented programs, magnitude carrier-specific and
unpublished"), and drop the flat "pay less … for the same coverage." Optionally extend the lint.
**Status: fixed in this PR** (source `data/briefings/after-palmquist.md`; regenerated). The briefing
PDF was not rebuilt — same open item as `docs/findings.md` 2026-08-08.

### 3.2 The mark's prohibited-claims list bans exactly what the SARM/peptide pages say
`content/mark.md:97` (and `:109`) prohibit: *"Any language implying the mark indicates absence of
heavy metals."* Yet `content/standards/aas-injectable.md:32` and `sarms-oral.md:32` state: *"the
mark speaks solely to the **absence of a detectable heavy-metal burden** on the tested lot."*
This is not a semantic tension — it is the program breaking its own published rule on two pages.
A hostile reader lands `mark.md` and the SARM page side by side and quotes them against each
other. **Recommended fix:** reword the two `:32` sentences to the compliant form ("the mark
speaks solely to measured heavy-metal content against the panel on the tested lot"), and consider
whether "Certification here is heavy-metal safety only" should read "heavy-metal content only."
**Status: fixed in this PR** — the `absence` clause on all 5 cat26 pages (aas-injectable, sarms-oral,
peptides ×2, research-chem) now reads "the mark speaks solely to the heavy-metal content measured on
the tested lot against the panel" (source `data/standards/cat26-pages.json`). The "heavy-metal safety
only" wording is **left** for the §4.3 sitewide safety-language decision, so these 5 pages stay
consistent with the other 212.

### 3.3 `/verify` still advertises "15" standards while the rest of the site says 348
`content/verify.md:8`: `{ k: "Standards available", v: "15" }`. Everywhere else now says 348
(`index.md:24`, `standards/index.md:37`, `brands.md:35`). The `4a8d0f0` "reconcile snapshot
counts" commit updated the homepage/register/FAQ/brands to 348 but **missed `verify.md`**, which
still carries the stale figure from the retired 15-row food catalog. A regulator's first stop is
`/verify`; the 15-vs-348 gap on adjacent pages is the "inconsistent enough to create immediate
doubt" the audit opens with (I.1). **Recommended fix:** update `verify.md:8` to the same basis as
the other pages (or delete the stat if "available to certify against" is meant to differ from "in
force" — but then say which, consistently).
**Status: fixed in this PR** — `verify.md:8` now reads 348, matching `/standards`. Caveat: this is a
hand-maintained number (like the homepage snapshot) and will drift again as pages are added; the
durable fix is to compute it the way `build-standards-pages.mjs` computes the `/standards` count.

### 3.4 The machine catalog (15 rows) no longer matches the site (348)
`data/standards/hmtc_standards_catalog.json` still reports `locked_rows: 15`, `analyte_cells_
published: 3`. The site's 348/320/1,794 is computed from the 348 committed `content/standards/`
pages, not from this catalog. So the human-readable HTML and the machine-readable data now
**disagree by ~23×.** A technical reviewer (or an AI-licensing buyer) who pulls the JSON sees a
different program than the one on the homepage. **Recommended fix:** re-sync the catalog from the
current generator source, or retire it and point `data.md`'s machine index at the live per-page
data. This one is bigger than a copy-edit — flagged, not auto-fixed.

### 3.5 `apply.md` says lab cost is "included"; `brief-4` says it's a separate pass-through
`apply.md:76,107` ("Laboratory analysis … included in certification") vs
`brief-4-cost-of-being-uncertified.md:69` ("laboratory testing is an un-marked-up pass-through
to an accredited lab … disciplined by the lab market"). Both can't be the buyer's mental model.
**Recommended fix:** pick one (pass-through is the more defensible and the more common
certification-body posture) and align both pages.

### 3.6 `standards/index.md` labels the panel "11", the homepage "10" — RECLASSIFIED: not a defect
`standards/index.md:9` shows "Analytes per row: 11"; `index.md:27` shows "Certified analyte panel:
10". On closer inspection this is **not** a missed hand-edit (my first read was wrong):
`build-standards-pages.mjs:354` computes the `/standards` figure as `Math.max(panel widths across all
in-force pages)` — a deliberate "widest panel any page publishes" definition (11, because some pages
carry an 11th conditional cell), whereas the homepage states the *certified* panel (10, with MeHg a
named conditional 11th). Both are correct on their own definition; they only look inconsistent because
the two labels read alike. **Recommendation (optional, not urgent):** relabel one so the definitions
are legible — e.g. `/standards` → "Widest panel: 11" or "Panel: 10 (+1 conditional)". No change made;
a wording call, not a correctness bug.

### 3.7 Small numeric drift in the committed pages (likely stale, verify before "fixing")
Computed from front-matter: the 348 pages sum to **1,793** firm limits (homepage says **1,794**),
and `content/standards/butter-and-ghee.md` is **missing its `firm_analytes` field entirely**
(every other page has it). Per `docs/findings.md` (2026-08-07), committed `content/standards/`
pages are known to drift from their generators and are regenerated by `prebuild`, so the *live*
site may already be 1,794/complete. **Recommended action:** run `npm run prebuild`, diff
`content/standards/`, and commit the regenerated pages so disk == live (this also closes the
1,793/1,794 and butter-and-ghee gaps if they are indeed stale). Don't hand-edit the numbers.

---

## 4. Business & claims-architecture decisions (real risk, but yours to make)

These are the audit's strategic core. They are **not defects** and I have not changed them. They
are recorded here with a recommendation so the decision is explicit rather than defaulted.

1. **Zero-numeric-limit certification (27 pages).** `firm_analytes: 0` pages (AAS, oral SARMs,
   injectable/nasal peptides, raw research chem, plus cookware/tableware/menstrual/packaging)
   are certifiable via "passing every control." Defensible for control-based device/migration
   standards; hardest to defend on the injectables. The homepage "at or below every value" claim
   (`index.md:73`, `mark.md:29`) is *trivially* satisfied when there are no values. **Recommend:**
   either (a) publish an explicit numeric decision anchor (e.g. the Q3D/USP PDE as a ceiling, not
   just an escalation flag) so "every value" is non-vacuous, or (b) give control-only standards a
   distinct mark/scope line so they don't ride on the numeric claim.
2. **SARMs / unapproved-peptide scope (reputational).** FDA treats SARMs as unapproved drugs.
   The disclaimer ("does not endorse legality/efficacy") will not stop the mark being used as
   reassurance on a legally precarious product, and it sits in the same taxonomy as infant food.
   **Recommend:** decide explicitly whether the injectables/SARMs family stays in the *same*
   program and mark as Category 1, or is spun into a separately-branded content-only scheme.
   This is the single highest reputational-contagion item in the audit.
3. **"heavy-metal-safety standard" wording on 217 pages.** Defensible as domain language (§2),
   but the FTC "net impression" risk is real given the dominant words are "…Certified." **Recommend:**
   a claims-counsel read on whether "safety" should become "content"/"contaminant" in the
   standard-page `description` template (`build-category-standard-pages.mjs`). Sitewide generated
   change — do it deliberately, not in an audit-response commit.
4. **348 "in force" vs 0 certificates (credibility inversion).** `brands.md:35` already frames
   this honestly ("an empty register, not a hidden one"). The exposure is that "in force" reads
   as "in use." **Recommend:** keep the honest framing; consider "published / open for
   application" over "in force" until the first certificate issues.
5. **Pricing opacity + rush fees.** Revenue-tiered, unpublished, $5k/$10k rush. The rush optic
   ("faster safety certificate for more money") is the weak point, even though the technical bar
   is identical. **Recommend:** state on `apply.md` that rush changes queue position only, never
   the standard or the outcome. (Pricing publication is a go-to-market call.)
6. **One mark across incomparable bases.** Same mark for 90,000 µg/kg accessible-part lead
   (oral irrigator) and infant-food ppb. Scientifically fine (different matrices/routes), but the
   mark erases the distinction. **Recommend:** this is what the mandatory scope line is for;
   consider making the basis (content / migration / as-consumed) part of the required scope line.
7. **Litigation-defense positioning** ("Evidence a Jury Will See," expected-loss/ROI figures).
   Mostly modeled and labeled as such; the one uncited assertion is §3.1. **Recommend:** keep the
   modeling clearly labeled "modeled," and make sure every ROI number carries its assumption.
8. **The audit's structural asks** (split HMI/HMTc legally, partner with an accredited 17065
   body, seat the independent committee before issuing certificates, narrow to one product family
   first). These are company-strategy decisions outside this repo. Noted, not actioned.

---

## 5. Out of scope: the Heavy Metal Index claims

The audit's *most quotable* single item — the PRISMA-equivalent page reporting "3,055 source
pages from **0** identified papers → **Infinity%** inclusion," plus the deferred PDF-verification /
inter-rater / synthesis-reproducibility program and the "Cochrane-level" positioning — all live in
the **heavy-metal-index** repo, which is not attached to this session. I could not verify or fix
any of it here. If you want that audited and (where real) fixed, attach the repo (I can pull it in
with `add_repo` once it's authorized) and I'll run the same evidence pass. If the "Infinity%"
figure is really on the live HMI PRISMA page, it is the cheapest and most urgent fix in the entire
audit and should be closed today regardless of everything above.

The one HMI-adjacent thing this repo *does* assert is the firewall (`README.md`,
`firewall-cert-lint.mjs`, `index.md:42`): one-way citation, no corpus re-hosting. The audit's
"circular legitimacy" critique (same operator both sides) is a governance point the firewall
narrows but cannot fully answer — an accredited-body partnership or a seated independent committee
is what actually answers it (§4.8).

---

## 6. Recommended sequencing

1. **Done in this PR:** §3.1 (insurance claim), §3.2 (mark self-contradiction), §3.3 (`/verify`
   15→348). §3.6 reclassified (not a defect). All build-blocking lints pass.
2. **This week, one small decision each (not done — need your call):** §3.4 (catalog re-sync),
   §3.5 (lab-cost wording), §3.7 (regenerate stale pages + fix the 1,793/1,794 homepage drift).
3. **With counsel / as strategy:** §4 — especially §4.2 (SARMs scope) and §4.1 (zero-limit
   numeric anchor), which are the two items a brand GC or regulator hits first.
4. **Separately:** attach the HMI repo and run the §5 pass; close "Infinity%" first if real.

The claim-discipline-lint philosophy this program already believes in — *don't ship a claim you
can't substantiate, because one false claim collapses the Daubert thesis the whole program is
sold on* — is the right lens for all of §3. Every item there is a claim we've already told
ourselves not to make.
