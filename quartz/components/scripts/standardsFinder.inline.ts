// Standards Finder — client hydration for /standards/finder.
//
// A guided lookup over the published register. The visitor picks a product
// category, product, product form, intended market, and whether they already hold
// lab results; the tool reports, with no company name required, the applicable
// standard, its basis, the analyte panel and published limits, current eligibility,
// the known challenges (the tightest limits, plus pointers to the standard page's
// own "what is likely to struggle" section), and the recommended route (Readiness
// Review vs Direct Certification). It reads only the slim projection at
// /static/data/standards-finder-context.json; nothing is submitted anywhere.
//
// It complements the /standards register, it does not replace the certification
// program: every result restates that the decision follows the HMTc program.

type AnalyteCell = {
  code: string
  status: "published" | "in_development" | "not_material" | "control"
  limit_ppb: number | null
  control_basis: string | null
  controlling_jurisdiction?: string
  per_market?: Record<string, number>
  forms?: { form: string; limit_ppb: number | null; jurisdiction: string | null }[]
}

type Variant = {
  key: string
  form: string
  basis: string
  eligibility: "firm" | "partial" | "forming"
  firm_count: number
  in_development: string[]
  controlled_screens: string[]
  form_split: string[]
  tightest: { code: string; limit_ppb: number }[]
  analytes: AnalyteCell[]
}

type Product = {
  slug: string
  name: string
  category: number
  category_name: string
  page_url: string
  standard_version: string | null
  single_form: boolean
  variants: Variant[]
}

type FinderContext = {
  schema: string
  unit: string
  analyte_order: string[]
  analyte_labels: Record<string, string>
  analyte_pages: Record<string, string>
  markets: { code: string; label: string }[]
  categories: { num: number; name: string; product_count: number }[]
  products: Product[]
}

type FinderState = {
  context: FinderContext
  category: number
  productSlug: string
  formKey: string
  market: string
  hasReport: "yes" | "no" | ""
}

let contextCache: Promise<FinderContext> | undefined
const stateByRoot = new WeakMap<HTMLElement, FinderState>()

function loadContext() {
  contextCache ??= fetch("/static/data/standards-finder-context.json").then((r) => {
    if (!r.ok) throw new Error("finder context unavailable")
    return r.json() as Promise<FinderContext>
  })
  return contextCache
}

function esc(v: string) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function fmtPpb(v: number | null | undefined) {
  if (v == null || !Number.isFinite(v)) return null
  return `${v.toLocaleString("en-US")} ppb`
}

const CONTROL_BASIS_LABEL: Record<string, string> = {
  "government-limit": "strictest applicable government maximum",
  "government-read-across": "government read-across",
  "controlled-screen": "reflex screen",
  "government-limit-form-split": "government maximum, form specific",
  "in-development": "in development",
}

const STATUS_LABEL: Record<string, string> = {
  published: "firm limit",
  in_development: "in development",
  not_material: "controlled screen",
  control: "controlled screen",
}

function productsInCategory(ctx: FinderContext, category: number) {
  return ctx.products
    .filter((p) => p.category === category)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function currentProduct(state: FinderState) {
  return state.context.products.find((p) => p.slug === state.productSlug) ?? null
}

function currentVariant(product: Product | null, formKey: string) {
  if (!product) return null
  return product.variants.find((v) => v.key === formKey) ?? product.variants[0] ?? null
}

function marketLabel(ctx: FinderContext, code: string) {
  return ctx.markets.find((m) => m.code === code)?.label ?? code
}

// ── Select population ───────────────────────────────────────────────────────
function fillCategory(root: HTMLElement, state: FinderState) {
  const sel = root.querySelector("[data-finder-category]") as HTMLSelectElement | null
  if (!sel) return
  sel.innerHTML = state.context.categories
    .map(
      (c) =>
        `<option value="${c.num}"${c.num === state.category ? " selected" : ""}>${esc(
          `${c.num}. ${c.name}`,
        )}</option>`,
    )
    .join("")
}

function fillProduct(root: HTMLElement, state: FinderState) {
  const sel = root.querySelector("[data-finder-product]") as HTMLSelectElement | null
  if (!sel) return
  const list = productsInCategory(state.context, state.category)
  sel.innerHTML = list
    .map(
      (p) => `<option value="${esc(p.slug)}"${p.slug === state.productSlug ? " selected" : ""}>${esc(p.name)}</option>`,
    )
    .join("")
}

function fillForm(root: HTMLElement, state: FinderState) {
  const wrap = root.querySelector("[data-finder-form-wrap]") as HTMLElement | null
  const sel = root.querySelector("[data-finder-form]") as HTMLSelectElement | null
  if (!wrap || !sel) return
  const product = currentProduct(state)
  if (!product || product.single_form) {
    wrap.classList.add("is-hidden")
    sel.innerHTML = ""
    return
  }
  wrap.classList.remove("is-hidden")
  sel.innerHTML = product.variants
    .map(
      (v) => `<option value="${esc(v.key)}"${v.key === state.formKey ? " selected" : ""}>${esc(v.form)}</option>`,
    )
    .join("")
}

function fillMarket(root: HTMLElement, state: FinderState) {
  const sel = root.querySelector("[data-finder-market]") as HTMLSelectElement | null
  if (!sel) return
  const options = [`<option value="">Not sure, or not specified</option>`].concat(
    state.context.markets.map(
      (m) => `<option value="${esc(m.code)}"${m.code === state.market ? " selected" : ""}>${esc(m.label)}</option>`,
    ),
  )
  sel.innerHTML = options.join("")
}

// ── Result rendering ────────────────────────────────────────────────────────
function analytePanelTable(state: FinderState, variant: Variant) {
  const ctx = state.context
  const showMarket = state.market !== ""
  const head =
    `<thead><tr><th>Analyte</th><th>HMTc limit</th><th>Basis of control</th>` +
    (showMarket ? `<th>${esc(marketLabel(ctx, state.market))} government limit</th>` : "") +
    `</tr></thead>`
  const rows = variant.analytes
    .map((a) => {
      const label = ctx.analyte_labels[a.code] || a.code
      const page = ctx.analyte_pages[a.code]
      const name = page
        ? `<a href="${esc(page)}">${esc(label)}</a> <span class="hmtc-finder-cellstate">${esc(a.code)}</span>`
        : `${esc(label)} <span class="hmtc-finder-cellstate">${esc(a.code)}</span>`
      const limit =
        a.status === "published" && a.limit_ppb != null
          ? esc(fmtPpb(a.limit_ppb) as string)
          : `<span class="hmtc-finder-cellstate">${esc(STATUS_LABEL[a.status] || a.status)}</span>`
      const basis = a.control_basis
        ? esc(CONTROL_BASIS_LABEL[a.control_basis] || a.control_basis)
        : `<span class="hmtc-finder-cellstate">not set</span>`
      let market = ""
      if (showMarket) {
        const v = a.per_market?.[state.market]
        market =
          v != null
            ? `<td>${esc(fmtPpb(v) as string)}</td>`
            : `<td><span class="hmtc-finder-cellstate">not separately listed</span></td>`
      }
      return `<tr><td>${name}</td><td>${limit}</td><td>${basis}</td>${market}</tr>`
    })
    .join("")
  return `<div class="hmtc-finder-panel"><table>${head}<tbody>${rows}</tbody></table></div>`
}

function eligibilityCopy(variant: Variant) {
  const panel = variant.analytes.length
  if (variant.eligibility === "firm") {
    return `This standard is in force. All ${panel} evaluated analytes carry a firm published limit, so the product can be taken to certification now against these numbers.`
  }
  if (variant.eligibility === "partial") {
    return `This standard is in force. ${variant.firm_count} of ${panel} evaluated analytes carry a firm published limit; the remaining cells are still in development and are not certification barriers. Certification runs against the firm limits now.`
  }
  return `This standard exists as a page and the limits are still being finalized. No analyte carries a firm published limit yet, so read the page for its current state before planning testing.`
}

function eligibilityChip(variant: Variant) {
  const label =
    variant.eligibility === "firm" ? "in force" : variant.eligibility === "partial" ? "in force, widening" : "forming"
  return `<span class="hmtc-finder-chip is-${variant.eligibility}">${esc(label)}</span>`
}

function challengesBlock(state: FinderState, product: Product, variant: Variant) {
  const ctx = state.context
  const tags: string[] = []
  for (const t of variant.tightest) {
    const label = ctx.analyte_labels[t.code] || t.code
    tags.push(`<span class="hmtc-finder-tag">${esc(label)} ${esc(fmtPpb(t.limit_ppb) as string)}</span>`)
  }
  const flags: string[] = []
  if (variant.controlled_screens.length) {
    const names = variant.controlled_screens.map((c) => ctx.analyte_labels[c] || c).join(", ")
    flags.push(
      `<p class="hmtc-finder-note">Reflex screens apply for ${esc(names)}: there is no fixed ceiling, but a result over the screen trigger requires follow-up speciation.</p>`,
    )
  }
  if (variant.form_split.length) {
    const names = variant.form_split.map((c) => ctx.analyte_labels[c] || c).join(", ")
    flags.push(
      `<p class="hmtc-finder-note">Form-specific limits apply for ${esc(names)}: the ceiling depends on the exact product form. See the standard page.</p>`,
    )
  }
  const tightestLine = tags.length
    ? `<p>The tightest limits, where sourcing has to work hardest, are:</p><div class="hmtc-finder-tags">${tags.join(
        "",
      )}</div>`
    : `<p>No firm numeric limit is set yet, so there is nothing to rank by tightness.</p>`
  return `<div class="hmtc-finder-block">
    <p class="hmtc-finder-kicker">Known ingredient and matrix challenges</p>
    ${tightestLine}
    ${flags.join("")}
    <p class="hmtc-finder-note">The tightest limit is not the same as the hardest to meet: whether a product struggles depends on its ingredients and sourcing. The standard page names, for this category, which products and ingredients most often run above the limit and why.</p>
    <div class="hmtc-finder-links">
      <a href="${esc(product.page_url)}#hard">What is likely to struggle</a>
      <a href="/hard-to-meet">Cross-category summary</a>
    </div>
  </div>`
}

function marketBlock(state: FinderState, variant: Variant) {
  if (state.market === "") return ""
  const ctx = state.context
  const label = marketLabel(ctx, state.market)
  const published = variant.analytes.filter((a) => a.status === "published")
  const listed = published.filter(
    (a) => a.limit_ppb != null && a.per_market && a.per_market[state.market] != null,
  )
  const stricter = listed.filter((a) => (a.per_market![state.market] as number) > (a.limit_ppb as number))
  const looser = listed.filter((a) => (a.per_market![state.market] as number) < (a.limit_ppb as number))
  let detail: string
  if (published.length === 0) {
    detail = `The limits for this product are still being finalized, so a market comparison is not meaningful yet.`
  } else if (listed.length === 0) {
    detail = `${esc(
      label,
    )} does not publish a separate government limit for this product in the register. The HMTc limit is set to the strictest applicable government maximum from the jurisdictions that do regulate it.`
  } else {
    let strictNote: string
    if (looser.length) {
      // Should not arise for government-limit cells (HMTc is the strictest of them),
      // but never assert superiority the data does not support: compare directly.
      strictNote = ` The column shows each ${esc(label)} government value next to the HMTc limit; compare them directly.`
    } else if (stricter.length) {
      strictNote = ` For ${stricter.length} of them the HMTc limit is stricter than the ${esc(
        label,
      )} government value; on the rest it matches.`
    } else {
      strictNote = ` The HMTc limit matches the ${esc(label)} government value on every listed analyte.`
    }
    detail = `${esc(label)} publishes a government limit for ${listed.length} of the ${
      published.length
    } firm analytes in the panel above; the column shows each one.${strictNote} HMTc holds one number, the strictest applicable government maximum, regardless of the market you sell into.`
  }
  return `<div class="hmtc-finder-block">
    <p class="hmtc-finder-kicker">Your market: ${esc(label)}</p>
    <p>${detail}</p>
  </div>`
}

function routeBlock(state: FinderState) {
  let title: string
  let body: string
  let href: string
  let cta: string
  if (state.hasReport === "yes") {
    title = "Direct Certification may fit"
    body =
      "You indicated you already hold recent lab results. If those results cover the full analyte panel above, on the product basis shown, and your process controls are stable, your existing evidence may support Direct Certification (Route B), where the mark issues only after the evidence demonstrates conformance."
    href = "/apply"
    cta = "Start an application"
  } else if (state.hasReport === "no") {
    title = "Start with a Readiness Review"
    body =
      "You indicated you do not yet have suitable results, or are not sure. The Readiness Track (Route A) is the fit: it is nonpublic, you read the applicable limits, test, and correct the cause before any official evaluation. No mark is awarded during readiness."
    href = "/program/readiness"
    cta = "How readiness works"
  } else {
    title = "Which route fits"
    body =
      "Tell the tool whether you already hold recent lab results, above, and it will point you to the Readiness Track or to Direct Certification. Both begin without a full data submission or fee."
    href = "/apply"
    cta = "Compare the two routes"
  }
  return `<div class="hmtc-finder-block hmtc-finder-route">
    <p class="hmtc-finder-kicker">Recommended route</p>
    <p class="hmtc-finder-title" style="font-size:1.05rem">${esc(title)}</p>
    <p>${esc(body)}</p>
    <div class="hmtc-finder-links"><a href="${esc(href)}">${esc(cta)}</a></div>
  </div>`
}

function renderResult(root: HTMLElement, state: FinderState) {
  const result = root.querySelector("[data-finder-result]") as HTMLElement | null
  if (!result) return
  const product = currentProduct(state)
  const variant = currentVariant(product, state.formKey)
  if (!product || !variant) {
    result.innerHTML = ""
    return
  }
  const ctx = state.context
  const formNote = product.single_form ? "" : `, ${esc(variant.form.toLowerCase())} form`
  const versionRow = product.standard_version
    ? `<div><dt>Standard version</dt><dd>${esc(product.standard_version)}</dd></div>`
    : ""

  const standardBlock = `<div class="hmtc-finder-block">
    <p class="hmtc-finder-kicker">Applicable standard</p>
    <div class="hmtc-finder-lead">
      <h3 class="hmtc-finder-title">${esc(product.name)}${formNote}</h3>
      ${eligibilityChip(variant)}
    </div>
    <p>${eligibilityCopy(variant)}</p>
    <dl class="hmtc-finder-kv">
      <div><dt>Category</dt><dd>${esc(`${product.category}. ${product.category_name}`)}</dd></div>
      <div><dt>Product basis</dt><dd>${esc(variant.basis)}</dd></div>
      <div><dt>Firm analyte limits</dt><dd>${variant.firm_count} of ${variant.analytes.length}</dd></div>
      ${versionRow}
    </dl>
    <div class="hmtc-finder-links">
      <a href="${esc(product.page_url)}">Open the full standard</a>
    </div>
  </div>`

  const panelBlock = `<div class="hmtc-finder-block">
    <p class="hmtc-finder-kicker">Analyte panel and published limits</p>
    <p class="hmtc-finder-note">Limits are in ${esc(ctx.unit)} on the ${esc(
      variant.basis,
    )} basis. A firm limit is a published ceiling; a reflex screen has no fixed ceiling but triggers follow-up testing; an in-development cell is not yet a certification barrier.</p>
    ${analytePanelTable(state, variant)}
  </div>`

  result.innerHTML =
    standardBlock +
    panelBlock +
    challengesBlock(state, product, variant) +
    marketBlock(state, variant) +
    routeBlock(state) +
    `<p class="hmtc-finder-disclaimer">This is a guided lookup of the published HMTc register, not a certification decision or a compliance determination. It reports the standard as published; the certification decision follows the HMTc program, which requires the full required analyte panel, comparable matrix basis, lab documentation, LOD/LOQ review, lot sampling, and program review. No company name is required to look up a standard.</p>`
}

// ── Setup ───────────────────────────────────────────────────────────────────
function syncFormKey(state: FinderState) {
  const product = currentProduct(state)
  if (!product) return
  if (!product.variants.some((v) => v.key === state.formKey)) {
    state.formKey = product.variants[0]?.key ?? ""
  }
}

function rerender(root: HTMLElement, state: FinderState) {
  fillProduct(root, state)
  fillForm(root, state)
  renderResult(root, state)
}

async function setup(root: HTMLElement) {
  if (root.dataset.finderReady === "true") return
  root.dataset.finderReady = "true"
  const status = root.querySelector("[data-finder-status]") as HTMLElement | null
  try {
    const context = await loadContext()
    if (!context.products.length || !context.categories.length) {
      if (status) status.textContent = "The register is not loaded yet."
      return
    }
    const params = new URLSearchParams(window.location.search)
    const querySlug = params.get("product")
    const seeded = context.products.find((p) => p.slug === querySlug)
    const firstCat = context.categories[0].num
    const state: FinderState = {
      context,
      category: seeded ? seeded.category : firstCat,
      productSlug: seeded ? seeded.slug : productsInCategory(context, firstCat)[0]?.slug ?? "",
      formKey: "",
      market: "",
      hasReport: "",
    }
    syncFormKey(state)
    stateByRoot.set(root, state)

    fillCategory(root, state)
    fillProduct(root, state)
    fillForm(root, state)
    fillMarket(root, state)
    if (status) status.remove()
    renderResult(root, state)

    const catSel = root.querySelector("[data-finder-category]") as HTMLSelectElement | null
    catSel?.addEventListener("change", () => {
      state.category = Number(catSel.value)
      state.productSlug = productsInCategory(context, state.category)[0]?.slug ?? ""
      syncFormKey(state)
      rerender(root, state)
    })

    const prodSel = root.querySelector("[data-finder-product]") as HTMLSelectElement | null
    prodSel?.addEventListener("change", () => {
      state.productSlug = prodSel.value
      syncFormKey(state)
      fillForm(root, state)
      renderResult(root, state)
      const url = new URL(window.location.href)
      url.searchParams.set("product", state.productSlug)
      window.history.replaceState({}, "", url)
    })

    const formSel = root.querySelector("[data-finder-form]") as HTMLSelectElement | null
    formSel?.addEventListener("change", () => {
      state.formKey = formSel.value
      renderResult(root, state)
    })

    const marketSel = root.querySelector("[data-finder-market]") as HTMLSelectElement | null
    marketSel?.addEventListener("change", () => {
      state.market = marketSel.value
      renderResult(root, state)
    })

    for (const radio of [...root.querySelectorAll<HTMLInputElement>("[data-finder-report-input]")]) {
      radio.addEventListener("change", () => {
        if (radio.checked) {
          state.hasReport = radio.value as "yes" | "no"
          renderResult(root, state)
        }
      })
    }
  } catch {
    if (status) {
      status.classList.add("is-error")
      status.textContent = "The register could not be loaded. Use the link above to browse the full standards register."
    }
  }
}

function setupAll() {
  document.querySelectorAll<HTMLElement>("[data-standards-finder]").forEach((el) => setup(el))
}

document.addEventListener("nav", setupAll)
queueMicrotask(setupAll)

// Module scope: keeps these top-level identifiers out of the shared global script
// scope tsc otherwise assigns to non-module .inline.ts files (avoids collisions with
// sibling inline scripts). The inline bundler injects the file's source regardless.
export {}
