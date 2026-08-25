import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot, type FullSlug } from "../util/path"
import { i18n } from "../i18n"
import { MegaMenu } from "./MegaMenu"
import style from "./styles/topNav.scss"
// @ts-ignore — mega-menu disclosure: hover intent, click-outside + Escape to close,
// full keyboard nav. Adds `.hmi-nav--js` to switch the CSS-only :hover/:focus-within
// fallback off (that fallback is what leaves a click-opened panel stuck open).
import topNavScript from "./scripts/topNav.inline"
// @ts-ignore — homepage hero search (?q= handling) — no-ops off the index slug
import homeSearchScript from "./scripts/homeSearch.inline"
import searchStyle from "./styles/search.scss"
// @ts-ignore — the FlexSearch modal behaviour; iterates every `.search` element,
// opens the overlay on the button, reads the prebuilt contentIndex via the
// global getContentIndex(). Ships here because Quartz only emits css/
// afterDOMLoaded for components in a layout slot — a nested <Search/> call
// would never get its resources emitted, so TopNav carries them itself.
import searchScript from "./scripts/search.inline"

// The v3 global header, reproduced from Heavy Metal Certified v3.dc.html
// (lines 41–109). renderPage.tsx lifts this into a full-bleed sticky
// <header class="hmi-topnav-shell">; the shell carries the white ground +
// bottom rule (see cert-chrome.scss). Left→right: brand (mark + wordmark),
// the five mega-menu triggers, a flex spacer, then the actions group
// (certificate lookup · Log in · Get started).
  // The Log in / Get started pair points off-site at the brand app
  // (app.heavymetalcertified.com): Get started is the onboarding front
  // door for new brands, Log in is the returning-account entry. Absolute
  // URLs — they cross the app subdomain, so are NOT resolveRelative'd.

export default (() => {
  const TopNav: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, cfg, displayClass } = props
    const slug = (fileData.slug ?? "index") as FullSlug
    const baseDir = pathToRoot(slug)
    const wordmark = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title

    return (
      <div class={classNames(displayClass, "hmtc-bar")}>
        <a class="hmtc-brand" href={baseDir} aria-label={`${wordmark} home`}>
          <img
            class="hmtc-mark"
            src={`${baseDir}/static/hmtc-mark-red.svg`}
            alt=""
            width="36"
            height="42"
          />
          <span class="hmtc-wordmark">{wordmark}</span>
        </a>

        <button
          type="button"
          class="hmi-topnav-burger hmtc-burger"
          aria-label="Toggle navigation"
          aria-expanded="false"
          aria-controls="hmi-topnav-menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        <nav id="hmi-topnav-menu" class="hmi-topnav-menu hmi-nav hmtc-nav" aria-label="Primary">
          <MegaMenu slug={slug} />
        </nav>

        <div class="hmtc-spacer" />

        <div class="hmtc-actions">
          {/*
            Site search. This is Quartz's `.search` markup rendered INLINE in the
            bar (not a nested <Search/> component call): the search.inline.ts
            handler iterates every `.search` element, so this block is wired by
            the searchScript bundle carried on TopNav below. The DOM shape must
            stay `.search > .search-button + .search-container > .search-space >
            .search-bar + .search-layout`. The button keeps the retired
            `.hmtc-search` pill's glyph/label/kbd so the bar looks unchanged; the
            "/" hint is now honest (search.inline.ts opens on "/").
          */}
          <div class="search hmtc-topnav-search" role="search">
            <button
              type="button"
              class="search-button"
              aria-label="Search standards, briefings and analytes"
            >
              <span class="hmtc-search-glyph" aria-hidden="true">&#8981;</span>
              <span class="hmtc-search-label">Search standards, briefings, analytes</span>
              <span class="hmtc-search-kbd" aria-hidden="true">/</span>
            </button>
            <div class="search-container">
              <div class="search-space">
                <input
                  autocomplete="off"
                  class="search-bar"
                  name="search"
                  type="text"
                  aria-label="Search"
                  placeholder="Search standards, briefings, analytes, regulations…"
                />
                <div class="search-layout" data-preview="true"></div>
              </div>
            </div>
          </div>
          <a class="hmtc-login" href="https://app.heavymetalcertified.com/login">
            Log in
          </a>
          <a class="hmtc-apply" href="https://app.heavymetalcertified.com/hmt/get-started">
            Get started
          </a>
        </div>
      </div>
    )
  }

  TopNav.css = [style, searchStyle]
  // afterDOMLoaded is a single slot, so ship every behaviour here, each IIFE-wrapped
  // to isolate scope (inline scripts are bundled with imports inlined, so wrapping
  // is safe): the mega-menu disclosure JS (topNav.inline — hover intent,
  // click-outside + Escape to close, keyboard nav; sets `.hmi-nav--js` to disable the
  // CSS-only fallback that leaves click-opened panels stuck open); the homepage
  // hero-search `?q=` wiring; and the FlexSearch modal (search.inline) that powers
  // the top-bar `.search` pill.
  TopNav.afterDOMLoaded = `(()=>{${topNavScript}})();(()=>{${homeSearchScript}})();(()=>{${searchScript}})();`
  return TopNav
}) satisfies QuartzComponentConstructor
