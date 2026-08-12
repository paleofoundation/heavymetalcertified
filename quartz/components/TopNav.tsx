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

// The v3 global header. renderPage.tsx lifts this into a full-bleed sticky
// <header class="hmi-topnav-shell">; the shell carries the white ground and
// bottom rule. Left to right: brand, brand-first and evidence mega-menu triggers,
// flex spacer, then certificate lookup, Log in, and Check readiness.

export default (() => {
  const TopNav: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, cfg, displayClass } = props
    const slug = (fileData.slug ?? "index") as FullSlug
    const baseDir = pathToRoot(slug)
    const wordmark = cfg?.pageTitle ?? i18n(cfg.locale).propertyDefaults.title

    return (
      <div class={classNames(displayClass, "hmtc-bar")}>
        <a class="hmtc-brand" href={baseDir} aria-label={`${wordmark} — home`}>
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
          <a class="hmtc-search" href={`${baseDir}/verify`} aria-label="Look up a lot, brand or standard">
            <span class="hmtc-search-glyph" aria-hidden="true">&#8981;</span>
            <span class="hmtc-search-label">Look up a lot, brand or standard</span>
            <span class="hmtc-search-kbd" aria-hidden="true">/</span>
          </a>
          <a class="hmtc-login" href={`${baseDir}/portal`}>
            Control Room preview
          </a>
          <a class="hmtc-apply" href={`${baseDir}/readiness`}>
            Check readiness
          </a>
        </div>
      </div>
    )
  }

  TopNav.css = style
  TopNav.afterDOMLoaded = `(()=>{${topNavScript}})();(()=>{${homeSearchScript}})();`
  return TopNav
}) satisfies QuartzComponentConstructor
