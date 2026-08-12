import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/search.scss"
// @ts-ignore
import script from "./scripts/search.inline"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

export interface SearchOptions {
  enablePreview: boolean
  buttonLabel: string
  placeholder: string
  shortcutLabel?: string
  className?: string
}

const defaultOptions: SearchOptions = {
  enablePreview: true,
  buttonLabel: "Search",
  placeholder: "Search for something",
}

export default ((userOpts?: Partial<SearchOptions>) => {
  const Search: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
    const opts = { ...defaultOptions, ...userOpts }
    const searchPlaceholder = userOpts?.placeholder ?? i18n(cfg.locale).components.search.searchBarPlaceholder
    const buttonLabel = userOpts?.buttonLabel ?? i18n(cfg.locale).components.search.title
    return (
      <div class={classNames(displayClass, "search", opts.className ?? "")}>
        <button class="search-button" type="button" aria-label={buttonLabel}>
          <span class="search-button-glyph" aria-hidden="true">&#8981;</span>
          <p>{buttonLabel}</p>
          {opts.shortcutLabel ? <kbd aria-hidden="true">{opts.shortcutLabel}</kbd> : null}
        </button>
        <div class="search-container">
          <div class="search-space">
            <input
              autocomplete="off"
              class="search-bar"
              name="search"
              type="text"
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
            />
            <div class="search-layout" data-preview={opts.enablePreview}></div>
          </div>
        </div>
      </div>
    )
  }

  Search.afterDOMLoaded = script
  Search.css = style

  return Search
}) satisfies QuartzComponentConstructor
