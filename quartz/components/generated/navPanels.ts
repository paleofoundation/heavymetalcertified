// Curated HMTc navigation: program sections plus network wayfinding.
// This module is hand-authored despite its legacy directory name.
// The Index's tools/build-nav-panels.mjs uses a different corpus and must not
// overwrite it. All destinations resolve against this site's content/.

export type NavChild = {
  label: string
  anchor?: string
  count?: number
} & ({ slug: string; href?: never } | { href: `https://${string}`; slug?: never })

export interface NavGroup {
  heading: string
  blurb?: string
  children: NavChild[]
}

export interface NavPanel {
  key: string
  label: string
  panelLabel: string
  slug: string
  blurb: string
  extraPrefixes?: string[]
  layout?: "ecosystem"
  groups: NavGroup[]
  allLabel: string
}

export const navPanels: NavPanel[] = [
  {
    "key": "standards",
    "label": "Standards",
    "panelLabel": "Standards",
    "slug": "standards",
    "blurb": "Find product-specific limits, browse the register, and read the manuals and regulation references behind each standard.",
    "groups": [
      {
        "heading": "Find a standard",
        "children": [
          {
            "label": "Standards Finder",
            "slug": "standards/finder"
          },
          {
            "label": "Full standards register",
            "slug": "standards",
            "anchor": "subcats"
          },
          {
            "label": "Requirements by category",
            "slug": "requirements"
          },
          {
            "label": "Data & downloads",
            "slug": "data"
          }
        ]
      },
      {
        "heading": "Program manuals",
        "children": [
          {
            "label": "All manual editions",
            "slug": "manuals"
          },
          {
            "label": "Infant & Child Foods",
            "slug": "manuals/infant-and-child-foods"
          }
        ]
      },
      {
        "heading": "How limits are set",
        "children": [
          {
            "label": "Method v1 to Method v2",
            "slug": "program/method"
          },
          {
            "label": "Regulation references",
            "slug": "regulations"
          },
          {
            "label": "Derivation & publication gates",
            "slug": "program/structure"
          },
          {
            "label": "The two limit pathways",
            "slug": "program/two-pathways"
          }
        ]
      }
    ],
    "allLabel": "All standards",
    "extraPrefixes": [
      "manuals",
      "regulations",
      "requirements",
      "data"
    ]
  },
  {
    "key": "analytes",
    "label": "Analytes",
    "panelLabel": "The analyte panel",
    "slug": "analytes",
    "blurb": "Eight metals, ten analytes. Each page states, from the government and expert-body record and the occurrence data, why the metal is limited and why the program monitors it.",
    "groups": [
      {
        "heading": "Tier 1: zero-tolerance toxics",
        "children": [
          {
            "label": "Lead",
            "slug": "analytes/lead"
          },
          {
            "label": "Cadmium",
            "slug": "analytes/cadmium"
          },
          {
            "label": "Arsenic (iAs)",
            "slug": "analytes/arsenic"
          },
          {
            "label": "Mercury (MeHg)",
            "slug": "analytes/mercury"
          }
        ]
      },
      {
        "heading": "Tier 2: capped to the government limit",
        "children": [
          {
            "label": "Nickel",
            "slug": "analytes/nickel"
          },
          {
            "label": "Tin",
            "slug": "analytes/tin"
          },
          {
            "label": "Aluminum",
            "slug": "analytes/aluminum"
          },
          {
            "label": "Chromium (Cr-VI)",
            "slug": "analytes/chromium"
          }
        ]
      }
    ],
    "allLabel": "All ten analytes"
  },
  {
    "key": "research",
    "label": "Research",
    "panelLabel": "Research & briefings",
    "slug": "articles",
    "blurb": "Research analyses, standards briefings and regulatory updates, with links to the evidence behind them.",
    "extraPrefixes": [
      "briefings"
    ],
    "groups": [
      {
        "heading": "Standards briefings",
        "children": [
          {
            "label": "All briefings",
            "slug": "briefings"
          },
          {
            "label": "What HMTc Is",
            "slug": "briefings/hmtc-primer"
          },
          {
            "label": "The Big 8",
            "slug": "briefings/the-big-8"
          },
          {
            "label": "Four Metals Is No Longer Enough",
            "slug": "briefings/brief-7-four-vs-eight"
          },
          {
            "label": "The Evidence a Jury Will See",
            "slug": "briefings/defense-counsel-briefing"
          }
        ]
      },
      {
        "heading": "Research analyses",
        "children": [
          {
            "label": "All research analyses",
            "slug": "articles"
          },
          {
            "label": "Lead & cadmium in chocolate",
            "slug": "articles/lead-and-cadmium-in-dark-chocolate"
          },
          {
            "label": "Infant formula metals",
            "slug": "articles/infant-formula-metal-amplification"
          },
          {
            "label": "Farmed vs wild fish",
            "slug": "articles/aquaculture-vs-wild-contamination-differential"
          },
          {
            "label": "Combined exposure",
            "slug": "articles/combined-exposure-underprotection"
          }
        ]
      },
      {
        "heading": "Regulatory Watch",
        "children": [
          {
            "label": "Living regulatory tracker",
            "slug": "articles/regulatory-watch"
          },
          {
            "label": "Worldwide watch 2026",
            "slug": "articles/worldwide-heavy-metal-regulatory-watch-2026"
          },
          {
            "label": "US baby-food laws",
            "slug": "articles/us-baby-food-heavy-metal-laws-states-fda"
          },
          {
            "label": "EU arsenic & nickel",
            "slug": "articles/eu-food-limits-arsenic-seafood-nickel-deadlines"
          }
        ]
      }
    ],
    "allLabel": "Explore the research"
  },
  {
    "key": "program",
    "label": "Program",
    "panelLabel": "The program",
    "slug": "program/structure",
    "blurb": "How a limit is set, how a product is tested against it, and what happens when a lot falls short.",
    "groups": [
      {
        "heading": "How the program works",
        "children": [
          {
            "label": "What heavy metal testing is",
            "slug": "heavy-metal-testing"
          },
          {
            "label": "What heavy metal certification is",
            "slug": "heavy-metal-certification"
          },
          {
            "label": "Method v1 to Method v2",
            "slug": "program/method"
          },
          {
            "label": "Program structure & gates",
            "slug": "program/structure"
          },
          {
            "label": "The two limit pathways",
            "slug": "program/two-pathways"
          },
          {
            "label": "The readiness pathway",
            "slug": "program/readiness"
          },
          {
            "label": "Corrective action",
            "slug": "program/corrective-action"
          }
        ]
      },
      {
        "heading": "Choosing HMTc",
        "children": [
          {
            "label": "Certification comparison",
            "slug": "compare"
          },
          {
            "label": "For brands",
            "slug": "for-brands"
          },
          {
            "label": "For retailers",
            "slug": "for-retailers"
          },
          {
            "label": "What happens to your data",
            "slug": "what-happens-to-your-data"
          },
          {
            "label": "For legal & QA",
            "slug": "for-legal-qa"
          }
        ]
      },
      {
        "heading": "Heavy metals by product",
        "children": [
          {
            "label": "Heavy metals in baby food",
            "slug": "heavy-metals-in-baby-food"
          },
          {
            "label": "Heavy metals in protein powder",
            "slug": "heavy-metals-in-protein-powder"
          },
          {
            "label": "Heavy metals in supplements",
            "slug": "heavy-metals-in-supplements"
          },
          {
            "label": "Heavy metals in dark chocolate",
            "slug": "heavy-metals-in-dark-chocolate"
          },
          {
            "label": "Heavy metals in rice",
            "slug": "heavy-metals-in-rice"
          }
        ]
      }
    ],
    "allLabel": "Program structure",
    "extraPrefixes": [
      "program",
      "heavy-metal-testing",
      "heavy-metal-certification",
      "compare",
      "for-brands",
      "for-retailers",
      "for-legal-qa",
      "what-happens-to-your-data",
      "heavy-metals-in-baby-food",
      "heavy-metals-in-protein-powder",
      "heavy-metals-in-supplements",
      "heavy-metals-in-dark-chocolate",
      "heavy-metals-in-rice"
    ]
  },
  {
    "key": "brands",
    "label": "Brands",
    "panelLabel": "Certified brands",
    "slug": "brands",
    "blurb": "Every brand carrying the mark, and the route to check any single certificate. The directory is a published list, not a census.",
    "groups": [
      {
        "heading": "Find & verify",
        "children": [
          {
            "label": "Certified-brand directory",
            "slug": "brands"
          },
          {
            "label": "Verify a certificate or lot",
            "slug": "verify"
          }
        ]
      },
      {
        "heading": "The certification mark",
        "children": [
          {
            "label": "Using the mark",
            "slug": "mark"
          },
          {
            "label": "Become a certified brand",
            "slug": "apply"
          }
        ]
      }
    ],
    "allLabel": "The full directory",
    "extraPrefixes": [
      "verify",
      "mark",
      "apply"
    ]
  },
  {
    key: "ecosystem",
    label: "Ecosystem",
    panelLabel: "Heavy Metal network",
    slug: "ecosystem",
    blurb: "Public knowledge, checkable evidence, qualified lots, and finished-product certification.",
    layout: "ecosystem",
    allLabel: "Explore the ecosystem",
    groups: [
      {
        heading: "HMI",
        blurb: "Public knowledge, government floors, and occurrence evidence behind the requirements.",
        children: [
          { label: "Explore Heavy Metal Index", href: "https://heavymetalindex.com" },
          { label: "Read the HMI paper", slug: "ecosystem/hmi" },
        ],
      },
      {
        heading: "TECRID",
        blurb: "Checkable lab evidence: issuer, measurements, version, and current status. Free core trust.",
        children: [
          { label: "Explore TECRID", href: "https://tecrid.com" },
          { label: "Read the TECRID paper", slug: "ecosystem/tecrid" },
        ],
      },
      {
        heading: "VLE",
        blurb: "QUALIFIED lots before the floor. A bounded quantity, a frozen purchasing profile, and checkable proof.",
        children: [
          { label: "Explore Verified Lot Exchange", href: "https://vle.exchange" },
          { label: "Read the VLE paper", slug: "ecosystem/vle" },
        ],
      },
      {
        heading: "HMTc",
        blurb: "You are here: published numeric standards, finished-product certification, and a mark you can verify.",
        children: [
          { label: "Standards register", slug: "standards" },
          { label: "Apply for certification", slug: "apply" },
          { label: "Verify the mark", slug: "verify" },
          { label: "Read the HMTc paper", slug: "ecosystem/hmtc" },
        ],
      },
    ],
  }
]
