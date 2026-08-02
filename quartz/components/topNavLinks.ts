// Secondary destinations in the global top-navigation bar (TopNav.tsx).
//
// The primary taxonomy no longer lives here: it is the five mega-menu panels,
// whose contents are curated in `navPanels.seed.ts` and resolved (with live
// counts and a build-blocking dangling-slug check) into
// `generated/navPanels.ts` by tools/build-nav-panels.mjs.
//
// What remains is `utilityLinks` → secondary destinations (About). "Ask the
// Index" is not in this list: it is rendered by TopNav.tsx as its own pill.
//
// Hrefs are root-relative SIMPLE slugs (no leading slash, no extension).
// TopNav.tsx resolves each one against the current page with
// `resolveRelative(slug, href)` so the bar works at every directory depth and
// under a non-root base path. Keep these as bare slugs; do NOT hard-code "/".
//
// To add / reorder taxonomy entries, edit this file only. TopNav.tsx maps over
// these arrays verbatim, so there is no second place to update.

import { SimpleSlug } from "../util/path"

export interface TopNavLink {
  /** Visible label in the bar. */
  label: string
  /** Root-relative simple slug, e.g. "metals" or "regulations". */
  slug: SimpleSlug
  /**
   * When true, this entry is considered "active" if the current page's slug
   * starts with `${slug}/` (section match) in addition to an exact match. Used
   * for the taxonomy hubs so e.g. `metals/lead` highlights "Metals".
   */
  matchPrefix?: boolean
}

// Secondary destinations rendered to the right of the mega-menu. Empty for the
// cert site's first chrome pass — the primary nav (Standards / Manuals /
// Briefings / Program) lives in the mega-menu, and the cert secondary surfaces
// (Verify, Apply, Log in) are added here as those pages ship.
export const utilityLinks: TopNavLink[] = []
