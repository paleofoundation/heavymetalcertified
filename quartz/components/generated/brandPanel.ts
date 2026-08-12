import type { NavPanel } from "./navPanels"

// Brand-first navigation is intentionally maintained separately from the
// generated evidence/navigation panels. It represents the applicant decision
// journey rather than a content inventory, and therefore must not be rebuilt
// from the standards or editorial seed.
export const brandPanel: NavPanel = {
  key: "brand-control",
  label: "For Brands",
  panelLabel: "For Brands",
  slug: "for-brands",
  extraPrefixes: [
    "readiness",
    "what-if-we-dont-pass",
    "cost-and-timing",
    "brand-bill-of-rights",
    "trust",
    "category-readiness",
    "apply",
  ],
  blurb:
    "A controlled route to assess existing evidence, understand consequences, close gaps, certify what the record supports, and maintain it over time.",
  groups: [
    {
      heading: "Begin",
      children: [
        { label: "For Brands", slug: "for-brands" },
        { label: "Private Readiness", slug: "readiness" },
        { label: "Apply for certification", slug: "apply" },
        { label: "Category readiness", slug: "category-readiness" },
      ],
    },
    {
      heading: "Know before testing",
      children: [
        { label: "What if we do not pass?", slug: "what-if-we-dont-pass" },
        { label: "Cost and timing", slug: "cost-and-timing" },
        { label: "Brand Bill of Rights", slug: "brand-bill-of-rights" },
        { label: "Trust Center", slug: "trust" },
      ],
    },
    {
      heading: "Prove and verify",
      children: [
        { label: "Standards register", slug: "standards" },
        { label: "Using the mark", slug: "mark" },
        { label: "Verify a certificate", slug: "verify" },
        { label: "Certified-brand directory", slug: "brands" },
      ],
    },
  ],
  allLabel: "Brand control center",
}
