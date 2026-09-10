// Sitemap writer + validator for the two URLs declared in robots.txt.
//
// WHY THIS EXISTS. Quartz ContentIndex emits public/sitemap.xml, and
// postbuild-cert-sitemaps.mjs used to emit only sitemap-scholarly.xml. Robots
// declares both. A missing or unreadable file at the edge is a crawler 500/404
// on a URL we advertised. Both sitemaps are therefore produced here from the
// same built-HTML walk the crawl audit uses, with a required XML prolog, escaped
// locs, and a fail-loud validator so a broken declared sitemap cannot ship.

import fs from "node:fs"
import path from "node:path"

import {
  CERT_ORIGIN,
  expectedCanonical,
  htmlRoute,
  isNoindex,
  linkRel,
  meta,
  walkHtml,
} from "./built-html.mjs"

export const SCHOLARLY_SECTIONS = ["articles/", "briefings/", "manuals/"]

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function urlsetXml(locs) {
  const unique = [...new Set(locs)].sort()
  const body = unique
    .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function xmlLocations(xml) {
  return [...String(xml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    m[1].replace(/&amp;/g, "&"),
  )
}

export function isWellFormedSitemap(xml) {
  const text = String(xml)
  if (!text.startsWith("<?xml")) return false
  if (!/<urlset\b[^>]*>/.test(text) || !/<\/urlset>/.test(text)) return false
  const locs = xmlLocations(text)
  if (!locs.length) return false
  if (locs.some((url) => !url.startsWith(`${CERT_ORIGIN}/`))) return false
  // Unescaped ampersand in a loc (or anywhere outside an entity) is the usual
  // reason a crawler XML parser rejects a sitemap.
  const stripped = text.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, "")
  if (stripped.includes("&")) return false
  return true
}

export function scholarlyRel(rel) {
  return SCHOLARLY_SECTIONS.some((section) => rel.startsWith(section))
}

export function collectIndexable(publicDir) {
  const indexable = []
  const scholarly = []
  for (const file of walkHtml(publicDir)) {
    if (path.basename(file) === "404.html") continue
    const html = fs.readFileSync(file, "utf8")
    if (isNoindex(html)) continue
    const route = htmlRoute(publicDir, file)
    const canonical = linkRel(html, "canonical") ?? expectedCanonical(route)
    indexable.push(canonical)
    const citationTitle = meta(html, "citation_title")
    const rel = path.relative(publicDir, file).split(path.sep).join("/")
    if (citationTitle && scholarlyRel(rel)) scholarly.push(canonical)
  }
  return {
    indexable: [...new Set(indexable)].sort(),
    scholarly: [...new Set(scholarly)].sort(),
  }
}

export function writeSitemaps(publicDir, { minMain = 50, minScholarly = 10 } = {}) {
  fs.mkdirSync(publicDir, { recursive: true })
  const { indexable, scholarly } = collectIndexable(publicDir)
  const mainXml = urlsetXml(indexable)
  const scholarXml = urlsetXml(scholarly)
  const mainPath = path.join(publicDir, "sitemap.xml")
  const scholarPath = path.join(publicDir, "sitemap-scholarly.xml")
  fs.writeFileSync(mainPath, mainXml, "utf8")
  fs.writeFileSync(scholarPath, scholarXml, "utf8")

  const errors = validateDeclaredSitemaps(publicDir, { minMain, minScholarly })
  if (errors.length) {
    const err = new Error(`sitemap write produced an invalid declared sitemap:\n${errors.join("\n")}`)
    err.errors = errors
    throw err
  }
  return { mainPath, scholarPath, indexable, scholarly }
}

export function validateDeclaredSitemaps(
  publicDir,
  { minMain = 50, minScholarly = 10 } = {},
) {
  const errors = []
  const required = ["robots.txt", "sitemap.xml", "sitemap-scholarly.xml"]
  for (const name of required) {
    if (!fs.existsSync(path.join(publicDir, name))) {
      errors.push(`missing public/${name}`)
    }
  }

  const mainPath = path.join(publicDir, "sitemap.xml")
  const scholarPath = path.join(publicDir, "sitemap-scholarly.xml")
  const robotsPath = path.join(publicDir, "robots.txt")

  if (fs.existsSync(mainPath)) {
    const xml = fs.readFileSync(mainPath, "utf8")
    if (!isWellFormedSitemap(xml)) errors.push("sitemap.xml: not a well-formed urlset")
    const locs = xmlLocations(xml)
    if (locs.length < minMain) {
      errors.push(`sitemap.xml: ${locs.length} URL(s); expected at least ${minMain}`)
    }
    for (const url of locs) {
      if (url !== `${CERT_ORIGIN}/` && url.endsWith("/")) {
        errors.push(`sitemap.xml: trailing-slash URL ${url}`)
      }
    }
  }

  if (fs.existsSync(scholarPath)) {
    const xml = fs.readFileSync(scholarPath, "utf8")
    if (!isWellFormedSitemap(xml)) {
      errors.push("sitemap-scholarly.xml: not a well-formed urlset")
    }
    const locs = xmlLocations(xml)
    if (locs.length < minScholarly) {
      errors.push(
        `sitemap-scholarly.xml: ${locs.length} URL(s); expected at least ${minScholarly}`,
      )
    }
  }

  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath, "utf8")
    for (const sitemap of [
      `${CERT_ORIGIN}/sitemap.xml`,
      `${CERT_ORIGIN}/sitemap-scholarly.xml`,
    ]) {
      if (!robots.includes(`Sitemap: ${sitemap}`)) {
        errors.push(`robots.txt: missing ${sitemap}`)
      }
    }
  }

  return errors
}
