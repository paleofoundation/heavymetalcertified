import { personEntity } from "./researcher-schema.mjs"

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"]
const MONTH_PATTERN = MONTHS.join("|")
const pad = (value, length = 2) => String(value).padStart(length, "0")

function calendarDate(year, month, day) {
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return undefined
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`
}

// Preserve the precision actually supplied; never invent January or the first day.
export function publicationDate(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime())
    ? calendarDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate()) : undefined
  if (typeof value !== "string" && typeof value !== "number") return undefined
  const raw = String(value).trim()
  if (/^\d{4}$/.test(raw)) return Number(raw) > 0 ? raw : undefined
  const full = raw.match(/^(\d{4})([-/])(\d{1,2})\2(\d{1,2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2}))?$/)
  if (full) {
    if (raw.includes("T") && !Number.isFinite(Date.parse(raw))) return undefined
    return calendarDate(Number(full[1]), Number(full[3]), Number(full[4]))
  }
  const monthOnly = raw.match(/^(\d{4})-(\d{2})$/)
  if (monthOnly) return Number(monthOnly[1]) > 0 && Number(monthOnly[2]) >= 1 && Number(monthOnly[2]) <= 12 ? raw : undefined
  const namedDay = raw.match(new RegExp(`^(${MONTH_PATTERN})\\s+(\\d{1,2}),?\\s+(\\d{4})$`, "i"))
  if (namedDay) return calendarDate(Number(namedDay[3]), MONTHS.indexOf(namedDay[1].toLowerCase()) + 1, Number(namedDay[2]))
  const dayFirst = raw.match(new RegExp(`^(\\d{1,2})\\s+(${MONTH_PATTERN})\\s+(\\d{4})$`, "i"))
  if (dayFirst) return calendarDate(Number(dayFirst[3]), MONTHS.indexOf(dayFirst[2].toLowerCase()) + 1, Number(dayFirst[1]))
  const namedMonth = raw.match(new RegExp(`^(${MONTH_PATTERN})\\s+(\\d{4})$`, "i"))
  if (namedMonth && Number(namedMonth[2]) > 0) return `${namedMonth[2]}-${pad(MONTHS.indexOf(namedMonth[1].toLowerCase()) + 1)}`
  return undefined
}

function firstDate(frontmatter, fields) {
  for (const field of fields) {
    const date = publicationDate(frontmatter[field])
    if (date) return date
  }
  return undefined
}

export function publicationAuthors(frontmatter) {
  const source = Object.hasOwn(frontmatter, "authors") ? frontmatter.authors : frontmatter.author
  const authors = (Array.isArray(source) ? source : [source]).flatMap((value) => {
    const name = typeof value === "string" ? value.trim() : typeof value?.name === "string" ? value.name.trim() : ""
    return name ? [{ name, orcid: typeof value === "object" ? value.orcid : undefined }] : []
  })
  return authors.map(({ name, orcid }) => {
    // A page-level ORCID belongs to its singular named author, not every coauthor.
    const singularName = typeof frontmatter.author === "string" ? frontmatter.author.trim() : undefined
    const pageOrcid = (singularName ? name === singularName : authors.length === 1) ? frontmatter.orcid : undefined
    return personEntity(name, orcid ?? pageOrcid)
  })
}

export function publicationMetadata(frontmatter) {
  const authors = publicationAuthors(frontmatter)
  const datePublished = firstDate(frontmatter, ["published", "date", "briefing_date", "effective_date"])
  const dateModified = firstDate(frontmatter, ["modified", "updated"])
  return {
    ...(authors.length ? { author: authors.length === 1 ? authors[0] : authors } : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
  }
}

export function jsonLdScript(graph) {
  return `<script type="application/ld+json">${JSON.stringify(graph).replace(/</g, "\\u003c")}</script>`
}

// Refresh only these emitter-owned IDs. Preserve unrelated scripts and graph nodes.
export function replacePublicationGraphs(html, graphs, ownedIds) {
  const ids = new Set(ownedIds)
  html = html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (block, json) => {
    let graph
    try { graph = JSON.parse(json) } catch { return block }
    if (ids.has(graph?.["@id"])) return ""
    if (!Array.isArray(graph?.["@graph"])) return block
    const remaining = graph["@graph"].filter(node => !ids.has(node?.["@id"]))
    if (remaining.length === graph["@graph"].length) return block
    return remaining.length ? jsonLdScript({ ...graph, "@graph": remaining }) : ""
  })
  if (!html.includes("</head>")) throw new Error("Publication page has no head for JSON-LD")
  return html.replace("</head>", `${graphs.filter(Boolean).map(jsonLdScript).join("")}</head>`)
}
