import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/corrections.inline"
import style from "./styles/corrections.scss"

// Headless component: ships the correction-form script + styles to every page
// so the markdown-embedded form on wiki/contact.md and wiki/errata.md is
// wired without each page having to register its own assets. Renders nothing.
const Corrections: QuartzComponent = () => null

Corrections.afterDOMLoaded = script
Corrections.css = style

export default (() => Corrections) satisfies QuartzComponentConstructor
