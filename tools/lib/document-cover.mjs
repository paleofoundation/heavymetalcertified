// Shared cover-image contract for landing-page OG tags and DataCite deposits.
//
// Two rasters per manual (Karen lock 2026-09-20):
//   Hero left panel:         tall first-page PNG  /static/manuals/covers/<stem>.png
//   Unfurl / DataCite:       1200×630 letterbox   /static/manuals/covers/<stem>-og.png
// og:image / twitter:image MUST be landscape summary_large_image. The tall PDF
// page is never the social card.
//
// DataCite has no og:image field. The DOI record points at the same 1200×630
// HTTPS URL via relatedIdentifiers (HasPart + Image).
//
// relationType is HasPart, not IsSupplementTo:
//   DataCite 4.x: relationType describes resource A (the deposited work) → related B.
//   A HasPart B = the manual includes the cover image as a part.
//   A IsSupplementTo B would mean the work is a supplement to the image (inverted).
//
// Rights on the DOI stay All rights reserved (mint-dois RIGHTS). No CC BY.

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(HERE, "../..")
export const BASE_URL = "https://heavymetalcertified.com"
export const DEFAULT_OG_IMAGE = "/static/og-image.png"
export const DEFAULT_OG_WIDTH = 1200
export const DEFAULT_OG_HEIGHT = 630
export const OG_LETTERBOX = { r: 255, g: 253, b: 251, alpha: 1 } // canon paper #fffdfb

const MANUAL_COVER_JOBS_STATIC = [
  { slug: "infant-and-child-foods", pdf: "HMTc-Infant-and-Child-Foods-Program-Manual-v3.pdf", stem: "infant-and-child-foods-v3" },
  { slug: "pet-foods", pdf: "HMTc-Pet-Foods-Program-Manual-2026.pdf", stem: "pet-foods-2026" },
  { slug: "peptides-sarms-and-research-chemicals", pdf: "HMTc-Peptides-SARMs-and-Research-Chemicals-Program-Manual-v1.pdf", stem: "peptides-sarms-and-research-chemicals-v1" },
]

function manifestCoverJobs() {
  const manPath = path.join(REPO_ROOT, "data/manuals/manifest.json")
  if (!fs.existsSync(manPath)) return []
  let manuals = []
  try { manuals = JSON.parse(fs.readFileSync(manPath, "utf8")).manuals || [] } catch { return [] }
  const have = new Set(MANUAL_COVER_JOBS_STATIC.map((j) => j.slug))
  const extra = []
  for (const m of manuals) {
    if (!m || have.has(m.slug) || m.status !== "published" || !m.download_pdf) continue
    const ver = String(m.download_pdf).match(/-v(\d+)\.pdf$/)
    extra.push({ slug: m.slug, pdf: m.download_pdf, stem: `${m.slug}-v${ver ? ver[1] : "1"}` })
  }
  return extra
}

export const MANUAL_COVER_JOBS = [...MANUAL_COVER_JOBS_STATIC, ...manifestCoverJobs()]

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

function isOgName(name) {
  return /(?:^|\/|-)og\.png$/i.test(name)
}

function frontmatterField(fm, keys) {
  if (!fm || typeof fm !== "object") return null
  for (const key of keys) {
    const v = fm[key]
    if (v == null) continue
    const s = String(v).trim()
    if (s && s.toLowerCase() !== "null") return s
  }
  return null
}

function assetFromRel(rel, repo, baseUrl) {
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

function manualRailRel(slug, repo = REPO_ROOT) {
  const job = MANUAL_COVER_JOBS.find((j) => j.slug === slug)
  const dir = path.join(repo, "content/static/manuals/covers")
  if (job) {
    const abs = path.join(dir, `${job.stem}.png`)
    if (fs.existsSync(abs)) return `/static/manuals/covers/${job.stem}.png`
  }
  if (!fs.existsSync(dir)) return null
  const names = fs.readdirSync(dir).filter((n) => n.endsWith(".png") && !isOgName(n))
  const hit = names.find((n) => n === `${slug}.png`) || names.find((n) => n.startsWith(`${slug}-`))
  return hit ? `/static/manuals/covers/${hit}` : null
}

function manualOgRel(slug, repo = REPO_ROOT) {
  const job = MANUAL_COVER_JOBS.find((j) => j.slug === slug)
  const dir = path.join(repo, "content/static/manuals/covers")
  if (job) {
    const abs = path.join(dir, `${job.stem}-og.png`)
    if (fs.existsSync(abs)) return `/static/manuals/covers/${job.stem}-og.png`
  }
  if (!fs.existsSync(dir)) return null
  const names = fs.readdirSync(dir).filter((n) => isOgName(n))
  const hit = names.find((n) => n === `${slug}-og.png`) || names.find((n) => n.startsWith(`${slug}-`) && isOgName(n))
  return hit ? `/static/manuals/covers/${hit}` : null
}

function standardOgRel(slug, repo = REPO_ROOT) {
  const og = path.join(repo, "content/static/standards/covers", `${slug}-og.png`)
  if (fs.existsSync(og)) return `/static/standards/covers/${slug}-og.png`
  return null
}

/** Tall first-page PNG for the hero left-column cover. Never the social card. */
export function resolveCover(opts = {}) {
  const { typeName, slug, frontmatter, repo = REPO_ROOT, baseUrl = BASE_URL } = opts
  const fromFm = frontmatterField(frontmatter, ["pdf_cover"])
  let rel = fromFm
  if (rel && isOgName(rel)) rel = null
  if (!rel && typeName === "manuals" && slug) rel = manualRailRel(slug, repo)
  if (!rel && typeName === "standards" && slug) {
    const tall = path.join(repo, "content/static/standards/covers", `${slug}.png`)
    if (fs.existsSync(tall)) rel = `/static/standards/covers/${slug}.png`
  }
  return assetFromRel(rel, repo, baseUrl)
}

/** 1200×630 letterbox used for og:image / twitter:image and DataCite Image URL. */
export function resolveOgImage(opts = {}) {
  const { typeName, slug, frontmatter, repo = REPO_ROOT, baseUrl = BASE_URL } = opts
  const fromFm = frontmatterField(frontmatter, ["socialImage", "cover"])
  let rel = fromFm && isOgName(fromFm) ? fromFm : null
  if (!rel && typeName === "manuals" && slug) rel = manualOgRel(slug, repo)
  if (!rel && typeName === "standards" && slug) rel = standardOgRel(slug, repo)
  const asset = assetFromRel(rel, repo, baseUrl)
  if (!asset) return null
  if (asset.width && asset.height && asset.height > asset.width) return null
  return asset
}

export async function writeLetterboxOg(srcPng, destPng) {
  await sharp(srcPng)
    .resize(DEFAULT_OG_WIDTH, DEFAULT_OG_HEIGHT, {
      fit: "contain",
      background: OG_LETTERBOX,
    })
    .png()
    .toFile(destPng)
  const size = pngSize(destPng)
  if (!size || size.width !== DEFAULT_OG_WIDTH || size.height !== DEFAULT_OG_HEIGHT) {
    throw new Error(`writeLetterboxOg: expected ${DEFAULT_OG_WIDTH}x${DEFAULT_OG_HEIGHT}, got ${size?.width}x${size?.height}`)
  }
  return size
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
