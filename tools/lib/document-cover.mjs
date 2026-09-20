// Shared cover-image contract for landing-page OG tags and DataCite deposits.
//
// DataCite has no og:image field. The landing page carries og:image / twitter:image;
// the DOI record points at the same absolute HTTPS PNG via relatedIdentifiers.
//
// relationType is HasPart, not IsSupplementTo:
//   DataCite 4.x: relationType describes resource A (the deposited work) → related B.
//   A HasPart B = the manual/standard includes the cover image as a part.
//   A IsSupplementTo B would mean the work is a supplement to the image (inverted).
//   resourceTypeGeneral=Image names B.
//
// Rights on the DOI stay All rights reserved (mint-dois RIGHTS). No CC BY.
// Covers are committed rasters from tools/render-manual-pdf-cover.mjs (PR #99).
// Standards covers are optional: content/static/standards/covers/<slug>.png when
// present; pages without a cover fall back to /static/og-image.png and omit the
// Image relatedIdentifier. Do not generate hundreds of standard covers here.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(HERE, "../..")
export const BASE_URL = "https://heavymetalcertified.com"
export const DEFAULT_OG_IMAGE = "/static/og-image.png"
export const DEFAULT_OG_WIDTH = 1200
export const DEFAULT_OG_HEIGHT = 630

export const MANUAL_COVER_JOBS = [
  { slug: "infant-and-child-foods", pdf: "HMTc-Infant-and-Child-Foods-Program-Manual-v3.pdf", stem: "infant-and-child-foods-v3" },
  { slug: "pet-foods", pdf: "HMTc-Pet-Foods-Program-Manual-2026.pdf", stem: "pet-foods-2026" },
]

export const COVER_RELATION = {
  relatedIdentifierType: "URL",
  relationType: "HasPart",
  resourceTypeGeneral: "Image",
}

export function pngSize(absPath) {
  try {
    const fd = fs.openSync(absPath, "r")
    const buf = Buffer.alloc(24)
    fs.readSync(fd, buf, 0, 24, 0)
    fs.closeSync(fd)
    if (buf.toString("ascii", 1, 4) !== "PNG") return null
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  } catch {
    return null
  }
}

export function absoluteHttpsAsset(src, baseUrl = BASE_URL) {
  if (!src) return null
  const s = String(src).trim()
  if (!s || s.toLowerCase() === "null") return null
  if (/^https?:\/\//i.test(s)) return s
  const host = String(baseUrl).replace(/^https?:\/\//, "").replace(/\/$/, "")
  const pathname = s.startsWith("/") ? s : `/${s}`
  return `https://${host}${pathname}`
}

function frontmatterCoverPath(fm) {
  if (!fm || typeof fm !== "object") return null
  for (const key of ["pdf_cover", "socialImage", "cover"]) {
    const v = fm[key]
    if (v == null) continue
    const s = String(v).trim()
    if (s && s.toLowerCase() !== "null") return s
  }
  return null
}

function manualCoverRel(slug, repo = REPO_ROOT) {
  const job = MANUAL_COVER_JOBS.find((j) => j.slug === slug)
  const dir = path.join(repo, "content/static/manuals/covers")
  if (job) {
    const abs = path.join(dir, `${job.stem}.png`)
    if (fs.existsSync(abs)) return `/static/manuals/covers/${job.stem}.png`
  }
  if (!fs.existsSync(dir)) return null
  const names = fs.readdirSync(dir).filter((n) => n.endsWith(".png"))
  const hit = names.find((n) => n === `${slug}.png`) || names.find((n) => n.startsWith(`${slug}-`))
  return hit ? `/static/manuals/covers/${hit}` : null
}

function standardCoverRel(slug, repo = REPO_ROOT) {
  const abs = path.join(repo, "content/static/standards/covers", `${slug}.png`)
  return fs.existsSync(abs) ? `/static/standards/covers/${slug}.png` : null
}

export function resolveCover(opts = {}) {
  const { typeName, slug, frontmatter, repo = REPO_ROOT, baseUrl = BASE_URL } = opts
  const fromFm = frontmatterCoverPath(frontmatter)
  let rel = fromFm
  if (!rel && typeName === "manuals" && slug) rel = manualCoverRel(slug, repo)
  if (!rel && typeName === "standards" && slug) rel = standardCoverRel(slug, repo)
  if (!rel) return null
  const url = absoluteHttpsAsset(rel, baseUrl)
  if (!url) return null
  const pathname = new URL(url).pathname
  const absCandidates = [
    path.join(repo, "content", pathname.replace(/^\//, "")),
    path.join(repo, "quartz", pathname.replace(/^\//, "")),
  ]
  const abs = absCandidates.find((p) => fs.existsSync(p))
  const size = abs ? pngSize(abs) : null
  return {
    rel: pathname,
    url,
    width: size?.width ?? null,
    height: size?.height ?? null,
    abs: abs ?? null,
  }
}

export function coverRelatedIdentifier(cover) {
  const url = typeof cover === "string" ? cover : cover?.url
  if (!url) return null
  return {
    relatedIdentifier: url,
    relatedIdentifierType: COVER_RELATION.relatedIdentifierType,
    relationType: COVER_RELATION.relationType,
    resourceTypeGeneral: COVER_RELATION.resourceTypeGeneral,
  }
}

export function isCoverRelatedIdentifier(row) {
  if (!row || typeof row !== "object") return false
  return (
    row.relatedIdentifierType === "URL" &&
    row.relationType === "HasPart" &&
    row.resourceTypeGeneral === "Image" &&
    /\/static\/.+\/covers\/.+\.png$/i.test(String(row.relatedIdentifier || ""))
  )
}

export function mergeCoverRelatedIdentifiers(existing, coverId) {
  const list = Array.isArray(existing) ? existing.map((row) => ({ ...row })) : []
  if (!coverId) return list
  const already = list.some((row) => String(row.relatedIdentifier) === String(coverId.relatedIdentifier) && isCoverRelatedIdentifier(row))
  if (!already) list.push({ ...coverId })
  return list
}
