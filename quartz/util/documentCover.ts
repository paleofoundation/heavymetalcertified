// Landing-page OG cover helper. Mirrors tools/lib/document-cover.mjs
// (URL + frontmatter contract only — no filesystem, so Head stays isomorphic).
//
// socialImage is the 1200×630 letterbox. pdf_cover is the tall rail raster and
// must never become og:image (Karen lock: summary_large_image landscape).

export const DEFAULT_OG_IMAGE = "/static/og-image.png"
export const DEFAULT_OG_WIDTH = 1200
export const DEFAULT_OG_HEIGHT = 630

function frontmatterString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  const s = String(value).trim()
  return s && s.toLowerCase() !== "null" ? s : undefined
}

export function absoluteHttpsAsset(src: string, baseUrl: string): string {
  if (/^https?:\/\//i.test(src)) return src
  const host = String(baseUrl).replace(/^https?:\/\//, "").replace(/\/$/, "")
  const pathname = src.startsWith("/") ? src : `/${src}`
  return `https://${host}${pathname}`
}

export function pageCoverSrc(frontmatter: Record<string, unknown> | undefined): string | undefined {
  // Never pdf_cover — that asset is portrait and is the left-rail only.
  return frontmatterString(frontmatter?.socialImage) || frontmatterString(frontmatter?.cover)
}

export function isLandscapeOg(width?: string, height?: string): boolean {
  if (!width || !height) return true
  const w = Number(width)
  const h = Number(height)
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return true
  return w >= h
}

export function pageCoverDims(frontmatter: Record<string, unknown> | undefined): {
  width?: string
  height?: string
} {
  const width = frontmatterString(frontmatter?.og_image_width)
  const height = frontmatterString(frontmatter?.og_image_height)
  return { width, height }
}
