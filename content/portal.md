---
title: Brand Control Room — Specimen
type: portal
noindex: true
audience: [brand-legal, retailer-compliance, certifier]
description: "A nonfunctional specimen of the future account surface for readiness, evidence, product-specific certificates, lots, CAPA, mark rights, people, and audit history."
snapshot:
  - { k: "Account access", v: "Not yet available" }
  - { k: "Displayed records", v: "Illustrative only" }
  - { k: "Readiness", v: "Pre-certification" }
  - { k: "Certificates", v: "Product-specific" }
connections:
  - { label: "Private Readiness", href: "/readiness" }
  - { label: "What happens to your data", href: "/what-happens-to-your-data" }
  - { label: "What if a product does not pass?", href: "/what-if-we-dont-pass" }
  - { label: "Verify a certificate", href: "/verify" }
  - { label: "Using the mark", href: "/mark" }
rail_box:
  variant: note
  title: "This is a design specimen"
  body: "No account, certificate, laboratory result, CAPA, user, or date shown here is real."
---

This page is a nonfunctional design specimen for the future Brand Control Room. It does not authenticate users, accept files, create an applicant record, issue a certificate, or display live program data.

The specimen exists to publish the information architecture before software is described as operational.

## One account, two legally different stages

| Stage | What the Control Room must show | What it must never imply |
|---|---|---|
| Private Readiness | Product scope, evidence inventory, Evidence Reuse Passport, gaps, portfolio sequence, cost and timing assumptions, recommended route | That the brand applied, failed certification, holds a certificate, or may use the mark. |
| Confidential Remediation | Pre-certification CAPA, milestones, evidence, legal-limit confirmation, support record | That remediation privately preserves a certificate; no certificate exists in this track. |
| Formal Certification | Accepted scope, governing standard and edition, work order, sample plan, evidence, decision and appeal record | That paying a fee purchases an outcome or that a partial panel certifies a product. |
| Surveillance and Renewal | Later lots, status, change control, trends, CAPA, mark authorization, renewal and transition notices | That self-reporting automatically keeps a certificate active. Status follows the published consequence rules. |

## Control Room modules

| Module | Record it must control |
|---|---|
| Portfolio | Exact product, form, formulation family, market, intended consumer, facility, category and current stage. |
| Evidence Passport | Each laboratory report or COA, acceptance criteria, accepted scope, qualification, rejection reason and missing work. |
| Work and cost | Quote lines, assumptions, dependencies, authorizations, laboratory charges, logistics, confirmation and remediation costs. |
| Samples and lots | Product and lot identity, custody, reserve samples, laboratory, method, reporting basis, result status and decision link. |
| Certificates | Product-specific certificate, governing editions, dates, status, public verification fields and authorized claims. |
| CAPA | Trigger, investigation, root cause, action, owner, evidence, deadline, verification and closure. |
| Mark rights | Approved asset, product and form, markets, scope line, QR destination, artwork versions, approval and removal notices. |
| People and permissions | Named users, role, least-privilege access, invitation, removal, review and authentication history. |
| Audit history | Who viewed, changed, approved, exported, corrected or disclosed a record and why. |

## Example state model

The future interface should not collapse every event into “pass” or “fail.” It should display the stage and consequence separately.

| Example event | Stage | Certificate effect | Public effect |
|---|---|---|---|
| Existing report lacks lot identity | Private Readiness | None; no certificate exists | None. |
| Pre-certification baseline is not certifiable but remains within applicable legal limits | Confidential Remediation may be available | None; no certificate exists | No failed-applicant listing. |
| Formal result is borderline under the uncertainty rule | Certification decision | Pending confirmation under the published rule | No result is represented as final before confirmation. |
| Certified product has a later nonconformity | Surveillance | Status, release and mark consequences follow the program rules | Verification changes only as the governing status and disclosure rules require. |
| Result may exceed an applicable legal limit | Any stage | Certification workflow stops or escalates | Law, recall, regulator and contractual duties control; confidentiality does not override them. |

## Data boundary before software opens

The Control Room should not accept private records until the agreement and data notice define access, processors, purpose, retention, deletion, export, correction, legal holds, compulsory process, regulator requests, audit logging, account closure, and the Heavy Metal Index firewall.

The product UI is not the policy. The controls must exist in the governing terms and technical enforcement together.

[Review the current data boundary](/what-happens-to-your-data).

[Use the on-device readiness check](/readiness) without creating an account.
