// Fee Calculator — client hydration for the /apply certification-fee estimator.
//
// Self-contained on this site: it never routes to paleofoundation.com and it prices
// only Heavy Metal Tested & Certified, not the sibling Certified Paleo / KETO /
// Grain-Free programs. The visitor picks a gross-annual-revenue band, a term (1 / 2 /
// 3 years) and a processing speed (standard or one of two rush tiers); the tool
// returns the annual-basis certification fee for that combination, with the multi-year
// discount and any flat rush surcharge broken out. Nothing is submitted anywhere.
//
// The fee table below is the single source of truth for the dollar figures. It is
// transcribed verbatim from the program's "heavy metal pricing.csv" (fourteen revenue
// bands; 1-year fee, and the discounted 2-year and 3-year totals). The discounts are
// NOT recomputed here from a percentage, because the published table applies a reduced
// multi-year discount in the upper bands; the tool must return exactly the published
// number, so the published number is what is stored.
//
// The DOM this drives lives inline in content/apply.md (the [data-fee-calculator]
// block), not in a component render, so the estimator sits in its own mid-page section
// rather than after the page body. This script ships site-wide via the FeeCalculator
// component in quartz.layout.ts and no-ops on every page that has no [data-fee-calculator]
// root. The selectors here and the data-* attributes there are a matched pair; keep them
// in sync.

type Band = {
  /** Roman-numeral band label as published, e.g. "Band III". */
  label: string
  /** Gross-annual-revenue range shown to the applicant. */
  revenue: string
  /** 1-year fee. */
  y1: number
  /** 2-year total before the multi-year discount (2 x y1). */
  y2gross: number
  /** 2-year total after the published discount. */
  y2: number
  /** 3-year total before the multi-year discount (3 x y1). */
  y3gross: number
  /** 3-year total after the published discount. */
  y3: number
}

// From "heavy metal pricing.csv" — do not paraphrase the numbers.
const BANDS: Band[] = [
  { label: "Band 0 (Provisional)", revenue: "Under $250k", y1: 6000, y2gross: 12000, y2: 10800, y3gross: 18000, y3: 14400 },
  { label: "Band I (Baseline)", revenue: "$250k to $499k", y1: 7500, y2gross: 15000, y2: 13500, y3gross: 22500, y3: 18000 },
  { label: "Band II", revenue: "$500k to $999k", y1: 9500, y2gross: 19000, y2: 17100, y3gross: 28500, y3: 22800 },
  { label: "Band III", revenue: "$1M to $4.99M", y1: 12500, y2gross: 25000, y2: 22500, y3gross: 37500, y3: 30000 },
  { label: "Band IV", revenue: "$5M to $9.99M", y1: 16500, y2gross: 33000, y2: 29700, y3gross: 49500, y3: 39600 },
  { label: "Band V", revenue: "$10M to $19.99M", y1: 22000, y2gross: 44000, y2: 39600, y3gross: 66000, y3: 52800 },
  { label: "Band VI", revenue: "$20M to $49.99M", y1: 30000, y2gross: 60000, y2: 54000, y3gross: 90000, y3: 72000 },
  { label: "Band VII", revenue: "$50M to $74.99M", y1: 42000, y2gross: 84000, y2: 75600, y3gross: 126000, y3: 113400 },
  { label: "Band VIII", revenue: "$75M to $99.99M", y1: 58000, y2gross: 116000, y2: 104400, y3gross: 174000, y3: 156600 },
  { label: "Band IX", revenue: "$100M to $199.99M", y1: 80000, y2gross: 160000, y2: 144000, y3gross: 240000, y3: 216000 },
  { label: "Band X", revenue: "$200M to $499.99M", y1: 115000, y2gross: 230000, y2: 207000, y3gross: 345000, y3: 310500 },
  { label: "Band XI", revenue: "$500M to $749.99M", y1: 165000, y2gross: 330000, y2: 297000, y3gross: 495000, y3: 445500 },
  { label: "Band XII", revenue: "$750M to $999.99M", y1: 235000, y2gross: 470000, y2: 423000, y3gross: 705000, y3: 634500 },
  { label: "Band XIII", revenue: "$1B and above", y1: 325000, y2gross: 650000, y2: 585000, y3gross: 975000, y3: 877500 },
]

const readyRoots = new WeakSet<HTMLElement>()

function usd(n: number) {
  return `$${Math.round(n).toLocaleString("en-US")}`
}

function bandForRevenue(root: HTMLElement) {
  const sel = root.querySelector("[data-fee-revenue]") as HTMLSelectElement | null
  const i = sel ? Number(sel.value) : 0
  return BANDS[Number.isFinite(i) && i >= 0 && i < BANDS.length ? i : 0]
}

function termYears(root: HTMLElement) {
  const sel = root.querySelector("[data-fee-term]") as HTMLSelectElement | null
  const y = sel ? Number(sel.value) : 1
  return y === 2 || y === 3 ? y : 1
}

function rushSurcharge(root: HTMLElement) {
  const sel = root.querySelector("[data-fee-rush]") as HTMLSelectElement | null
  const r = sel ? Number(sel.value) : 0
  return r === 5000 || r === 10000 ? r : 0
}

function fillRevenue(root: HTMLElement) {
  const sel = root.querySelector("[data-fee-revenue]") as HTMLSelectElement | null
  if (!sel || sel.options.length) return
  // Default to Band III ($1M to $4.99M), a mid-market anchor, so a figure shows on load.
  const defaultIndex = 3
  sel.innerHTML = BANDS.map(
    (b, i) =>
      `<option value="${i}"${i === defaultIndex ? " selected" : ""}>${b.label} &middot; ${b.revenue}</option>`,
  ).join("")
}

function render(root: HTMLElement) {
  const out = root.querySelector("[data-fee-result]") as HTMLElement | null
  if (!out) return
  const band = bandForRevenue(root)
  const years = termYears(root)
  const rush = rushSurcharge(root)

  const termFee = years === 1 ? band.y1 : years === 2 ? band.y2 : band.y3
  const grossFee = years === 1 ? band.y1 : years === 2 ? band.y2gross : band.y3gross
  const saved = grossFee - termFee
  const total = termFee + rush
  const perYear = total / years
  const termLabel = years === 1 ? "1 year" : `${years} years` // noun form: "2 years"
  const termAdj = `${years}-year` // adjective form: "2-year term"

  const row = (k: string, v: string, strong = false) =>
    `<div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7">
      <span style="font-size:13px;line-height:1.5;color:#3f3a3a">${k}</span>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:${strong ? "14px" : "12.5px"};color:#9f2727;white-space:nowrap">${v}</span>
    </div>`

  // The discount percentage is derived from the published numbers, never assumed:
  // the fee table applies 10% at two years across every band, but 20% at three years
  // only through Band VI and 10% at three years from Band VII up. Deriving it keeps the
  // label honest to whatever the table actually holds for the selected band.
  const pct = grossFee > 0 ? Math.round((saved / grossFee) * 100) : 0
  const savingsRow =
    years > 1 && saved > 0
      ? row(`Multi-year discount (${pct}% off ${usd(grossFee)})`, `&minus;${usd(saved)}`)
      : ""
  const rushRow = rush > 0 ? row("Rush surcharge (flat)", `+${usd(rush)}`) : ""
  const perYearNote =
    years > 1
      ? `<p style="font-size:11.5px;line-height:1.55;color:#736b6b;margin:12px 0 0">That is ${usd(
          perYear,
        )} per year across the ${termAdj} term, billed as one ${termAdj} certification.</p>`
      : ""

  out.innerHTML = `
    <div style="padding:20px 22px">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:6px">Estimated Heavy Metal Tested &amp; Certified fee</div>
      <div style="font-family:Lora,serif;font-size:40px;line-height:1.05;color:#2b1f1f;margin-bottom:4px">${usd(total)}</div>
      <div style="font-size:13px;line-height:1.5;color:#736b6b;margin-bottom:16px">${band.label}, ${band.revenue.toLowerCase()}, ${termAdj} term</div>
      <div style="border:1px solid #e8e1db;background:#faf7f4;padding:4px 16px 6px">
        ${row(`Certification fee, ${termLabel}`, usd(termFee))}
        ${savingsRow}
        ${rushRow}
        <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:12px 0 6px">
          <span style="font-family:Lora,serif;font-size:16px;color:#2b1f1f">Total for the ${termAdj} term</span>
          <span style="font-family:'IBM Plex Mono',monospace;font-size:15px;color:#9f2727;white-space:nowrap">${usd(total)}</span>
        </div>
      </div>
      ${perYearNote}
      <p style="margin:18px 0 0"><a href="#start" style="display:inline-block;background:#9f2727;color:#fff;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;padding:9px 15px;border-radius:3px;text-decoration:none">Start an application</a></p>
    </div>`
}

function setup(root: HTMLElement) {
  if (readyRoots.has(root)) return
  readyRoots.add(root)
  fillRevenue(root)
  for (const attr of ["[data-fee-revenue]", "[data-fee-term]", "[data-fee-rush]"]) {
    const el = root.querySelector(attr) as HTMLSelectElement | null
    el?.addEventListener("change", () => render(root))
  }
  render(root)
}

function setupAll() {
  document.querySelectorAll<HTMLElement>("[data-fee-calculator]").forEach((el) => setup(el))
}

document.addEventListener("nav", setupAll)
queueMicrotask(setupAll)

// Module scope: keeps these identifiers out of the shared inline-script global scope
// (tsc treats a non-module .inline.ts as a global script). The bundler injects the
// source regardless.
export {}
