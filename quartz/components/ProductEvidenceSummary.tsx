import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/productEvidenceSummary.scss"

function text(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number") return String(value)
  return undefined
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => text(item)).filter((item): item is string => Boolean(item))
  }

  const item = text(value)
  return item ? [item] : []
}

function labelize(value: unknown): string | undefined {
  const normalized = text(value)
  if (!normalized) return undefined

  return normalized
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatPopulation(value: unknown): string | undefined {
  const normalized = text(value)
  if (!normalized) return undefined

  const match = normalized.match(/^([a-z]+)-(\d+)-(\d+)(mo|yr)$/i)
  if (match) {
    const [, group, start, end, unit] = match
    return `${labelize(group)} ${start}-${end} ${unit.toLowerCase()}`
  }

  return labelize(normalized)
}

function formatDate(value: unknown): string | undefined {
  const normalized = text(value)
  if (!normalized) return undefined

  const date = new globalThis.Date(normalized)
  if (Number.isNaN(date.getTime())) return normalized

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export default (() => {
  const ProductEvidenceSummary: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined
    const isProductCategory =
      frontmatter?.type === "product-category" && fileData.slug?.startsWith("products/")

    if (!frontmatter || !isProductCategory) return null

    const metals = list(frontmatter.primary_metals_of_concern)
    const ingredients = list(frontmatter.ingredient_targets)
    const sources = text(frontmatter.sources)
    const updated = formatDate(frontmatter.updated)
    const evidenceStatus = text(frontmatter.public_evidence_label) ?? labelize(frontmatter.evidence_fitness)
    const population = formatPopulation(frontmatter.vulnerable_population)
    const categoryLabel = text(frontmatter.category_label)
    const shortcuts = [
      "Source Evidence Inventory",
      "Measured Values And Concentration Evidence",
      "Distribution Context",
      "Extracted Formula Concentration Rows",
      "Structured Concentration Rows",
      "Evidence Used For This Row",
      "Sources",
    ]
      .map((label) => {
        const entry = fileData.toc?.find((tocEntry) => tocEntry.text === label)
        return entry ? { label: productShortcutLabel(label), slug: entry.slug } : undefined
      })
      .filter((entry): entry is { label: string; slug: string } => Boolean(entry))

    return (
      <section class="hmi-product-brief" aria-label="Product evidence summary">
        <div class="hmi-product-brief-kicker">
          <span>Product evidence page</span>
          {categoryLabel ? <span>{categoryLabel}</span> : null}
        </div>

        <div class="hmi-product-brief-grid">
          <div class="hmi-product-brief-main">
            <h2>Evidence Summary</h2>
            <p>
              This page summarizes what cited Heavy Metal Index sources report for this product
              category: metals covered, measured values, regulatory context, and evidence gaps.
            </p>
            <p class="hmi-product-standards-note">
              Technical extraction details may appear below for traceability, but public pages do
              not publish HMT&C standards, candidate limits, or certification thresholds. Internal
              percentile, confidence, and regulatory-ceiling decisions belong in the staff
              standards workbench.
            </p>
          </div>

          <dl class="hmi-product-facts">
            {evidenceStatus ? (
              <div>
                <dt>Evidence status</dt>
                <dd>{evidenceStatus}</dd>
              </div>
            ) : null}
            {sources ? (
              <div>
                <dt>Source coverage</dt>
                <dd>{sources} cited sources</dd>
              </div>
            ) : null}
            {population ? (
              <div>
                <dt>Population</dt>
                <dd>{population}</dd>
              </div>
            ) : null}
            {updated ? (
              <div>
                <dt>Updated</dt>
                <dd>{updated}</dd>
              </div>
            ) : null}
          </dl>
        </div>

        {metals.length > 0 ? (
          <div class="hmi-product-chip-group" aria-label="Metals covered">
            <span class="hmi-product-chip-label">Metals covered</span>
            {metals.map((metal) => (
              <span class="hmi-product-chip">{metal}</span>
            ))}
          </div>
        ) : null}

        {ingredients.length > 0 ? (
          <div class="hmi-product-chip-group hmi-product-chip-group-muted" aria-label="Ingredient targets">
            <span class="hmi-product-chip-label">Ingredient targets</span>
            {ingredients.map((ingredient) => (
              <span class="hmi-product-chip">{labelize(ingredient) ?? ingredient}</span>
            ))}
          </div>
        ) : null}

        {shortcuts.length > 0 ? (
          <nav class="hmi-product-brief-links" aria-label="Product evidence shortcuts">
            {shortcuts.map((shortcut) => (
              <a href={`#${shortcut.slug}`}>{shortcut.label}</a>
            ))}
          </nav>
        ) : null}
      </section>
    )
  }

  ProductEvidenceSummary.css = style
  return ProductEvidenceSummary
}) satisfies QuartzComponentConstructor

function productShortcutLabel(label: string): string {
  switch (label) {
    case "Source Evidence Inventory":
      return "Source evidence"
    case "Measured Values And Concentration Evidence":
      return "Measured values"
    case "Distribution Context":
      return "Distribution context"
    case "Extracted Formula Concentration Rows":
    case "Structured Concentration Rows":
      return "Structured values"
    case "Evidence Used For This Row":
      return "Evidence notes"
    default:
      return label
  }
}
