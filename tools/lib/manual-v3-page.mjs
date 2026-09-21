// manual-v3-page.mjs — Cat-1 Manual v3 body renderer.
// Uses the same frontmatter helper and v3 tokens as tools/lib/manual-page.mjs.
// Body sections are the locked thin TOC, not the retired matrix / struggle shape.

import { renderManualFrontmatter } from "./manual-page.mjs"
import {
  SECTION_CLASS,
  H2_CLASS,
  PROSE_CLASS,
  LEAD_CLASS,
  PRINCIPLE_CARD_CLASS,
} from "./design-tokens.mjs"
import {
  PRINCIPLES,
  PANEL_NOTE,
  MANUAL_LEAD,
  apaCite,
  COPYRIGHT,
  ZENODO_VERSION_DOI,
  ZENODO_CONCEPT_DOI,
  buildRegister,
} from "./cat1-manual-v3.mjs"
import { METHOD_EDITION_POINTER_HTML } from "./method-change.mjs"

const ACCENT = "#9f2727"
const LINK = "#1c43ad"
const INK = "#2b1f1f"
const BODY = "#3f3a3a"
const MUTE = "#736b6b"
const FAINT = "#a9a1a1"
const BORDER = "#e8e1db"
const TINT = "#fdf4f3"
const H2 = `font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:${INK};border-bottom:1px solid ${BORDER};padding-bottom:10px`
const H3 = `font-family:Lora,serif;font-weight:400;font-size:20px;line-height:1.3;color:${INK};margin:28px 0 12px`
const P = `font-size:16.5px;line-height:1.78;color:${BODY};margin:0 0 18px`
const CAP = `font-size:13.5px;line-height:1.7;color:${MUTE};margin:0 0 var(--space-3, 24px)`
const CALL = `border-left:3px solid ${ACCENT};background:${TINT};padding:var(--space-3, 24px)`

const esc = (s) => String(s == null ? "" : s)
  .replace(/&(?![a-z#0-9]+;)/gi, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")

function section(id, title, inner) {
  return `<section class="${SECTION_CLASS}">
<h2 id="${id}" class="${H2_CLASS}" style="${H2}">${title}</h2>
${inner}
</section>`
}

function p(html) {
  return `<p class="${PROSE_CLASS}" style="${P}">${html}</p>`
}

function cap(html) {
  return `<p class="hmtc-cap" style="${CAP}">${html}</p>`
}

function h3(id, title) {
  return `<h3 id="${id}" style="${H3}">${title}</h3>`
}

function kvGrid(rows) {
  const cells = rows
    .map(
      ([k, v]) =>
        `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:${BODY}">${k}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:${ACCENT};text-align:right">${v}</span></div>`,
    )
    .join("")
  return `<div style="border:1px solid ${BORDER};background:#fffdfb;padding:8px 18px 4px;margin:0 0 20px">${cells}</div>`
}

function table(headers, rows, caption) {
  const th = headers
    .map((h, i) => `<th style="text-align:${i === 0 ? "left" : "left"}">${esc(h)}</th>`)
    .join("")
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
    .join("\n")
  return `${caption ? cap(caption) : ""}<div class="hmtc-table-wrap"><table style="width:100%;border-collapse:collapse;min-width:36rem"><thead><tr>${th}</tr></thead><tbody>
${body}
</tbody></table></div>`
}

function principlesHtml() {
  const cards = PRINCIPLES.map(
    (pr, i) => `<article class="${PRINCIPLE_CARD_CLASS}">
<div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px"><span class="hmtc-principle-n">${i + 1}</span><span class="hmtc-principle-k">${esc(pr.k)}</span></div>
<p>${esc(pr.v)}</p>
</article>`,
  ).join("")
  return (
    cap(
      `The five objectives are co-equal. None may be sacrificed to advance another. Cited from <span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:${ACCENT}">docs/governance/hmtc-governing-principles.md</span> (the ruling named in the readiness manifest).`,
    ) +
    `<div class="hmtc-principle-grid">${cards}</div>` +
    `<div style="${CALL};margin-top:var(--space-3, 24px)"><p class="${PROSE_CLASS}" style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0">Every cert-ready cell is a government floor or a disclosed read-across. Species never replace the parent total. Limits do not derive from the Heavy Metal Index; every number traces to a named sovereign instrument. The Index is cited one way, outbound only.</p></div>`
  )
}

function lifecycleHtml() {
  return (
    p(
      `A SKU enters by baseline testing, is assigned a status, and stays under surveillance for as long as the mark is used. Status attaches to the product, not the brand. A product is Certified only when every one of the eight limit analytes is at or below 100% of its published limit — the government floor or disclosed read-across for that cell — confirmed under the measurement-uncertainty rule. There is no band above the limit that still earns the mark.`,
    ) +
    table(
      ["Status", "Meaning", "Mark", "Condition"],
      [
        ["Certified", "Full compliance", "permitted", "every analyte at or below 100% of its published limit"],
        ["Remediation", "Not certified — applicant or corrective", "withheld / removed", "any analyte above its published limit, or a new applicant not yet at 100%; corrective action and intensified surveillance"],
        ["Suspension", "Certification halted — hard stop", "removed", "a government legal-limit violation, a data-integrity failure, or failure to execute directives"],
        ["Revocation", "Permanent termination", "removed", "willful misconduct, data fraud, concealment, or persistent unremediated suspension"],
      ],
      "Certified is the only status that carries the mark. A lot in violation of a government legal limit at entry is a hard stop; a lot above any published HMTc limit is not certified and enters Remediation.",
    ) +
    cap(
      `Every claim analyte is equal at the gate. A product is Certified only at or below 100% of every published government floor or disclosed read-across. An exceedance on any metal enters Remediation and carries no mark. Lead, cadmium, inorganic arsenic, and mercury may be named as priority toxics for toxicological clarity; that label is not a status ladder. Any quantifiable Cr(VI) on a credible pathway is a hard fail. No metal has a transitional band or an allowed overage.`,
    ) +
    kvGrid([
      ["Baseline before any status", "3 lots, worst-performing lot"],
      ["Prior accredited data", "credits up to 2 lots"],
      ["Entry hard-stop", "a government legal-limit violation"],
      ["Suspension reinstatement", "does not require a fresh baseline"],
    ])
  )
}

function instrumentsHtml() {
  return (
    h3("mark", "The mark") +
    p(
      `The mark may be used only on Certified product — every analyte at or below 100% of its published limit. A product in Remediation carries no mark, at any margin and on any metal, and is not listed as certified while any analyte is above its limit. Suspension and Revocation remove the mark. Claims of heavy-metal free, no toxic metals, or 100% safe are prohibited. The mark certifies testing against published limits under ongoing surveillance; it does not certify safety.`,
    ) +
    h3("mu", "Measurement uncertainty") +
    p(
      `Every result is read with the laboratory's expanded measurement uncertainty at coverage factor k = 2 (95%). Pass only when (result + MU) ≤ limit. Fail when (result − MU) > limit. Anything between is borderline and requires confirmatory action before status issues. A borderline result alone shall not certify. Testing into compliance is prohibited.`,
    ) +
    h3("capa", "CAPA") +
    table(
      ["Status", "Initiate", "Full plan", "Containment"],
      [
        ["Remediation", "10 business days", "30 calendar days", "as needed"],
        ["Suspension (hard stop)", "2 business days", "10 business days", "Immediate (within 48 hours)"],
      ],
      "CAPA windows scale with certification status, not with analyte class. A product in Remediation has a 12-month default to return to Certified. A CAPA closes only after verification of effectiveness and Operator approval.",
    ) +
    h3("remediation", "Remediation") +
    p(
      `The Confidential Remediation Track is a confidential entry-and-support pathway for products not yet at 100% of every published limit. It is expressly not a certified status and displays no mark. After certification, Corrective Action follows the published status rules. Concealment of a known exceedance is grounds for revocation. Confidentiality never delays a recall, never overrides a reporting duty, and never withholds evidence from a regulator who asks.`,
    ) +
    h3("ratchet", "Standards ratchet") +
    p(
      `A published limit tightens only through the Standards Ratchet: a stated trigger, a capped step, and a dated edition. Limits do not loosen because a brand found them inconvenient. The subcategory page, not this manual, is the live derivation of each cell.`,
    )
  )
}

function lotTestingHtml() {
  return (
    p(
      `Certification is a standing obligation. Totals are run on every completing lot. Speciation is a pathway reflex, not an extra panel seat. Risk tier and the surveillance schedule are assigned after application, from the brand's laboratory capability as well as the product class.`,
    ) +
    h3("risk-tiers", "Product risk tiers") +
    table(
      ["Risk class", "Subcategories"],
      [
        ["High", "Infant formula (powder); infant formula (ready-to-feed); baby cereals and dry grain products"],
        ["Moderate", "Fruit purées; non-root vegetable purées; root-vegetable purées; mixed meals"],
        ["Lower", "Fruit juice (not canned); teething and snack products"],
      ],
      "These are the nine subcategory standard pages of the live Infant and Child Foods taxonomy. The Program Operator may raise a specific SKU (for example a rice-based teething product) on documented rationale.",
    ) +
    h3("frequency", "Baseline frequency matrix") +
    table(
      ["Status", "High", "Moderate", "Lower", "Hold and release", "Independent sampling"],
      [
        ["Certified", "Monthly", "Quarterly", "Quarterly", "not required", "yes, per schedule"],
        ["Remediation", "Every lot", "Every lot", "Every lot", "mandatory", "Operator-directed third-party sampling"],
      ],
      "This grid is the starting point, not the assigned schedule. Certified is the only status that carries the mark; Remediation carries none. Every claim analyte is equal at the gate — any exceedance, any quantifiable Cr(VI), or a concealment concern takes the every-lot, Operator-directed row regardless of product risk tier.",
    ) +
    h3("baseline", "Baseline") +
    p(
      `Every SKU is tested across three distinct production lots on the full eight-total panel, with required pathway speciation, before any status is assigned. Status is taken from the worst-performing lot. A single passing lot certifies nothing. Qualifying ISO/IEC 17025 prior data from the preceding twelve months may credit up to two lots, per analyte actually measured. That pathway is not available on the Confidential Remediation Track.`,
    ) +
    h3("reflex", "Reflex") +
    p(
      `A new ingredient, supplier, origin, water source, product-contact equipment, packaging, formulation, or process change triggers a full-panel reflex on the next one or two lots. A claim-analyte result at or above 80% of its limit triggers confirmatory testing, Operator notice, and speciation where a speciated form applies.`,
    ) +
    h3("speciation", "Speciation") +
    table(
      ["Pathway", "Species", "When mandatory", "Reflex trigger"],
      [
        ["Rice or rice-derived ingredients", "iAs", "all such products", "total As at or above 50% of the applicable limit"],
        ["Fish or marine ingredients", "MeHg", "all such products", "total Hg at or above 50% of the applicable limit"],
        ["Credible hexavalent pathway", "Cr(VI)", "where the pathway exists", "anomalous total Cr, or Operator direction"],
      ],
      "Species ≤ parent. The speciated result does not replace the parent total; both ceilings must be met. Failure to perform a required speciation renders the lot ineligible. The Operator may lower the 50% trigger and shall not raise it.",
    ) +
    h3("sampling", "Sampling and chain of custody") +
    p(
      `Certification testing is lot-based composite sampling with a complete custody record from collection through laboratory receipt. A custody breach invalidates the result. Testing is ISO/IEC 17025 for the methods and matrices in scope. The LOQ for each claim-surface analyte must sit at or below the published limit; where it does not, a non-detect is indeterminate. Results are reported as structured data, with MU, on the finished-product basis. PDF-only submissions are not accepted.`,
    ) +
    h3("lab-informed", "Lab-informed schedule") +
    p(
      `The frequency matrix is not assigned by itself. After application, the Program Operator reads what the brand's laboratory actually states and writes the schedule from that evidence.`,
    ) +
    table(
      ["Input", "What is read"],
      [
        ["Panel", "Does the lab quantify every Big-8 total on this matrix?"],
        ["LOQ", "Is each claim-surface LOQ at or below the published limit?"],
        ["MU", "Is expanded uncertainty reported at k = 2?"],
        ["Capability", "Can the lab run the required pathway speciation (rice → iAs, and so on)?"],
        ["Accreditation", "ISO/IEC 17025 for the methods and matrices in scope?"],
        ["Turnaround", "Can hold-and-release be met at the assigned frequency?"],
      ],
    ) +
    kvGrid([
      ["Decision owner", "Program Operator"],
      ["Recommendation", "Technical Committee, on request"],
      ["Fail: LOQ above limit", "schedule not assigned; lot indeterminate"],
      ["Fail: missing Big-8 total", "schedule not assigned"],
      ["Fail: no required speciation method", "schedule not assigned"],
      ["Fail: no 17025 scope", "schedule not assigned"],
    ]) +
    cap(
      `A brand is not certified against a fantasy grid. If the laboratory cannot support the published panel, LOQ, MU, or pathway speciation, the SKU stays uncertified until the capability exists.`,
    ) +
    h3("stay-gate", "90% stay-in-program certification gate") +
    p(
      `The program certifies only if there is at least 90% confidence the brand can remain in the program. A one-lot pass that will fail the next surveillance cycle is not a certification. This gate protects brands who enter as much as it protects consumers: entering a program the brand cannot keep is a harm.`,
    ) +
    table(
      ["Input", "Read as"],
      [
        ["Baseline lots", "three-lot record, worst lot, not the best lot"],
        ["Headroom", "distance to the published limit, not a knife-edge pass"],
        ["Lab capability", "the lab-informed schedule inputs above"],
        ["Pathway risk", "rice, marine, hexavalent, or other documented pathways"],
        ["Schedule feasibility", "can the brand actually run the assigned frequency and hold-and-release?"],
        ["CAPA capacity", "can the brand open and close CAPA on the published windows?"],
      ],
    ) +
    kvGrid([
      ["Decision owner", "Program Operator"],
      ["Pass", "≥90% confidence the brand can remain under the assigned schedule"],
      ["Fail: knife-edge baseline", "do not certify"],
      ["Fail: lab cannot support the schedule", "do not certify"],
      ["Fail: would enter only to be suspended", "do not certify"],
      ["Fail: concealment or data-integrity doubt", "do not certify; Suspension / Revocation path"],
    ])
  )
}

function registerHtml(reg) {
  const rows = reg.rows.map((r) => {
    const name = r.href
      ? `<a href="${r.href}" style="color:${LINK};text-decoration:none">${esc(r.name)}</a>`
      : esc(r.name)
    const doi = r.cert_doi
      ? `<a href="https://doi.org/${esc(r.cert_doi)}" style="color:${LINK};text-decoration:none;font-family:'IBM Plex Mono',monospace;font-size:12.5px">${esc(r.cert_doi)}</a>`
      : `<span style="color:${FAINT}">—</span>`
    const status = r.cert_ready
      ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:${ACCENT}">cert-ready</span>`
      : `<span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:${FAINT}">HOLD</span>`
    const reason = r.cert_ready ? "—" : esc(r.hold_reason)
    return [name, status, doi, reason]
  })
  return (
    cap(
      `Every Cat-1 compiled record and every live subcategory page. Cert-ready means the live page carries a house DOI under prefix 10.83138 and every joined compiled variant has a complete claim-surface (Big-8 totals numeric; rice rows have numeric iAs; species ≤ parent). Incomplete cells stay listed as not cert-ready. This table is generated from the compiled corpus and page frontmatter; it is not typed.`,
    ) +
    cap(PANEL_NOTE) +
    table(["Standard", "Status", "cert_doi", "HOLD reason"], rows)
  )
}

function editionHtml(doi) {
  const mintPara = doi
    ? p(
        `The current edition is identified by house DOI <a href="https://doi.org/${esc(doi)}" style="color:${LINK}">${esc(doi)}</a> (<a href="https://doi.org/${esc(doi)}" style="color:${LINK}">https://doi.org/${esc(doi)}</a>). The earlier Zenodo edition <a href="https://doi.org/${ZENODO_VERSION_DOI}" style="color:${LINK}">${ZENODO_VERSION_DOI}</a> remains citable only as an earlier deposited edition.`,
      )
    : ""
  return (
    p(
      `This is Manual v3 of the Infant and Child Foods Program Manual for Category 1. It supersedes the earlier deposited Zenodo edition <a href="https://doi.org/${ZENODO_VERSION_DOI}" style="color:${LINK}">${ZENODO_VERSION_DOI}</a> (concept DOI <a href="https://doi.org/${ZENODO_CONCEPT_DOI}" style="color:${LINK}">${ZENODO_CONCEPT_DOI}</a>). That earlier deposited edition never certified a brand. It remains citable only as an earlier deposited edition. ${METHOD_EDITION_POINTER_HTML}`,
    ) +
    mintPara +
    `<div style="${CALL}"><p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0 0 12px;max-width:74ch">${apaCite(doi)}</p><p style="font-size:13.5px;line-height:1.7;color:#5a4141;margin:0">${COPYRIGHT}</p></div>`
  )
}

function leadHtml() {
  return `<p class="${LEAD_CLASS}">${MANUAL_LEAD}</p>`
}

export function renderManualV3Body({ register, certDoi = null } = {}) {
  const reg = register || buildRegister()
  return [
    leadHtml(),
    section("principles", "Governing Principles", principlesHtml()),
    section("lifecycle", "Program lifecycle and statuses", lifecycleHtml()),
    section("instruments", "Mark, measurement uncertainty, CAPA, remediation, ratchet", instrumentsHtml()),
    section("lot-testing", "Lot Testing Schedule", lotTestingHtml()),
    section("register", "Cat-1 Standards Register", registerHtml(reg)),
    section("edition", "About this edition", editionHtml(certDoi)),
  ].join("\n\n")
}

export function renderManualV3Page(data) {
  const fm = renderManualFrontmatter(data)
  return `${fm}\n\n${renderManualV3Body({ register: data.register, certDoi: data.certDoi })}\n`
}
