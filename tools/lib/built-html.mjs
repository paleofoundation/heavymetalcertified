// Shared HTML walk + tag helpers for postbuild sitemap/JSON-LD gates.
// These read the emitted public/ tree, not source frontmatter, so they see the
// same robots/canonical/title a crawler sees.

import fs from "node:fs"
import path from "node:path"

export const CERT_ORIGIN = "https://heavymetalcertified.com"

export function walkFiles(dir) {
  if (!fs.existsSync(dir)) return []
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walkFiles(full) : [full]
  })
}

export function walkHtml(publicDir) {
  return walkFiles(publicDir).filter((file) => file.endsWith(".html"))
}

// A tag ends at the first ">" that is OUTSIDE a quoted attribute value.
export function tags(html, name) {
  return html.match(new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, "gi")) ?? []
}

export function attribute(tag, name) {
  const m = tag.match(new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i"))
  return m ? (m[1] ?? m[2]) : undefined
}

export function selectedAttribute(html, tagName, selectorName, selectorValue, resultName) {
  for (const tag of tags(html, tagName)) {
    if (attribute(tag, selectorName)?.toLowerCase() === selectorValue.toLowerCase()) {
      const value = attribute(tag, resultName)
      if (value !== undefined) return value
    }
  }
}

export function meta(html, name) {
  return selectedAttribute(html, "meta", "name", name, "content")
}

export function property(html, name) {
  return selectedAttribute(html, "meta", "property", name, "content")
}

export function linkRel(html, rel) {
  return selectedAttribute(html, "link", "rel", rel, "href")
}

export function pageTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i)
  return m ? decodeEntities(m[1]).trim() : ""
}

export function titleWithoutBrand(html) {
  return pageTitle(html)
    .replace(/\s*\|\s*Heavy Metal Tested & Certified\s*$/i, "")
    .trim()
}

export function robotsContent(html) {
  return meta(html, "robots") ?? ""
}

export function isNoindex(html) {
  return /(?:^|,)\s*noindex\b/i.test(robotsContent(html))
}

export function htmlRoute(publicDir, file) {
  const rel = path.relative(publicDir, file).split(path.sep).join("/")
  if (rel === "index.html") return "/"
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}`
  return `/${rel.slice(0, -".html".length)}`
}

export function expectedCanonical(route) {
  return route === "/" ? `${CERT_ORIGIN}/` : `${CERT_ORIGIN}${route}`
}

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#34;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&ldquo;": "“",
  "&rdquo;": "”",
  "&mdash;": "—",
  "&ndash;": "–",
  "&middot;": "·",
  "&nbsp;": " ",
  "&hellip;": "…",
}

export function decodeEntities(s) {
  return String(s || "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z]+;/gi, (m) => (m in ENTITIES ? ENTITIES[m] : m))
}

export function hasJsonLdType(html, type) {
  const blocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) ?? []
  for (const block of blocks) {
    const raw = block.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "")
    try {
      const parsed = JSON.parse(raw)
      const nodes = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object"
          ? [parsed, ...(Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [])]
          : []
      if (nodes.some((node) => node && node["@type"] === type)) return true
    } catch {
      // Malformed JSON-LD is a coverage miss, not a parse crash.
    }
  }
  return false
}
