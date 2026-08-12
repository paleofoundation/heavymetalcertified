#!/usr/bin/env node

// Render every emitted HTML route at desktop and mobile widths, then verify the
// global chrome, reading-surface rules, local links/assets, and the readiness
// interaction. This complements the page-specific v3 computed-style contract.

import fs from "node:fs"
import path from "node:path"
import { createServer } from "node:http"

const root = path.join(process.cwd(), "public")
const port = 8124
const base = `http://127.0.0.1:${port}`
const types = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".woff2": "font/woff2",
}

function filesUnder(dir, suffix = "") {
  const found = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) found.push(...filesUnder(full, suffix))
    else if (!suffix || entry.name.endsWith(suffix)) found.push(full)
  }
  return found
}

function routeFor(file) {
  const rel = path.relative(root, file).split(path.sep).join("/")
  if (rel === "index.html") return "/"
  if (rel.endsWith("/index.html")) return `/${rel.slice(0, -"/index.html".length)}`
  return `/${rel.replace(/\.html$/, "")}`
}

function localTargetExists(urlPath) {
  let decoded
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return false
  }
  const safe = decoded.replace(/^\/+/, "")
  if (safe.split("/").includes("..")) return false
  const target = path.join(root, safe)
  return (
    fs.existsSync(target) ||
    fs.existsSync(`${target}.html`) ||
    fs.existsSync(path.join(target, "index.html")) ||
    (safe === "" && fs.existsSync(path.join(root, "index.html")))
  )
}

function serve() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let requestPath
      try {
        requestPath = decodeURIComponent(new URL(req.url, base).pathname)
      } catch {
        res.statusCode = 400
        return res.end("400")
      }
      const safe = requestPath.replace(/^\/+/, "")
      if (safe.split("/").includes("..")) {
        res.statusCode = 403
        return res.end("403")
      }
      let file = path.join(root, safe)
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
        const indexFile = path.join(file, "index.html")
        file = fs.existsSync(indexFile)
          ? indexFile
          : fs.existsSync(`${file}.html`)
            ? `${file}.html`
            : indexFile
      }
      else if (!fs.existsSync(file) && fs.existsSync(`${file}.html`)) file = `${file}.html`
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
        res.statusCode = 404
        return res.end("404")
      }
      res.setHeader("content-type", types[path.extname(file)] || "application/octet-stream")
      fs.createReadStream(file).pipe(res)
    })
    server.listen(port, "127.0.0.1", () => resolve(server))
  })
}

async function main() {
  let chromium
  try {
    ;({ chromium } = await import("playwright"))
  } catch {
    console.error("check-all-routes: playwright not installed; install it and Chromium after building")
    process.exit(2)
  }
  if (!fs.existsSync(root)) {
    console.error("check-all-routes: public/ is missing; run npm run build first")
    process.exit(2)
  }

  const routes = filesUnder(root, ".html").map(routeFor).sort()
  const server = await serve()
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === "127.0.0.1") await route.continue()
    else await route.abort()
  })

  const failures = []
  const localRefs = new Map()
  let next = 0

  async function worker() {
    const page = await context.newPage()
    while (next < routes.length) {
      const route = routes[next++]
      const pageErrors = []
      const onError = (error) => pageErrors.push(error.message)
      page.on("pageerror", onError)
      const response = await page.goto(`${base}${route}`, { waitUntil: "domcontentloaded" }).catch((error) => {
        failures.push(`${route}: navigation failed — ${error.message}`)
        return null
      })
      if (!response || response.status() !== 200) failures.push(`${route}: expected HTTP 200, got ${response?.status() ?? "no response"}`)

      const result = await page.evaluate(() => {
        const title = document.title.trim()
        const inlineBold = document.querySelectorAll(
          '.wiki-content [style*="font-weight:600"],.wiki-content [style*="font-weight:700"],.wiki-content [style*="font-weight:800"],.wiki-content [style*="font-weight:900"]',
        ).length
        const computedBold = [...document.querySelectorAll(".wiki-content strong,.wiki-content b")].filter(
          (element) => Number.parseInt(getComputedStyle(element).fontWeight, 10) > 500,
        ).length
        const refs = [...document.querySelectorAll("a[href],link[href],script[src],img[src],source[src]")]
          .map((element) => element.getAttribute("href") || element.getAttribute("src"))
          .filter(Boolean)
        return {
          title,
          headers: document.querySelectorAll("header").length,
          mains: document.querySelectorAll("main").length,
          inlineBold,
          computedBold,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          refs,
        }
      })

      if (!result.title) failures.push(`${route}: empty document title`)
      if (result.headers !== 1) failures.push(`${route}: expected one global header, got ${result.headers}`)
      if (result.mains !== 1) failures.push(`${route}: expected one main element, got ${result.mains}`)
      if (result.inlineBold) failures.push(`${route}: ${result.inlineBold} inline-bold reading-surface element(s)`)
      if (result.computedBold) failures.push(`${route}: ${result.computedBold} computed-bold strong/b element(s)`)
      if (result.overflow > 1) failures.push(`${route}: desktop body overflows horizontally by ${result.overflow}px`)

      await page.setViewportSize({ width: 390, height: 844 })
      const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (mobileOverflow > 1) failures.push(`${route}: mobile body overflows horizontally by ${mobileOverflow}px`)
      await page.setViewportSize({ width: 1440, height: 1000 })

      for (const raw of result.refs) {
        if (/^(?:mailto:|tel:|data:|javascript:|#)/i.test(raw)) continue
        let resolved
        try {
          resolved = new URL(raw, `${base}${route}`)
        } catch {
          failures.push(`${route}: invalid local reference ${raw}`)
          continue
        }
        if (resolved.hostname === "127.0.0.1" || resolved.hostname === "heavymetalcertified.com" || resolved.hostname === "www.heavymetalcertified.com") {
          const target = resolved.pathname
          const key = `${route} → ${target}`
          localRefs.set(key, target)
        }
      }
      for (const error of pageErrors) failures.push(`${route}: uncaught page error — ${error}`)
      page.off("pageerror", onError)
    }
    await page.close()
  }

  await Promise.all(Array.from({ length: Math.min(6, routes.length) }, () => worker()))

  for (const [label, target] of localRefs) {
    if (!localTargetExists(target)) failures.push(`${label}: local target does not exist`)
  }

  const readiness = await context.newPage()
  const transmitted = []
  let trackReadinessRequests = false
  readiness.on("request", (request) => {
    if (trackReadinessRequests) transmitted.push(request.url())
  })
  await readiness.goto(`${base}/readiness`, { waitUntil: "domcontentloaded" })
  trackReadinessRequests = true
  const selections = {
    category: "Infant and Child Foods",
    consumer: "infant",
    form: "powder",
    portfolio: "small",
    evidence: "partial",
    intent: "readiness",
  }
  for (const [name, value] of Object.entries(selections)) await readiness.selectOption(`select[name="${name}"]`, value)
  await readiness.click('[data-readiness-form] button[type="submit"]')
  const readinessResult = await readiness.locator("[data-readiness-result]").evaluate((element) => ({
    hidden: element.hidden,
    text: element.textContent || "",
  }))
  if (readinessResult.hidden || !readinessResult.text.includes("Private Readiness only")) {
    failures.push("/readiness: completed six-question check did not reveal the expected decision map")
  }
  await readiness.click('[data-readiness-form] button[type="reset"]')
  if (!(await readiness.locator("[data-readiness-result]").evaluate((element) => element.hidden))) {
    failures.push("/readiness: reset did not clear the decision map")
  }
  if (transmitted.length) failures.push(`/readiness: form interaction initiated unexpected request(s): ${transmitted.join(", ")}`)
  await readiness.close()

  await context.close()
  await browser.close()
  server.close()

  if (failures.length) {
    console.error(`check-all-routes: ${failures.length} failure(s) across ${routes.length} rendered routes`)
    for (const failure of failures) console.error(`  ✗ ${failure}`)
    process.exit(1)
  }
  console.log(`check-all-routes: OK — ${routes.length} rendered routes, ${localRefs.size} local references, desktop/mobile layout, and readiness interaction.`)
}

main()
