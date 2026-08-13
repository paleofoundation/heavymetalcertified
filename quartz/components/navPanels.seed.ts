// Editorial seed for the global navigation panels.
//
// This file answers "which pages appear in the menu, in what order, under what
// label". It is hand-maintained on purpose. A pure top-N-by-source-count would
// put `arsenic-total` and `copper` in the Metals panel and bury mercury, because
// the corpus is deepest where the literature is deepest, not where a reader
// starts. Selection is an editorial judgment; counting is not.
//
// What the generator adds: live source counts, live hub totals, and a
// build-blocking check that every slug below resolves to a real page. Numbers
// never live in this file — if you find yourself typing one, it belongs in
// tools/build-nav-panels.mjs instead.
//
// The generated output is quartz/components/generated/navPanels.ts, which is
// what TopNav imports. Run `node tools/build-nav-panels.mjs` after editing here;
// prebuild does it automatically.

export interface SeedChild {
  /** Visible label. Falls back to the page's own title when omitted. */
  label: string
  /** Root-relative simple slug, no leading slash, e.g. "metals/lead". */
  slug: string
  /** Optional #fragment appended to the resolved href. */
  anchor?: string
  /**
   * Where the generator should read a count for this row:
   *   "sources"    — the page's own `sources:` frontmatter (metal pages)
   *   "group"      — a commodity group count from data/nav/ingredient-groups.json
   *   "dir:<path>" — countMarkdownPages over a wiki directory
   *   omitted      — render no count
   */
  count?: "sources" | "group" | `dir:${string}`
}

export interface SeedGroup {
  heading: string
  children: SeedChild[]
}

export interface SeedPanel {
  key: string
  /** Label in the bar. Kept short — five long labels overflow at 1200px. */
  label: string
  /** Longer label used as the panel's own heading. Defaults to `label`. */
  panelLabel?: string
  /** Hub the bar label links to. */
  slug: string
  blurb: string
  /** Additional slug prefixes that light this item as active. */
  extraPrefixes?: string[]
  /** Exactly two groups — they render as the panel's two columns. */
  groups: [SeedGroup, SeedGroup]
  /** Footer link text; `{n}` is replaced with the live hub total. */
  allLabel: string
}

export const seedPanels: SeedPanel[] = [
  {
    key: "metals",
    label: "Metals",
    slug: "metals",
    blurb: "Toxicology, exposure routes, and regulatory limits, one page per metal.",
    allLabel: "All {n} metals",
    groups: [
      {
        heading: "Most-referenced",
        children: [
          { label: "Lead", slug: "metals/lead", count: "sources" },
          { label: "Cadmium", slug: "metals/cadmium", count: "sources" },
          { label: "Arsenic", slug: "metals/arsenic", count: "sources" },
          { label: "Mercury", slug: "metals/mercury", count: "sources" },
          { label: "Nickel", slug: "metals/nickel", count: "sources" },
          { label: "Chromium", slug: "metals/chromium", count: "sources" },
          { label: "Aluminum", slug: "metals/aluminum", count: "sources" },
        ],
      },
      {
        // Species matter more than totals for arsenic and mercury: iAs and MeHg
        // are the toxicologically governing forms and carry their own limits.
        heading: "By species",
        children: [
          { label: "Inorganic arsenic", slug: "metals/arsenic-inorganic", count: "sources" },
          { label: "Total arsenic", slug: "metals/arsenic-total", count: "sources" },
          { label: "Methylmercury", slug: "metals/mercury-methyl", count: "sources" },
          { label: "Total mercury", slug: "metals/mercury-total", count: "sources" },
          { label: "Hexavalent chromium", slug: "metals/chromium-hexavalent", count: "sources" },
          { label: "Tin", slug: "metals/tin", count: "sources" },
          { label: "Antimony", slug: "metals/antimony", count: "sources" },
        ],
      },
    ],
  },
  {
    key: "ingredients",
    label: "Foods",
    panelLabel: "Foods & Ingredients",
    slug: "ingredients",
    blurb: "Commodity-level contamination profiles: why an ingredient accumulates, and how much.",
    allLabel: "All {n} ingredients",
    groups: [
      {
        heading: "By commodity",
        children: [
          { label: "Fruits", slug: "ingredients", anchor: "fruits", count: "group" },
          { label: "Vegetables", slug: "ingredients", anchor: "vegetables", count: "group" },
          {
            label: "Grains, cereals & bakery",
            slug: "ingredients",
            anchor: "grains-cereals--bakery",
            count: "group",
          },
          { label: "Fish & seafood", slug: "ingredients", anchor: "fish--seafood", count: "group" },
          { label: "Meat & poultry", slug: "ingredients", anchor: "meat--poultry", count: "group" },
          {
            label: "Herbs, spices & botanicals",
            slug: "ingredients",
            anchor: "herbs-spices--botanicals",
            count: "group",
          },
          { label: "Beverages & water", slug: "ingredients", anchor: "beverages--water", count: "group" },
        ],
      },
      {
        heading: "Most-studied ingredients",
        children: [
          { label: "Rice", slug: "ingredients/rice", count: "sources" },
          { label: "Cocoa", slug: "ingredients/cocoa", count: "sources" },
          { label: "Fish", slug: "ingredients/fish", count: "sources" },
          { label: "Leafy greens", slug: "ingredients/leafy-greens", count: "sources" },
          { label: "Black pepper", slug: "ingredients/black-pepper", count: "sources" },
          { label: "Seaweed", slug: "ingredients/seaweed", count: "sources" },
          { label: "Cinnamon", slug: "ingredients/cinnamon", count: "sources" },
        ],
      },
    ],
  },
  {
    key: "products",
    label: "Products",
    slug: "products",
    blurb: "Consumer-category risk profiles, built from the ingredients that drive them.",
    allLabel: "All {n} product categories",
    groups: [
      {
        heading: "Infant & child",
        children: [
          { label: "Infant formula, powder", slug: "products/infant-formula-powder-non-soy", count: "sources" },
          { label: "Infant formula, soy", slug: "products/infant-formula-powder-soy-based", count: "sources" },
          { label: "Rice-based baby cereal", slug: "products/baby-cereals-dry-rice-based", count: "sources" },
          { label: "Non-rice baby cereal", slug: "products/baby-cereals-dry-non-rice", count: "sources" },
          { label: "Fruit purees", slug: "products/fruit-purees", count: "sources" },
          { label: "Vegetable purees", slug: "products/root-vegetable-purees", count: "sources" },
          { label: "Rice snacks & crackers", slug: "products/rice-snacks-crackers", count: "sources" },
        ],
      },
      {
        heading: "Other categories",
        children: [
          { label: "Seafood", slug: "products/fish-marine-predatory", count: "sources" },
          { label: "Shellfish", slug: "products/shellfish", count: "sources" },
          { label: "Seaweed & kelp foods", slug: "products/seaweed-kelp-foods", count: "sources" },
          { label: "Bottled drinking water", slug: "products/bottled-drinking-water", count: "sources" },
          { label: "Baby wipes", slug: "products/baby-wipes", count: "sources" },
          { label: "Baby lotion & cream", slug: "products/baby-lotion-cream", count: "sources" },
          { label: "Mineral sunscreen", slug: "products/baby-sunscreen-mineral", count: "sources" },
        ],
      },
    ],
  },
  {
    key: "regulations",
    label: "Regulations",
    slug: "regulations",
    blurb: "Agency limits and action levels, with the body that set each one.",
    extraPrefixes: ["regulators"],
    allLabel: "All {n} regulations",
    groups: [
      {
        heading: "Key instruments",
        children: [
          { label: "FDA Closer to Zero", slug: "regulations/fda-closer-to-zero" },
          { label: "EU lead limits, infant foods", slug: "regulations/eu-2023-915-lead-infant-young-child-foods" },
          { label: "EFSA cadmium TWI", slug: "regulations/efsa-cadmium-twi" },
          { label: "California Prop 65 lead", slug: "regulations/oehha-lead-prop65" },
          { label: "EU nickel maximum levels", slug: "regulations/eu-2024-1987-nickel-maximum-levels" },
          { label: "By jurisdiction", slug: "regulations/by-jurisdiction" },
          { label: "Regulatory timeline", slug: "regulations/timeline" },
        ],
      },
      {
        heading: "Regulatory bodies",
        children: [
          { label: "US FDA", slug: "regulators/us-fda" },
          { label: "EFSA", slug: "regulators/efsa" },
          { label: "JECFA", slug: "regulators/jecfa" },
          { label: "Codex Alimentarius", slug: "regulators/codex" },
          { label: "US EPA", slug: "regulators/us-epa" },
          { label: "ATSDR", slug: "regulators/atsdr" },
          { label: "All bodies", slug: "regulators" },
        ],
      },
    ],
  },
  {
    key: "evidence",
    label: "Evidence",
    slug: "trust",
    blurb: "How the Index is built, what it covers, and where it is still thin.",
    extraPrefixes: ["coverage", "synthesis", "methodology", "audits", "sources", "testing", "errata"],
    allLabel: "The trust center",
    groups: [
      {
        heading: "Methods & coverage",
        children: [
          { label: "Methodology", slug: "methodology", count: "dir:wiki/methodology" },
          { label: "Search strategy", slug: "methodology/search-strategy" },
          { label: "Corpus coverage (PRISMA)", slug: "coverage" },
          { label: "Editorial standards", slug: "editorial-standards" },
          { label: "Defensibility audits", slug: "audits", count: "dir:wiki/audits" },
          { label: "Errata & corrections", slug: "errata" },
        ],
      },
      {
        heading: "The evidence base",
        children: [
          { label: "Source archive", slug: "sources", count: "dir:wiki/sources" },
          { label: "Synthesis findings", slug: "synthesis", count: "dir:wiki/synthesis" },
          { label: "Testing methods", slug: "testing", count: "dir:wiki/testing" },
          { label: "ICP-MS", slug: "testing/icp-ms" },
          { label: "Licensing & reuse", slug: "licensing" },
          { label: "Ask the Index", slug: "ask" },
        ],
      },
    ],
  },
]
