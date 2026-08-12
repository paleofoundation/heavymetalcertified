---
title: Verify a Product Certificate
type: verify
audience: [regulator, consumer, retailer-compliance]
description: "The authoritative product-specific lookup route for a lot number, certificate number, or product code, including status, scope, governing edition, and mark authorization."
snapshot:
  - { k: "Certificates issued", v: "0" }
  - { k: "Lookup state", v: "Not yet active" }
  - { k: "Certification scope", v: "Per product" }
  - { k: "Measured values", v: "Not public" }
connections:
  - { label: "Using the mark", href: "/mark" }
  - { label: "Standards register", href: "/standards" }
  - { label: "Certified Products Directory", href: "/brands" }
  - { label: "Standard stability", href: "/standard-stability" }
rail_box:
  variant: note
  title: "No certificates have been issued"
  body: "Lookup will activate with the first issued product certificate. This page does not display a fictitious result."
---

No product certificates have been issued. The lookup control is therefore not active, and this page does not present a specimen product as though it were certified.

<div style="display:flex;align-items:stretch;border:2px solid #9f2727;max-width:38rem;overflow:hidden;background:#fffdfb;margin:22px 0 12px">
  <input type="text" disabled aria-label="Certificate lookup unavailable because no certificates have been issued" placeholder="Lookup activates with the first certificate" style="flex:1 1 auto;min-width:0;border:0;outline:none;font:inherit;font-size:15px;padding:13px 15px;color:#736b6b;background:#faf7f4" />
  <button type="button" disabled style="border:0;background:#9f2727;color:#fff;font:inherit;font-family:'IBM Plex Mono',monospace;font-size:10.5px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;padding:0 20px;opacity:.62">Verify</button>
</div>

When the register opens, a query will require a lot number, certificate number, or product code and return one matching product record. Optional directory visibility does not control this authoritative lookup.

## What a verification result must show

| Field | Why it matters |
|---|---|
| Product and legal holder | Identifies the exact certified subject. |
| Form and basis | Prevents powder, liquid, dry-as-sold, as-consumed, and contact-product decisions from being mixed. |
| Certificate number | Gives the claim a durable identifier. |
| Standard and manual editions | Shows the rule governing the decision. |
| Status and effective dates | Shows whether mark use is currently authorized. |
| Eight priority metals / ten-analyte panel | Defines the tested scope without implying control of every analyte. |
| Authorized scope line and QR destination | Lets a customer compare the package claim with the approved wording. |
| Correction and report route | Gives regulators, retailers, and consumers a controlled way to flag an error or misuse. |

## What it will not show

The public record will not represent a product as “safe,” “heavy metal free,” or free of risk. It will not imply that the brand’s other products are certified.

Measured concentrations, formulas, supplier records, complete laboratory reports, and chain-of-custody files remain controlled records except where the governing agreement, law, regulator request, legal process, or program rule requires disclosure.

## How to read a mark now

Until the first certificate is issued, no product is authorized to present an HMTc product certificate. A package or advertisement claiming a current HMTc certification should therefore be reported for review.

After lookup activates, investigate a claim when the identifier does not resolve, product or form does not match, status does not authorize the mark, record has expired, artwork is altered, or surrounding language exceeds the certificate scope.

[Review the complete mark guide](/mark).
