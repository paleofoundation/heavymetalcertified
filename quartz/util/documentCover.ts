// Landing-page OG cover helper. Mirrors tools/lib/document-cover.mjs
// (URL + frontmatter contract only — no filesystem, so Head stays isomorphic).
//
// Prefer pdf_cover (PR #99 rail asset) then socialImage. Pages without a cover
// keep the branded /static/og-image.png fallback.

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
  return (
    frontmatterString(frontmatter?.pdf_cover) ||
    frontmatterString(frontmatter?.socialImage) ||
    frontmatterString(frontmatter?.cover)
  )
}

export function pageCoverDims(frontmatter: Record<string, unknown> | undefined): {
  width?: string
  height?: string
} {
  const width = frontmatterString(frontmatter?.og_image_width)
  const height = frontmatterString(frontmatter?.og_image_height)
  return { width, height }
}
