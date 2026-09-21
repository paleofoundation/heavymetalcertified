// Density + hero-pile rules for Program Manuals.
// Imported by tools/design-lint.mjs (build-blocking) and unit tests.

import {
  SECTION_CLASS,
  LEAD_CLASS,
  AUTHORITY_CLASS,
  COVER_CLASS,
  CAT1_MANUAL,
  SECTION_GAP,
  HERO_DEK_MAX_SENTENCES,
  HERO_DEK_MAX_WORDS,
  LEAD_MAX_SENTENCES,
  LEAD_MAX_WORDS,
  SPACE,
  TABLE_CELL_PAD_MIN,
  wordCount,
  sentenceCount,
} from "./design-tokens.mjs"

const FM_DESC = /(?:^|\n)description:\s*(?:"([^"]*)"|'([^']*)'|(.+))/
const SECTION_OPEN = /<section\b([^>]*)>/gi
const MARGIN_BOTTOM = /margin-bottom\s*:\s*(\d+)px/i
const STYLE_ATTR = /style\s*=\s*"([^"]*)"/i
const CLASS_ATTR = /class\s*=\s*"([^"]*)"/i

export function parseFrontmatterDescription(fm) {
  const m = String(fm || "").match(FM_DESC)
  return (m && (m[1] || m[2] || m[3] || "")).trim()
}

export function extractLeadHtml(body) {
  const m = String(body || "").match(new RegExp(`<p[^>]*class="[^"]*${LEAD_CLASS}[^"]*"[^>]*>([\\s\\S]*?)</p>`, "i"))
  return m ? m[1] : ""
}

export function lintHeroDek(description, rel) {
  const findings = []
  const words = wordCount(description)
  const sentences = sentenceCount(description)
  if (!description) {
    findings.push(`${rel}  hero dek empty — a Manual hero states one job in ≤${HERO_DEK_MAX_SENTENCES} sentences / ${HERO_DEK_MAX_WORDS} words`)
    return findings
  }
  if (sentences > HERO_DEK_MAX_SENTENCES) {
    findings.push(`${rel}  hero dek word-pile — ${sentences} sentences (max ${HERO_DEK_MAX_SENTENCES}). One job: the governing instrument, not a contents list.`)
  }
  if (words > HERO_DEK_MAX_WORDS) {
    findings.push(`${rel}  hero dek word-pile — ${words} words (max ${HERO_DEK_MAX_WORDS}). Aligns with the network hero kill-gate.`)
  }
  if (/Method v2 governing instrument/i.test(description)) {
    findings.push(`${rel}  hero dek treats Method as the page subject — manuals are entity-first (category / infant-child foods). Method lives at /program/method.`)
  }
  return findings
}

export function lintManualLead(body, rel, { required = false } = {}) {
  const findings = []
  const lead = extractLeadHtml(body)
  if (!lead) {
    if (required) findings.push(`${rel}  missing <p class="${LEAD_CLASS}"> — Manual v3 opens with a ≤${LEAD_MAX_SENTENCES}-sentence lead, not a heading pile`)
    return findings
  }
  const words = wordCount(lead)
  const sentences = sentenceCount(lead)
  if (sentences > LEAD_MAX_SENTENCES) {
    findings.push(`${rel}  lead word-pile — ${sentences} sentences (max ${LEAD_MAX_SENTENCES})`)
  }
  if (words > LEAD_MAX_WORDS) {
    findings.push(`${rel}  lead word-pile — ${words} words (max ${LEAD_MAX_WORDS})`)
  }
  if (/Method v2 governing instrument/i.test(lead)) {
    findings.push(`${rel}  lead treats Method as the page subject — open with what the Manual does for the category. Method lives at /program/method.`)
  }
  return findings
}

export function lintManualSections(body, rel) {
  const findings = []
  const html = String(body || "")
  let m
  const re = new RegExp(SECTION_OPEN.source, "gi")
  let n = 0
  while ((m = re.exec(html))) {
    n++
    const attrs = m[1] || ""
    const cls = (attrs.match(CLASS_ATTR)?.[1] || "")
    const style = attrs.match(STYLE_ATTR)?.[1] || ""
    const mb = style.match(MARGIN_BOTTOM)
    if (!cls.split(/\s+/).includes(SECTION_CLASS)) {
      findings.push(`${rel}  <section> #${n} missing class="${SECTION_CLASS}" (token floor --section-gap-manual / ${SECTION_GAP}px)`)
    }
    if (mb && Number(mb[1]) < SECTION_GAP) {
      findings.push(`${rel}  <section> #${n} inline margin-bottom ${mb[1]}px < token floor ${SECTION_GAP}px`)
    }
  }
  if (n === 0) findings.push(`${rel}  no <section> blocks — a Program Manual is sectioned`)
  return findings
}

export function lintTokenCss(css) {
  const findings = []
  const src = String(css || "")
  const expect = {
    "--space-1": `${SPACE[1]}px`,
    "--space-2": `${SPACE[2]}px`,
    "--space-3": `${SPACE[3]}px`,
    "--space-4": `${SPACE[4]}px`,
    "--space-5": `${SPACE[5]}px`,
  }
  for (const [name, want] of Object.entries(expect)) {
    const re = new RegExp(`${name}\\s*:\\s*${want.replace("px", "px")}`)
    if (!re.test(src)) findings.push(`quartz/styles/tokens.scss  missing locked token ${name}: ${want}`)
  }
  if (!/--table-cell-pad-y\s*:\s*(\d+)px/.test(src)) {
    findings.push("quartz/styles/tokens.scss  missing --table-cell-pad-y")
  } else {
    const y = Number(src.match(/--table-cell-pad-y\s*:\s*(\d+)px/)[1])
    if (y < TABLE_CELL_PAD_MIN) findings.push(`quartz/styles/tokens.scss  --table-cell-pad-y ${y}px < ${TABLE_CELL_PAD_MIN}px floor`)
  }
  return findings
}

export function lintStandardsHaveNoManualCover(body, rel) {
  const html = String(body || "")
  const findings = []
  if (html.includes(AUTHORITY_CLASS) || html.includes(COVER_CLASS) || html.includes("hmtc-manual-cover")) {
    findings.push(`${rel}  PDF cover / manual authority leaked onto a standards page — claim surface stays the hero`)
  }
  return findings
}

export function lintCat1ManualShape(body, rel) {
  const findings = []
  if (!body.includes(`class="${LEAD_CLASS}"`) && !body.includes(`class='${LEAD_CLASS}'`)) {
    findings.push(`${rel}  Cat-1 Manual v3 missing .${LEAD_CLASS}`)
  }
  if (!/hmtc-principle-card/.test(body)) {
    findings.push(`${rel}  Cat-1 Manual v3 missing airy .hmtc-principle-card grid`)
  }
  const abs = String(body || "").match(/(?:^|\n)scholar_abstract:\s*"([^"]+)"/)
  if (abs && /^(Manual v3 is the Method|The Method v2)/i.test(abs[1])) {
    findings.push(`${rel}  scholar_abstract opens with Method as subject — entity is the Infant and Child Foods Program Manual`)
  }
  if (/Method v2 governing instrument/i.test(String(body || ""))) {
    findings.push(`${rel}  Method v2 governing instrument leftover — Method essay lives at /program/method`)
  }
  return findings
}

export { CAT1_MANUAL, SECTION_CLASS, LEAD_CLASS }
