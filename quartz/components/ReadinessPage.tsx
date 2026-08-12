import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import BrandReadinessCheck from "./BrandReadinessCheck"
import Content from "./pages/Content"

export default (() => {
  const Check = BrandReadinessCheck()
  const Article = Content()

  const ReadinessPage: QuartzComponent = (props: QuartzComponentProps) => (
    <>
      <Check {...props} />
      <Article {...props} />
    </>
  )

  ReadinessPage.css = Check.css
  ReadinessPage.afterDOMLoaded = Check.afterDOMLoaded
  return ReadinessPage
}) satisfies QuartzComponentConstructor
