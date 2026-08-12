import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot, type FullSlug } from "../util/path"

// The v3 interior hero band (Heavy Metal Certified v3.dc.html 331–367): a
// full-width red band carrying breadcrumb · title + kind badge · dek · meta row
// · page-snapshot box. renderPage.tsx emits this OUTSIDE the 3-column shell so
// it spans the viewport. Values come from frontmatter; the band degrades (drops
// the dek, the meta pieces, or the whole snapshot box) rather than erroring.

// Screen type → the kind badge (v3 KIND map). Keyed on frontmatter `type`.
const KIND: Record<string, string> = {
  standard: "Standard",
  "standard-in-development": "Standard",
  "standards-index": "Register",
  analyte: "Reference",
  "public-briefing": "Briefing",
  "briefings-index": "Directory",
  "manuals-index": "Library",
  method: "Method",
  certification: "Certification",
  program: "Program",
  verify: "Lookup",
  apply: "Apply",
  brands: "Directory",
  brand: "Product profile",
  portal: "Portal",
  remediation: "Policy",
  mark: "Mark",
  article: "Analysis",
  "articles-index": "Directory",
  regulation: "Regulation reference",
  "regulation-index": "Record of law",
}

// First slug segment → breadcrumb section label + hub slug.
const SECTION: Record<string, string> = {
  standards: "Standards",
  analytes: "Analytes",
  regulations: "Regulation references",
  briefings: "Briefings",
  manuals: "Manuals",
  program: "Program",
  articles: "Articles",
  verify: "Verify",
  apply: "Apply",
  brands: "Brands",
  portal: "Brands",
  method: "Method & evidence",
  certification: "Certification",
}

function iso(v: unknown): string | undefined {
  if (!v) return undefined
  const s = String(v)
  // Trim the time component only off a real ISO date ("2026-08-04T…"); human
  // dates like "August 2026" (11 chars) must pass through intact, not get
  // sliced to "August 202".
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s
}

export default (() => {
  const HeroBand: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = (fileData.slug ?? "index") as FullSlug
    const base = pathToRoot(slug)
    const fm = (fileData.frontmatter ?? {}) as Record<string, any>
    const title = fm.title ?? "Heavy Metal Certified"
    const type = String(fm.type ?? "")
    const badge = KIND[type] ?? "Standard"

    // Breadcrumb: HMTc / <section> / <leaf>. On a hub page the leaf is the
    // collection's own name, never a repeat of the section.
    const seg = String(slug).split("/")[0]
    const isHub = !String(slug).includes("/")
    const sectionLabel = SECTION[seg]
    const sectionHref = `${base}/${seg}`
    // The breadcrumb leaf. A page may set a short `breadcrumb_leaf` (e.g. the
    // instrument reference "GB 2762-2022") when its full title is long; the leaf
    // otherwise falls back to the title. The section crumb is dropped when it
    // would just repeat the leaf (a section hub linking to itself).
    const leaf = fm.breadcrumb_leaf ? String(fm.breadcrumb_leaf) : title
    const showSection = Boolean(sectionLabel) && !isHub && sectionLabel !== leaf

    // Snapshot rows. An explicit `snapshot:` frontmatter array wins (used by the
    // static pages ported from the comp); otherwise derive per screen type.
    const rows: [string, string][] = []
    const eff = iso(fm.effective_date)
    if (Array.isArray(fm.snapshot)) {
      for (const r of fm.snapshot as any[]) {
        if (Array.isArray(r)) rows.push([String(r[0]), String(r[1])])
        else if (r && typeof r === "object") rows.push([String(r.k ?? r.label ?? ""), String(r.v ?? r.value ?? "")])
      }
    } else if (type === "standard" || type === "standard-in-development") {
      if (fm.native_basis) rows.push(["Native basis", String(fm.native_basis)])
      if (fm.standard_version) rows.push(["Standard version", String(fm.standard_version)])
      if (fm.category_name) rows.push(["Category", String(fm.category_name)])
      rows.push(["Analyte panel", "10 analytes"])
      if (eff) rows.push(["Effective", eff])
    } else if (type === "public-briefing") {
      if (fm.section) rows.push(["Series", String(fm.section)])
      const pub = iso(fm.briefing_date)
      if (pub) rows.push(["Published", pub])
      rows.push(["Document type", "Report"])
    } else {
      // manuals + other cited surfaces
      if (fm.cert_doi) rows.push(["DOI", String(fm.cert_doi)])
      if (eff) rows.push(["Effective", eff])
    }
    const snapshot = rows.slice(0, 4)

    const author = fm.author ? String(fm.author) : undefined
    const orcid = fm.orcid ? String(fm.orcid) : undefined
    const updated = iso(fm.updated) ?? iso(fm.briefing_date) ?? eff
    const dek = fm.description ? String(fm.description) : undefined
    // dek_html carries emphasis (e.g. an italic case name); render it as HTML.
    // Falls back to the plain description. Both are author-generated, so the
    // dangerouslySetInnerHTML is on trusted content only.
    const dekHtml = fm.dek_html ? String(fm.dek_html) : undefined
    const hasSnapshot = snapshot.length > 0
    // The snapshot box title. Defaults to "Page snapshot"; a regulation detail
    // page overrides it with "Instrument".
    const snapTitle = fm.snapshot_title ? String(fm.snapshot_title) : "Page snapshot"
    // Explicit meta stamps (e.g. "PRIMARY-VERIFIED · 2022-06-30"). When present
    // they replace the derived author/updated row. A single optional action link
    // (e.g. "Primary source ↗") may sit at the end of the meta row.
    const heroMeta: string[] = Array.isArray(fm.hero_meta) ? (fm.hero_meta as any[]).map(String) : []
    const heroAction =
      fm.hero_action && typeof fm.hero_action === "object"
        ? {
            label: String((fm.hero_action as any).label ?? ""),
            href: String((fm.hero_action as any).href ?? "#"),
          }
        : null

    return (
      <section class="hmtc-heroband">
        <div class={hasSnapshot ? "hmtc-heroband-inner" : "hmtc-heroband-inner hmtc-heroband-inner--full"}>
          <div class="hmtc-hb-left">
            <nav class="hmtc-hb-crumb" aria-label="Breadcrumb">
              <a href={base || "/"}>HMTc</a>
              {showSection ? (
                <>
                  <span>/</span>
                  <a href={sectionHref}>{sectionLabel}</a>
                </>
              ) : null}
              <span>/</span>
              <span class="hmtc-hb-leaf">{leaf}</span>
            </nav>
            <div class="hmtc-hb-titlerow">
              <h1 class="hmtc-hb-title">{title}</h1>
              <span class="hmtc-hb-badge">{badge}</span>
            </div>
            {dekHtml ? (
              <p class="hmtc-hb-dek" dangerouslySetInnerHTML={{ __html: dekHtml }} />
            ) : dek ? (
              <p class="hmtc-hb-dek">{dek}</p>
            ) : null}
            {heroMeta.length || author || updated || (heroAction && heroAction.label) ? (
              <div class="hmtc-hb-meta">
                {heroMeta.length ? (
                  heroMeta.map((s) => <span class="hmtc-hb-stamp">{s}</span>)
                ) : (
                  <>
                    {author ? (
                      <span>
                        Author {author}
                        {orcid ? ` · ORCID ${orcid}` : ""}
                      </span>
                    ) : null}
                    {updated ? <span class="hmtc-hb-stamp">UPDATED {updated}</span> : null}
                  </>
                )}
                {heroAction && heroAction.label ? (
                  <a class="hmtc-hb-action" href={heroAction.href}>
                    {heroAction.label}
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
          {hasSnapshot ? (
            <div class="hmtc-hb-snap">
              <div class="hmtc-hb-snap-head">{snapTitle}</div>
              <div class="hmtc-hb-snap-body">
                {snapshot.map(([k, v]) => (
                  <div class="hmtc-hb-snap-row">
                    <span class="hmtc-hb-snap-k">{k}</span>
                    <span class="hmtc-hb-snap-v">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    )
  }
  return HeroBand
}) satisfies QuartzComponentConstructor
