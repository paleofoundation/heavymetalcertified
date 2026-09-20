import researcherIdentity from "../../data/researcher-identity.json"
import { KAREN_PERSON } from "../../tools/lib/researcher-schema.mjs"
import { Fragment } from "preact"
import { documentPdf } from "./documentMetadata"
import { currentDocumentDoi } from "./DocumentDoi"

export const STANDARD_SERIES_TITLE = "Heavy Metal Tested & Certified Standards"
export const ICS_PUBLISHER_NAME = "Institute of Contaminant Standards"
const ICS_PUBLISHER = {
  "@type": "Organization",
  "@id": "https://contaminantstandards.com/#organization",
  name: ICS_PUBLISHER_NAME,
}
const STANDARD_RIGHTS =
  "© 2026 Institute of Contaminant Standards / Heavy Metal Certified. All rights reserved."

export function isStandardDocument(fm: Record<string, unknown>, slug = ""): boolean {
  if (String(fm.type) === "standard-in-development") return false
  if (!slug.startsWith("standards/")) return false
  if (slug === "standards/index" || slug.endsWith("/index")) return false
  return String(fm.type) === "standard"
}

export const MANUAL_SERIES_TITLE = "Heavy Metal Tested & Certified Program Manuals"

export function isManualDocument(fm: Record<string, unknown>, slug = ""): boolean {
  if (!slug.startsWith("manuals/")) return false
  if (slug === "manuals/index" || slug.endsWith("/index")) return false
  return frontmatterBoolean(fm.scholar_eligible) || String(fm.type) === "standard" || String(fm.type) === "manual"
}

export function frontmatterString(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined
  const normalized = String(value).trim()
  return normalized || undefined
}

function frontmatterStringArray(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).flatMap((item) => {
    const normalized = typeof item === "string" ? item.trim() : ""
    return normalized ? [normalized] : []
  })
}

export function frontmatterBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value
  return typeof value === "string" && ["true", "yes", "1"].includes(value.trim().toLowerCase())
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]
const MONTH_PATTERN = MONTHS.join("|")

function calendarDate(year: number, month: number, day: number): string | undefined {
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return undefined
  return `${String(year).padStart(4, "0")}/${String(month).padStart(2, "0")}/${String(day).padStart(2, "0")}`
}

// Accept explicit publication dates only. In particular, an invalid date must
// not fall through to an arbitrary year found elsewhere in a string.
export function normalizeCitationDate(value: unknown): string | undefined {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime())
      ? calendarDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate())
      : undefined
  }
  const raw = frontmatterString(value)
  if (!raw) return undefined
  if (/^[0-9]{4}$/.test(raw)) return Number(raw) > 0 ? raw : undefined
  const full = raw.match(/^([0-9]{4})([-/])([0-9]{1,2})\2([0-9]{1,2})$/)
  if (full) return calendarDate(Number(full[1]), Number(full[3]), Number(full[4]))
  const timestamp = raw.match(
    /^([0-9]{4})-([0-9]{2})-([0-9]{2})T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})$/,
  )
  if (timestamp)
    return Number.isFinite(Date.parse(raw))
      ? calendarDate(Number(timestamp[1]), Number(timestamp[2]), Number(timestamp[3]))
      : undefined
  const monthDay = raw.match(
    new RegExp(`^(${MONTH_PATTERN})\\s+([0-9]{1,2})(?:st|nd|rd|th)?,?\\s+([0-9]{4})$`, "i"),
  )
  if (monthDay)
    return calendarDate(
      Number(monthDay[3]),
      MONTHS.indexOf(monthDay[1].toLowerCase()) + 1,
      Number(monthDay[2]),
    )
  const dayMonth = raw.match(new RegExp(`^([0-9]{1,2})\\s+(${MONTH_PATTERN})\\s+([0-9]{4})$`, "i"))
  if (dayMonth)
    return calendarDate(
      Number(dayMonth[3]),
      MONTHS.indexOf(dayMonth[2].toLowerCase()) + 1,
      Number(dayMonth[1]),
    )
  const monthYear = raw.match(new RegExp(`^(${MONTH_PATTERN})\\s+([0-9]{4})$`, "i"))
  if (monthYear) return Number(monthYear[2]) > 0 ? monthYear[2] : undefined
  const yearMonth = raw.match(/^([0-9]{4})[-/]([0-9]{1,2})$/)
  if (
    yearMonth &&
    Number(yearMonth[1]) > 0 &&
    Number(yearMonth[2]) >= 1 &&
    Number(yearMonth[2]) <= 12
  )
    return yearMonth[1]
  return undefined
}

export function citationPublicationDate(
  fm: Record<string, unknown>,
  source = false,
): string | undefined {
  const fields = source
    ? ["published", "date", "year"]
    : ["published", "date", "briefing_date", "effective_date"]
  for (const field of fields) {
    const date = normalizeCitationDate(fm[field])
    if (date) return date
  }
  return undefined
}

export function citationAuthors(
  fm: Record<string, unknown>,
  source = false,
  slug = "",
): string[] {
  const list = frontmatterStringArray(fm.authors)
  const authors = list.length ? list : frontmatterStringArray(fm.author)
  if (source) return authors
  const names = new Set(
    [researcherIdentity.name, researcherIdentity.citationName].map((name) => name.toLowerCase()),
  )
  const normalized = authors.map((author) =>
    names.has(author.replace(/\s+/g, " ").toLowerCase()) ? researcherIdentity.citationName : author,
  )
  if (!normalized.length && isStandardDocument(fm, slug)) return [researcherIdentity.citationName]
  return normalized
}

function isoDateFromCitationDate(value: string): string {
  return value.includes("/") ? value.replaceAll("/", "-") : value
}

function citationOnlineDate(fm: Record<string, unknown>, publicationDate?: string): string | undefined {
  const online = normalizeCitationDate(fm.online_date ?? fm.date_online)
  return online && online !== publicationDate ? online : undefined
}

export function standardPdfUrl(fm: Record<string, unknown>, slug: string, socialUrl: string): string {
  const currentPdf = documentPdf(fm, slug)
  if (currentPdf) return `https://heavymetalcertified.com${currentPdf}`
  const configured = frontmatterString(fm.scholar_pdf_url)
  if (configured) return configured
  return `${socialUrl.replace(/\/$/, "")}.pdf`
}

export interface CitationMetadataIssue {
  slug: string
  code:
    | "declared-doi-scholar-hold"
    | "declared-doi-not-eligible"
    | "excluded-document-doi"
    | "missing-authors"
    | "missing-publication-date"
  severity: "warning" | "error"
  doi?: string
  detail: string
}

export function citationMetadataIssues(
  slug: string,
  fm: Record<string, unknown>,
): CitationMetadataIssue[] {
  if (fm.type === "source" || slug.startsWith("sources/")) return []
  const issues: CitationMetadataIssue[] = []
  const isStandard = isStandardDocument(fm, slug)
  const eligible = frontmatterBoolean(fm.scholar_eligible) || isStandard
  const declaredDoi = frontmatterString(fm.cert_doi)
  const currentDoi = currentDocumentDoi(slug, fm)
  if (currentDoi && !eligible) {
    const explicitHold =
      fm.scholar_eligible === false ||
      (typeof fm.scholar_eligible === "string" &&
        fm.scholar_eligible.trim().toLowerCase() === "false")
    issues.push({
      slug,
      code: explicitHold ? "declared-doi-scholar-hold" : "declared-doi-not-eligible",
      severity: "warning",
      doi: currentDoi,
      detail:
        "A current-document DOI is declared locally but Scholar metadata is suppressed. Preserve the editorial hold; registration and publication readiness require separate verification.",
    })
  } else if (declaredDoi && !currentDoi) {
    issues.push({
      slug,
      code: "excluded-document-doi",
      severity: "warning",
      doi: declaredDoi,
      detail:
        "This DOI is not valid for current-document metadata (invalid/test DOI or no published current manual DOI in the edition manifest). Do not reuse an earlier edition DOI.",
    })
  }
  if (eligible && !citationAuthors(fm, false, slug).length)
    issues.push({
      slug,
      code: "missing-authors",
      severity: "error",
      detail: "Scholar-eligible document has no explicit author names; metadata is suppressed.",
    })
  if (eligible && !citationPublicationDate(fm))
    issues.push({
      slug,
      code: "missing-publication-date",
      severity: "error",
      detail:
        "Scholar-eligible document has no valid publication date; updated and created are not publication dates.",
    })
  return issues
}

export function CitationMetadata({
  frontmatter,
  slug,
  title,
  socialUrl,
}: {
  frontmatter: Record<string, unknown> | undefined
  slug: string | undefined
  title: string
  socialUrl: string
}) {
  if (!frontmatter) return null
  const slugStr = (slug ?? "") as string

  // Source pages represent the underlying paper — emit its real bibliographic
  // record (author, journal, the paper's own DOI).
  const isSourcePage = frontmatter.type === "source" || slugStr.startsWith("sources/")
  if (isSourcePage) {
    const citationTitle = frontmatterString(frontmatter.title) ?? title
    const authors = citationAuthors(frontmatter, true)
    const publicationDate = citationPublicationDate(frontmatter, true)
    const publication = frontmatterString(frontmatter.publication)
    const doi = frontmatterString(frontmatter.doi)
    const canonicalSourceUrl = frontmatterString(frontmatter.access_url)
    return (
      <>
        <meta name="citation_title" content={citationTitle} />
        {authors.map((author, index) => (
          <meta key={`citation-author-${index}`} name="citation_author" content={author} />
        ))}
        {publicationDate && <meta name="citation_publication_date" content={publicationDate} />}
        {publication && <meta name="citation_journal_title" content={publication} />}
        {doi && <meta name="citation_doi" content={doi} />}
        <meta name="citation_abstract_html_url" content={socialUrl} />
        {canonicalSourceUrl && (
          <meta name="citation_fulltext_html_url" content={canonicalSourceUrl} />
        )}
      </>
    )
  }

  // Standards emit Highwire + ScholarlyArticle on every `/standards/{slug}`
  // page (ORDER HMTC-SCHOLAR-META-1). Manuals use the same chrome when
  // scholar_eligible (Manual v3). Articles/briefings stay on the
  // scholar_eligible gate and remain technical reports — no journal title.
  // standard-in-development pages still emit nothing.
  const isStandard = isStandardDocument(frontmatter, slugStr)
  const isManual = isManualDocument(frontmatter, slugStr)
  const isScholarEligible = frontmatterBoolean(frontmatter.scholar_eligible) || isStandard
  if (isScholarEligible) {
    const citationTitle = frontmatterString(frontmatter.title) ?? title
    const pubDate = citationPublicationDate(frontmatter)
    const certDoi = currentDocumentDoi(slugStr, frontmatter)
    const authors = citationAuthors(frontmatter, false, slugStr)
    // Missing authors or publication dates cannot form a Scholar citation.
    // The read-only metadata audit reports these gaps without inventing values.
    if (!authors.length || !pubDate) return null
    const abstract =
      frontmatterString(frontmatter.scholar_abstract) ??
      frontmatterString(frontmatter.socialDescription) ??
      frontmatterString(frontmatter.description)
    const keywordList = frontmatterStringArray(frontmatter.keywords)
    const keywords = keywordList.length ? keywordList.join(", ") : undefined
    const ogSrc = frontmatterString(frontmatter.socialImage)
    const imageUrl = ogSrc
      ? `https://heavymetalcertified.com${ogSrc.startsWith("/") ? ogSrc : `/${ogSrc}`}`
      : undefined
    const dateModifiedRaw = normalizeCitationDate(frontmatter.updated) ?? pubDate
    const aboutLeaf = frontmatterString(frontmatter.breadcrumb_leaf)
    const aboutCategory = frontmatter.category != null ? String(frontmatter.category) : undefined
    const hasPdf = frontmatterBoolean(frontmatter.scholar_pdf)
    const configuredPdf = frontmatterString(frontmatter.scholar_pdf_url)
    const currentPdf = documentPdf(frontmatter, slugStr)
    const pdfUrl = isStandard || isManual
      ? (frontmatterString(frontmatter.pdf)
          ? `https://heavymetalcertified.com${frontmatterString(frontmatter.pdf)}`
          : standardPdfUrl(frontmatter, slugStr, socialUrl))
      : currentPdf
        ? `https://heavymetalcertified.com${currentPdf}`
        : (configuredPdf ?? (hasPdf ? `${socialUrl}.pdf` : undefined))
    const onlineDate = citationOnlineDate(frontmatter, pubDate)
    if (isStandard || isManual) {
      const seriesTitle = isManual ? MANUAL_SERIES_TITLE : STANDARD_SERIES_TITLE
      const doiUrl = certDoi ? `https://doi.org/${certDoi}` : undefined
      const pdfMedia = {
        "@type": "MediaObject",
        encodingFormat: "application/pdf",
        contentUrl: pdfUrl,
      }
      const scholarlyArticle = {
        "@context": "https://schema.org",
        "@type": "ScholarlyArticle",
        "@id": `${socialUrl}#scholarly-article`,
        name: citationTitle,
        headline: citationTitle,
        author: authors.map((author) =>
          author === researcherIdentity.citationName || author === researcherIdentity.name
            ? KAREN_PERSON
            : { "@type": "Person", name: author },
        ),
        datePublished: isoDateFromCitationDate(pubDate),
        publisher: ICS_PUBLISHER,
        inLanguage: "en",
        url: socialUrl,
        isAccessibleForFree: true,
        copyrightNotice: STANDARD_RIGHTS,
        license: "https://heavymetalcertified.com/license",
        dateModified: isoDateFromCitationDate(dateModifiedRaw),
        isPartOf: { "@type": "Periodical", name: seriesTitle, publisher: ICS_PUBLISHER },
        encoding: pdfMedia,
        associatedMedia: pdfMedia,
        ...(certDoi
          ? {
              identifier: {
                "@type": "PropertyValue",
                propertyID: "DOI",
                value: certDoi,
                url: doiUrl,
              },
              sameAs: doiUrl,
            }
          : {}),
        ...(abstract ? { abstract, description: abstract } : {}),
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(keywords ? { keywords } : {}),
        ...(aboutLeaf || aboutCategory
          ? {
              about: {
                "@type": "Thing",
                name: aboutCategory
                  ? `Category ${aboutCategory}${aboutLeaf ? ` ${aboutLeaf}` : ""}`
                  : aboutLeaf,
              },
            }
          : {}),
      }
      const breadcrumbLeaf = aboutLeaf || citationTitle
      const breadcrumbList = isManual
        ? {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "@id": `${socialUrl}#breadcrumbs`,
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "HMTc", item: "https://heavymetalcertified.com" },
              { "@type": "ListItem", position: 2, name: "Manuals", item: "https://heavymetalcertified.com/manuals" },
              { "@type": "ListItem", position: 3, name: breadcrumbLeaf, item: socialUrl },
            ],
          }
        : null
      return (
        <>
          <meta name="citation_title" content={citationTitle} />
          {authors.map((author, index) => (
            <Fragment key={`citation-author-${index}`}>
              <meta name="citation_author" content={author} />
              {author === researcherIdentity.citationName && (
                <meta name="citation_author_institution" content={ICS_PUBLISHER_NAME} />
              )}
            </Fragment>
          ))}
          <meta name="citation_publication_date" content={pubDate} />
          {onlineDate && <meta name="citation_online_date" content={onlineDate} />}
          <meta name="citation_journal_title" content={seriesTitle} />
          <meta name="citation_publisher" content={ICS_PUBLISHER_NAME} />
          {certDoi && <meta name="citation_doi" content={certDoi} />}
          <meta name="citation_fulltext_html_url" content={socialUrl} />
          <meta name="citation_pdf_url" content={pdfUrl} />
          <link rel="alternate" type="application/pdf" href={pdfUrl} />
          <meta name="citation_language" content="en" />
          {abstract && <meta name="citation_abstract" content={abstract} />}
          {keywords && isManual ? <meta name="citation_keywords" content={keywords} /> : null}
          <script
            type="application/ld+json"
            data-standard-scholarly
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(scholarlyArticle).replace(/</g, "\\u003c"),
            }}
          />
          {breadcrumbList ? (
            <script
              type="application/ld+json"
              data-manual-breadcrumbs
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(breadcrumbList).replace(/</g, "\\u003c"),
              }}
            />
          ) : null}
        </>
      )
    }
    // A URL path is not a report number; emitting one as `citation_technical_
    // report_number` publishes malformed bibliographic metadata. Every
    // scholar-eligible page is tagged as a technical report of the Institute.
    // Retain the site's existing stable series identifier when no explicit
    // report identifier is set. This is an HMTc identifier convention, not a
    // claim that Google requires every report to have an assigned number. The
    // identifier follows the
    // same scheme the DOI manifest and the manuals use: hmtc.<section>.<slug>
    // (e.g. hmtc.articles.tea-multi-metal-bioaccumulation). It never changes
    // across editions; the edition is carried by citation_publication_date.
    const slugParts = slugStr.split("/").filter(Boolean)
    const seriesNumber =
      slugParts.length >= 2 ? `hmtc.${slugParts[0]}.${slugParts[slugParts.length - 1]}` : undefined
    const reportNumber =
      frontmatterString(frontmatter.report_number) ??
      frontmatterString(frontmatter.standard_version) ??
      frontmatterString(frontmatter.edition) ??
      seriesNumber
    return (
      <>
        <meta name="citation_title" content={citationTitle} />
        {authors.map((author, index) => (
          <Fragment key={`citation-author-${index}`}>
            <meta name="citation_author" content={author} />
            {author === researcherIdentity.citationName && (
              <meta
                name="citation_author_institution"
                content="Heavy Metal Tested & Certified, Institute of Contaminant Standards (ICS)"
              />
            )}
          </Fragment>
        ))}
        <meta name="citation_publisher" content="Institute of Contaminant Standards (ICS)" />
        <meta
          name="citation_technical_report_institution"
          content="Heavy Metal Tested & Certified, Institute of Contaminant Standards (ICS)"
        />
        {pubDate && <meta name="citation_publication_date" content={pubDate} />}
        {reportNumber && <meta name="citation_technical_report_number" content={reportNumber} />}
        <meta name="citation_language" content="en" />
        {abstract && <meta name="citation_abstract" content={abstract} />}
        {keywords && <meta name="citation_keywords" content={keywords} />}
        <meta name="citation_abstract_html_url" content={socialUrl} />
        <meta name="citation_fulltext_html_url" content={socialUrl} />
        {/* Every scholar-eligible document is free to read in full — no paywall,
            no registration. Scholar treats this as an inclusion signal. */}
        <meta name="citation_fulltext_world_readable" content="true" />
        {pdfUrl && <meta name="citation_pdf_url" content={pdfUrl} />}
        {pdfUrl && <link rel="alternate" type="application/pdf" href={pdfUrl} />}
        {certDoi && <meta name="citation_doi" content={certDoi} />}
      </>
    )
  }

  return null
}
