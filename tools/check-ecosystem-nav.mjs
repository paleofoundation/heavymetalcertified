#!/usr/bin/env node
// Build first, then run `node tools/check-ecosystem-nav.mjs`.
// Set ECOSYSTEM_BASE_URL to run the same checks against a deployed preview.
import assert from "node:assert/strict"
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs"
import { createServer } from "node:http"
import { extname, join, resolve } from "node:path"
import { chromium } from "playwright"

const root = resolve("public")
const output = resolve(process.env.ECOSYSTEM_OUTPUT_DIR || "output/ecosystem-nav")
const pages = ["/ecosystem", "/ecosystem/hmi", "/ecosystem/tecrid", "/ecosystem/vle", "/ecosystem/hmtc"]
const itemSelector = '.hmi-nav-item[data-panel="ecosystem"]'
const panelSelector = `${itemSelector} .hmi-nav-panel`
const failures = []
const browserErrors = []
const checks = []
const homepageTimings = []
const internalLinks = new Set()
const oidcToken = process.env.VERCEL_OIDC_TOKEN
const oidcHeader = "x-vercel-trusted-oidc-idp-token"
const redact = text => oidcToken ? String(text).replaceAll(oidcToken, "[redacted]") : String(text)
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" }
mkdirSync(output, { recursive: true })

async function serveBuild() {
  assert(existsSync(join(root, "index.html")), "Build the site before running the ecosystem navigation check")
  const server = createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
    let file = join(root, pathname)
    if (existsSync(file) && statSync(file).isDirectory()) file = existsSync(`${file}.html`) ? `${file}.html` : join(file, "index.html")
    else if (!existsSync(file) && existsSync(`${file}.html`)) file += ".html"
    if (!file.startsWith(`${root}/`) || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404)
      return res.end("404")
    }
    res.setHeader("Content-Type", types[extname(file)] || "application/octet-stream")
    createReadStream(file).pipe(res)
  })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  return server
}

const server = process.env.ECOSYSTEM_BASE_URL ? null : await serveBuild()
const base = (process.env.ECOSYSTEM_BASE_URL || `http://127.0.0.1:${server.address().port}`).replace(/\/$/, "")
const origin = new URL(base).origin
const normalizedPath = href => new URL(href, base).pathname.replace(/\/$/, "") || "/"
const browser = await chromium.launch()

async function scenario(name, run) {
  if (process.env.ECOSYSTEM_CHECK && !name.includes(process.env.ECOSYSTEM_CHECK)) return
  try {
    await run()
    checks.push(name)
    console.log(`PASS ${name}`)
  } catch (error) {
    failures.push({ name, message: redact(error.message), stack: redact(error.stack) })
    console.error(`FAIL ${name}: ${redact(error.stack)}`)
  }
}

async function newPage(viewport, touch = false) {
  const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch && viewport.width < 768 })
  await context.addInitScript(() => { window.__ecosystemDocumentId = crypto.randomUUID() })
  if (oidcToken) await context.route("**/*", async route => {
    const request = route.request()
    const headers = { ...request.headers() }
    delete headers[oidcHeader]
    if (new URL(request.url()).origin !== origin) return route.continue({ headers })
    headers[oidcHeader] = oidcToken
    // route.continue header overrides also follow redirects. Fetch without
    // redirects and fulfill the response so this token stays on this origin.
    try {
      const response = await route.fetch({ headers, maxRedirects: 0 })
      await route.fulfill({ response })
    } catch (error) {
      browserErrors.push({ type: "requestfailed", url: request.url(), message: redact(error.message) })
      await route.abort()
    }
  })
  const page = await context.newPage()
  page.setDefaultTimeout(6000)
  page.on("pageerror", error => browserErrors.push({ type: "pageerror", page: page.url(), message: redact(error.message) }))
  page.on("console", message => {
    if (message.type() === "error") browserErrors.push({ type: "console", page: page.url(), message: redact(message.text()), location: message.location() })
  })
  page.on("requestfailed", request => {
    // Navigation naturally aborts in-flight requests, so record only actual failures.
    if (request.failure()?.errorText === "net::ERR_ABORTED") return
    browserErrors.push({ type: "requestfailed", page: page.url(), url: request.url(), message: request.failure()?.errorText })
  })
  return page
}

async function goto(page, pathname) {
  const started = performance.now()
  const response = await page.goto(`${base}${pathname}`, { waitUntil: "domcontentloaded" })
  assert(response?.ok(), `${pathname} returned ${response?.status()}`)
  if (pathname === "/") {
    await page.locator(".hmtc-home-title").waitFor({ state: "visible", timeout: 3000 })
    await page.locator(".hmtc-home-action--primary").waitFor({ state: "visible", timeout: 3000 })
    const timing = await page.evaluate(() => ({
      domContentLoadedMs: Math.round(performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd || 0),
      firstContentfulPaintMs: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime || 0) || null,
    }))
    const visibleMs = Math.round(performance.now() - started)
    homepageTimings.push({ width: page.viewportSize().width, headingAndPrimaryCtaVisibleMs: visibleMs, ...timing })
    console.log(`TIMING ${page.viewportSize().width}px: heading and primary CTA visible in ${visibleMs}ms; DOMContentLoaded ${timing.domContentLoadedMs}ms; FCP ${timing.firstContentfulPaintMs ?? "pending"}ms`)
  }
  await page.locator(".hmi-nav--js").waitFor({ state: "attached" })
}

async function panelVisible(page, visible) {
  await page.locator(panelSelector).waitFor({ state: visible ? "visible" : "hidden" })
  assert.equal(await page.locator(`${itemSelector} .hmi-nav-toggle`).getAttribute("aria-expanded"), String(visible))
}

async function waitRoute(page, pathname) {
  await page.waitForURL(url => normalizedPath(url.href) === pathname)
  await page.waitForFunction(expected => {
    const slug = document.body.dataset.slug?.replace(/\/index$/, "")
    return (slug === "index" ? "/" : `/${slug}`) === expected && document.querySelector(".hmi-nav--js")
  }, pathname)
}

async function checkOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }))
  assert(dimensions.document <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1, `${label} overflows: ${JSON.stringify(dimensions)}`)
  const bar = await page.locator(".hmtc-bar").boundingBox()
  assert(bar && bar.x >= -1 && bar.x + bar.width <= dimensions.viewport + 1, `${label} header exceeds the viewport`)
}

async function checkNavContract(page) {
  const topLinks = page.locator(".hmi-nav-list > .hmi-nav-item > .hmi-nav-top")
  assert.equal(await topLinks.count(), 6, "The existing five sections plus Ecosystem must remain in the top nav")
  assert.deepEqual((await topLinks.allTextContents()).map(text => text.trim()), ["Standards", "Analytes", "Research", "Program", "Brands", "Ecosystem"])
  assert.equal(normalizedPath(await topLinks.nth(5).evaluate(element => element.href)), "/ecosystem", "Ecosystem must be a real link to the hub")
  assert.equal(await page.locator(`${itemSelector} .hmi-nav-toggle`).getAttribute("aria-controls"), await page.locator(panelSelector).getAttribute("id"), "The disclosure control must identify its panel")
  const columns = await page.locator(`${panelSelector} .hmi-nav-col`).evaluateAll(elements => elements.map(element => ({
    title: element.querySelector(".hmi-nav-colhead")?.textContent.trim(),
    blurb: element.querySelector(".hmi-nav-group-blurb")?.textContent.trim(),
    hrefs: [...element.querySelectorAll("a")].map(link => link.href),
  })))
  assert.deepEqual(columns.map(column => column.title), ["HMI", "TECRID", "VLE", "HMTc"])
  for (const [index, column] of columns.entries()) {
    assert(column.blurb && column.blurb.split(/\s+/).length <= 20, `${column.title} requires a blurb of at most 20 words`)
    assert(column.hrefs.length >= 2 && column.hrefs.length <= 4, `${column.title} requires 2 to 4 links`)
    assert(column.hrefs.some(href => normalizedPath(href) === pages[index + 1]), `${column.title} paper link missing or incorrectly resolved`)
    if (index < 3) assert(column.hrefs.some(href => new URL(href).origin === ["https://heavymetalindex.com", "https://tecrid.com", "https://vle.exchange"][index]), `${column.title} external destination missing`)
    for (const href of column.hrefs) if (new URL(href).origin === origin) internalLinks.add(href)
  }
  for (const destination of ["/standards", "/apply", "/verify"]) assert(columns[3].hrefs.some(href => normalizedPath(href) === destination), `HMTc ${destination} link missing`)
  assert(!/\u2014|Disney/i.test(columns.map(column => `${column.title} ${column.blurb}`).join(" ")), "Public dropdown copy contains an em dash or Disney metaphor")
}

async function checkHero(page) {
  const hero = page.locator(".hmtc-home-hero")
  await hero.locator("h1").waitFor({ state: "visible", timeout: 3000 })
  const title = (await hero.locator("h1").innerText()).replace(/\s+/g, " ").trim()
  assert.equal(title, "Published standards for heavy metals.")
  assert(!/\bVLE\b|\bQUALIFIED\b/i.test(await hero.innerText()), "Homepage hero must retain HMTc product identity")
  assert.equal(await hero.locator(".hmtc-home-action--primary").getAttribute("href"), "https://app.heavymetalcertified.com/hmt/get-started")
  const position = await hero.locator("h1").boundingBox()
  assert(position && position.y >= 0 && position.y < page.viewportSize().height, "HMTc heading must appear in the first viewport")
}

try {
  await scenario("1440px desktop identity, hover, keyboard, outside click, and SPA navigation", async () => {
    const page = await newPage({ width: 1440, height: 1000 })
    try {
      await goto(page, "/")
      await checkHero(page)
      await checkNavContract(page)
      await checkOverflow(page, "Desktop homepage")
      await page.screenshot({ path: join(output, "homepage-1440.png") })
      const top = page.locator(`${itemSelector} > .hmi-nav-top`)
      await top.hover()
      await panelVisible(page, true)
      const boxes = await page.locator(`${panelSelector} .hmi-nav-col`).evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width } }))
      assert.equal(new Set(boxes.map(box => Math.round(box.y))).size, 1, "Desktop ecosystem must use four side-by-side columns")
      for (let index = 1; index < boxes.length; index++) assert(boxes[index].x >= boxes[index - 1].x + boxes[index - 1].width, "Desktop columns overlap")
      await page.screenshot({ path: join(output, "megamenu-1440.png") })
      await page.mouse.move(10, 900)
      await panelVisible(page, false)
      await top.focus()
      await top.press("ArrowDown")
      await panelVisible(page, true)
      assert(await page.locator(`${panelSelector} a`).first().evaluate(element => element === document.activeElement), "ArrowDown must focus the first panel link")
      await page.keyboard.press("Escape")
      await panelVisible(page, false)
      assert(await top.evaluate(element => element === document.activeElement), "Escape must return focus to the top-level link")
      await top.press("ArrowDown")
      await page.mouse.click(10, 900)
      await panelVisible(page, false)
      const documentId = await page.evaluate(() => window.__ecosystemDocumentId)
      await top.click()
      await waitRoute(page, "/ecosystem")
      await panelVisible(page, false)
      assert.equal(await page.evaluate(() => window.__ecosystemDocumentId), documentId, "One-click ecosystem navigation should preserve the SPA document")
      await checkNavContract(page)
      // SPA keeps the pointer over the clicked trigger. Leave and re-enter to
      // exercise a fresh hover, since navigation intentionally closes panels.
      await page.mouse.move(10, 900)
      await page.locator(`${itemSelector} > .hmi-nav-top`).hover()
      await panelVisible(page, true)
      await page.locator(`${panelSelector} a`).filter({ hasText: "Read the HMI paper" }).click()
      await waitRoute(page, "/ecosystem/hmi")
      await panelVisible(page, false)
      assert.equal(await page.evaluate(() => window.__ecosystemDocumentId), documentId, "Nested paper navigation should preserve the SPA document")
      await checkNavContract(page)
      await page.locator(`${itemSelector} > .hmi-nav-top`).focus()
      await page.keyboard.press("ArrowDown")
      await panelVisible(page, true)
      await page.keyboard.press("Escape")
      await panelVisible(page, false)
      await page.locator(".hmtc-brand").click()
      await waitRoute(page, "/")
      await checkHero(page)
    } finally { await page.context().close() }
  })

  for (const width of [320, 390, 768, 1200, 1280]) {
    await scenario(`${width}px responsive menu, link reachability, and one-click hub`, async () => {
      const touch = width < 1200
      const page = await newPage({ width, height: 900 }, touch)
      try {
        await goto(page, "/")
        await checkHero(page)
        await checkNavContract(page)
        await checkOverflow(page, `${width}px closed menu`)
        const burger = page.locator(".hmi-topnav-burger")
        if (touch) {
          assert(await burger.isVisible(), `${width}px needs the touch navigation drawer`)
          await burger.tap()
          assert.equal(await burger.getAttribute("aria-expanded"), "true")
          await page.locator(`${itemSelector} .hmi-nav-toggle`).tap()
        } else {
          assert(!(await burger.isVisible()), `${width}px should retain desktop navigation`)
          await page.locator(`${itemSelector} > .hmi-nav-top`).hover()
          const headerBoxes = await page.locator(".hmtc-brand, .hmtc-nav, .hmtc-actions").evaluateAll(elements => elements.map(element => { const r = element.getBoundingClientRect(); return { x: r.x, right: r.right } }))
          for (let index = 1; index < headerBoxes.length; index++) assert(headerBoxes[index].x >= headerBoxes[index - 1].right - 1, `${width}px header controls overlap`)
        }
        await panelVisible(page, true)
        await checkOverflow(page, `${width}px open menu`)
        const links = page.locator(`${panelSelector} a`)
        for (let index = 0; index < await links.count(); index++) {
          const link = links.nth(index)
          await link.scrollIntoViewIfNeeded()
          await link.click({ trial: true })
          const rectangle = await link.boundingBox()
          assert(rectangle && rectangle.x >= -1 && rectangle.x + rectangle.width <= width + 1, `${width}px menu link is clipped: ${await link.innerText()}`)
        }
        await links.first().scrollIntoViewIfNeeded()
        await page.screenshot({ path: join(output, `megamenu-${width}.png`) })
        const paperLink = links.filter({ hasText: "Read the HMTc paper" })
        if (touch) await paperLink.tap()
        else await paperLink.click()
        await waitRoute(page, "/ecosystem/hmtc")
        await panelVisible(page, false)
        assert.equal(await burger.getAttribute("aria-expanded"), "false", "Navigation must close the mobile drawer")
        await checkNavContract(page)
        await checkOverflow(page, `${width}px nested paper`)
        if (touch) await burger.tap()
        const hub = page.locator(`${itemSelector} > .hmi-nav-top`)
        if (touch) await hub.tap()
        else await hub.click()
        await waitRoute(page, "/ecosystem")
        await checkOverflow(page, `${width}px ecosystem index`)
      } finally { await page.context().close() }
    })
  }

  for (const pathname of pages) {
    await scenario(`${pathname} paper content and resolved internal links`, async () => {
      const page = await newPage({ width: 1440, height: 1000 })
      try {
        await goto(page, pathname)
        await checkNavContract(page)
        const article = page.locator(".wiki-content")
        const text = await article.innerText()
        assert(text.trim().split(/\s+/).length >= 150, `${pathname} must contain a populated paper`)
        assert(!text.includes("\u2014"), `${pathname} contains a public em dash`)
        assert(!/Disney/i.test(text), `${pathname} contains a public Disney metaphor`)
        assert.equal(await article.locator("strong, b").count(), 0, `${pathname} contains bold markup on the reading surface`)
        const bold = await article.locator("p, li, td, a, span").evaluateAll(elements => elements.filter(element => element.getClientRects().length && Number(getComputedStyle(element).fontWeight) >= 600).slice(0, 5).map(element => element.textContent.trim().slice(0, 100)))
        assert.deepEqual(bold, [], `${pathname} contains bold prose`)
        const hrefs = await page.locator(`${panelSelector} a, .wiki-content a`).evaluateAll(elements => elements.map(element => element.href))
        for (const href of hrefs) {
          const url = new URL(href)
          assert(!url.pathname.includes("/ecosystem/ecosystem"), `${pathname} has a broken nested link: ${href}`)
          if (url.origin === origin && !url.hash) internalLinks.add(url.href)
        }
        await checkOverflow(page, pathname)
        await page.screenshot({ path: join(output, `${pathname.slice(1).replaceAll("/", "-")}.png`), fullPage: true })
      } finally { await page.context().close() }
    })
  }

  await scenario("All ecosystem internal destinations return successful responses", async () => {
    const context = await browser.newContext()
    try {
      const results = await Promise.all([...internalLinks].map(async url => {
        // Playwright API requests do not use browser route handlers. Disable
        // automatic redirects so an authenticated request cannot carry this
        // preview-origin header to an unrelated host.
        assert.equal(new URL(url).origin, origin)
        const response = await context.request.get(url, { maxRedirects: 0, headers: oidcToken ? { [oidcHeader]: oidcToken } : {} })
        assert(![301, 302, 303, 307, 308].includes(response.status()), `${url} unexpectedly redirects to ${response.headers().location}`)
        return { url, status: response.status() }
      }))
      assert.deepEqual(results.filter(result => result.status >= 400), [])
    } finally { await context.close() }
  })

  await scenario("No uncaught browser errors or failed first-party resources", async () => {
    const actionable = browserErrors.filter(error => error.type === "pageerror" || (error.type === "requestfailed" && new URL(error.url).origin === origin))
    assert.deepEqual(actionable, [])
  })
} finally {
  await browser.close()
  if (server) await new Promise(resolve => server.close(resolve))
  writeFileSync(join(output, "report.json"), JSON.stringify({ base, checks, failures, homepageTimings, browserErrors, internalDestinations: [...internalLinks] }, null, 2) + "\n")
}

console.log(`check-ecosystem-nav: ${checks.length} passed; ${failures.length} failed. Evidence: ${output}`)
if (failures.length) process.exitCode = 1
