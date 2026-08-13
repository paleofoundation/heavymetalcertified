# Outstanding ledger

Human-gated decisions and findings that a build cannot resolve on its own. No
`tools/outstanding/log.mjs` exists yet, so entries are recorded here as inline
`OUTSTANDING` sentinels (greppable by the `OUTSTANDING` token).

---

<!-- OUTSTANDING
id: remediation-postcert-voluntary-disclosure-protocol
repo: cert
scope_class: human-gated
type: decision
opened: 2026-08-13
branch: claude/remediation-governance-reconcile
owner: Karen Pendergrass / counsel
title: Ratify — or decline — a post-certification voluntary-disclosure protocol
-->

## OUTSTANDING · remediation post-certification protocol (decision)

- **repo:** cert
- **scope_class:** human-gated
- **type:** decision
- **opened:** 2026-08-13
- **branch:** `claude/remediation-governance-reconcile`
- **owner:** Karen / counsel

**The defect (now reconciled on the branch).** The live pages
[`/program/remediation`](../content/program/remediation.md),
[`/program/structure`](../content/program/structure.md), and
[`/portal`](../content/portal.md) promised that a **certified** brand could
voluntarily self-report a contamination finding and **retain its certificate and
mark** — "the certificate holds", "Effect on certificate: none if on schedule",
confidential-track row "Certificate held — yes", "the certificate is unaffected".

**Ground truth.** Program Manual **Part 2.4** (`data/manuals/cat1-manual/part2-program.md`)
defines the Confidential Remediation Track as an **entry and support pathway for
brands whose baseline does not reach Status A or B** and states, in terms, that it
is "**not a post-certification mechanism**"; the mark "**shall not be used … until at
least one SKU achieves Status A or B**." This is corroborated by Part 2.2 (status
framework), Part 2.7 (integrity), the Part 5 glossary, `/mark` (Part 2.5 §6.1), and
the litigation briefings (`hmtc-primer`, `defense-counsel-briefing`, `after-palmquist`),
all of which already describe the Track as pre-certification with the mark withheld.
**No ratified post-certification voluntary-disclosure protocol exists** anywhere in
content/data/docs/tools — there is no "Governance Policy §12"; every reference traces
to Part 2.4 (pre-certification). The manual's own consistency auditor already lists
`certificate held / certificate unaffected` as a **retired, forbidden** variant.

**Decision needed (Karen's / counsel's).** Does HMTc want to ratify a
**post-certification** voluntary-disclosure protocol under which a certified brand
that self-reports keeps its certificate and mark while an item is open and on schedule?

- **NO (default — shipped on this branch as Version A).** The three pages are
  reconciled to the pre-certification reality: the Track issues no certificate and
  authorises no mark until Status A/B. Promote the branch as-is.
- **YES.** Ratify the protocol in the Program Manual / Governance Policy first, then
  promote **Version B** — [`content/program/remediation-postcert-protocol.md`](../content/program/remediation-postcert-protocol.md),
  currently `draft:true` (excluded from the build) — replacing the `[§ proposed]`
  markers with the ratified section number, and relax the auditor's
  certificate-retention tripwire deliberately.

**Guardrail added.** `tools/audit-cat1-manual-consistency.mjs` now fails if the live
`/program` + `/portal` pages reassert certificate retention for a remediation item, so
the promise cannot silently return before a rule exists.
<!-- /OUTSTANDING -->
