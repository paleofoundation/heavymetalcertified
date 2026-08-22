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
      "Subcategory standards, each in its product's native basis. Published per subcategory the moment each is defensibly ready, never as a category-wide release.",
    groups: [
      {
        heading: "Find your standard",
        children: [
          { label: "Standards Finder (guided lookup)", slug: "standards/finder" },
          { label: "Full register, by category", slug: "standards" },
        ],
      },
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
        heading: "Grains, cereals & rice",
        children: [
          { label: "Rice (bulk grain)", slug: "standards/rice-bulk-grain" },
          { label: "Rice pasta", slug: "standards/pasta-rice-based" },
          { label: "Rice noodles", slug: "standards/rice-noodles" },
          { label: "Rice breakfast cereal", slug: "standards/breakfast-cereal-rice-based" },
          { label: "Rice snacks & crackers", slug: "standards/rice-snacks-crackers" },
          { label: "Rice beverages (rice milk)", slug: "standards/rice-beverages-rice-milk" },
          { label: "Flour (non-rice)", slug: "standards/flour-non-rice" },
          { label: "Bread & baked goods", slug: "standards/bread-and-baked-goods" },
          { label: "Pasta (wheat)", slug: "standards/pasta-wheat-based" },
          { label: "Breakfast cereal (non-rice)", slug: "standards/breakfast-cereal-non-rice" },
          { label: "Other grain products", slug: "standards/other-grain-products" },
          { label: "Grain-based snacks", slug: "standards/grain-based-snacks" },
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
          { label: "Chocolate", slug: "standards/chocolate" },
          { label: "Honey", slug: "standards/honey" },
          { label: "Vinegar", slug: "standards/vinegar" },
        ],
      },
      {
        heading: "Pet foods (human-grade)",
        children: [
          { label: "Dry pet food (kibble)", slug: "standards/pet-food-dry-kibble" },
          { label: "Canned / wet pet food", slug: "standards/pet-food-canned-wet" },
          { label: "Semi-moist pet food", slug: "standards/pet-food-semi-moist" },
          { label: "Raw pet food", slug: "standards/pet-food-raw" },
          { label: "Freeze-dried / dehydrated", slug: "standards/pet-food-freeze-dried" },
          { label: "Treats & snacks", slug: "standards/pet-treats-snacks" },
          { label: "Chews (incl. dental)", slug: "standards/pet-chews-dental" },
          { label: "Toppers, mixers & broths", slug: "standards/pet-toppers-mixers-broths" },
          { label: "Milk replacers & liquids", slug: "standards/pet-milk-replacers-specialty-liquids" },
          { label: "Fish / marine-protein diets", slug: "standards/pet-food-fish-marine-protein" },
        ],
      },
    ],
    allLabel: "All standards",
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
        heading: "Tier 1: zero-tolerance toxics",
        children: [
          { label: "Lead", slug: "analytes/lead" },
          { label: "Cadmium", slug: "analytes/cadmium" },
          { label: "Arsenic (iAs)", slug: "analytes/arsenic" },
          { label: "Mercury (MeHg)", slug: "analytes/mercury" },
        ],
      },
      {
        heading: "Tier 2: capped to the government limit",
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
    key: "regulations",
    label: "Regulations",
    panelLabel: "Regulation references",
    slug: "regulations",
    blurb:
      "The sovereign instruments the HMTc standards cite. Each records the primary-source maximum levels a standard adopts when that jurisdiction binds a limit: a record of law, never an HMTc threshold.",
    groups: [
      {
        heading: "EU & international",
        children: [
          { label: "European Union (EU 2023/915)", slug: "regulations/eu-2023-915" },
          { label: "United Kingdom (1881/2006)", slug: "regulations/uk-1881-2006" },
          { label: "Codex (CXS 193)", slug: "regulations/codex-cxs-193" },
          { label: "Gulf States (GSO 193)", slug: "regulations/gso-193" },
        ],
      },
      {
        heading: "National limits",
        children: [
          { label: "China (GB 2762)", slug: "regulations/china-gb-2762" },
          { label: "India (FSSAI)", slug: "regulations/india-fssai" },
          { label: "Brazil (ANVISA)", slug: "regulations/brazil-anvisa" },
          { label: "Australia & NZ (FSANZ)", slug: "regulations/au-nz-fsanz" },
          { label: "Canada (contaminants list)", slug: "regulations/canada-contaminants" },
        ],
      },
      {
        heading: "United States",
        children: [
          { label: "US FDA (Closer to Zero)", slug: "regulations/us-fda-c2z" },
          { label: "California (Prop 65)", slug: "regulations/ca-prop65" },
        ],
      },
    ],
    allLabel: "All 11 references",
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
          { label: "Heavy Metals in Pet Food", slug: "briefings/heavy-metals-in-pet-food" },
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
    allLabel: "All 12 briefings",
  },
  {
    key: "research",
    label: "Research",
    panelLabel: "Research analyses",
    slug: "articles",
    blurb:
      "Analyses that apply the independent literature to the certification question: one per Heavy Metal Index finding, each citing the index one way.",
    extraPrefixes: ["articles"],
    groups: [
      {
        heading: "Seafood & mercury",
        children: [
          { label: "Farmed vs wild fish", slug: "articles/aquaculture-vs-wild-contamination-differential" },
          { label: "Cooking & methylmercury", slug: "articles/cooking-does-not-reduce-mehg" },
          { label: "Climate & fish mercury", slug: "articles/climate-fish-mehg-projections" },
          { label: "Mining-impacted fish", slug: "articles/mining-impacted-freshwater-fish" },
          { label: "Cadmium in shellfish", slug: "articles/bivalve-cadmium-amplification" },
          { label: "Selenium & mercury", slug: "articles/se-hg-molar-ratio-certification-debate" },
          { label: "Subsistence fishing", slug: "articles/subsistence-fishing-mehg-disparity" },
          { label: "Arsenic speciation", slug: "articles/organoarsenical-inertness-assumption" },
        ],
      },
      {
        heading: "Infant, plant & pantry",
        children: [
          { label: "Lead & cadmium in chocolate", slug: "articles/lead-and-cadmium-in-dark-chocolate" },
          { label: "Infant formula metals", slug: "articles/infant-formula-metal-amplification" },
          { label: "Breastmilk pathway", slug: "articles/breastmilk-heavy-metal-exposure-pathway" },
          { label: "Lead in spices", slug: "articles/spice-adulteration-lead-infants" },
          { label: "Seaweed cadmium & arsenic", slug: "articles/seaweed-cd-as-contamination" },
          { label: "Nickel in plant staples", slug: "articles/dietary-nickel-plant-staple-accumulation" },
          { label: "Rice arsenic vs cadmium", slug: "articles/climate-metals-tradeoffs" },
          { label: "Tin in canned food", slug: "articles/tin-canned-food-acidic-matrix-migration" },
        ],
      },
      {
        heading: "Systems & certification",
        children: [
          { label: "Organic isn't protective", slug: "articles/organic-certification-not-protective" },
          { label: "Combined exposure", slug: "articles/combined-exposure-underprotection" },
          { label: "Supplements", slug: "articles/supplement-botanical-lead-pathway" },
          { label: "Organ meats", slug: "articles/organ-meat-cadmium-lead-accumulation" },
          { label: "Metals in tea", slug: "articles/tea-multi-metal-bioaccumulation" },
          { label: "Cookware leaching", slug: "articles/cookware-utensil-metal-leaching-pathway" },
          { label: "Wastewater-irrigated crops", slug: "articles/wastewater-irrigation-multimetal-crop-pathway" },
          { label: "EU limits timeline", slug: "articles/eu-regulatory-framework-timeline" },
        ],
      },
    ],
    allLabel: "All 24 analyses",
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
          { label: "Program structure & gates", slug: "program/structure" },
          { label: "The two limit pathways", slug: "program/two-pathways" },
        ],
      },
      {
        heading: "Readiness and the mark",
        children: [
          { label: "The readiness pathway", slug: "program/readiness" },
          { label: "Corrective action", slug: "program/corrective-action" },
          { label: "Using the mark", slug: "mark" },
        ],
      },
      {
        heading: "Choosing HMTc",
        children: [
          { label: "Certification comparison", slug: "compare" },
          { label: "For brands", slug: "for-brands" },
          { label: "For retailers", slug: "for-retailers" },
          { label: "Requirements by category", slug: "requirements" },
          { label: "What happens to your data", slug: "what-happens-to-your-data" },
          { label: "For legal & QA", slug: "for-legal-qa" },
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
