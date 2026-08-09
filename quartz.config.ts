import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Heavy Metal Certified — Quartz 4 configuration.
 *
 * The standards/certification authority surface for the Heavy Metal Tested &
 * Certified (HMTc) program. This is a SEPARATE deploy from heavymetalindex.com
 * (the independent literature index): separate repo, separate baseUrl, separate
 * Vercel project — the firewall invariant. It one-way-cites the index and never
 * imports the corpus ("fork the toolchain, not the content").
 *
 * Content lives in the Quartz default `content/`. Standards pages are GENERATED
 * from data/standards/hmtc_standards_catalog.json by tools/build-standards-pages.mjs;
 * briefings are imported by tools/import-briefings.mjs. Do not hand-edit generated
 * pages.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Heavy Metal Certified",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    // Cert site gets its OWN analytics property — never reuse the index's GA tag
    // (would commingle two independent properties' traffic). Set when provisioned.
    analytics: null,
    locale: "en-US",
    baseUrl: "heavymetalcertified.com",
    ignorePatterns: [
      "private",
      "templates",
      ".obsidian",
      "_TEMPLATE.md",
      "raw",
      "**/raw/**",
    ],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
        // v3 design: Lora (serif) for display/headings, Inter for body, IBM Plex
        // Mono for labels, stamps and measured values. Setting header:Lora loads
        // the Lora face the inline chrome/home styles reference.
        header: "Lora",
        body: "Inter",
        code: "IBM Plex Mono",
      },
      colors: {
        // Palette derived from answerthis.io. Cool near-white background,
        // dark cool-gray body text, verification-green accent (#176b43) used sparingly
        // on links, active states, and the citation tier pill. Replaces the
        // previous warm coffee/sienna palette.
        lightMode: {
          light: "#fdfdfc",
          lightgray: "#e8e6e1",
          // Darkened from #9c9890 (2.82:1 on --light, failed WCAG AA) to
          // #767067 (4.82:1). --gray drives all secondary text — content
          // meta, TOC, breadcrumbs, table headers, captions — so this one
          // token lifts every muted-text surface to AA.
          gray: "#767067",
          darkgray: "#2a2d34",
          dark: "#1a1d24",
          // HMTc red (#9f2727) — the v3 design accent, replacing the earlier
          // verification-green. Drives links, active nav and component accents
          // through var(--secondary); the theme-stable brand grounds (hero,
          // footer, table heads) ride on proof-design.scss --burg.
          secondary: "#9f2727",
          tertiary: "#6b6b6b",
          highlight: "rgba(159, 39, 39, 0.06)",
          textHighlight: "#f0e68c55",
        },
        darkMode: {
          light: "#141414",
          lightgray: "#2d2d2d",
          // Lightened from #6a6a6a (3.41:1 on dark --light, failed WCAG AA)
          // to #848484 (4.93:1). Mirrors the light-mode --gray lift.
          gray: "#848484",
          darkgray: "#cfcfcf",
          dark: "#e8e6e1",
          // Lightened HMTc red for dark-mode AA on the near-black --light.
          secondary: "#e08a8a",
          tertiary: "#9aa0a8",
          highlight: "rgba(224, 138, 138, 0.12)",
          textHighlight: "#b3aa0255",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      // Auto-link first prose mention of unambiguous metals; must run before
      // CrawlLinks so the inserted links are resolved + counted in the graph.
      Plugin.AutoLink(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      // Latex plugin removed: prose uses bare "$" for dollar amounts, which
      // remark-math/KaTeX was parsing as inline math (rendering $-delimited
      // spans as italic serif formulae). No page uses real $$…$$ math.
      // Superscript inline [n] citation markers sitewide (skips bibliography
      // markers, links, code, and data-no-cite regions).
      Plugin.SuperscriptCitations(),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
    ],
  },
}

export default config
