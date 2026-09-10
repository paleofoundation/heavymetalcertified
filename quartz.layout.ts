import { PageLayout, SharedLayout } from "./quartz/cfg";
import * as Component from "./quartz/components";

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // The global TopNav (wordmark + mega-menu + controls). renderPage.tsx lifts
  // this into a full-bleed sticky <header> outside #quartz-root.
  header: [Component.TopNav()],
  // SourceCitationPanel is a fixed slide-over (scrim + right-anchored dialog) that
  // fills and reveals on inline-citation click, reading the source's record from
  // the page's References list; mounting it also ships citationPanel.inline.ts (a
  // component's inline script only ships when it is in the layout). It is mounted
  // HERE, in the always-rendered top-level afterBody slot — NOT in the right rail
  // (its prior home at b6aadf4). The rail is display:none on mobile, and a fixed
  // overlay nested under a display:none ancestor would never render there; afterBody
  // renders on every page and at every width. The homepage opts out internally.
  // StandardsFinder renders inside .wiki-content (renderPage lifts afterBody there),
  // right after the page body, and self-gates to null on every page except the one
  // with `type: standards-finder`. Mounting it here ships its inline script site-wide;
  // the script no-ops unless it finds the [data-standards-finder] root, so it only
  // activates on /standards/finder. Degrades to a /standards link with JS off.
  //
  // FeeCalculator renders NOTHING; its DOM lives inline in content/apply.md. It is
  // mounted here only to ship feeCalculator.inline.ts site-wide (a component's inline
  // script is emitted whenever the component is in the layout, independent of render).
  // The script no-ops unless it finds the [data-fee-calculator] root, i.e. only on /apply.
  afterBody: [
    Component.CiteThisPage(),
    Component.StandardsFinder(),
    Component.FeeCalculator(),
    Component.ApplyForm(),
    Component.SourceCitationPanel(),
    Component.Corrections(),
  ],
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
  // provenance/actions. The citation slide-over is no longer mounted here — it
  // moved to the top-level afterBody slot (see sharedPageComponents) so the fixed
  // overlay renders at every width, including where the rail is display:none.
  right: [Component.Rail()],
};

// components for pages that display lists of pages (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.HeroBand()],
  left: [
    Component.Snav(),
    Component.DedicatedPages(),
  ],
  // The citation slide-over is mounted top-level (afterBody), not here — see the
  // note in defaultContentPageLayout / sharedPageComponents.
  right: [Component.Rail()],
};
