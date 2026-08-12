import { PageLayout, SharedLayout } from "./quartz/cfg";
import * as Component from "./quartz/components";

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // The global TopNav (wordmark + mega-menu + controls). renderPage.tsx lifts
  // this into a full-bleed sticky <header> outside #quartz-root.
  header: [Component.TopNav()],
  afterBody: [Component.Corrections(), Component.CiteThisPage()],
  footer: Component.Footer(),
};

// components for pages that display a single page (e.g. a single note)
// The public site keeps the right rail focused on document navigation.
// Dense graph and backlink widgets are useful during corpus development,
// but they compete with the primary reading path on public reference pages.
export const defaultContentPageLayout: PageLayout = {
  // The v3 interior hero band (breadcrumb · title · kind badge · meta ·
  // snapshot). renderPage.tsx lifts beforeBody into a full-width band above the
  // 3-column shell; the home page opts out (it carries its own hero in content).
  beforeBody: [Component.HeroBand()],
  // Proof's curated left rail (.snav): per-page section nav + a compact
  // cross-reference count group. Global navigation now lives in the TopNav.
  left: [
    Component.Snav(),
    Component.DedicatedPages(),
  ],
  // Proof's right rail (.rail): the certificate-verify affordance and page
  // provenance/actions.
  // SourceCitationPanel renders a hidden citation-detail panel at the top of the
  // rail and ships citationPanel.inline.ts (a component's inline script only
  // ships when it is in the layout); clicking an inline citation opens it with
  // that source's record from the page's References list. Rail carries the rest.
  right: [Component.SourceCitationPanel(), Component.Rail()],
};

// components for pages that display lists of pages (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.HeroBand()],
  left: [
    Component.Snav(),
    Component.DedicatedPages(),
  ],
  // SourceCitationPanel renders a hidden citation-detail panel at the top of the
  // rail and ships citationPanel.inline.ts (a component's inline script only
  // ships when it is in the layout); clicking an inline citation opens it with
  // that source's record from the page's References list. Rail carries the rest.
  right: [Component.SourceCitationPanel(), Component.Rail()],
};
