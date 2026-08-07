// Font registration for the scholarly-PDF renderer.
//
// The Content Page PDF v2 design uses three families:
//   Lora           — display serif: the title, the section subheadings, and the
//                    "Abstract" label.
//   Inter          — the sans the design sets body copy, tables, references and
//                    front/back matter in (the mockup uses system-ui, of which
//                    Inter is the portable, embeddable twin).
//   IBM Plex Mono  — the monospace for the masthead, section numbers, the
//                    KEYWORDS / CORRESPONDENCE / PUBLICATION HISTORY labels and
//                    table column headers.
//
// The static TTFs are vendored under ./fonts (OFL 1.1, licences alongside). All
// three cover Latin, Latin Extended, the micro sign and Cyrillic natively, so
// the renderer embeds real glyphs instead of ASCII-folding — "Ćwieląg-Drabek",
// "µg/kg" and Cyrillic journal titles all render correctly. (Verified with
// fontkit: the only glyph absent from Lora is the arrow, which the text
// normaliser maps, and which never appears in a title or subheading anyway.)

import { Font } from "@react-pdf/renderer"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts")
const f = (name) => join(FONT_DIR, name)

let registered = false

export function registerFonts() {
  if (registered) return
  registered = true

  Font.register({
    family: "Lora",
    fonts: [
      { src: f("Lora-Regular.ttf"), fontWeight: 400 },
      { src: f("Lora-Bold.ttf"), fontWeight: 700 },
      { src: f("Lora-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
    ],
  })

  Font.register({
    family: "Inter",
    fonts: [
      { src: f("Inter-Regular.ttf"), fontWeight: 400 },
      { src: f("Inter-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: f("Inter-Medium.ttf"), fontWeight: 500 },
      { src: f("Inter-SemiBold.ttf"), fontWeight: 600 },
    ],
  })

  Font.register({
    family: "IBMPlexMono",
    fonts: [
      { src: f("IBMPlexMono-Regular.ttf"), fontWeight: 400 },
      { src: f("IBMPlexMono-Medium.ttf"), fontWeight: 500 },
    ],
  })

  // The design sets body copy ragged-right, not justified, so ordinary words
  // are kept whole (no mid-word break in "bioaccumulation") instead of
  // react-pdf's default aggressive hyphenator. The exception is a long
  // unbreakable token — a DOI URL or a page slug like
  // "eu-2023-915-lead-infant-young-child-foods" — which, in a narrow table
  // column, is wider than the cell and, with no break point, crashes the layout
  // engine ("unsupported number: -9.2e+21"). Such tokens are broken at their
  // natural separators (and, failing that, by length), so they wrap instead.
  // The threshold is deliberately high (20). react-pdf prints a hyphen at every
  // break point it takes, so splitting an ordinary hyphenated word doubles the
  // hyphen ("leaf-to--infusion", "2348--7259"). Words shorter than 20 characters
  // — which includes the hyphenated compounds in titles and an ORCID — are left
  // whole; they fit their column and wrap at spaces without a hyphen. Only the
  // genuinely over-wide machine tokens (page slugs, DOI URLs) are broken, where
  // an added hyphen is tolerable and a crash is not.
  Font.registerHyphenationCallback((word) => {
    if (word.length < 20) return [word]
    const parts = word.split(/(?<=[/_\-.,;:])/)
    const out = []
    for (const p of parts) {
      if (p.length <= 16) out.push(p)
      else for (let i = 0; i < p.length; i += 14) out.push(p.slice(i, i + 14))
    }
    return out
  })
}
