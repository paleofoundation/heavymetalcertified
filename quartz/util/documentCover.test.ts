import test from "node:test"
import assert from "node:assert/strict"
import {
  absoluteHttpsAsset,
  DEFAULT_OG_HEIGHT,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_WIDTH,
  pageCoverDims,
  pageCoverSrc,
} from "./documentCover"

test("pageCoverSrc prefers pdf_cover over socialImage", () => {
  assert.equal(
    pageCoverSrc({
      pdf_cover: "/static/manuals/covers/infant-and-child-foods-v3.png",
      socialImage: "/static/og-image.png",
    }),
    "/static/manuals/covers/infant-and-child-foods-v3.png",
  )
  assert.equal(pageCoverSrc({ socialImage: "/static/og-image.png" }), "/static/og-image.png")
  assert.equal(pageCoverSrc({ pdf_cover: null, socialImage: "" }), undefined)
  assert.equal(pageCoverSrc({}), undefined)
})

test("cover pages get absolute HTTPS OG URL; others keep the generic card", () => {
  const cover = pageCoverSrc({ pdf_cover: "/static/manuals/covers/infant-and-child-foods-v3.png" })
  assert.equal(
    absoluteHttpsAsset(cover!, "heavymetalcertified.com"),
    "https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3.png",
  )
  assert.equal(
    absoluteHttpsAsset(DEFAULT_OG_IMAGE, "heavymetalcertified.com"),
    "https://heavymetalcertified.com/static/og-image.png",
  )
  assert.deepEqual(pageCoverDims({ og_image_width: 1020, og_image_height: 1320 }), {
    width: "1020",
    height: "1320",
  })
  assert.equal(DEFAULT_OG_WIDTH, 1200)
  assert.equal(DEFAULT_OG_HEIGHT, 630)
})
