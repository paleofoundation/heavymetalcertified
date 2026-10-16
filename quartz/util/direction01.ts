import type { Root } from "hast"
import { visit } from "unist-util-visit"
import legacyColors from "../styles/legacy-colors.json"

const colors: Record<string, string> = legacyColors

/** Recolor legacy inline presentation in the cloned render tree, never the content source.
 * Only CSS hex values change. Text, links, IDs, metadata and document data are untouched.
 * Restrict processing to style attributes; code examples, SVG identity marks and JSON-LD
 * are deliberately excluded. Component styles use the same semantic tokens directly.
 */
export function applyDirection01(root: Root): void {
  visit(root, "element", (node) => {
    const style = node.properties?.style
    if (typeof style !== "string") return
    node.properties.style = style.replace(/#[0-9a-f]{6}\b/gi, (hex) => colors[hex.toLowerCase()] ?? hex)
  })
}
