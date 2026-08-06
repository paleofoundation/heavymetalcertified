#!/usr/bin/env node
// Build per-instrument regulation reference pages for heavymetalcertified.com.
//
// INPUT  : data/regulations/infant-instruments.json  (the verified infant-food
//          limits each cited government instrument sets, exported from the Heavy
//          Metal Index regulatory register).
// OUTPUT : content/regulations/<slug>.md  — one page per instrument, in the site
//          design canon (#9f2727 accent, Lora headings, IBM Plex Mono tables).
//
// These pages are the "receipts" behind the standards: every number a standard's
// derivation cites resolves to the instrument page that sets it, with the primary
// citation and retrieval date. They RECORD sovereign law; they do not set or
// justify HMTc thresholds (that is the standard's job) — a one-way, firewall-clean
// reference, the same posture heavymetalindex.com/regulations uses.

import fs from "node:fs"
import path from "node:path"

const repoRoot = process.cwd()
const DATA = path.join(repoRoot, "data/regulations/infant-instruments.json")
const OUT = path.join(repoRoot, "content/regulations")

const ANALYTE_DISP = {
  Pb: "Lead (Pb)", iAs: "Inorganic arsenic (iAs)", tAs: "Total arsenic (tAs)",
  Cd: "Cadmium (Cd)", tHg: "Mercury, total (tHg)", MeHg: "Methylmercury (MeHg)",
  Ni: "Nickel (Ni)", Al: "Aluminium (Al)", Sn: "Tin (Sn)", "Cr-total": "Total chromium (Cr)",
  "Cr-VI": "Hexavalent chromium (Cr-VI)", Cr: "Chromium (Cr)",
}
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const disp = (a) => ANALYTE_DISP[a] || a

const H2 = 'font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px'
const THEAD = "background:#9f2727;color:#fff"
const TH = "text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase"
const TD = "padding:10px 15px;color:#2b1f1f"
const TDm = "padding:10px 15px;color:#736b6b;font-size:12.5px"

function limitsTable(limits) {
  const rows = limits
    .sort((a, b) => (a.analyte > b.analyte ? 1 : -1))
    .map((l, i) => {
      const bg = i % 2 ? "background:#fbf7f5;" : ""
      return `<tr style="border-bottom:1px solid #f2ece7;${bg}"><td style="${TD}">${esc(disp(l.analyte))}</td><td style="padding:10px 15px;text-align:right;font-family:'IBM Plex Mono',monospace;color:#2b1f1f">${l.value_ug_kg}</td><td style="${TDm}">${esc(l.basis || "")}</td><td style="${TDm}">${esc(l.scope)}</td><td style="padding:10px 15px;color:#a9a1a1;font-size:11.5px;font-family:'IBM Plex Mono',monospace">${esc((l.source || "").slice(0, 60))}</td></tr>`
    })
    .join("")
  return `<div style="overflow-x:auto"><table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:52rem;border-collapse:collapse"><thead><tr style="${THEAD}"><th style="${TH}">Analyte</th><th style="${TH};text-align:right">Limit (&micro;g/kg)</th><th style="${TH}">Basis</th><th style="${TH}">Product scope</th><th style="${TH}">Provision</th></tr></thead><tbody>${rows}</tbody></table></div>`
}

function page(inst) {
  const verifiedBadge = inst.verified
    ? `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#2c6e49;background:#e6f0ea;border-radius:4px;padding:3px 8px">Primary-verified${inst.retrieved ? " &middot; " + esc(inst.retrieved) : ""}</span>`
    : `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9a6a18;background:#f6eedd;border-radius:4px;padding:3px 8px">Values confirmed; no static PDF</span>`
  const fm = [
    "---",
    `title: "${esc(inst.name).replace(/"/g, '\\"')} — regulation reference"`,
    "type: regulation",
    `description: "The infant and child food heavy-metal maximum levels set by ${esc(inst.name)} (${esc(inst.jurisdiction)}), as cited by HMTc certification standards. Records sovereign law; does not set HMTc thresholds."`,
    `jurisdiction: ${inst.jurisdiction}`,
    `reference: "${esc(inst.reference)}"`,
    `instrument_status: ${inst.status}`,
    `regulation_slug: ${inst.slug}`,
    inst.url ? `source_url: ${inst.url}` : "",
    "audience: [regulator, brand-legal, retailer-compliance, certifier]",
    "---",
  ].filter(Boolean).join("\n")

  const body = [
    `<section id="what" style="margin-bottom:44px"><div style="margin-bottom:14px">${verifiedBadge}</div><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 16px;max-width:84ch">This page records the infant and child food heavy-metal maximum levels set by <strong>${esc(inst.name)}</strong>${inst.reference ? ` (${esc(inst.reference)})` : ""}, the instrument of ${esc(inst.body)}${inst.year ? `, ${inst.year}` : ""}. Every value below is transcribed from the primary text and is the value an HMTc standard cites when this jurisdiction binds a certification limit. It is a record of law, not an HMTc threshold.</p>${inst.url ? `<p style="font-size:13px;line-height:1.7;color:#736b6b;margin:0"><a href="${esc(inst.url)}" style="color:#1c43ad" target="_blank" rel="noopener">Primary source &nearr;</a></p>` : ""}</section>`,
    `<section id="limits" style="margin-bottom:44px"><h2 style="${H2}">Infant &amp; child food limits</h2><p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:0 0 14px">All values &micro;g/kg (ppb), in the basis the instrument states. ${inst.infant_limits.length} limit${inst.infant_limits.length === 1 ? "" : "s"} for infant and child food categories.</p>${limitsTable(inst.infant_limits)}</section>`,
    `<section id="hmtc" style="margin-bottom:20px"><h2 style="${H2}">How this interacts with HMTc</h2><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0;max-width:84ch">HMTc certification standards adopt the <em>strictest</em> maximum level set by any credible government worldwide. Where this instrument holds the strictest value for a (product, analyte) cell, it binds the HMTc limit and the standard cites this page. This page does not set or justify any HMTc threshold; it records the sovereign requirement the program measures against.</p></section>`,
  ].join("\n")

  return `${fm}\n${body}\n`
}

function main() {
  const { instruments } = JSON.parse(fs.readFileSync(DATA, "utf8"))
  fs.mkdirSync(OUT, { recursive: true })
  let n = 0
  for (const inst of instruments) {
    if (!inst.infant_limits.length) continue
    fs.writeFileSync(path.join(OUT, `${inst.slug}.md`), page(inst))
    n++
  }
  // index page
  const rows = instruments
    .filter((i) => i.infant_limits.length)
    .map((i) => `      <a href="/regulations/${i.slug}" style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:8px 0;font-size:14px;color:#1c43ad;border-bottom:1px dotted #f2ece7;text-decoration:none"><span>${esc(i.name)}</span><span style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#a9a1a1">${i.jurisdiction} &middot; ${i.infant_limits.length}</span></a>`)
    .join("\n")
  const idx = `---\ntitle: "Regulation references"\ntype: regulation-index\ndescription: "The government instruments HMTc infant and child food standards cite, each with its infant-food maximum levels transcribed from the primary text."\naudience: [regulator, brand-legal, certifier]\n---\n<section style="margin-bottom:20px"><p style="font-size:15.5px;line-height:1.75;color:#3f3a3a;margin:0 0 20px;max-width:84ch">The sovereign instruments behind the infant and child food standards. Each records the primary-source maximum levels a standard adopts when that jurisdiction binds a limit.</p><div style="border:1px solid #e8e1db;background:#fffdfb;padding:6px 20px">\n${rows}\n    </div></section>\n`
  fs.writeFileSync(path.join(OUT, "index.md"), idx)
  console.log(`built ${n} regulation pages + index in content/regulations/`)
}

main()
