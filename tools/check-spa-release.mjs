#!/usr/bin/env node
// Reproduce an open tab navigating across a release: persisted CSS and running
// JS must never stay on the previous build while the body comes from the new one.
import assert from "node:assert/strict"
import { readFileSync, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { join, extname } from "node:path"
import { chromium } from "playwright"

const root = "public"
const home = readFileSync(join(root, "index.html"), "utf8")
const cssName = home.match(/index\.[a-f0-9]+\.css/)?.[0]
assert(cssName, "Build the site before running the release-navigation check")
const css = readFileSync(join(root, cssName))
let release = "before"
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2" }
const server = createServer((req, res) => {
  const route = decodeURIComponent(new URL(req.url, "http://localhost").pathname)
  res.setHeader("Cache-Control", "no-store")
  if (/^\/index\.(before|after|next)\.css$/.test(route)) {
    res.setHeader("Content-Type", "text/css")
    return res.end(css)
  }
  let file = join(root, route)
  if (existsSync(file) && statSync(file).isDirectory()) file = existsSync(file + ".html") ? file + ".html" : join(file, "index.html")
  else if (!existsSync(file) && existsSync(file + ".html")) file += ".html"
  if (!existsSync(file)) { res.statusCode = 404; return res.end("404") }
  const ext = extname(file)
  res.setHeader("Content-Type", types[ext] || "application/octet-stream")
  let body = readFileSync(file)
  if (ext === ".html") body = body.toString().replaceAll(cssName, `index.${release}.css`)
  if (route === "/postscript.js") body = `window.__scriptRelease=${JSON.stringify(release)};\n${body}`
  res.end(body)
})
await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
const origin = `http://127.0.0.1:${server.address().port}`
let browser
try {
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await page.addInitScript(() => { window.__documentId = crypto.randomUUID() })
  const state = () => page.evaluate(() => ({
    id: window.__documentId,
    script: window.__scriptRelease,
    sheets: [...document.styleSheets].filter(sheet => sheet.ownerNode?.hasAttribute("data-persist")).map(sheet => sheet.href),
  }))
  const homeLink = () => page.getByRole("link", { name: "Heavy Metal Certified home", exact: true })
  const bigEightLink = () => page.locator(".hmtc-home-actions").getByRole("link", { name: "The Big 8", exact: true })
  await page.goto(`${origin}/`)
  await bigEightLink().waitFor()
  const before = await state()

  // Relative ../index.css and ./index.css URLs must normalize to the same asset.
  await bigEightLink().click()
  await page.waitForURL(`${origin}/briefings/the-big-8`)
  assert.equal((await state()).id, before.id, "fresh-home to nested page must remain SPA")
  await homeLink().click()
  await page.waitForURL(`${origin}/`)
  assert.deepEqual(await state(), before, "same-release navigation must remain SPA")
  await bigEightLink().click()
  await page.waitForURL(`${origin}/briefings/the-big-8`)
  assert.deepEqual(await state(), before, "same-release nested navigation must remain SPA")

  release = "after"
  await homeLink().click()
  await page.waitForURL(`${origin}/`)
  await page.waitForFunction(() => window.__scriptRelease === "after")
  const after = await state()
  assert.notEqual(after.id, before.id, "new release must load a new document")
  assert.deepEqual(after.sheets, [`${origin}/index.after.css`])
  assert.equal(await page.locator(".hmtc-search-field").evaluate(el => getComputedStyle(el).minHeight), "58px")

  // Create two same-document history entries, then publish while the tab is on
  // the earlier entry. Forward must take the router's isBack/reload path.
  await bigEightLink().click()
  await page.waitForURL(`${origin}/briefings/the-big-8`)
  assert.equal((await state()).id, after.id)
  await page.goBack()
  await page.waitForURL(`${origin}/`)
  await bigEightLink().waitFor()
  const historyBefore = await state()
  const historyLength = await page.evaluate(() => history.length)
  release = "next"
  await page.goForward()
  await page.waitForURL(`${origin}/briefings/the-big-8`)
  await page.waitForFunction(() => window.__scriptRelease === "next")
  const next = await state()
  assert.notEqual(next.id, historyBefore.id, "history navigation across releases must reload")
  assert.deepEqual(next.sheets, [`${origin}/index.next.css`])
  assert.equal(await page.evaluate(() => history.length), historyLength, "reload must not add a history entry")
  await page.goBack()
  await page.waitForURL(`${origin}/`)
  await bigEightLink().waitFor()
  console.log("check-spa-release: OK — same-release SPA, cross-release document/CSS/JS refresh, and Back/Forward recovery")
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
