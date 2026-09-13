import test from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import vm from "node:vm"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { transformSync } from "esbuild"
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const ctx = JSON.parse(fs.readFileSync(path.join(root, "content/static/data/standards-finder-context.json"), "utf8"))
const exported = JSON.parse(fs.readFileSync(path.join(root, "content/static/data/standards.json"), "utf8"))
const script = fs.readFileSync(path.join(root, "quartz/components/scripts/standardsFinder.inline.ts"), "utf8")
const js = transformSync(script + "\nglobalThis.finderTest = {finderLimit, marketBlock};", {loader:"ts",format:"cjs"}).code
const sandbox = { exports:{}, module:{exports:{}}, document:{addEventListener(){}}, queueMicrotask(){} }
vm.runInNewContext(js,sandbox)
const {finderLimit,marketBlock}=sandbox.finderTest

test("every finder cell retains source values, units, conditions, status and forms", () => {
  for (const p of ctx.products) {
    const original=exported.standards.find((r)=>r.product_slug===p.slug)
    for (const v of p.variants) for (const cell of v.analytes) {
      const source=original.variants[v.key].analytes[cell.code]
      assert.equal(cell.value_record,source.value_record??source.value_ppb??null)
      assert.equal(cell.value_unit,source.unit||null)
      assert.equal(cell.status,source.status)
      assert.equal(cell.forms?.length||0,source.forms?.length||0)
      if(cell.limit_ppb==null)assert.equal(cell.per_market,undefined)
      assert.ok(finderLimit(cell).length>0)
    }
  }
})
test("non-ppb source unit renders; unknown units never get an invented label",()=>{
  assert.match(finderLimit({status:"published",limit_ppb:null,value_record:2,value_unit:"ug/dm2"}),/2 ug\/dm2/)
  const unknown=finderLimit({status:"published",limit_ppb:null,value_record:90000,value_unit:null,source_native_basis:"expressed as mg/kg"})
  assert.match(unknown,/See standard for basis/)
  assert.doesNotMatch(unknown,/90000 mg|compiled normalized/)
})
test("precautionary, subsumed and screen numbers remain visible with their labels",()=>{
  for (const status of ["precautionary","subsumed","screen"]) {
    const html=finderLimit({status,limit_ppb:15,value_record:15,value_unit:"ug/kg"})
    assert.match(html,/15 ppb/)
    assert.match(html,/precautionary ceiling|bounded by parent total|screening value/)
  }
})
test("form split renders each form separately and cannot use a summary scalar",()=>{
  const html=finderLimit({status:"published",limit_ppb:999,value_record:999,forms:[{form:"A",limit_ppb:10},{form:"B",limit_ppb:30}]})
  assert.match(html,/A<\/span><br>10 ppb.*B<\/span><br>30 ppb/)
  assert.doesNotMatch(html,/999/)
})
test("market comparison never compares a non-ppb source quantity",()=>{
  const html=marketBlock({market:"US",context:{markets:[{code:"US",label:"United States"}]}},{analytes:[{status:"published",is_firm:true,limit_ppb:null,value_record:10,value_unit:"ug/day",per_market:{US:100}}]})
  assert.doesNotMatch(html,/stricter than|matches the.*every listed/)
})
