import { QuartzComponent, QuartzComponentConstructor } from "./types"

// @ts-ignore
import script from "./scripts/applyForm.inline"

// Headless component (mirrors Corrections): ships applyForm.inline.ts site-wide so the
// application form embedded in content/apply.md ([data-apply-form]) is wired without the
// page registering its own assets. Renders nothing; the script no-ops on every page
// without a [data-apply-form] root, i.e. everywhere but /apply. Mounted in the
// always-rendered afterBody slot (quartz.layout.ts).
const ApplyForm: QuartzComponent = () => null

ApplyForm.afterDOMLoaded = script

export default (() => ApplyForm) satisfies QuartzComponentConstructor
