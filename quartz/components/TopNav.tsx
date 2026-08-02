import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { pathToRoot, type FullSlug } from "../util/path"
import { i18n } from "../i18n"
import { MegaMenu } from "./MegaMenu"
import style from "./styles/topNav.scss"
// @ts-ignore — inline script, resolved by Quartz's esbuild loader
import script from "./scripts/topNav.inline"
// @ts-ignore — homepage hero search (?q= handling) — no-ops off the index slug
import homeSearchScript from "./scripts/homeSearch.inline"

// The v3 global header, reproduced from Heavy Metal Certified v3.dc.html
// (lines 41–109). renderPage.tsx lifts this into a full-bleed sticky
// <header class="hmi-topnav-shell">; the shell carries the white ground +
// bottom rule (see cert-chrome.scss). Left→right: brand (mark + wordmark),
// the five mega-menu triggers, a flex spacer, then the actions group
// (certificate lookup · Log in · Apply).

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
            Log in
          </a>
          <a class="hmtc-apply" href={`${baseDir}/apply`}>
            Apply
          </a>
        </div>
      </div>
    )
  }

  TopNav.css = style
  TopNav.afterDOMLoaded = `${script}\n${homeSearchScript}`
  return TopNav
}) satisfies QuartzComponentConstructor
