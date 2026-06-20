import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/productPercentileTool.scss"

// @ts-ignore
import script from "./scripts/productPercentileTool.inline"

export default (() => {
  const BrandPreScreenTool: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const frontmatter = fileData.frontmatter as Record<string, unknown> | undefined
    if (frontmatter?.type !== "brand-pre-screen-tool") return null

    return (
      <section
        class="hmi-percentile-tool hmi-brand-pre-screen"
        id="lab-result-comparator"
        data-percentile-tool
      >
        <div class="hmi-percentile-heading">
          <div>
            <div class="hmi-percentile-kicker">Lab result comparator</div>
            <h2>Compare your finished-product result against the cited literature</h2>
          </div>
          <p>
            Enter a finished-product heavy-metal result in ppb. The comparator shows where your
            value sits inside the range reported by cited peer-reviewed and government sources
            for the selected product category, and against the applicable regulatory cap. All
            values stay in your browser; nothing is submitted.
          </p>
        </div>

        <div class="hmi-percentile-status" data-comparator-status>
          Loading lab comparator context...
        </div>

        <div class="hmi-comparator-controls">
          <label>
            Product category
            <select data-comparator-row></select>
          </label>
          <label>
            Your lab basis
            <select data-comparator-basis></select>
          </label>
        </div>

        <div class="hmi-comparator-grid" data-comparator-grid></div>

        <p class="hmi-percentile-disclaimer">
          This comparator reports what the cited literature says and what the applicable
          regulatory cap is; it does not display HMT&amp;C certification thresholds. Final
          certification decisions follow the HMT&amp;C program and require the full required
          analyte panel, comparable matrix basis, lab documentation, LOQ/LOD review, lot
          sampling, and program review.
        </p>
      </section>
    )
  }

  BrandPreScreenTool.css = style
  BrandPreScreenTool.afterDOMLoaded = script
  return BrandPreScreenTool
}) satisfies QuartzComponentConstructor
