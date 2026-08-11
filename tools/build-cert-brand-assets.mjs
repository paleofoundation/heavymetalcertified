#!/usr/bin/env node
// Regenerates cert's own brand static assets so shared links and browser tabs
// carry the Heavy Metal Certified mark — not the Heavy Metal Index assets this
// repo inherited as a fork.
//
//   quartz/static/icon.png      512x512  — the red HMTc mark on white (favicon
//                                           source; the Favicon emitter downsizes
//                                           it to favicon.ico, and Head.tsx points
//                                           <link rel=icon> at it directly).
//   quartz/static/og-image.png  1200x630 — the default social card: white mark +
//                                           wordmark on the brand red, so an
//                                           unfurled link reads as HMTc.
//
// One-off / manual (NOT in the prebuild chain). Re-run after the mark or wordmark
// changes:  node tools/build-cert-brand-assets.mjs
//
// Deps already in the repo: sharp (raster), satori (text layout), and the site
// fonts under tools/pdf/fonts/. The mark comes from content/static/hmtc-mark-*.svg.

import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import path from "node:path"
import sharp from "sharp"
import satori from "satori"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const p = (...s) => path.join(ROOT, ...s)

const RED = "#9f2727"
const MARK_W = 1126
const MARK_H = 1314
const markAspect = MARK_W / MARK_H

async function loadFonts() {
  const f = (rel) => readFile(p("tools/pdf/fonts", rel))
  return [
    { name: "Lora", data: await f("Lora-Regular.ttf"), weight: 400, style: "normal" },
    { name: "Inter", data: await f("Inter-Regular.ttf"), weight: 400, style: "normal" },
    { name: "Inter", data: await f("Inter-SemiBold.ttf"), weight: 600, style: "normal" },
    { name: "IBM Plex Mono", data: await f("IBMPlexMono-Medium.ttf"), weight: 500, style: "normal" },
  ]
}

// ---- favicon source: red mark centered on a white square -------------------
async function buildIcon() {
  const size = 512
  const pad = 60
  const innerH = size - pad * 2
  const innerW = Math.round(innerH * markAspect)
  const markPng = await sharp(p("content/static/hmtc-mark-red.svg"))
    .resize({ width: innerW, height: innerH, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: markPng, gravity: "centre" }])
    .png()
    .toFile(p("quartz/static/icon.png"))
  console.log("wrote quartz/static/icon.png (512x512, red mark on white)")
}

// ---- default social card: white mark + wordmark on brand red ---------------
async function buildOgImage() {
  const W = 1200
  const H = 630
  // Rasterize the white mark at 2x display size for a crisp composite.
  const dispH = 400
  const dispW = Math.round(dispH * markAspect)
  const markPng = await sharp(p("content/static/hmtc-mark-white.svg"))
    .resize({ width: dispW * 2, height: dispH * 2, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const markDataUri = `data:image/png;base64,${markPng.toString("base64")}`

  const fonts = await loadFonts()
  const div = (style, children) => ({ type: "div", props: { style, children } })
  const text = (style, value) => ({ type: "div", props: { style, children: value } })

  const tree = div(
    {
      width: W,
      height: H,
      display: "flex",
      alignItems: "center",
      gap: 60,
      background: RED,
      padding: "0 84px",
      fontFamily: "Inter",
    },
    [
      { type: "img", props: { src: markDataUri, width: dispW, height: dispH, style: { flex: "0 0 auto" } } },
      div({ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minWidth: 0 }, [
        text(
          {
            fontFamily: "IBM Plex Mono",
            fontWeight: 500,
            fontSize: 21,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.72)",
            marginBottom: 18,
          },
          "Heavy Metal Tested & Certified",
        ),
        text(
          { fontFamily: "Lora", fontWeight: 400, fontSize: 60, lineHeight: 1.08, color: "#ffffff" },
          "Heavy Metal Certified",
        ),
        text(
          {
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: 27,
            lineHeight: 1.4,
            color: "rgba(255,255,255,0.92)",
            marginTop: 22,
            maxWidth: 560,
          },
          "Published heavy-metal standards — the strictest limit any government sets, in each product's native basis.",
        ),
        text(
          {
            fontFamily: "IBM Plex Mono",
            fontWeight: 500,
            fontSize: 20,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.7)",
            marginTop: 34,
          },
          "heavymetalcertified.com",
        ),
      ]),
    ],
  )

  const svg = await satori(tree, { width: W, height: H, fonts })
  await sharp(Buffer.from(svg)).png().toFile(p("quartz/static/og-image.png"))
  console.log("wrote quartz/static/og-image.png (1200x630, white mark on red)")
}

await buildIcon()
await buildOgImage()
console.log("done — cert brand assets regenerated")
