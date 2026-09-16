import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const root = fileURLToPath(new URL("../../", import.meta.url))
test("real HMTc emit adapter retains explicit coauthors and uses the relational template", async (t) => {
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "hmtc-mint-adapter-"))
  t.after(() => fs.rm(cwd, { recursive: true, force: true }))
  await fs.mkdir(path.join(cwd, "data"))
  for (const name of ["researcher-identity.json", "datacite-creator.json"]) await fs.copyFile(path.join(root, "data", name), path.join(cwd, "data", name))
  await fs.mkdir(path.join(cwd, "content/articles"), { recursive: true })
  await fs.writeFile(path.join(cwd, "content/articles/coauthors.md"), `---\ntitle: Fixture article\npublished: 2024-02-29\ndate: 2022-01-01\nupdated: 2026-01-01\nscholar_eligible: true\nauthors:\n  - name: "Garcia, Sofia"\n    nameType: Personal\n  - Karen Pendergrass\n---\nFixture.\n`)
  await fs.writeFile(path.join(cwd, "content/articles/undated.md"), `---\ntitle: Undated fixture\npublished: "2024-02-31"\nupdated: 2026-01-01\nscholar_eligible: true\n---\nFixture.\n`)
  const result = spawnSync(process.execPath, [path.join(root, "tools/mint-dois.mjs"), "--emit", "--types=articles"], {
    cwd, encoding: "utf8", env: { PATH: process.env.PATH, DATACITE_PREFIX: "10.99999", DATACITE_MODE: "test" },
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  const folder = path.join(cwd, "tools/.doi-deposit")
  const payload = JSON.parse(await fs.readFile(path.join(folder, "articles.coauthors.json"), "utf8"))
  assert.equal(payload.data.attributes.publicationYear, 2024)
  assert.deepEqual(payload.data.attributes.types, { resourceTypeGeneral: "Report", resourceType: "Research analysis" })
  const undated = JSON.parse(await fs.readFile(path.join(folder, "articles.undated.json"), "utf8"))
  assert.equal(Object.hasOwn(undated.data.attributes, "publicationYear"), false)
  assert.match(result.stdout, /publicationYear \(no valid published/)
  const creators = payload.data.attributes.creators
  assert.equal(creators.length, 2)
  assert.equal(creators[0].name, "Garcia, Sofia")
  assert.equal(creators[1].nameIdentifiers[0].nameIdentifier, "https://orcid.org/0000-0002-2348-7259")
  assert.deepEqual(creators[1].affiliation, [{ name: "Institute of Contaminant Standards" }, { name: "The Paleo Foundation" }])
})
