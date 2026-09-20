import test from "node:test"
import assert from "node:assert/strict"
import {
  absoluteHttpsAsset,
  DEFAULT_OG_HEIGHT,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_WIDTH,
  isLandscapeOg,
  pageCoverDims,
  pageCoverSrc,
} from "./documentCover"

test("pageCoverSrc uses socialImage and never pdf_cover", () => {
  assert.equal(
    pageCoverSrc({
      pdf_cover: "/static/manuals/covers/infant-and-child-foods-v3.png",
      socialImage: "/static/manuals/covers/infant-and-child-foods-v3-og.png",
    }),
    "/static/manuals/covers/infant-and-child-foods-v3-og.png",
  )
  assert.equal(
    pageCoverSrc({ pdf_cover: "/static/manuals/covers/infant-and-child-foods-v3.png" }),
    undefined,
  )
  assert.equal(pageCoverSrc({ socialImage: "" }), undefined)
  assert.equal(pageCoverSrc({}), undefined)
})

test("portrait dims are rejected for summary_large_image", () => {
  assert.equal(isLandscapeOg("1200", "630"), true)
  assert.equal(isLandscapeOg("1020", "1320"), false)
  assert.equal(isLandscapeOg(undefined, undefined), true)
  assert.deepEqual(pageCoverDims({ og_image_width: 1200, og_image_height: 630 }), {
    width: "1200",
    height: "630",
  })
  assert.equal(
    absoluteHttpsAsset("/static/manuals/covers/infant-and-child-foods-v3-og.png", "heavymetalcertified.com"),
    "https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3-og.png",
  )
  assert.equal(
    absoluteHttpsAsset(DEFAULT_OG_IMAGE, "heavymetalcertified.com"),
    "https://heavymetalcertified.com/static/og-image.png",
  )
  assert.equal(DEFAULT_OG_WIDTH, 1200)
  assert.equal(DEFAULT_OG_HEIGHT, 630)
})
