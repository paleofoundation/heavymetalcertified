import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/standardsFinder.scss"

// @ts-ignore
import script from "./scripts/standardsFinder.inline"

// The interactive Standards Finder. Rendered only on the page that opts in with
// `type: standards-finder` in its frontmatter; returns null everywhere else so the
// markup ships on that one page. Mounted in the always-rendered afterBody slot
// (quartz.layout.ts) so its inline script ships site-wide; the script no-ops unless
// it finds the [data-standards-finder] root, i.e. only on the Finder page.
export default (() => {
  const StandardsFinder: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined
    if (frontmatter?.type !== "standards-finder") return null

    return (
      <section class="hmtc-finder" data-standards-finder>
        <p class="hmtc-finder-intro">
          Pick your product below to read the standard it is held to: the analytes evaluated, the
          published limits, current eligibility, the known challenges, and whether Readiness Review
          or Direct Certification is the fit. No company name is required, and nothing is submitted.
        </p>

        <div class="hmtc-finder-controls">
          <label class="hmtc-finder-field">
            Product category
            <select data-finder-category aria-label="Product category"></select>
          </label>
          <label class="hmtc-finder-field">
            Product
            <select data-finder-product aria-label="Product"></select>
          </label>
          <label class="hmtc-finder-field is-hidden" data-finder-form-wrap>
            Product form
            <select data-finder-form aria-label="Product form"></select>
          </label>
          <label class="hmtc-finder-field">
            Intended market
            <select data-finder-market aria-label="Intended market"></select>
          </label>
          <fieldset class="hmtc-finder-report" data-finder-report>
            <legend>Do you already have recent lab results?</legend>
            <div class="hmtc-finder-report-options">
              <label>
                <input type="radio" name="hmtc-finder-report" value="yes" data-finder-report-input />
                Yes
              </label>
              <label>
                <input type="radio" name="hmtc-finder-report" value="no" data-finder-report-input />
                No, or not sure
              </label>
            </div>
          </fieldset>
        </div>

        <div class="hmtc-finder-status" data-finder-status>
          Loading the standards register...
        </div>

        <div class="hmtc-finder-result" data-finder-result></div>

        <noscript>
          <p class="hmtc-finder-fallback">
            This guided lookup needs JavaScript. You can browse every published standard, with its
            basis, analyte panel, and limits, in the <a href="/standards">standards register</a>.
          </p>
        </noscript>
      </section>
    )
  }

  StandardsFinder.css = style
  StandardsFinder.afterDOMLoaded = script
  return StandardsFinder
}) satisfies QuartzComponentConstructor
