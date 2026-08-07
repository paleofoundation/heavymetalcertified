#!/usr/bin/env node
// Build per-instrument regulation reference pages for heavymetalcertified.com.
//
// INPUT  : data/regulations/cert-regulation-snapshot.json
//          A self-contained snapshot the Heavy Metal Index exports from its
//          regulatory register (tools/evidence/export-cert-regulation-snapshot.mjs).
//          The cert build never reads the HMI repo directly (Part-2 firewall +
//          Vercel shallow-clone safety): HMI exports the snapshot, it is committed
//          here, and this generator renders the local copy. One-way: HMI -> cert.
//          Falls back to data/regulations/infant-instruments.json only if the
//          snapshot is absent, so a missing export fails loudly rather than
//          silently shipping thin pages.
// OUTPUT : content/regulations/<slug>.md  — one page per instrument, in the site
//          design canon (#9f2727 accent, Lora headings, IBM Plex Mono tables,
//          no bold on the reading surface).
//
// These pages RECORD sovereign law; they do not set or justify HMTc thresholds
// (that is the standard's job). The only HMTc sentence is the firewall posture
// paragraph, unchanged. Everything else is a transcription of a government limit.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const SNAP = path.join(repoRoot, "data/regulations/cert-regulation-snapshot.json")
const LEGACY = path.join(repoRoot, "data/regulations/infant-instruments.json")
const OUT = path.join(repoRoot, "content/regulations")

const ANALYTE_DISP = {
  Pb: "Lead (Pb)", iAs: "Inorganic arsenic (iAs)", tAs: "Total arsenic (tAs)",
  Cd: "Cadmium (Cd)", tHg: "Mercury, total (tHg)", MeHg: "Methylmercury (MeHg)",
  Ni: "Nickel (Ni)", Al: "Aluminium (Al)", Sn: "Tin (Sn)", "Cr-total": "Total chromium (Cr)",
  "Cr-VI": "Hexavalent chromium (Cr-VI)", Cr: "Chromium (Cr)", Sb: "Antimony (Sb)",
}
const METAL_ORDER = ["Pb", "Cd", "iAs", "tAs", "MeHg", "tHg", "Ni", "Al", "Cr-VI", "Cr-total", "Cr", "Sn", "Sb"]
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const disp = (a) => ANALYTE_DISP[a] || a
const morder = (a) => { const i = METAL_ORDER.indexOf(a); return i < 0 ? 99 : i }

const H2 = "font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px"
const P = "font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch"
const CAP = "font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px"
const THEAD = "background:#9f2727;color:#fff"
const TH = "text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase"
const TD = "padding:10px 15px;color:#2b1f1f"
const TDm = "padding:10px 15px;color:#736b6b;font-size:12.5px"

function limitsTable(limits) {
  const sorted = [...limits].sort((a, b) => morder(a.analyte) - morder(b.analyte) || String(a.scope).localeCompare(String(b.scope)))
  const rows = sorted.map((l, i) => {
    const bg = i % 2 ? "background:#fbf7f5;" : ""
    const prov = l.notes ? l.notes.split(";")[0].trim() : (l.status || "")
    return `<tr style="border-bottom:1px solid #f2ece7;${bg}"><td style="${TD}">${esc(disp(l.analyte))}</td><td style="padding:10px 15px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${l.value_ug_kg}</td><td style="${TDm}">${esc(l.basis || "")}</td><td style="${TDm}">${esc(l.scope || "")}</td><td style="padding:10px 15px;color:#a9a1a1;font-size:11.5px;font-family:'IBM Plex Mono',monospace">${esc(prov)}</td></tr>`
  }).join("")
  return `<div style="overflow-x:auto"><table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:52rem;border-collapse:collapse"><thead><tr style="${THEAD}"><th style="${TH}">Analyte</th><th style="${TH};text-align:right">Limit (&micro;g/kg)</th><th style="${TH}">Basis</th><th style="${TH}">Product scope</th><th style="${TH}">Provision</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function glanceTable(inst) {
  const cats = new Set(inst.matrices).size
  const metalNames = inst.metals.slice().sort((a, b) => morder(a) - morder(b)).map(disp).join(", ")
  const rowdata = [
    ["What is it", `${esc(inst.name)}${inst.authority ? ` — a contaminant standard of ${esc(inst.authority)}` : ""}${inst.jurisdiction ? ` (${esc(inst.jurisdiction)})` : ""}.`],
    ["Metals with a maximum level", esc(metalNames)],
    ["How many maximum levels", `${inst.row_count} across ${cats} product ${cats === 1 ? "category" : "categories"}, in the basis the instrument states.`],
    ["How HMTc uses it", `As a government floor. Where this instrument holds the strictest existing limit for a (product, analyte) cell, an HMTc standard cites this page. It records law; it is not an HMTc threshold.`],
  ]
  const rows = rowdata.map((r, i) => `<tr style="border-bottom:1px solid #f2ece7;${i % 2 ? "background:#fbf7f5;" : ""}"><td style="padding:10px 15px;color:#736b6b;font-size:12.5px;width:30%;vertical-align:top;font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.04em;font-size:10.5px">${r[0]}</td><td style="padding:10px 15px;color:#2b1f1f;font-size:14px">${r[1]}</td></tr>`).join("")
  return `<div style="overflow-x:auto"><table style="width:100%;border:1px solid #e8e1db;border-collapse:collapse">${rows}</table></div>`
}

function page(inst) {
  const verifiedBadge = `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#2c6e49;background:#e6f0ea;border-radius:4px;padding:3px 8px">Register-transcribed &middot; ${inst.metals.length} analytes &middot; ${inst.row_count} limits</span>`
  const cats = new Set(inst.matrices).size
  const fm = [
    "---",
    `title: "${esc(inst.name).replace(/"/g, '\\"')} — regulation reference"`,
    "type: regulation",
    `description: "The heavy-metal maximum levels set by ${esc(inst.name).replace(/"/g, "'")} (${esc(inst.jurisdiction)}), as recorded by the Heavy Metal Index register and cited by HMTc certification standards. Records sovereign law; does not set HMTc thresholds."`,
    `jurisdiction: ${inst.jurisdiction || "—"}`,
    `reference: "${esc(inst.name).replace(/"/g, "'")}"`,
    inst.instrument_status ? `instrument_status: ${inst.instrument_status}` : "",
    `regulation_slug: ${inst.slug}`,
    inst.effective_date ? `effective_date: ${inst.effective_date}` : "",
    `metals: [${inst.metals.map((m) => JSON.stringify(m)).join(", ")}]`,
    `analyte_count: ${inst.metals.length}`,
    `limit_count: ${inst.row_count}`,
    `category_count: ${cats}`,
    inst.primary_url ? `source_url: ${inst.primary_url}` : "",
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "---",
  ].filter(Boolean).join("\n")

  const speciationNote = (inst.metals.includes("tAs") && inst.metals.includes("iAs"))
    ? " Where the instrument distinguishes total arsenic (tAs) from inorganic arsenic (iAs), both are recorded as separate rows; total-arsenic screening may precede an inorganic-arsenic confirmation."
    : ""

  const body = [
    `<section id="what" style="margin-bottom:44px"><div style="margin-bottom:14px">${verifiedBadge}</div><p style="${P}">This page records the heavy-metal maximum levels set by ${esc(inst.name)}${inst.authority ? `, the instrument of ${esc(inst.authority)}` : ""}${inst.jurisdiction ? ` (${esc(inst.jurisdiction)})` : ""}. Every value below is transcribed into the Heavy Metal Index register from the primary text and is the value an HMTc standard cites when this jurisdiction binds a certification limit. It is a record of law, not an HMTc threshold.</p>${inst.primary_url ? `<p style="font-size:13px;line-height:1.7;color:#736b6b;margin:0"><a href="${esc(inst.primary_url)}" style="color:#1c43ad" target="_blank" rel="noopener">Primary source &nearr;</a></p>` : ""}</section>`,
    `<section id="at-a-glance" style="margin-bottom:44px"><h2 style="${H2}">At a glance</h2>${glanceTable(inst)}</section>`,
    `<section id="limits" style="margin-bottom:44px"><h2 style="${H2}">Maximum levels</h2><p style="${CAP}">All values &micro;g/kg (ppb), in the basis the instrument states. ${inst.row_count} maximum level${inst.row_count === 1 ? "" : "s"} across ${inst.metals.length} analyte${inst.metals.length === 1 ? "" : "s"} and ${cats} product ${cats === 1 ? "category" : "categories"}.</p>${limitsTable(inst.limits)}</section>`,
    `<section id="basis" style="margin-bottom:44px"><h2 style="${H2}">Basis and method notes</h2><p style="${P}">Values are recorded in the native basis each row states (for example whole commodity, as consumed, muscle meat, or as placed on the market). A limit in one basis is not directly comparable to a limit in another without conversion.${speciationNote}</p></section>`,
    `<section id="hmtc" style="margin-bottom:44px"><h2 style="${H2}">How this interacts with HMTc</h2><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0;max-width:84ch">HMTc certification standards adopt the <em>strictest existing</em> maximum level set by any credible government worldwide. Where this instrument holds the strictest value for a (product, analyte) cell, it binds the HMTc limit and the standard cites this page. This page does not set or justify any HMTc threshold; it records the sovereign requirement the program measures against.</p></section>`,
    `<section id="sources" style="margin-bottom:20px"><h2 style="${H2}">Source and provenance</h2><p style="${P}">${inst.primary_url ? `Primary source: <a href="${esc(inst.primary_url)}" style="color:#1c43ad" target="_blank" rel="noopener">${esc(inst.primary_url)}</a>. ` : ""}Values are transcribed into the Heavy Metal Index regulatory register and rendered here from that register; each row carries its own provenance note in the register.</p></section>`,
  ].join("\n")

  return `${fm}\n${body}\n`
}

function loadInstruments() {
  if (fs.existsSync(SNAP)) {
    const d = JSON.parse(fs.readFileSync(SNAP, "utf8"))
    return { instruments: d.instruments, source: "snapshot" }
  }
  if (fs.existsSync(LEGACY)) {
    // Fallback keeps the build alive but signals the missing export loudly.
    console.warn("WARNING: cert-regulation-snapshot.json missing; falling back to thin infant-instruments.json. Run tools/evidence/export-cert-regulation-snapshot.mjs on the HMI side and commit the snapshot.")
    const d = JSON.parse(fs.readFileSync(LEGACY, "utf8"))
    return {
      instruments: d.instruments.filter((i) => i.infant_limits.length).map((i) => ({
        slug: i.slug, curated: true, jurisdiction: i.jurisdiction, authority: i.body, name: i.name,
        effective_date: null, instrument_status: i.status, metals: [...new Set(i.infant_limits.map((l) => l.analyte))],
        matrices: [...new Set(i.infant_limits.map((l) => l.scope))], row_count: i.infant_limits.length, primary_url: i.url,
        limits: i.infant_limits.map((l) => ({ analyte: l.analyte, value_ug_kg: l.value_ug_kg, basis: l.basis, scope: l.scope, status: "", url: i.url, notes: l.source || "" })),
      })),
      source: "legacy",
    }
  }
  throw new Error("No regulation data: neither cert-regulation-snapshot.json nor infant-instruments.json found.")
}

function main() {
  const { instruments, source } = loadInstruments()
  fs.mkdirSync(OUT, { recursive: true })
  let n = 0
  for (const inst of instruments) {
    if (!inst.limits || !inst.limits.length) continue
    fs.writeFileSync(path.join(OUT, `${inst.slug}.md`), page(inst))
    n++
  }

  // index page: curated (cited by standards) first, then the wider register.
  const curated = instruments.filter((i) => i.curated && i.limits.length)
  const others = instruments.filter((i) => !i.curated && i.limits.length).sort((a, b) => b.row_count - a.row_count)
  const link = (i) => `      <a href="/regulations/${i.slug}" style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:8px 0;font-size:14px;color:#1c43ad;border-bottom:1px dotted #f2ece7;text-decoration:none"><span>${esc(i.name)}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#a9a1a1">${esc(i.jurisdiction)} &middot; ${i.row_count}</span></a>`
  const block = (title, note, list) => `<section style="margin-bottom:36px"><h2 style="${H2}">${title}</h2><p style="${CAP}">${note}</p><div style="border:1px solid #e8e1db;background:#fffdfb;padding:6px 20px">\n${list.map(link).join("\n")}\n    </div></section>`
  const idx = `---\ntitle: "Regulation references"\ntype: regulation-index\ndescription: "The government instruments HMTc certification standards cite, each with its heavy-metal maximum levels transcribed from the primary text into the Heavy Metal Index register."\naudience: [regulator, brand-legal, certifier]\n---\n<section style="margin-bottom:28px"><p style="${P}">The sovereign instruments behind the certification standards. Each records the primary-source maximum levels a standard adopts when that jurisdiction binds a limit — a one-way reference to law, never a justification of any HMTc threshold.</p></section>\n${block("Cited by HMTc standards", "The instruments the published standards currently draw binding limits from.", curated)}\n${block("Global food-contaminant register", "Additional national and supranational food-contaminant standards recorded in the register, available as the program expands to new categories and jurisdictions.", others)}\n`
  fs.writeFileSync(path.join(OUT, "index.md"), idx)
  console.log(`built ${n} regulation pages + index from ${source} in content/regulations/`)
}

main()
