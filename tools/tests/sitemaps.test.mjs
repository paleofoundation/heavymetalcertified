import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

import {
  collectIndexable,
  escapeXml,
  isWellFormedSitemap,
  urlsetXml,
  validateDeclaredSitemaps,
  writeSitemaps,
  xmlLocations,
} from "../lib/sitemaps.mjs"

function tmpPublic() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "hmtc-sitemaps-"))
}

function writePage(dir, rel, { title, canonical, robots = "index, follow", citation } = {}) {
  const file = path.join(dir, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  const cite = citation
    ? `<meta name="citation_title" content="${citation}"/>`
    : ""
  fs.writeFileSync(
    file,
    `<html><head><title>${title}</title><link rel="canonical" href="${canonical}"/><meta name="robots" content="${robots}"/>${cite}</head></html>`,
    "utf8",
  )
}

test("urlsetXml emits a prolog and escapes locs", () => {
  const xml = urlsetXml([
    "https://heavymetalcertified.com/a&b",
    "https://heavymetalcertified.com/",
  ])
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/)
  assert.match(xml, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/)
  assert.ok(xml.includes("https://heavymetalcertified.com/a&amp;b"))
  assert.deepEqual(xmlLocations(xml), [
    "https://heavymetalcertified.com/",
    "https://heavymetalcertified.com/a&b",
  ])
})

test("isWellFormedSitemap rejects a Quartz-style sitemap with no prolog", () => {
  const quartz = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://heavymetalcertified.com/</loc></url></urlset>`
  assert.equal(isWellFormedSitemap(quartz), false)
  assert.equal(isWellFormedSitemap(urlsetXml(["https://heavymetalcertified.com/"])), true)
})

test("isWellFormedSitemap rejects empty or off-origin loc sets", () => {
  assert.equal(isWellFormedSitemap(urlsetXml([])), false)
  const bad = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>https://example.com/</loc></url>\n</urlset>\n`
  assert.equal(isWellFormedSitemap(bad), false)
})

test("collectIndexable keeps standards in the main sitemap and out of scholarly", () => {
  const dir = tmpPublic()
  writePage(dir, "index.html", {
    title: "Home",
    canonical: "https://heavymetalcertified.com/",
  })
  writePage(dir, "standards/bone-broth.html", {
    title: "Bone broth",
    canonical: "https://heavymetalcertified.com/standards/bone-broth",
    citation: "Bone broth",
  })
  writePage(dir, "articles/lead-and-cadmium-in-dark-chocolate.html", {
    title: "Chocolate",
    canonical: "https://heavymetalcertified.com/articles/lead-and-cadmium-in-dark-chocolate",
    citation: "Lead and Cadmium in Dark Chocolate",
  })
  writePage(dir, "portal.html", {
    title: "Portal",
    canonical: "https://heavymetalcertified.com/portal",
    robots: "noindex, nofollow",
  })
  const { indexable, scholarly } = collectIndexable(dir)
  assert.deepEqual(indexable, [
    "https://heavymetalcertified.com/",
    "https://heavymetalcertified.com/articles/lead-and-cadmium-in-dark-chocolate",
    "https://heavymetalcertified.com/standards/bone-broth",
  ])
  assert.deepEqual(scholarly, [
    "https://heavymetalcertified.com/articles/lead-and-cadmium-in-dark-chocolate",
  ])
})

test("writeSitemaps fails loud when the corpus is too small to be a real deploy", () => {
  const dir = tmpPublic()
  writePage(dir, "index.html", {
    title: "Home",
    canonical: "https://heavymetalcertified.com/",
  })
  assert.throws(() => writeSitemaps(dir), /invalid declared sitemap/)
})

test("validateDeclaredSitemaps requires robots to advertise both files", () => {
  const dir = tmpPublic()
  writePage(dir, "index.html", {
    title: "Home",
    canonical: "https://heavymetalcertified.com/",
  })
  fs.writeFileSync(
    path.join(dir, "sitemap.xml"),
    urlsetXml(["https://heavymetalcertified.com/"]),
    "utf8",
  )
  fs.writeFileSync(
    path.join(dir, "sitemap-scholarly.xml"),
    urlsetXml(["https://heavymetalcertified.com/articles/x"]),
    "utf8",
  )
  fs.writeFileSync(path.join(dir, "robots.txt"), "User-agent: *\nAllow: /\n", "utf8")
  const errors = validateDeclaredSitemaps(dir, { minMain: 1, minScholarly: 1 })
  assert.ok(errors.some((e) => e.includes("robots.txt: missing")))
})

test("escapeXml is the only encoding applied to loc text", () => {
  assert.equal(escapeXml(`a&b<c>"d`), "a&amp;b&lt;c&gt;&quot;d")
})
