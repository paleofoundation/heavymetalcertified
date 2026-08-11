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
    { name: "Lora", data: await f("Lora-Bold.ttf"), weight: 700, style: "normal" },
    { name: "Inter", data: await f("Inter-Regular.ttf"), weight: 400, style: "normal" },
    { name: "Inter", data: await f("Inter-SemiBold.ttf"), weight: 600, style: "normal" },
    { name: "IBM Plex Mono", data: await f("IBMPlexMono-Medium.ttf"), weight: 500, style: "normal" },
  ]
}

const div = (style, children) => ({ type: "div", props: { style, children } })
const text = (style, value) => ({ type: "div", props: { style, children: value } })

// The mark SVG ships as white linework on a #7f1f1f plaque; strip the plaque so
// only the white linework renders (subtle logo directly on the card, no dark box).
async function whiteMarkNoPlaque() {
  const raw = await readFile(p("content/static/hmtc-mark-white.svg"), "utf8")
  return raw.replace(/fill="#7f1f1f"/g, 'fill="none"')
}

// ---- favicon: white ampersand on the brand red (legible at 16-48px) --------
async function buildIcon() {
  const size = 512
  const fonts = await loadFonts()
  const tree = div(
    {
      width: size,
      height: size,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: RED,
      borderRadius: 104,
    },
    text(
      { fontFamily: "Lora", fontWeight: 700, fontSize: 380, color: "#ffffff", lineHeight: 1, marginTop: -18 },
      "&",
    ),
  )
  const svg = await satori(tree, { width: size, height: size, fonts })
  await sharp(Buffer.from(svg)).png().toFile(p("quartz/static/icon.png"))
  console.log("wrote quartz/static/icon.png (512x512, white ampersand on red)")
}

// ---- default social card: content-forward, subtle mark, no plaque ----------
async function buildOgImage() {
  const W = 1200
  const H = 630
  // Small, subtle white mark (plaque removed) as a letterhead — the wordmark and
  // tagline carry the card, not the logo.
  const markH = 66
  const markW = Math.round(markH * markAspect)
  const markPng = await sharp(Buffer.from(await whiteMarkNoPlaque()))
    .resize({ width: markW * 3, height: markH * 3, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()
  const markDataUri = `data:image/png;base64,${markPng.toString("base64")}`

  const fonts = await loadFonts()

  const tree = div(
    {
      width: W,
      height: H,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      background: RED,
      padding: "0 92px",
      fontFamily: "Inter",
    },
    [
      { type: "img", props: { src: markDataUri, width: markW, height: markH, style: { marginBottom: 40 } } },
      text(
        { fontFamily: "Lora", fontWeight: 400, fontSize: 82, lineHeight: 1.03, color: "#ffffff" },
        "Heavy Metal Certified",
      ),
      text(
        {
          fontFamily: "Inter",
          fontWeight: 400,
          fontSize: 31,
          lineHeight: 1.4,
          color: "rgba(255,255,255,0.9)",
          marginTop: 26,
          maxWidth: 900,
        },
        "The strictest heavy-metal limit any government sets — published per subcategory, in each product's native basis.",
      ),
      div(
        {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginTop: 52,
          paddingTop: 26,
          borderTop: "1px solid rgba(255,255,255,0.22)",
          fontFamily: "IBM Plex Mono",
          fontWeight: 500,
          fontSize: 20,
          letterSpacing: 1,
        },
        [
          text({ color: "rgba(255,255,255,0.82)" }, "heavymetalcertified.com"),
          text({ color: "rgba(255,255,255,0.55)" }, "Institute of Contaminant Standards"),
        ],
      ),
    ],
  )

  const svg = await satori(tree, { width: W, height: H, fonts })
  await sharp(Buffer.from(svg)).png().toFile(p("quartz/static/og-image.png"))
  console.log("wrote quartz/static/og-image.png (1200x630, content-forward, subtle mark)")
}

await buildIcon()
await buildOgImage()
console.log("done — cert brand assets regenerated")
