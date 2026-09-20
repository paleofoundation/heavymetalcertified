// Shared HMTc spacing + density tokens.
// CSS (quartz/styles/tokens.scss) and generators/lint import this file so the
// scale cannot drift. Do not invent off-scale values.

export const SPACE = Object.freeze({
  1: 8,
  2: 16,
  3: 24,
  4: 48,
  5: 72,
})

export const SPACE_SCALE = [SPACE[1], SPACE[2], SPACE[3], SPACE[4], SPACE[5]]

/** Sitewide section floor (standards, program, manuals). */
export const SECTION_GAP = SPACE[4]
/** Manuals get the next step on the locked scale so sections are not glued. */
export const MANUAL_SECTION_GAP = SPACE[5]

export const TABLE_CELL_PAD_Y = SPACE[2]
export const TABLE_CELL_PAD_X = SPACE[2]
export const TABLE_CELL_PAD_MIN = 12

export const PROSE_MAX_CH = 70
export const PROSE_MAX_MIN = 65
export const PROSE_MAX_MAX = 72

export const H2_MARGIN_TOP = SPACE[4]
export const H2_MARGIN_BOTTOM = SPACE[2]
export const TABLE_MARGIN_Y = SPACE[3]

export const SECTION_CLASS = "hmtc-section"
export const H2_CLASS = "hmtc-h2"
export const PROSE_CLASS = "hmtc-prose"
export const LEAD_CLASS = "hmtc-manual-lead"
export const PRINCIPLE_CARD_CLASS = "hmtc-principle-card"
export const AUTHORITY_CLASS = "hmtc-manual-authority"
export const COVER_CLASS = "hmtc-manual-cover"

/** Hero dek: one job, not a word pile. Network kill-gate spirit. */
export const HERO_DEK_MAX_SENTENCES = 2
export const HERO_DEK_MAX_WORDS = 32
/** Body lead on a Manual v3 page. */
export const LEAD_MAX_SENTENCES = 2
export const LEAD_MAX_WORDS = 50

export const CAT1_MANUAL = "infant-and-child-foods"

export function px(n) {
  return `${n}px`
}

export function cssCustomProperties() {
  return [
    `--space-1: ${px(SPACE[1])}`,
    `--space-2: ${px(SPACE[2])}`,
    `--space-3: ${px(SPACE[3])}`,
    `--space-4: ${px(SPACE[4])}`,
    `--space-5: ${px(SPACE[5])}`,
    `--section-gap: var(--space-4)`,
    `--section-gap-manual: var(--space-5)`,
    `--table-cell-pad-y: ${px(TABLE_CELL_PAD_Y)}`,
    `--table-cell-pad-x: ${px(TABLE_CELL_PAD_X)}`,
    `--prose-max: ${PROSE_MAX_CH}ch`,
    `--h2-margin-top: var(--space-4)`,
    `--h2-margin-bottom: var(--space-2)`,
    `--table-margin-y: var(--space-3)`,
  ]
}

export function wordCount(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, "x")
    .split(/\s+/)
    .filter(Boolean).length
}

export function sentenceCount(s) {
  const normalized = String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/v\d+\.\d+/gi, "vX")
    .replace(/\b[A-Z]\./g, "X")
    .replace(/\s+/g, " ")
    .trim()
  if (!normalized) return 0
  return normalized.split(/[.?!]+/).map((p) => p.trim()).filter(Boolean).length
}
