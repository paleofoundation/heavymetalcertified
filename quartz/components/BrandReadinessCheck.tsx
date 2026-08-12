import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/brandReadinessCheck.scss"
import readiness from "../../data/category-readiness.json"

// @ts-ignore — progressively enhances the static form below and re-runs after SPA navigation.
import script from "./scripts/brandReadinessCheck.inline"

const categories = [
  ...readiness.categories.map((category) => category.name),
  "Another or uncertain category",
]

export default (() => {
  const BrandReadinessCheck: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    if (fileData.slug !== "readiness") return null

    return (
      <section class="hmtc-readiness-check" aria-labelledby="readiness-check-title" data-readiness-check>
        <div class="hmtc-readiness-check__head">
          <div>
            <div class="hmtc-readiness-check__kicker">Private readiness check</div>
            <h2 id="readiness-check-title">Map the next step before you submit data</h2>
          </div>
          <p>
            This check runs entirely in your browser. It does not upload, transmit, or retain your
            answers, and it is not an application or certification decision.
          </p>
        </div>

        <form class="hmtc-readiness-check__form" data-readiness-form>
          <label>
            Product category
            <select name="category" required>
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option value={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Intended consumer
            <select name="consumer" required>
              <option value="">Select the intended consumer</option>
              <option value="infant">Infant or child under 3</option>
              <option value="child">Child 3–5</option>
              <option value="general">General population</option>
              <option value="uncertain">Uncertain or mixed</option>
            </select>
          </label>

          <label>
            Product form
            <select name="form" required>
              <option value="">Select the sold form</option>
              <option value="powder">Powder or dry-as-sold</option>
              <option value="ready">Ready-to-feed or as-consumed</option>
              <option value="solid">Solid or as-sold</option>
              <option value="contact">Contact product or component</option>
              <option value="uncertain">Uncertain or multiple forms</option>
            </select>
          </label>

          <label>
            Products and distinct formulations
            <select name="portfolio" required>
              <option value="">Select portfolio size</option>
              <option value="one">1 product / formulation</option>
              <option value="small">2–5 products / formulations</option>
              <option value="large">6 or more products / formulations</option>
              <option value="uncertain">Not yet mapped</option>
            </select>
          </label>

          <label>
            Existing finished-product evidence
            <select name="evidence" required>
              <option value="">Select the closest description</option>
              <option value="full">Recent accredited 10-analyte results with lot identity</option>
              <option value="partial">Some accredited analytes or lots</option>
              <option value="coa">Supplier COAs or internal results only</option>
              <option value="none">No current evidence</option>
              <option value="uncertain">Unknown quality or scope</option>
            </select>
          </label>

          <label>
            Decision sought now
            <select name="intent" required>
              <option value="">Select the immediate objective</option>
              <option value="readiness">Private readiness and gap mapping</option>
              <option value="certification">Formal certification decision</option>
              <option value="remediation">Improvement or remediation planning</option>
              <option value="uncertain">Help choosing the route</option>
            </select>
          </label>

          <div class="hmtc-readiness-check__actions">
            <button type="submit">Build my readiness map</button>
            <button type="reset" class="hmtc-readiness-check__reset">Clear</button>
          </div>
        </form>

        <div class="hmtc-readiness-check__result" data-readiness-result hidden aria-live="polite">
          <div class="hmtc-readiness-check__result-head">
            <div>
              <div class="hmtc-readiness-check__kicker">Immediate decision map</div>
              <h3 data-readiness-title>Private Readiness is the controlled next step</h3>
            </div>
            <span data-readiness-state>Private Readiness only</span>
          </div>
          <dl>
            <div><dt>Category state</dt><dd data-readiness-category-state></dd></div>
            <div><dt>Required panel</dt><dd>Eight priority metals / ten analytes</dd></div>
            <div><dt>Evidence reuse</dt><dd data-readiness-reuse></dd></div>
            <div><dt>Likely new work</dt><dd data-readiness-gap></dd></div>
            <div><dt>Planning window</dt><dd data-readiness-timing></dd></div>
            <div><dt>Principal cost drivers</dt><dd data-readiness-cost></dd></div>
          </dl>
          <p data-readiness-note></p>
          <div class="hmtc-readiness-check__next">
            <a href="#show-us-what-you-already-know">Prepare the evidence inventory</a>
            <a href="/cost-and-timing">Review cost and timing</a>
            <a href="/what-happens-to-your-data">Review the data boundary</a>
          </div>
        </div>
      </section>
    )
  }

  BrandReadinessCheck.css = style
  BrandReadinessCheck.afterDOMLoaded = script
  return BrandReadinessCheck
}) satisfies QuartzComponentConstructor
