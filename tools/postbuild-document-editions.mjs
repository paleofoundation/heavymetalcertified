#!/usr/bin/env node
// Current web-edition PDFs and page-specific RSS. Read the built article DOM so
// scientific tables, product-form variants, citations and history stay intact.
// Build machines need Playwright Chromium (`npx playwright install chromium`).
import { chromium } from "playwright"
import { createServer } from "node:http"
import handler from "serve-handler"
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync, copyFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import matter from "gray-matter"

const TYPES = new Set(["standard", "standard-in-development", "public-briefing", "article", "analyte", "rationale", "regulation", "program", "guide", "comparison", "manual"])
const BASE = "https://heavymetalcertified.com"
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]))
const documents = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const file = join(dir, name)
    if (statSync(file).isDirectory()) walk(file)
    else if (file.endsWith(".md")) {
      const source = readFileSync(file, "utf8")
      const { data: fm } = matter(source)
      const slug = file.replace(/^content\//, "").replace(/\.md$/, "")
      if (TYPES.has(fm.type) && !slug.endsWith("/index")) documents.push({ slug, fm, source, file })
    }
  }
}
walk("content")
const selected = process.env.HMTC_PDF_SLUGS?.split(",")
const jobs = selected ? documents.filter(d => selected.includes(d.slug)) : documents
const gitDates = new Map()
let date = ""
for (const line of execFileSync("git", ["log", "--format=%cI", "--name-only", "--", "content"], {encoding:"utf8"}).split("\n")) {
  if (/^\d{4}-\d{2}-\d{2}T/.test(line)) date = line
  else if (line.startsWith("content/") && !gitDates.has(line)) gitDates.set(line, date)
}
const printCss = `
@page { size: A4; margin: 18mm 15mm 19mm; }
* { box-sizing:border-box; } body { margin:0; color:#292222; font:10pt/1.55 Arial,sans-serif; }
.pdf-header { border-bottom:1px solid #9f2727; padding-bottom:14pt; margin-bottom:20pt; }
.pdf-header .label { color:#9f2727; font:8pt/1.5 monospace; letter-spacing:.06em; text-transform:uppercase; }
h1 { color:#9f2727; font:24pt/1.15 Georgia,serif; margin:10pt 0; } .pdf-byline,.pdf-canonical { font-size:8pt; margin:5pt 0; overflow-wrap:anywhere; }
h2 { font:18pt/1.25 Georgia,serif !important; color:#9f2727 !important; margin:20pt 0 10pt !important; break-after:avoid; }
h3 { font:13pt/1.35 Georgia,serif !important; margin:14pt 0 8pt !important; break-after:avoid; }
p, li { font-size:10pt !important; line-height:1.55 !important; orphans:3; widows:3; } p { margin:0 0 9pt; }
a { color:#9f2727; overflow-wrap:anywhere; } a[role=anchor] { display:none; }
section { margin-bottom:16pt !important; } div { max-width:100% !important; }
[style*="overflow"] { overflow:visible !important; } table { width:100% !important; min-width:0 !important; border-collapse:collapse; table-layout:auto; margin:10pt 0; font-size:8pt !important; }
thead { display:table-header-group; } tfoot { display:table-footer-group; } tr { break-inside:avoid; }
th,td { padding:5pt 4pt !important; white-space:normal !important; overflow-wrap:break-word; font-size:8pt !important; line-height:1.4 !important; border:1px solid #e8e1db; }
.pdf-wide-table th:first-child,.pdf-wide-table td:first-child { width:20%; }
.pdf-wide-table th:last-child,.pdf-wide-table td:last-child { width:14%; }
th { background:#9f2727 !important; color:#fff !important; font-weight:400; }
img,svg { max-width:100%; height:auto; } pre { white-space:pre-wrap; overflow-wrap:anywhere; } button,nav { display:none; }
.pdf-body details > summary { display:list-item; } .pdf-body details > * { content-visibility:visible; }
.pdf-body [style*="grid-template-columns"] { gap:10pt !important; }
.pdf-body [style*="position:sticky"] { position:static !important; }
`
const server = createServer((req,res) => handler(req,res,{public:"public",cleanUrls:true}))
await new Promise(resolve => server.listen(0,"127.0.0.1",resolve))
const port = server.address().port
let browser
let complete = 0
try {
  browser = await chromium.launch({headless:true})
  const queue = [...jobs]
  await Promise.all(Array.from({length:3}, async () => {
    const page = await browser.newPage()
    await page.route("**/*", route => route.request().url().startsWith(`http://127.0.0.1:${port}/`) ? route.continue() : route.abort())
    while (queue.length) {
      const {slug,fm,source,file} = queue.shift()
      // A standard ships a committed house @react-pdf edition (content/static/standards/<slug>.pdf).
      // Serve that verbatim as the web-edition PDF instead of a Chromium browser print — a
      // certification PDF, especially one bearing a DataCite DOI, must be the house scholarly
      // template, never a headless-browser render. (S-DOI-OLIVE-SHIP-1: kills Chromium/Skia
      // standard PDFs on Production; the pre-mint root failure lived exactly here.)
      const stdBase = (fm.type === "standard" || fm.type === "standard-in-development") ? slug.split("/").pop() : null
      const reactPdfSrc = stdBase ? join("content/static/standards", `${stdBase}.pdf`) : null
      if (reactPdfSrc && existsSync(reactPdfSrc)) {
        const dest = `public/${slug}.pdf`
        mkdirSync(dirname(dest), {recursive:true})
        copyFileSync(reactPdfSrc, dest)
        const revision = createHash("sha256").update(source).digest("hex").slice(0,16)
        const modified = new Date(gitDates.get(file) || fm.updated || fm.effective_date || "2026-01-01")
        const url = `${BASE}/${slug}`
        const feed = `public/feeds/${slug}.xml`
        mkdirSync(dirname(feed),{recursive:true})
        writeFileSync(feed,`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(fm.title)} — page updates</title><link>${esc(url)}</link><description>Published revisions of this Heavy Metal Certified page.</description><atom:link href="${BASE}/feeds/${slug}.xml" rel="self" type="application/rss+xml"/><item><title>${esc(fm.title)}</title><link>${esc(url)}</link><guid isPermaLink="false">${esc(url)}#revision-${revision}</guid><pubDate>${modified.toUTCString()}</pubDate><description>${esc(fm.description ?? "The current published edition is available on the website.")}</description></item></channel></rss>`)
        if (++complete % 50 === 0) console.log(`document-editions: ${complete}/${jobs.length}`)
        continue
      }
      const response = await page.goto(`http://127.0.0.1:${port}/${slug}`,{waitUntil:"networkidle"})
      if (!response?.ok()) throw new Error(`Unpublished document route: ${slug} (${response?.status()})`)
      const content = await page.evaluate(({base,slug}) => {
        const original = document.querySelector(".wiki-content > article")
        if (!original || document.querySelector("#hmtc-page-citation")?.getAttribute("data-cite-slug") !== slug) throw new Error(`Missing published document: ${slug}`)
        const article = original.cloneNode(true)
        article.querySelectorAll("h1,script,button,[role=anchor]").forEach(e=>e.remove())
        article.querySelectorAll("details").forEach(e=>e.setAttribute("open",""))
        article.querySelectorAll("a[href]").forEach(a=>{ const u=new URL(a.getAttribute("href"),location.href); if(u.origin===location.origin) u.host=new URL(base).host,u.protocol="https:";a.setAttribute("href",u.href) })
        let maxColumns = 0
        article.querySelectorAll("table").forEach(table => {
          const columns = Math.max(0, ...Array.from(table.rows, row => Array.from(row.cells).reduce((n, cell) => n + cell.colSpan, 0)))
          maxColumns = Math.max(maxColumns, columns)
          if (columns >= 6) table.classList.add("pdf-wide-table")
          if (!table.tHead) {
            const headerRows = []
            for (const row of table.rows) {
              if (!row.cells.length || !Array.from(row.cells).every(cell => cell.tagName === "TH")) break
              headerRows.push(row)
            }
            if (headerRows.length) {
              const head = table.createTHead()
              headerRows.forEach(row => head.append(row))
            }
          }
        })
        const citation = document.querySelector("[data-hmi-cite-text]")?.textContent ?? ""
        return {html:article.innerHTML, citation, maxColumns, tableRows:original.querySelectorAll("tr").length}
      }, {base:BASE,slug})
      const author = fm.author ?? "Karen Pendergrass"
      const orcid = author === "Karen Pendergrass" ? " · ORCID 0000-0002-2348-7259" : ""
      const edition = fm.standard_version ?? fm.updated ?? fm.briefing_date ?? fm.effective_date ?? ""
      const url = `${BASE}/${slug}`
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(fm.title)}</title><style>${printCss}${content.maxColumns > 9 ? "@page { size: A4 landscape; }" : ""}</style></head><body><header class="pdf-header"><div class="label">Heavy Metal Certified · Current web edition</div><h1>${esc(fm.title)}</h1><p class="pdf-byline">${esc(author)}${orcid}${edition ? " · "+esc(edition instanceof Date ? edition.toISOString().slice(0,10) : edition) : ""}</p><p class="pdf-canonical">${esc(content.citation || url)}</p></header><main class="pdf-body">${content.html}</main></body></html>`,{waitUntil:"load"})
      const printedRows = await page.locator("tr").count()
      if (printedRows !== content.tableRows) throw new Error(`Table-row loss: ${slug}`)
      const path = `public/${slug}.pdf`
      mkdirSync(dirname(path),{recursive:true})
      await page.pdf({path,format:"A4",printBackground:true,displayHeaderFooter:true,headerTemplate:"<span></span>",footerTemplate:'<div style="font:8px Arial;width:100%;text-align:center;color:#777">Heavy Metal Certified · <span class="pageNumber"></span> / <span class="totalPages"></span></div>',margin:{top:"18mm",bottom:"19mm",left:"15mm",right:"15mm"},preferCSSPageSize:true})
      const revision = createHash("sha256").update(source).digest("hex").slice(0,16)
      const modified = new Date(gitDates.get(file) || fm.updated || fm.effective_date || "2026-01-01")
      const feed = `public/feeds/${slug}.xml`
      mkdirSync(dirname(feed),{recursive:true})
      writeFileSync(feed,`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(fm.title)} — page updates</title><link>${esc(url)}</link><description>Published revisions of this Heavy Metal Certified page.</description><atom:link href="${BASE}/feeds/${slug}.xml" rel="self" type="application/rss+xml"/><item><title>${esc(fm.title)}</title><link>${esc(url)}</link><guid isPermaLink="false">${esc(url)}#revision-${revision}</guid><pubDate>${modified.toUTCString()}</pubDate><description>${esc(fm.description ?? "The current published edition is available on the website.")}</description></item></channel></rss>`)
      if (++complete % 50 === 0) console.log(`document-editions: ${complete}/${jobs.length}`)
    }
    await page.close()
  }))
  console.log(`document-editions: ${complete} current PDFs and page feeds; all table-row counts preserved`)
} finally { await browser?.close();server.close() }
