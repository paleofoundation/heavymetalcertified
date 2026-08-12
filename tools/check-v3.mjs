#!/usr/bin/env node
// check-v3 — the design-fidelity gate (docs/design-canon/FIDELITY.md).
//
// Assertions in design/v3-acceptance.cert.json are checked against the COMPUTED
// styles of the RENDERED page in headless Chromium — never against source SCSS.
// This is the whole point: the source can be correct while an older rule wins in
// the cascade and the browser disagrees. Source-reading cannot catch that; this can.
//
// Usage:  npm run build && npm run check:v3
// First run needs a browser:  npx --yes playwright install chromium
// Exits non-zero on any mismatch. Do not report a page as matching the canon
// until this passes.

import { readFileSync, existsSync, statSync, createReadStream } from "node:fs"
import { createServer } from "node:http"
import { join, extname } from "node:path"

const SPEC = "design/v3-acceptance.cert.json"
const ROOT = "public"
const PORT = 8123
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".png": "image/png", ".woff2": "font/woff2" }

function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let p = decodeURIComponent(req.url.split("?")[0])
      let f = join(ROOT, p)
      if (existsSync(f) && statSync(f).isDirectory()) {
        const indexFile = join(f, "index.html")
        f = existsSync(indexFile) ? indexFile : existsSync(f + ".html") ? f + ".html" : indexFile
      }
      else if (!existsSync(f) && existsSync(f + ".html")) f = f + ".html" // cleanUrls
      if (!existsSync(f)) { res.statusCode = 404; return res.end("404") }
      res.setHeader("content-type", TYPES[extname(f)] || "application/octet-stream")
      createReadStream(f).pipe(res)
    })
    server.listen(PORT, () => resolve(server))
  })
}

function toHex(v) {
  const m = String(v).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i)
  if (!m) return String(v).toLowerCase()
  return "#" + [1, 2, 3].map((i) => Number(m[i]).toString(16).padStart(2, "0")).join("")
}
const px = (v) => parseFloat(String(v))

async function main() {
  let chromium
  try {
    ({ chromium } = await import("playwright"))
  } catch {
    console.error("check-v3: playwright not installed.\n  npm i -D playwright && npx --yes playwright install chromium")
    process.exit(2)
  }
  if (!existsSync(SPEC)) { console.error(`check-v3: missing ${SPEC}`); process.exit(2) }
  if (!existsSync(ROOT)) { console.error("check-v3: no public/ — run `npm run build` first"); process.exit(2) }
  const spec = JSON.parse(readFileSync(SPEC, "utf8"))
  const server = await serve()
  const browser = await chromium.launch()
  const failures = []
  let checked = 0
  for (const [path, assertions] of Object.entries(spec.pages || {})) {
    const page = await browser.newPage({ viewport: spec.viewport || { width: 1440, height: 1000 } })
    await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: "networkidle" }).catch(() => {})
    for (const a of assertions) {
      checked++
      if (a.viewport) await page.setViewportSize(a.viewport)
      if (a.click) await page.click(a.click)
      if (a.key) await page.keyboard.press(a.key)
      const got = await page.evaluate(({ sel, prop }) => {
        if (prop === "no-horizontal-overflow") {
          return document.documentElement.scrollWidth <= document.documentElement.clientWidth
        }
        const els = document.querySelectorAll(sel)
        if (prop === "count") return els.length
        if (prop === "absent") return els.length === 0
        if (!els[0]) return null
        return getComputedStyle(els[0])[prop]
      }, a)
      const label = `${path} · ${a.sel} · ${a.prop}`
      let ok
      if (a.prop === "count" || a.prop === "no-horizontal-overflow") ok = got === a.want
      else if (a.prop === "absent") ok = got === (a.want !== false)
      else if (got == null) ok = false
      else if (a.match === "contains") ok = String(got).toLowerCase().includes(String(a.want).toLowerCase())
      else if (/^#|rgb/.test(String(a.want)) || /color/i.test(a.prop)) ok = toHex(got) === toHex(a.want)
      else if (/px$/.test(String(a.want))) ok = Math.abs(px(got) - px(a.want)) <= 1
      else ok = String(got) === String(a.want)
      if (!ok) failures.push(`  FAIL  ${label}  want ${a.want}  got ${got}${a.note ? "   (" + a.note + ")" : ""}`)
    }
    await page.close()
  }
  await browser.close()
  server.close()
  if (failures.length) {
    console.error(`check-v3: ${failures.length}/${checked} assertions FAILED\n` + failures.join("\n"))
    process.exit(1)
  }
  console.log(`check-v3: OK — ${checked} assertions pass against the rendered build`)
}

main()
