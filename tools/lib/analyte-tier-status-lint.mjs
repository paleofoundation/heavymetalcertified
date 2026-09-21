// analyte-tier-status-lint.mjs — fail if analyte Tier 1 / Tier 2 still drives
// certification status. Method v2: every claim analyte is equal at the gate
// (100% of published gov_floor | read_across). Exceedance → Remediation
// (unmarked). Product risk tiers (High / Moderate / Lower) and the appeals
// "Tier 1 internal / Tier 2 independent committee" are different axes and
// are not flagged. Design-canon content Tiers live in docs/ and are out of scope.

const PATTERNS = [
  { re: /Remediation\s*[—\-–:]\s*Tier[\s-]*[12]/i, why: "Remediation protocol still split by analyte Tier 1/2" },
  { re: /Tier[\s-]*[12][\s\S]{0,48}exceedance/i, why: "exceedance reaction still keyed to analyte Tier 1/2" },
  { re: /exceedance[\s\S]{0,48}Tier[\s-]*[12]/i, why: "exceedance reaction still keyed to analyte Tier 1/2" },
  { re: /tiering sets (how|the reaction|only the severity)/i, why: "tiering still described as a status/reaction ladder" },
  { re: /Tier[\s-]*[12][\s\S]{0,90}most severe reaction/i, why: "Tier 1 still drives a different certification reaction" },
  { re: /most severe reaction[\s\S]{0,90}Tier[\s-]*[12]/i, why: "Tier 1 still drives a different certification reaction" },
  { re: /Tier[\s-]*2[\s\S]{0,90}elevated/i, why: "Tier 2 still drives a different certification reaction" },
  { re: /treated as Tier[\s-]*1/i, why: "species still remapped onto a Tier 1 status track" },
  { re: /Tier[\s-]*1[\s\S]{0,40}zero-tolerance|zero-tolerance[\s\S]{0,40}Tier[\s-]*1/i, why: "Tier 1 still used as a zero-tolerance status class" },
  { re: /HMTc tier/i, why: "snapshot still exposes analyte Tier as a status field" },
  { re: /is a Tier[\s-]*[12] analyte/i, why: "analyte still classified onto a certification-status tier" },
  { re: /classifies \w+ as (a |one of four )?Tier/i, why: "analyte still classified onto a certification-status tier" },
  { re: /classified into two tiers/i, why: "panel still presented as a two-tier status architecture" },
  { re: /analyte tiering/i, why: "analyte tiering still presented as status architecture" },
  { re: /toxicological tier of the exceedance/i, why: "reaction still follows the analyte's toxicological tier" },
  { re: /<th[^>]*>Tier<\/th>/i, why: "master/panel table still has a Tier status column" },
  { re: /<td[^>]*>Tier[\s-]*[12]<\/td>/i, why: "table cell still emits analyte Tier as a status label" },
  { re: />Tier[\s-]*[12]<\/span>/i, why: "pill/label still emits analyte Tier as a status stamp" },
  { re: /Tier[\s-]*2[\s\S]{0,40}150\s*%/i, why: "retired Tier-2 transitional overage" },
  { re: /Tier[\s-]*[12][\s-]+(toxic|metal|analyte)s?/i, why: "analytes still grouped as Tier 1/2 for program status" },
]

export function lintAnalyteTierStatus(text, rel) {
  const hits = []
  const src = String(text || "")
  for (const { re, why } of PATTERNS) {
    const flags = re.flags.includes("g") ? re.flags : `${re.flags}g`
    const g = new RegExp(re.source, flags)
    let m
    while ((m = g.exec(src)) !== null) {
      let line = 1
      for (let i = 0; i < m.index; i++) if (src[i] === "\n") line++
      hits.push(`${rel}:${line}  analyte-tier status architecture — ${why} → "${m[0].replace(/\s+/g, " ").trim().slice(0, 80)}"`)
      if (m.index === g.lastIndex) g.lastIndex++
    }
  }
  return hits
}

export { PATTERNS as ANALYTE_TIER_STATUS_PATTERNS }
