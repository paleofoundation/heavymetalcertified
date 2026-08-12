import { resolveRelative, type SimpleSlug, type FullSlug } from "../util/path"
import { navPanels, type NavPanel } from "./generated/navPanels"
import { brandPanel } from "./generated/brandPanel"

// One top-level navigation item and its disclosure panel.
//
// Three properties this markup is built to guarantee, in order of importance:
//
// 1. Crawlable. Every panel is server-rendered in full on every page. All hrefs
//    and their link text are in the initial HTML, and the panel is hidden with
//    `visibility`, never `display:none` or `[hidden]`. Search and answer engines
//    do not need to click in order to discover the applicant and evidence paths.
//
// 2. Usable on touch. The label is a real link to the hub; a separate chevron
//    button owns the disclosure. Tapping the label navigates and tapping the
//    chevron opens the panel.
//
// 3. Links, not commands. `aria-expanded` + `aria-controls` on a button beside
//    a list of anchors implements the disclosure-navigation pattern without
//    misrepresenting ordinary navigation as an application menu.
//
// Evidence panels come from generated/navPanels.ts. The applicant journey is
// maintained separately in generated/brandPanel.ts because it is a decision
// architecture, not an inventory generated from standards or editorial data.

function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function isPanelActive(currentSlug: string, panel: NavPanel): boolean {
  if (currentSlug === panel.slug) return true
  if (currentSlug.startsWith(`${panel.slug}/`)) return true
  return (panel.extraPrefixes ?? []).some(
    (p) => currentSlug === p || currentSlug.startsWith(`${p}/`),
  )
}

export function MegaMenu({ slug }: { slug: FullSlug }) {
  const current = (slug ?? "") as string
  const panels = [brandPanel, ...navPanels.filter((panel) => panel.key !== "brands")]

  return (
    <ul class="hmi-nav-list">
      {panels.map((panel) => {
        const active = isPanelActive(current, panel)
        const panelId = `hmi-panel-${panel.key}`
        const labelId = `hmi-navlabel-${panel.key}`
        return (
          <li class="hmi-nav-item" data-panel={panel.key}>
            <a
              id={labelId}
              class={active ? "hmi-nav-top active" : "hmi-nav-top"}
              href={resolveRelative(slug, panel.slug as SimpleSlug)}
              aria-current={active ? "page" : undefined}
            >
              {panel.label}
            </a>
            <button
              type="button"
              class="hmi-nav-toggle"
              aria-expanded="false"
              aria-controls={panelId}
            >
              <span class="hmi-sr-only">{`Show ${panel.panelLabel} menu`}</span>
              <Chevron />
            </button>

            <div class="hmi-nav-panel" id={panelId} aria-labelledby={labelId}>
              <div class="hmi-nav-panel-inner">
                <div class="hmi-nav-lead">
                  <div class="hmi-nav-title">{panel.panelLabel}</div>
                  <p class="hmi-nav-blurb">{panel.blurb}</p>
                  <a class="hmi-nav-all" href={resolveRelative(slug, panel.slug as SimpleSlug)}>
                    {panel.allLabel} <span aria-hidden="true">→</span>
                  </a>
                </div>
                <div class="hmi-nav-cols">
                  {panel.groups.map((group) => (
                    <div class="hmi-nav-col">
                      <p class="hmi-nav-colhead">{group.heading}</p>
                      <ul>
                        {group.children.map((child) => {
                          const href =
                            resolveRelative(slug, child.slug as SimpleSlug) +
                            (child.anchor ? `#${child.anchor}` : "")
                          return (
                            <li>
                              <a href={href}>
                                <span class="hmi-nav-childlabel">{child.label}</span>
                                {child.count ? (
                                  <span class="hmi-nav-count">
                                    {child.count.toLocaleString("en-US")}
                                    <span class="hmi-sr-only"> pages</span>
                                  </span>
                                ) : null}
                              </a>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
