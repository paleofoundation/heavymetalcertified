// Hand-authored for heavymetalcertified.com's first chrome pass.
//
// Unlike the index site, this file is NOT emitted by tools/build-nav-panels.mjs
// yet: the cert taxonomy is small and fixed, and many of the v3 design's nav
// destinations (verify, brands, apply, the governance policy, most manual
// editions) have no page in this repo. Every slug below resolves to a real
// content page, so the mega-menu never links to a 404. As those surfaces ship,
// move this to the generator + a cert navPanels.seed.ts so counts go live and
// dangling slugs fail the build.
//
// Structure/labels follow the v3 design; membership follows repo reality.

export interface NavChild {
  label: string
  slug: string
  anchor?: string
  count?: number
}

export interface NavGroup {
  heading: string
  children: NavChild[]
}

export interface NavPanel {
  key: string
  label: string
  panelLabel: string
  slug: string
  blurb: string
  extraPrefixes?: string[]
  groups: NavGroup[]
  allLabel: string
}

export const navPanels: NavPanel[] = [
  {
    key: "standards",
    label: "Standards",
    panelLabel: "Standards",
    slug: "standards",
    blurb:
      "Subcategory standards, each in its product's native basis. Published per subcategory the moment each is defensibly ready — never as a category-wide release.",
    groups: [
      {
        heading: "Seafood",
        children: [
          { label: "Marine fish, predatory", slug: "standards/fish-marine-predatory" },
          { label: "Marine fish, non-predatory", slug: "standards/fish-marine-non-predatory" },
          { label: "Freshwater fish", slug: "standards/fish-freshwater" },
          { label: "Shellfish", slug: "standards/shellfish" },
          { label: "Seaweed & kelp foods", slug: "standards/seaweed-kelp-foods" },
          { label: "Canned seafood", slug: "standards/canned-seafood" },
        ],
      },
      {
        heading: "Pantry and fats",
        children: [
          { label: "Salt", slug: "standards/salt" },
          { label: "Herbs & spices", slug: "standards/spices" },
          { label: "Olive oil", slug: "standards/olive-oil" },
          { label: "Other cooking oils", slug: "standards/cooking-oils-other" },
          { label: "Butter & ghee", slug: "standards/butter-and-ghee" },
        ],
      },
      {
        heading: "Other categories",
        children: [
          { label: "Rice-based breakfast cereal", slug: "standards/breakfast-cereal-rice-based" },
          { label: "Non-rice breakfast cereal", slug: "standards/breakfast-cereal-non-rice" },
          { label: "Chocolate", slug: "standards/chocolate" },
          { label: "Honey", slug: "standards/honey" },
          { label: "Vinegar", slug: "standards/vinegar" },
        ],
      },
    ],
    allLabel: "All 15 standards",
  },
  {
    key: "analytes",
    label: "Analytes",
    panelLabel: "The analyte panel",
    slug: "analytes",
    blurb:
      "Eight metals, ten analytes. Each page states, from the government and expert-body record and the occurrence data, why the metal is limited and why the program monitors it.",
    groups: [
      {
        heading: "Start here",
        children: [
          { label: "The Big 8 — eight metals, not four", slug: "big-8" },
        ],
      },
      {
        heading: "Tier 1 — zero-tolerance toxics",
        children: [
          { label: "Lead", slug: "analytes/lead" },
          { label: "Cadmium", slug: "analytes/cadmium" },
          { label: "Arsenic (iAs)", slug: "analytes/arsenic" },
          { label: "Mercury (MeHg)", slug: "analytes/mercury" },
        ],
      },
      {
        heading: "Tier 2 — capped to the government limit",
        children: [
          { label: "Nickel", slug: "analytes/nickel" },
          { label: "Tin", slug: "analytes/tin" },
          { label: "Aluminum", slug: "analytes/aluminum" },
          { label: "Chromium (Cr-VI)", slug: "analytes/chromium" },
        ],
      },
    ],
    allLabel: "All ten analytes",
  },
  {
    key: "manuals",
    label: "Manuals",
    panelLabel: "Program Manuals",
    slug: "manuals",
    blurb:
      "The bound, citable edition of each category. The edition named on a certificate is the one that governs it.",
    groups: [
      {
        heading: "Published editions",
        children: [
          { label: "Infant & Child Foods", slug: "manuals/infant-and-child-foods" },
        ],
      },
      {
        heading: "Browse",
        children: [
          { label: "All editions", slug: "manuals" },
        ],
      },
    ],
    allLabel: "All editions",
  },
  {
    key: "briefings",
    label: "Briefings",
    panelLabel: "Standards Briefings",
    slug: "briefings",
    blurb:
      "What the standard changes, and for whom. Written for the readers who decide whether a certificate is worth its price.",
    groups: [
      {
        heading: "Primers",
        children: [
          { label: "What HMTc Is", slug: "briefings/hmtc-primer" },
          { label: "Four Metals Is No Longer Enough", slug: "briefings/brief-7-four-vs-eight" },
          { label: "Named as a Hazard, Left Unlimited", slug: "briefings/the-prop-65-gap" },
          { label: "What Organic Doesn't Say", slug: "briefings/brief-3-what-organic-doesnt-say" },
          { label: "The Open Category", slug: "briefings/brief-2-open-category" },
        ],
      },
      {
        heading: "Counsel and finance",
        children: [
          { label: "After Palmquist", slug: "briefings/after-palmquist" },
          { label: "The Cost of Being Uncertified", slug: "briefings/brief-4-cost-of-being-uncertified" },
          { label: "The Evidence a Jury Will See", slug: "briefings/defense-counsel-briefing" },
        ],
      },
      {
        heading: "Retail and market",
        children: [
          { label: "The Retailer as Anchor", slug: "briefings/brief-5-retailer-as-anchor" },
          { label: "The Premium Promise", slug: "briefings/brief-6-premium-promise" },
          { label: "The Surveillance Protocol", slug: "briefings/brief-8-surveillance-protocol" },
        ],
      },
    ],
    allLabel: "All 11 briefings",
  },
  {
    key: "program",
    label: "Program",
    panelLabel: "The program",
    slug: "program/structure",
    blurb:
      "How a limit is set, how a product is tested against it, and what happens when a lot falls short.",
    groups: [
      {
        heading: "How it works",
        children: [
          { label: "The Big 8 — why eight metals", slug: "big-8" },
          { label: "Program structure & gates", slug: "program/structure" },
          { label: "Two remediation pathways", slug: "program/two-pathways" },
        ],
      },
      {
        heading: "Policy and the mark",
        children: [
          { label: "Confidential Remediation Track", slug: "program/remediation" },
          { label: "Using the mark", slug: "mark" },
        ],
      },
    ],
    allLabel: "Program structure",
  },
  {
    key: "brands",
    label: "Brands",
    panelLabel: "Certified brands",
    slug: "brands",
    blurb:
      "Every brand carrying the mark, and the route to check any single certificate. The directory is a published list, not a census.",
    groups: [
      {
        heading: "Look up a certificate",
        children: [
          { label: "Check a lot number", slug: "verify" },
          { label: "Check a certificate number", slug: "verify" },
          { label: "Check a product code", slug: "verify" },
        ],
      },
      {
        heading: "The mark",
        children: [
          { label: "The certified-brand directory", slug: "brands" },
          { label: "Become a certified brand", slug: "apply" },
          { label: "Scope of the mark", slug: "mark" },
        ],
      },
    ],
    allLabel: "The full directory",
  },
]
