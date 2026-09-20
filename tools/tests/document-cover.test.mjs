import test from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"
import {
  absoluteHttpsAsset,
  coverRelatedIdentifier,
  DEFAULT_OG_IMAGE,
  mergeCoverRelatedIdentifiers,
  resolveCover,
} from "../lib/document-cover.mjs"

const root = fileURLToPath(new URL("../../", import.meta.url))

test("Cat-1 manual cover resolves to the committed v3 PNG with dimensions", () => {
  const cover = resolveCover({ typeName: "manuals", slug: "infant-and-child-foods", repo: root })
  assert.ok(cover)
  assert.equal(cover.rel, "/static/manuals/covers/infant-and-child-foods-v3.png")
  assert.equal(cover.url, "https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3.png")
  assert.equal(cover.width, 1020)
  assert.equal(cover.height, 1320)
})

test("HasPart Image relatedIdentifier is DataCite-shaped; fallback pages have none", () => {
  const cover = resolveCover({ typeName: "manuals", slug: "infant-and-child-foods", repo: root })
  const id = coverRelatedIdentifier(cover)
  assert.deepEqual(id, {
    relatedIdentifier: "https://heavymetalcertified.com/static/manuals/covers/infant-and-child-foods-v3.png",
    relatedIdentifierType: "URL",
    relationType: "HasPart",
    resourceTypeGeneral: "Image",
  })
  assert.equal(resolveCover({ typeName: "manuals", slug: "seafood", repo: root }), null)
  assert.equal(resolveCover({ typeName: "standards", slug: "olive-oil", repo: root }), null)
  assert.equal(absoluteHttpsAsset(DEFAULT_OG_IMAGE), "https://heavymetalcertified.com/static/og-image.png")
})

test("mergeCoverRelatedIdentifiers is idempotent", () => {
  const id = coverRelatedIdentifier(resolveCover({ typeName: "manuals", slug: "pet-foods", repo: root }))
  const once = mergeCoverRelatedIdentifiers([{ relatedIdentifier: "10.1/x", relatedIdentifierType: "DOI", relationType: "References" }], id)
  const twice = mergeCoverRelatedIdentifiers(once, id)
  assert.equal(twice.filter((r) => r.resourceTypeGeneral === "Image").length, 1)
  assert.equal(twice.length, 2)
})

test("mint dry-run for infant-and-child-foods prints HasPart URL Image cover", () => {
  const result = spawnSync(process.execPath, [path.join(root, "tools/mint-dois.mjs"), "--types=manuals", "--slug=infant-and-child-foods"], {
    cwd: root,
    encoding: "utf8",
    env: { PATH: process.env.PATH, DATACITE_MODE: "test" },
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /DRY-RUN/)
  assert.match(result.stdout, /manuals\/infant-and-child-foods: HasPart URL Image https:\/\/heavymetalcertified\.com\/static\/manuals\/covers\/infant-and-child-foods-v3\.png/)
  assert.doesNotMatch(result.stdout, /LIVE/)
})

test("mint dry-run for a manual without a cover has no Image relatedIdentifier", () => {
  const result = spawnSync(process.execPath, [path.join(root, "tools/mint-dois.mjs"), "--types=manuals", "--slug=seafood"], {
    cwd: root,
    encoding: "utf8",
    env: { PATH: process.env.PATH, DATACITE_MODE: "test" },
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /manuals\/seafood: \(none\)/)
})

test("update-covers dry-run for olive-oil does not invent a DOI or an Image URL", () => {
  const result = spawnSync(process.execPath, [path.join(root, "tools/mint-dois.mjs"), "--update-covers", "--types=standards", "--slug=olive-oil"], {
    cwd: root,
    encoding: "utf8",
    env: { PATH: process.env.PATH, DATACITE_MODE: "test" },
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.match(result.stdout, /already-deposited/)
  assert.match(result.stdout, /olive-oil: no cover asset/)
  assert.doesNotMatch(result.stdout, /10\.83138\/hmtc\.std\.30\.olive-oil.*HasPart/)
})
