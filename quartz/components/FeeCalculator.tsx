import { QuartzComponent, QuartzComponentConstructor } from "./types"

// @ts-ignore
import script from "./scripts/feeCalculator.inline"

// The /apply certification-fee estimator.
//
// Unlike StandardsFinder, this component renders NO markup: the estimator's DOM lives
// inline in content/apply.md (the [data-fee-calculator] block) so it can sit in its own
// mid-page section rather than after the whole page body. This component exists only to
// ship feeCalculator.inline.ts site-wide (a component's inline script is emitted whenever
// the component is in the layout, independent of what it renders). The script no-ops on
// every page without a [data-fee-calculator] root, i.e. everywhere but /apply.
//
// Mounted in the always-rendered afterBody slot (quartz.layout.ts).
export default (() => {
  const FeeCalculator: QuartzComponent = () => null
  FeeCalculator.afterDOMLoaded = script
  return FeeCalculator
}) satisfies QuartzComponentConstructor
