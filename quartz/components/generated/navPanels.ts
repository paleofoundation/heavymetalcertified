// Hand-authored for heavymetalcertified.com.
//
// Three authority doors (Standards, Method & Evidence, Certification), each a
// door onto a section hub, not a sitemap of every leaf. This replaces the older
// eight-door bar (26 groups, 126 links) that overflowed the bar and the drawer.
// The doors map to the site's three jobs: what a product must meet, why the
// limits are trustworthy, and how to get and verify the mark.
//
// This file is NOT emitted by tools/build-nav-panels.mjs (that generator reads a
// stale index-site seed and a wiki/ dir this repo does not have; running it would
// clobber this file). Edit it directly. Every slug below resolves to a real
// content page, so the mega-menu never links to a 404. Two hubs, method.md and
// certification.md, are the door landings and are maintained alongside this file.
//
// Constraints: no em dash anywhere in this file (design-lint blocks it), and no
// bare "$" (there is no LaTeX plugin, so "$" renders as math).

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
    panelLabel: "Published standards",
    slug: "standards",
    blurb:
      "The governing standard for a product, each in its own native basis. Find it by product, by program manual, or open the full register.",
    extraPrefixes: ["manuals"],
    groups: [
      {
        heading: "Find your standard",
        children: [
          { label: "Standards Finder (guided lookup)", slug: "standards/finder" },
          { label: "Full register, by category", slug: "standards" },
        ],
      },
      {
        heading: "Popular categories",
        children: [
          { label: "Infant formula powder", slug: "standards/infant-formula-powder" },
          { label: "Baby cereals", slug: "standards/baby-cereals-dry" },
          { label: "Marine predatory fish", slug: "standards/fish-marine-predatory" },
          { label: "Shellfish", slug: "standards/shellfish" },
          { label: "Dark chocolate", slug: "standards/chocolate" },
          { label: "Herbs & spices", slug: "standards/spices" },
        ],
      },
      {
        heading: "By program manual",
        children: [
          { label: "Infant & Child Foods", slug: "manuals/infant-and-child-foods" },
          { label: "Seafood", slug: "manuals/seafood" },
          { label: "Grains, cereals & rice", slug: "manuals/grains-cereals-rice" },
          { label: "Dairy & milk products", slug: "manuals/dairy-and-milk-products" },
          { label: "Pet foods", slug: "manuals/pet-foods" },
          { label: "All program manuals", slug: "manuals" },
        ],
      },
    ],
    allLabel: "Browse all standards",
  },
  {
    key: "method",
    label: "Method & Evidence",
    panelLabel: "Method & evidence",
    slug: "method",
    blurb:
      "How limits are set, what the ten-analyte panel measures, and the public evidence behind every published value.",
    extraPrefixes: ["analytes", "regulations", "articles", "briefings", "program"],
    groups: [
      {
        heading: "How limits are set",
        children: [
          { label: "How the program works", slug: "program/structure" },
          { label: "What heavy metal testing is", slug: "heavy-metal-testing" },
          { label: "The two remediation pathways", slug: "program/two-pathways" },
          { label: "Confidential Remediation Track", slug: "program/remediation" },
        ],
      },
      {
        heading: "The ten analytes",
        children: [
          { label: "All ten analytes", slug: "analytes" },
          { label: "Lead", slug: "analytes/lead" },
          { label: "Cadmium", slug: "analytes/cadmium" },
          { label: "Arsenic", slug: "analytes/arsenic" },
          { label: "Mercury", slug: "analytes/mercury" },
        ],
      },
      {
        heading: "Evidence & policy",
        children: [
          { label: "Regulatory register", slug: "regulations" },
          { label: "Research library", slug: "articles" },
          { label: "Standards briefings", slug: "briefings" },
          { label: "What certification is", slug: "heavy-metal-certification" },
        ],
      },
    ],
    allLabel: "Understand the method",
  },
  {
    key: "certification",
    label: "Certification",
    panelLabel: "Certification",
    slug: "certification",
    blurb:
      "The route from an eligible product to a verifiable certificate: get certified, check a public certificate, and manage an active one.",
    extraPrefixes: [
      "verify",
      "brands",
      "apply",
      "portal",
      "mark",
      "for-brands",
      "for-retailers",
      "for-legal-qa",
      "compare",
    ],
    groups: [
      {
        heading: "Get certified",
        children: [
          { label: "For brands", slug: "for-brands" },
          { label: "Certification comparison", slug: "compare" },
          { label: "The readiness pathway", slug: "program/readiness" },
          { label: "Apply", slug: "apply" },
        ],
      },
      {
        heading: "Public register",
        children: [
          { label: "Verify a certificate", slug: "verify" },
          { label: "Certified brands", slug: "brands" },
          { label: "Scope of the mark", slug: "mark" },
        ],
      },
      {
        heading: "For your team",
        children: [
          { label: "For retailers", slug: "for-retailers" },
          { label: "For legal & QA", slug: "for-legal-qa" },
          { label: "Brand Control Room", slug: "portal" },
          { label: "Corrective action", slug: "program/corrective-action" },
        ],
      },
    ],
    allLabel: "Explore certification",
  },
]
