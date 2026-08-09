#!/usr/bin/env node
// tools/audit-layout-liveness.mjs
//
// Catches the recurring "mounted-but-empty" Quartz failure: a component is added
// to quartz.layout.ts (or rendered directly by renderPage.tsx) but the data
// source / generator output / inline script it needs did NOT come with it, so it
// renders empty or ships no working behaviour — and NO build error fires.
//
// Confirmed instances this codifies (both repos):
//   • CiteThisPage registered but rendered nowhere (index, findings F-05) — an
//     orphan; caught by audit-component-redundancy R1 there. In cert it IS
//     mounted but its slug allowlist omits analytes/standards/briefings, so it
//     returns null on the bulk of the corpus (L4 below).
//   • cert mega-menu disclosure JS "never shipped": `import topNavScript` was
//     absent / `afterDOMLoaded` overwritten, so the imported script was never
//     wired to a lifecycle slot and got tree-shaken out — un-shipped site-wide
//     (L1 UNWIRED / MISSING).
//   • cert RelatedPages / DedicatedPages render empty: they consume the in-memory
//     link graph, and the corpus carried 0 [[wikilinks]] + 0 cross-link anchors,
//     so groups.length===0 → return null (L3 EMPTY_LINK_GRAPH).
//
// WHY STATIC, NOT RENDER: Quartz's ComponentResources emitter
// (quartz/plugins/emitters/componentResources.ts) collects a component's
// .css/.before/.afterDOMLoaded by COMPONENT IDENTITY, deduped globally, the
// moment the component sits in a layout slot — regardless of whether its render
// ever produces DOM. So a mounted component that returns null on every page
// STILL ships its assets: "mounted but empty" throws neither a build error nor a
// missing-asset error. Asset-presence and render-emptiness are ORTHOGONAL axes.
// The checks that actually target the failure are the data/graph/gate checks
// (L2–L4), asset-WIRING (L1), and a coverage gate (L5).
//
// A render-based check WAS prototyped (esbuild-bundle each component + stub its
// .inline/.scss imports + preact-render-to-string against sample pages). It is
// low-signal: with SYNTHESISED props it cannot tell "component broken" from
// "props too thin" — it false-flags Body (needs the real content tree), MegaMenu
// (named export, needs generated navPanels) and Head (transitively imports the
// native `sharp` module, which will not bundle). A HIGH-signal render check would
// have to feed the REAL parsed content tree + link graph, i.e. hook Quartz's
// build — the "full build" cost this lint is meant to avoid. It is left as future
// work (see OI ledger). The static graph/gate/data checks already catch the
// "renders empty on real pages" class by inspecting the actual corpus.
//
// Repo-agnostic: run from a repo root. Auto-detects the content dir (wiki/ for
// heavy-metal-index, content/ for heavymetalcertified). The SAME file drops into
// both tools/ dirs.
//
// Usage:
//   node tools/audit-layout-liveness.mjs [--warn-only] [--json] [--update-baseline]
//
//   --warn-only        exit 0 even with findings (prebuild default while draining)
//   --json             machine-readable output
//   --update-baseline  re-accept the current findings into the baseline ratchet
//
// Exit 1 (unless --warn-only) when a NEW finding appears beyond the accepted
// baseline — same ratchet as audit-component-redundancy / contamination-integrity.

import { readFileSync, existsSync, readdirSync, statSync, writeFileSync } from "node:fs"
import { join, dirname, basename, relative } from "node:path"
import { execFileSync } from "node:child_process"

const ROOT = process.cwd()
const args = process.argv.slice(2)
const warnOnly = args.includes("--warn-only")
const asJson = args.includes("--json")
const updateBaseline = args.includes("--update-baseline")

// ── repo config (auto-detected) ────────────────────────────────────────────
const COMPONENTS_DIR = join(ROOT, "quartz/components")
const LAYOUT_FILE = join(ROOT, "quartz.layout.ts")
const RENDERPAGE_FILE = join(ROOT, "quartz/components/renderPage.tsx")
const GENERATED_DIR = join(ROOT, "quartz/components/generated")
const CONTENT_DIR = existsSync(join(ROOT, "wiki"))
  ? join(ROOT, "wiki")
  : existsSync(join(ROOT, "content"))
    ? join(ROOT, "content")
    : null
const STATIC_DIR = CONTENT_DIR ? join(CONTENT_DIR, "static") : null
const BASELINE = join(ROOT, "tools/layout-liveness-baseline.json")

if (!existsSync(LAYOUT_FILE) || !existsSync(COMPONENTS_DIR)) {
  console.error("audit-layout-liveness: not a Quartz repo root (no quartz.layout.ts / quartz/components). cwd=" + ROOT)
  process.exit(2)
}

const findings = [] // { code, component, detail, severity }
const add = (code, component, detail, severity = "error") =>
  findings.push({ code, component, detail, severity })

// ── helpers ────────────────────────────────────────────────────────────────
const read = (p) => {
  try {
    return readFileSync(p, "utf8")
  } catch {
    return null
  }
}
const nonEmpty = (p) => {
  const s = read(p)
  return s != null && s.replace(/\s+/g, "").length > 0
}
const componentFile = (name) => {
  for (const p of [join(COMPONENTS_DIR, `${name}.tsx`), join(COMPONENTS_DIR, `pages/${name}.tsx`)]) {
    if (existsSync(p)) return p
  }
  return null
}

// Resolve an import specifier like "./scripts/foo.inline" or "./styles/foo.scss"
// (relative to a component file) to an on-disk path, trying the loader-implied
// extensions Quartz uses.
const resolveImport = (fromFile, spec) => {
  const baseDir = dirname(fromFile)
  const candidates = []
  if (/\.scss$/.test(spec)) candidates.push(join(baseDir, spec))
  else if (/\.inline$/.test(spec)) candidates.push(join(baseDir, spec + ".ts"), join(baseDir, spec + ".js"))
  else candidates.push(join(baseDir, spec), join(baseDir, spec + ".ts"), join(baseDir, spec + ".tsx"))
  return candidates.find(existsSync) || candidates[0]
}

// Cheap corpus grep via git-grep/grep; returns count of MATCHING FILES. Never
// throws (grep exits 1 on no match).
const grepFileCount = (pattern) => {
  if (!CONTENT_DIR) return 0
  try {
    const out = execFileSync("grep", ["-rlE", "--include=*.md", pattern, CONTENT_DIR], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    })
    return out.split("\n").filter(Boolean).length
  } catch {
    return 0 // exit 1 = no matches
  }
}

// ── enumerate the content corpus by slug (free — from filenames only) ────────
const corpusSlugs = []
if (CONTENT_DIR) {
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      if (name.startsWith(".")) continue
      const p = join(dir, name)
      const st = statSync(p)
      if (st.isDirectory()) {
        if (name === "static" || name === "assets") continue
        walk(p)
      } else if (name.endsWith(".md")) {
        corpusSlugs.push(relative(CONTENT_DIR, p).replace(/\.md$/, ""))
      }
    }
  }
  walk(CONTENT_DIR)
}
const totalPages = corpusSlugs.length

// ── 1. resolve the ACTIVE component set ──────────────────────────────────────
// (a) everything mounted in quartz.layout.ts, (b) everything renderPage.tsx
// instantiates directly (bypasses getQuartzComponents — its own hazard class),
// (c) sibling components those compose transitively.
const layoutSrc = read(LAYOUT_FILE) || ""
const active = new Map() // name -> { name, origin:Set, wrappedBy?, wraps? }
const markActive = (name, origin) => {
  if (!active.has(name)) active.set(name, { name, origin: new Set() })
  active.get(name).origin.add(origin)
}

// (a) layout slots: capture every Component.X, and record wrapper→child nesting
//     for the Component.W(Component.C()) shape.
for (const m of layoutSrc.matchAll(/Component\.(\w+)\s*\(\s*Component\.(\w+)\s*\(/g)) {
  markActive(m[1], "layout-wrapper")
  markActive(m[2], "layout-wrapped")
  active.get(m[1]).wraps = m[2]
  active.get(m[2]).wrappedBy = m[1]
}
for (const m of layoutSrc.matchAll(/Component\.(\w+)\b/g)) markActive(m[1], "layout")

// (b) renderPage-direct: `import XConstructor from "./X"` then `<X ` / `XConstructor()`
const renderPageSrc = read(RENDERPAGE_FILE) || ""
for (const m of renderPageSrc.matchAll(/import\s+(\w+)\s+from\s+["']\.\/(\w+)["']/g)) {
  const local = m[1]
  const comp = m[2]
  if (!componentFile(comp)) continue
  // Only count it if it is actually rendered as JSX or called as a ctor here.
  if (new RegExp(`<${comp}\\b`).test(renderPageSrc) || new RegExp(`\\b${local}\\s*\\(`).test(renderPageSrc)) {
    markActive(comp, "renderPage-direct")
  }
}

// (c) transitive composition (one hop is enough in practice): a component that
//     imports a sibling component AND renders it as JSX / Component.X.
const addTransitive = () => {
  let grew = true
  let hops = 0
  while (grew && hops < 3) {
    grew = false
    hops++
    for (const name of [...active.keys()]) {
      const f = componentFile(name)
      if (!f) continue
      const src = read(f) || ""
      const imported = new Set()
      for (const im of src.matchAll(/import\s+(?:\{([^}]*)\}|(\w+))\s+from\s+["']\.\/(\w+)["']/g)) {
        const named = (im[1] || "").split(",").map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean)
        const dflt = im[2]
        const mod = im[3]
        for (const n of [...named, dflt].filter(Boolean)) {
          if (componentFile(mod)) imported.add(n === mod ? n : mod === n ? n : n) // keep the module name
          if (componentFile(mod)) imported.add(mod)
        }
      }
      for (const mod of imported) {
        if (!componentFile(mod)) continue
        if (new RegExp(`<${mod}\\b`).test(src) || new RegExp(`Component\\.${mod}\\b`).test(src)) {
          if (!active.has(mod)) {
            markActive(mod, "transitive")
            grew = true
          } else {
            active.get(mod).origin.add("transitive")
          }
        }
      }
    }
  }
}
addTransitive()

// Extract the MAIN QuartzComponent function body/bodies (brace-matched), so gate
// detection ignores `return null`s that live in private sub-helpers (e.g. Head's
// CitationMetadata, Snav's Apparatus). Allowlist LITERALS are still read from the
// whole file (arrays like PUBLIC_PREFIXES live at module scope). Falls back to the
// whole source when no typed component is found (e.g. `export function MegaMenu`).
const extractMainBody = (src) => {
  const bodies = []
  const re = /:\s*QuartzComponent\b[^=]*=\s*(?:async\s*)?\([^)]*\)\s*=>\s*/g
  let m
  while ((m = re.exec(src))) {
    const i = re.lastIndex
    if (src[i] === "{") {
      let depth = 0
      for (let j = i; j < src.length; j++) {
        if (src[j] === "{") depth++
        else if (src[j] === "}" && --depth === 0) {
          bodies.push(src.slice(i, j + 1))
          break
        }
      }
    } else {
      bodies.push(src.slice(i, i + 800)) // expression-bodied arrow (ternary/null)
    }
  }
  return bodies.length ? bodies.join("\n") : src
}

// ── 2. analyse each active component ─────────────────────────────────────────
const analyses = new Map()
for (const [name, meta] of active) {
  const file = componentFile(name)
  if (!file) {
    add("MISSING_COMPONENT", name, `mounted in ${[...meta.origin].join("/")} but quartz/components/${name}.tsx does not exist`)
    continue
  }
  const src = read(file)

  // inline/scss imports the component declares
  const assets = []
  for (const m of src.matchAll(/import\s+(\w+)\s+from\s+["'](\.\/(?:scripts|styles)\/[^"']+)["']/g)) {
    const [, varName, spec] = m
    if (!/\.(inline|scss)$/.test(spec) && !/\.inline\.(scss|ts|js)$/.test(spec)) continue
    const path = resolveImport(file, spec)
    // is the imported var referenced anywhere ELSE (wired into a lifecycle slot,
    // concatenateResources, a template ${var}, or an array)?
    const wired = new RegExp(`\\b${varName}\\b`, "g")
    const refs = (src.match(wired) || []).length
    assets.push({ varName, spec, path, exists: existsSync(path), nonEmpty: nonEmpty(path), wired: refs > 1 })
  }

  // classification.
  //   wrapper  — forwards a child's lifecycle asset from a variable via optional
  //              chaining, the DesktopOnly/MobileOnly signature
  //              (`.afterDOMLoaded = component?.afterDOMLoaded`). This is the
  //              distinctive shape; "ctor takes a param" is NOT sufficient
  //              because most components take an `opts` param.
  //   headless — no JSX render path anywhere and returns null (Corrections).
  //   visible  — has a JSX render path.
  const hasJsxReturn = /return\s*\(\s*</.test(src) || /return\s*</.test(src) || /=>\s*</.test(src)
  const isWrapper = /\.(?:afterDOMLoaded|beforeDOMLoaded|css)\s*=\s*\w+\?\.(?:afterDOMLoaded|beforeDOMLoaded|css)/.test(src)
  const returnsOnlyNull =
    (/=>\s*null\b/.test(src) || /return\s+null/.test(src)) && !hasJsxReturn
  const kind = isWrapper ? "wrapper" : returnsOnlyNull ? "headless" : hasJsxReturn ? "visible" : "unknown"

  // data inputs: generated modules + readFileSync + fetch("/static/*.json") in
  // the component AND in the inline scripts it ships.
  const dataInputs = []
  const seenData = new Set()
  const pushData = (rec) => {
    const dkey = rec.path || rec.ref
    if (seenData.has(dkey)) return
    seenData.add(dkey)
    dataInputs.push(rec)
  }
  const scanForData = (text, srcLabel) => {
    for (const m of text.matchAll(/from\s+["']\.\/generated\/(\w+)["']/g)) {
      pushData({ kind: "generated-module", ref: `generated/${m[1]}`, path: join(GENERATED_DIR, `${m[1]}.ts`), from: srcLabel })
    }
    for (const m of text.matchAll(/fetch\(\s*["'`]([^"'`]*\/static\/[^"'`]+\.json)[^"'`]*["'`]/g)) {
      pushData({ kind: "static-fetch", ref: m[1], path: staticJsonPath(m[1]), from: srcLabel })
    }
    for (const m of text.matchAll(/["'`]([\w./-]*static\/[\w./-]+\.json)["'`]/g)) {
      pushData({ kind: "static-ref", ref: m[1], path: staticJsonPath(m[1]), from: srcLabel })
    }
  }
  scanForData(src, name)
  for (const a of assets) {
    if (/\.inline/.test(a.spec) && a.exists) scanForData(read(a.path) || "", a.varName)
  }

  // link-graph consumer?
  const linkGraphConsumer =
    /fileData\.links/.test(src) ||
    /relatedByCategory|relatedGraph/.test(src) ||
    (/allFiles/.test(src) && /\.links\b/.test(src))

  // self-gate allowlist (best-effort, slug/type-specific to avoid false hits).
  // A component is "gated" when its MAIN body has a slug/type-guarded early
  // `return null` AND we can read a slug-prefix / exact-slug / type allowlist
  // (from the whole file). Basing the null-return + guard on the main body (not
  // the whole file) prevents sub-helper null returns (Head, Snav) from being
  // read as component gates. If we can't read a gate, we stay silent.
  const mainBody = extractMainBody(src)
  const bodyGuardedNull =
    (/return\s+null/.test(mainBody) || /\?\s*[^:{}]*:\s*null\b/.test(mainBody)) &&
    (/\bslug\w*\s*\.\s*startsWith\s*\(/.test(mainBody) ||
      /(?:frontmatter\.)?type\s*[!=]==?\s*["'`]/.test(mainBody) ||
      /!\s*\w*[Cc]itable\w*\s*\(/.test(mainBody) ||
      /\b(?:isPublic|isCitable|shouldRender|canRender)\w*\s*\(/.test(mainBody) ||
      /\.some\([^)]*startsWith/.test(mainBody))
  const usesSlugStartsWith = /\bslug\w*\s*\.\s*startsWith\s*\(/.test(src) || /\.startsWith\(\s*\w+\s*\)/.test(src)
  const prefixes = new Set()
  const exactSlugs = new Set()
  // direct `slug.startsWith("literal")`
  for (const m of src.matchAll(/\bslug\w*\s*\.\s*startsWith\(\s*["'`]([^"'`]+)["'`]/g)) prefixes.add(m[1])
  // named allowlist arrays: PREFIX* → slug prefixes, EXACT* → exact slugs
  for (const m of src.matchAll(/\b(\w*(?:PREFIX|EXACT|PUBLIC|ALLOW|CITABLE|WHITELIST)\w*)\s*(?::[^=]*)?=\s*\[([^\]]*)\]/gi)) {
    const nm = m[1]
    const lits = [...m[2].matchAll(/["'`]([^"'`]+)["'`]/g)].map((x) => x[1])
    if (/EXACT/i.test(nm)) lits.forEach((l) => exactSlugs.add(l))
    else if (usesSlugStartsWith) lits.forEach((l) => prefixes.add(l))
    else lits.forEach((l) => exactSlugs.add(l))
  }
  const types = new Set()
  for (const m of src.matchAll(/(?:frontmatter\.)?type\s*[!=]==?\s*["'`]([^"'`]+)["'`]/g)) types.add(m[1])
  const gated = bodyGuardedNull && (prefixes.size > 0 || exactSlugs.size > 0 || types.size > 0)

  const wiredAssets = assets.filter((x) => x.exists && x.nonEmpty && x.wired).map((x) => x.spec)
  analyses.set(name, { name, file, kind, assets, wiredAssets, dataInputs, linkGraphConsumer, gated, prefixes, exactSlugs, types, wrappedBy: meta.wraps, wrappedByParent: meta.wrappedBy, origin: meta.origin })
}

function staticJsonPath(ref) {
  // Normalise "/static/x.json", "static/x.json", "../static/x.json" → <static>/x.json
  const m = ref.match(/static\/(.+\.json)$/)
  if (!m || !STATIC_DIR) return null
  return join(STATIC_DIR, m[1])
}

// ── L1. asset wiring & integrity ─────────────────────────────────────────────
for (const a of analyses.values()) {
  for (const asset of a.assets) {
    if (!asset.exists) add("MISSING_ASSET", a.name, `imports ${asset.spec} → ${relative(ROOT, asset.path)} which does not exist`)
    else if (!asset.nonEmpty) add("EMPTY_ASSET", a.name, `imports ${asset.spec} but the file is empty`)
    else if (!asset.wired)
      add(
        "UNWIRED_ASSET",
        a.name,
        `imports ${asset.spec} as \`${asset.varName}\` but never references it (not assigned to .css/.before/.afterDOMLoaded) → esbuild tree-shakes it → un-shipped site-wide`,
      )
  }
}

// L1b. wrapper forwarding: a mounted wrapper wrapping a child must forward the
// child's lifecycle assets, or the child's JS/CSS un-ships.
for (const a of analyses.values()) {
  if (a.kind !== "wrapper" || !a.wrappedBy) continue
  const child = analyses.get(a.wrappedBy)
  if (!child) continue
  const src = read(a.file) || ""
  const childHasAssets = child.assets.some((x) => x.exists && x.nonEmpty)
  if (!childHasAssets) continue
  for (const slot of ["afterDOMLoaded", "beforeDOMLoaded", "css"]) {
    if (!new RegExp(`\\.${slot}\\s*=`).test(src))
      add("WRAPPER_DROPS_ASSETS", a.name, `wraps ${child.name} (which ships assets) but does not forward .${slot} → child assets un-ship`)
  }
}

// ── L2. data-input existence ─────────────────────────────────────────────────
for (const a of analyses.values()) {
  for (const d of a.dataInputs) {
    if (!d.path) continue
    if (!existsSync(d.path)) add("MISSING_DATA_INPUT", a.name, `needs ${d.kind} ${d.ref} (via ${d.from}) → ${relative(ROOT, d.path)} missing → renders empty/loading shell`)
    else if (!nonEmpty(d.path)) add("EMPTY_DATA_INPUT", a.name, `needs ${d.kind} ${d.ref} but ${relative(ROOT, d.path)} is empty`)
  }
}

// ── L3. link-graph liveness ──────────────────────────────────────────────────
const linkConsumers = [...analyses.values()].filter((a) => a.linkGraphConsumer)
if (linkConsumers.length && CONTENT_DIR) {
  const wikilinkFiles = grepFileCount("\\[\\[")
  const anchorFiles = grepFileCount('href="\\.?/|\\]\\(\\.?/')
  const linked = wikilinkFiles + anchorFiles
  const names = linkConsumers.map((a) => a.name).join(", ")
  if (linked === 0) {
    add("EMPTY_LINK_GRAPH", names, `link-graph consumer(s) mounted but the corpus has 0 internal links ([[wikilinks]] or internal anchors) → they render empty on every page`)
  } else if (totalPages > 20 && linked / totalPages < 0.1) {
    add("SPARSE_LINK_GRAPH", names, `only ${linked}/${totalPages} pages carry internal links; link-graph consumer(s) likely render empty on most pages`, "warn")
  }
}

// ── L4. self-gate vs corpus ──────────────────────────────────────────────────
for (const a of analyses.values()) {
  if (!a.gated) continue
  const norm = (p) => p.replace(/^\//, "")
  // per-entry hit counts so we can flag DEAD allowlist entries (the stale/
  // wrong-taxonomy signal), not just an all-zero gate.
  const prefixHits = [...a.prefixes].map((p) => ({ label: norm(p) + "*", n: corpusSlugs.filter((s) => s.startsWith(norm(p))).length }))
  const exactHits = [...a.exactSlugs].map((e) => ({ label: norm(e), n: corpusSlugs.filter((s) => norm(e) === s).length }))
  let typeMatches = 0
  for (const t of a.types) typeMatches += grepFileCount(`^type:\\s*["']?${t}["']?\\s*$`)
  const total = prefixHits.reduce((s, x) => s + x.n, 0) + exactHits.reduce((s, x) => s + x.n, 0) + typeMatches
  const gate = [...prefixHits.map((x) => x.label), ...exactHits.map((x) => x.label), ...[...a.types].map((t) => "type:" + t)].join(", ")
  if (total === 0) {
    add("GATE_MATCHES_NO_PAGES", a.name, `renders only for {${gate}} but 0 corpus pages match → renders empty on every page`)
    continue
  }
  // Some entries live, some dead → a stale allowlist copied from another
  // taxonomy (the CiteThisPage class): entries that match nothing mean the
  // component skips pages it likely should cover.
  const dead = [...prefixHits, ...exactHits].filter((x) => x.n === 0).map((x) => x.label)
  if (dead.length) {
    add(
      "STALE_GATE_ENTRY",
      a.name,
      `slug allowlist entries match 0 pages: {${dead.join(", ")}} — likely stale/wrong-taxonomy; the component renders empty on pages it may be meant to cover`,
      "warn",
    )
  }
}

// ── L5. coverage / liveness gate (drift catcher) ─────────────────────────────
for (const a of analyses.values()) {
  const shipsAsset = a.assets.some((x) => x.exists && x.nonEmpty && x.wired)
  if (a.kind === "headless") {
    if (!shipsAsset) add("HEADLESS_DEAD", a.name, `renders null by design but ships no non-empty wired asset → it does nothing`)
  } else if (a.kind === "unknown") {
    add("UNPROVEN_LIVENESS", a.name, `cannot classify (no JSX render path, no null return, no wrapper shape) → cannot prove it produces output; wire it or register its liveness`, "warn")
  }
  // visible/wrapper components with a render path are considered live unless a
  // more specific check (L2/L3/L4) already flagged them.
}

// ── L1c. asset-shipping ratchet ──────────────────────────────────────────────
// A component that PREVIOUSLY shipped an inline asset but no longer imports/wires
// it has silently un-shipped its JS/CSS site-wide — the fully-removed-import
// megamenu regression (cert f6a57bb), which L1's unwired check cannot see because
// there is no import left to inspect. Compared against the accepted baseline; a
// legitimate removal is confirmed with --update-baseline.
const key = (f) => `${f.code}::${f.component}`
let baselineObj = {}
try {
  baselineObj = JSON.parse(read(BASELINE) || "{}") || {}
} catch {
  baselineObj = {}
}
const baseline = baselineObj.accepted ?? []
const baselineAssets = baselineObj.componentAssets ?? {}
const currentAssets = {}
for (const a of analyses.values()) {
  currentAssets[a.name] = a.wiredAssets.slice().sort()
  for (const spec of baselineAssets[a.name] ?? []) {
    if (!a.wiredAssets.includes(spec))
      add("ASSET_REGRESSION", a.name, `previously shipped ${spec} but no longer imports/wires it → its JS/CSS is un-shipped site-wide. Restore it, or --update-baseline if the removal is intended.`)
  }
}

if (updateBaseline) {
  writeFileSync(
    BASELINE,
    JSON.stringify(
      {
        note: "Accepted layout-liveness findings + per-component shipped-asset snapshot (ratchet). Findings: draining backlog, do not grow. componentAssets: dropping one flags ASSET_REGRESSION. Re-run --update-baseline after intended changes.",
        accepted: findings.map(key).sort(),
        componentAssets: currentAssets,
      },
      null,
      2,
    ) + "\n",
  )
  console.log(`layout-liveness-baseline.json updated: ${findings.length} accepted findings`)
  process.exit(0)
}
const baseSet = new Set(baseline)
const newFindings = findings.filter((f) => !baseSet.has(key(f)))
const resolved = baseline.filter((k) => !findings.some((f) => key(f) === k))

// ── report ───────────────────────────────────────────────────────────────────
if (asJson) {
  console.log(
    JSON.stringify(
      {
        repo: basename(ROOT),
        contentDir: CONTENT_DIR ? relative(ROOT, CONTENT_DIR) : null,
        totalPages,
        active: [...active.keys()].sort(),
        classification: Object.fromEntries([...analyses].map(([n, a]) => [n, a.kind])),
        findings,
        newFindings,
        resolved,
      },
      null,
      2,
    ),
  )
} else {
  console.log(
    `layout-liveness: ${active.size} active components in ${basename(ROOT)}, ${findings.length} finding(s) (${baseline.length} in accepted baseline)`,
  )
  const bySev = (s) => findings.filter((f) => f.severity === s)
  for (const f of findings) {
    const isNew = !baseSet.has(key(f))
    const tag = isNew ? "NEW " : "    "
    const mark = f.severity === "warn" ? "•" : "✗"
    console.log(`  ${mark} ${tag}${f.code}  ${f.component} — ${f.detail}`)
  }
  if (resolved.length) console.log(`  ✓ resolved since baseline (run --update-baseline to shrink it): ${resolved.join(", ")}`)
  if (findings.length === 0) console.log("  ✓ every active component proves liveness (asset/data/graph/gate)")
  else if (newFindings.length === 0) console.log("  ✓ no NEW findings beyond the accepted baseline")
  console.log(`  (${bySev("error").length} error-class, ${bySev("warn").length} advisory)`)
}

const blocking = newFindings.filter((f) => f.severity !== "warn")
if (blocking.length > 0 && !warnOnly) {
  console.error(`\nlayout-liveness: ${blocking.length} NEW error-class finding(s). Fix, or --update-baseline to accept, or --warn-only to downgrade.`)
  process.exit(1)
}
process.exit(0)
