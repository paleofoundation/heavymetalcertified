# FSIS label-submission packet — HMTc certifier SOP

**Status:** Draft for Karen's review. Internal operating procedure — not published.
**Applies to:** Any HMTc-certified product under FSIS jurisdiction that will display the mark on the label: meat, poultry, and egg products, including meat-based products such as bone broth (Category 35). **Does not apply** to FDA-regulated products — seafood (Category 6) and most pet food (Category 17) are FDA/AAFCO, not FSIS, and take the ordinary FDA labeling route.

**Confirm jurisdiction first.** If the product contains meat or poultry above the FSIS threshold, or is a processed egg product, it is FSIS and this SOP applies. If unsure, treat as FSIS and confirm.

---

## The rule in one paragraph

On an FSIS-regulated product, a third-party certification seal is a "special statement or claim" (9 CFR 412.1). It is **not** eligible for generic approval. The establishment must submit the finished label as a **sketch** through the **Label Submission and Approval System (LSAS)** and obtain approval before printing. The label is judged for whether the claim is truthful, substantiated, and not misleading (9 CFR 317.8 / 381.129). Approval attaches to the **label**, not to HMTc — there is no blanket certifier approval. Our job is to hand the establishment a complete, defensible file.

---

## What the certifier supplies to each establishment

Four of the five items the file needs already exist as certification artifacts. Provide them as a single packet when the certificate issues:

1. **Seal artwork** — the mark in the correct color and clear-space, with the **required scope line** shown as it must print (what was measured, to what limit, in what basis). Never supply the mark without its scope line.
2. **Certificate** — current, naming the product, facility, and certification term.
3. **Governing standard** — the published HMTc subcategory standard the mark refers to (the maximum level and basis). This is the *definition* of the claim. Link to the live `/standards/<subcategory>` page and include a dated snapshot.
4. **Trademark license** — the executed license authorizing this establishment to display the mark on this product (mark serial 99307306).
5. **Verification address** — the public `/verify` URL that prints with the mark, at which the certificate and standard can be confirmed.

## What the establishment adds and submits

The establishment supplies its own lot data and its own label, then submits:

- The **finished label sketch** (printer's proof) with the mark and scope line in place, through **LSAS**.
- Held on file at the establishment for inspection (not necessarily uploaded, but producible on request): the **accredited-laboratory analytical report** for the certified lot (ISO/IEC 17025 lab), plus items 2–5 above.

## Scope-line requirement (the load-bearing detail)

The mark must never appear as a bare seal implying a blanket assurance. It travels with a scope line stating precisely what was tested and to what limit — this is what keeps the claim defined and defensible, and it is the difference between a seal the FSIS review passes and an adjective it stops. The scope-line spec is governed by `/mark`; do not vary it per establishment.

## Vocabulary firewall

Do not let "clean," "pure," "toxin-free," "safe," or "chemical-free" appear adjacent to the mark in the label copy we supply or advise on. The mark is a *tested-measurement* claim. Purity vocabulary is exactly what draws the FSIS objection and forces a seal to be redrawn.

## Sequence

1. Confirm FSIS jurisdiction.
2. Issue certificate → assemble and deliver the five-item packet.
3. Establishment places mark + scope line on the label design.
4. Establishment submits the label sketch via LSAS and waits for sketch approval before printing.
5. Establishment retains the lab report and packet on-site for inspection verification.

## Open items (tracked)

- **askFSIS pre-clearance** of the seal wording and substantiation list is pending (see `askfsis-inquiry-hmtc-mark.md`). Until a response is on file, treat this SOP as our best reading of 9 CFR 412, not an agency-confirmed position.
- **Verification-URL-on-label is a confirmed FSIS requirement** (Certified Paleo precedent): the public `/verify` address must print with the mark. This is already item 5 above and is baked into the scope-line spec. Open sub-point: confirm whether FSIS also required the *certifier name* to appear in addition to the URL, and add it to `/mark` if so.
