// Editorial seed for Heavy Metal Certified's three-door navigation.
//
// The global bar is an orientation layer, not an exhaustive sitemap. Each
// panel therefore has exactly three groups, no more than six links per group,
// and no more than sixteen links total. tools/build-nav-panels.mjs validates
// those limits and refuses to emit a dead or duplicate destination.

export interface SeedChild {
  label: string
  slug: string
  anchor?: string
}

export interface SeedGroup {
  heading: string
  children: SeedChild[]
}

export interface SeedPanel {
  key: string
  label: string
  panelLabel?: string
  slug: string
  blurb: string
  extraPrefixes: string[]
  groups: [SeedGroup, SeedGroup, SeedGroup]
  allLabel: string
}

export const seedPanels: SeedPanel[] = [
  {
    key: "standards",
    label: "Standards",
    panelLabel: "Published standards",
    slug: "standards",
    blurb:
      "Find the governing standard first: by program, by common product lookup, or by product family.",
    extraPrefixes: ["manuals"],
    allLabel: "Browse all standards",
    groups: [
      {
        heading: "Browse by program",
        children: [
          { label: "Infant & Child Foods manual", slug: "manuals/infant-and-child-foods" },
          { label: "Seafood manual", slug: "manuals/seafood" },
          { label: "All program manuals", slug: "manuals" },
        ],
      },
      {
        heading: "Common lookups",
        children: [
          { label: "Infant formula powder", slug: "standards/infant-formula-powder" },
          { label: "Baby cereals", slug: "standards/baby-cereals-dry" },
          { label: "Marine predatory fish", slug: "standards/fish-marine-predatory" },
          { label: "Shellfish", slug: "standards/shellfish" },
          { label: "Herbs & spices", slug: "standards/spices" },
        ],
      },
      {
        heading: "Browse by family",
        children: [
          { label: "Infant & Child Foods", slug: "standards", anchor: "infant-child-foods" },
          { label: "Seafood", slug: "standards", anchor: "seafood" },
          { label: "Grains, cereals & rice", slug: "standards", anchor: "grains-cereals-rice" },
          { label: "Culinary oils & fats", slug: "standards", anchor: "culinary-oils-fats" },
          { label: "Herbs, spices & salt", slug: "standards", anchor: "herbs-spices-salt" },
        ],
      },
    ],
  },
  {
    key: "research",
    label: "Research",
    panelLabel: "Research & evidence",
    slug: "articles",
    blurb:
      "Read the research, standards briefings, regulatory record, and public methods behind the program.",
    extraPrefixes: [
      "method",
      "analytes",
      "regulations",
      "articles",
      "briefings",
      "program/structure",
      "standard-stability",
    ],
    allLabel: "Browse research articles",
    groups: [
      {
        heading: "Research",
        children: [
          { label: "Research library", slug: "articles" },
          { label: "Standards briefings", slug: "briefings" },
          { label: "Regulatory register", slug: "regulations" },
          { label: "The evidence base", slug: "method", anchor: "evidence-base" },
        ],
      },
      {
        heading: "Methods",
        children: [
          { label: "Method overview", slug: "method" },
          { label: "How initial limits are set", slug: "program/structure" },
          { label: "Native basis", slug: "program/structure", anchor: "basis" },
          { label: "Publication gates", slug: "program/structure", anchor: "gates" },
          { label: "Standard stability", slug: "standard-stability" },
        ],
      },
      {
        heading: "Analytes",
        children: [
          { label: "All ten analytes", slug: "analytes" },
          { label: "The Big 8", slug: "method", anchor: "measures" },
          { label: "Lead", slug: "analytes/lead" },
          { label: "Cadmium", slug: "analytes/cadmium" },
          { label: "Arsenic", slug: "analytes/arsenic" },
          { label: "Mercury", slug: "analytes/mercury" },
        ],
      },
    ],
  },
  {
    key: "certification",
    label: "Certification",
    panelLabel: "Certification",
    slug: "certification",
    blurb:
      "Move from eligibility to application, verify a public certificate, or manage an active certification.",
    extraPrefixes: [
      "verify",
      "brands",
      "apply",
      "portal",
      "mark",
      "program/two-pathways",
      "program/remediation",
      "for-brands",
      "category-readiness",
      "cost-and-timing",
      "readiness",
      "standard-stability",
      "brand-bill-of-rights",
      "what-happens-to-your-data",
      "what-if-we-dont-pass",
    ],
    allLabel: "Explore certification",
    groups: [
      {
        heading: "Get certified",
        children: [
          { label: "For brands", slug: "for-brands" },
          { label: "Category readiness", slug: "category-readiness" },
          { label: "Cost & timing", slug: "cost-and-timing" },
          { label: "Apply", slug: "apply" },
        ],
      },
      {
        heading: "Public register",
        children: [
          { label: "Verify a certificate", slug: "verify" },
          { label: "Certified brands", slug: "brands" },
          { label: "Scope of the mark", slug: "mark", anchor: "asserts" },
        ],
      },
      {
        heading: "Brand operations",
        children: [
          { label: "Brand Control Room", slug: "portal" },
          { label: "Using the mark", slug: "mark" },
          { label: "Two remediation pathways", slug: "program/two-pathways" },
          { label: "Confidential Remediation Track", slug: "program/remediation" },
        ],
      },
    ],
  },
]
