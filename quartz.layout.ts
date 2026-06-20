import { PageLayout, SharedLayout } from "./quartz/cfg";
import * as Component from "./quartz/components";

// Folders kept out of the public Explorer. Two groups:
//   1. Reference-governance pages that have their own footer/home entry
//      points and would crowd the primary taxonomy (app, methodology, ...).
//   2. Internal operations and build artifacts that must never surface in
//      public navigation — ingest run logs (batch-reports), QA audits, the
//      corpus-ops queue, and the static/ JSON asset folder. Leaking these
//      reads as unfinished and undercuts the "independent reference" posture
//      (CLAUDE.md Part 2).
//
// Do NOT add `audits` or `coverage` here: the Audit dashboard and Coverage
// page are the curated, public defensibility surfaces (audience includes
// brand-legal, regulator, journalist) that Part 1 wants reviewers to find.
// They are intentionally discoverable in nav and footer.
//
// IMPORTANT: Quartz serializes this filter with filterFn.toString() and
// re-evaluates it client-side, so it must be SELF-CONTAINED — the Set has to
// be built inside the function body. A hoisted closure variable would be
// undefined in the browser and silently break the Explorer. Defined once and
// shared across both layouts so the hidden set cannot drift between them.
const primaryNavFilter = (node: { slugSegment: string }) => {
  const hiddenPrimaryNav = new Set([
    "app",
    "about",
    "batch-reports",
    "briefings",
    "certification",
    "contact",
    "corpus",
    "courses",
    "editorial-standards",
    "health",
    "lint",
    "log",
    "methodology",
    "microbiome",
    "overview",
    "privacy",
    "queries",
    "static",
    "studies",
    "supply-chain",
    "staff",
    "tags",
    "terms",
    "testing",
    "workbench",
  ]);
  return !hiddenPrimaryNav.has(node.slugSegment);
};

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [Component.Corrections(), Component.RelatedPages(), Component.CiteThisPage()],
  footer: Component.Footer(),
};

// components for pages that display a single page (e.g. a single note)
// The public site keeps the right rail focused on document navigation.
// Dense graph and backlink widgets are useful during corpus development,
// but they compete with the primary reading path on public reference pages.
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    // Reading time disabled: a reference work is consulted, not read
    // start-to-finish, so a "166 min read" estimate on a long synthesis
    // page is misleading and discouraging rather than informative. The
    // last-updated date is the meta that matters here.
    Component.ContentMeta({ showReadingTime: false }),
    Component.EvidenceHeader(),
    Component.ProductEvidenceSummary(),
    Component.BrandPreScreenTool(),
    Component.SourceCitationPanel(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.AskIndex(),
    Component.Explorer({
      title: "Index",
      folderDefaultState: "collapsed",
      useSavedState: false,
      filterFn: primaryNavFilter,
    }),
  ],
  right: [Component.DesktopOnly(Component.TableOfContents())],
};

// components for pages that display lists of pages (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta({ showReadingTime: false }),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.AskIndex(),
    Component.Explorer({
      title: "Index",
      folderDefaultState: "collapsed",
      useSavedState: false,
      filterFn: primaryNavFilter,
    }),
  ],
  right: [],
};
