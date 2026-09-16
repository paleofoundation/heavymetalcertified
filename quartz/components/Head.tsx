import { CitationMetadata, frontmatterBoolean, frontmatterString } from "./citationMetadata"
import ResearcherProfileMetadata from "./ResearcherProfileMetadata"
import { i18n } from "../i18n"
import { canonicalUrl, FullSlug, getFileExtension, joinSegments, pathToRoot, simplifySlug } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"

// og:type — "article" for substantive documents (briefings, standards,
// regulations, source pages, single metal/analyte pages…) so social cards render
// as articles; "website" for the homepage and section/list landings. A page is
// article-ish by its `type` frontmatter, its `scholar_eligible` flag, or a
// content slug PREFIX. The prefix (foo/ not foo) is deliberate: it matches the
// individual page (`metals/lead`) but not the folder landing (`metals`), which
// should stay "website".
const OG_ARTICLE_TYPES = new Set([
  "public-briefing",
  "briefing",
  "standard",
  "regulation",
  "synthesis",
  "source",
  "metal",
  "analyte",
  "article",
  "rationale",
  "manual",
  // Wayfinding / SEO surfaces authored as substantive documents: the
  // certification-comparison asset and the audience entry-path guides.
  "comparison",
  "guide",
])
const OG_ARTICLE_PREFIXES = [
  "briefings/",
  "standards/",
  "regulations/",
  "metals/",
  "analytes/",
  "program/",
  "articles/",
  "synthesis/",
  "sources/",
  "manuals/",
  "health/",
  "supply-chain/",
  "testing/",
  "microbiome/",
  "methodology/",
]
function isArticlePage(frontmatter: Record<string, unknown> | undefined, slug: string | undefined): boolean {
  if (slug === "index" || slug === "404" || slug === undefined) return false
  const fmType = frontmatterString(frontmatter?.type)?.toLowerCase()
  if (fmType === "article-series") return false
  if (fmType && OG_ARTICLE_TYPES.has(fmType)) return true
  if (frontmatterBoolean(frontmatter?.scholar_eligible)) return true
  return OG_ARTICLE_PREFIXES.some((p) => slug.startsWith(p))
}


export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    // <title> strategy for search + AI answer engines:
    //   1. An explicit `seoTitle` frontmatter wins verbatim (hand-tuned head-term
    //      landing pages, homepage).
    //   2. Otherwise the page title gains the program-name suffix (cfg.pageTitleSuffix)
    //      so every interior page carries the brand + "heavy metal tested / certified"
    //      head terms — UNLESS the title already names the brand, which would double it.
    const seoTitleOverride = frontmatterString(fileData.frontmatter?.seoTitle)
    const baseTitle =
      frontmatterString(fileData.frontmatter?.title) ?? i18n(cfg.locale).propertyDefaults.title
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const titleAlreadyBranded = /heavy metal (tested|certified)|hmtc/i.test(baseTitle)
    const title =
      seoTitleOverride ?? (titleAlreadyBranded ? baseTitle : baseTitle + titleSuffix)
    // Two descriptions, deliberately:
    //   metaDescription  → the SERP snippet (<meta name="description">). Prefer the
    //     page's own `description`, which we keep ~150–160 chars and keyword-forward.
    //   socialDescription → OG / Twitter cards, where a longer, richer line reads
    //     well. Falls back to `description` so single-field pages are unchanged.
    const socialDescription =
      frontmatterString(fileData.frontmatter?.socialDescription) ??
      frontmatterString(fileData.frontmatter?.description) ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)
    const metaDescription =
      frontmatterString(fileData.frontmatter?.description) ?? socialDescription

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // Url of current page. simplifySlug strips `index`; canonicalUrl then
    // normalizes folders to Vercel's final slashless 200 URL. A cross-domain canonical or
    // a self-canonical pointing at a non-served path is the duplicate-content
    // defect that folded the old paleofoundation.com↔heavymetaltested.com pair.
    const socialUrl =
      fileData.slug === "404"
        ? url.toString()
        : canonicalUrl(cfg.baseUrl ?? "example.com", simplifySlug(fileData.slug!))

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`
    const ogType = isArticlePage(fileData.frontmatter, fileData.slug) ? "article" : "website"

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {/* Vercel serves this one document for nested misses too. Without a
            root base, the 404 header's relative links resolve under the missing
            pathname (for example /missing/verify). */}
        {fileData.slug === "404" && <base href="/" />}
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        {/* Full program name (not the shorter masthead wordmark) so social +
            entity graphs read the brand that carries the head terms. */}
        <meta property="og:site_name" content="Heavy Metal Tested & Certified"></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content={ogType} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={socialDescription} />
        <meta property="og:description" content={socialDescription} />
        <meta property="og:image:alt" content={socialDescription} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            {/* Explicit dimensions of the branded default card (static/og-image.png,
                built by tools/build-cert-brand-assets.mjs). Scrapers that require
                og:image:width/height — LinkedIn, Slack — need these to render the
                preview at all rather than dropping to a bare-URL card. */}
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta
              property="og:image:type"
              content={`image/${(getFileExtension(ogImageDefaultPath) ?? "png").replace(/^\./, "")}`}
            />
          </>
        )}

        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            <meta property="og:url" content={socialUrl}></meta>
            <meta property="twitter:url" content={socialUrl}></meta>
            {fileData.slug !== "404" && <link rel="canonical" href={socialUrl} />}
          </>
        )}

        <link rel="icon" href={iconPath} />
        <meta name="description" content={metaDescription} />
        <meta
          name="robots"
          content={
            fileData.slug === "404" || frontmatterBoolean(fileData.frontmatter?.noindex)
              ? "noindex, nofollow"
              : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          }
        />
        <CitationMetadata
          frontmatter={fileData.frontmatter}
          slug={fileData.slug}
          title={title}
          socialUrl={socialUrl}
        />
        <ResearcherProfileMetadata frontmatter={fileData.frontmatter} slug={fileData.slug} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor
