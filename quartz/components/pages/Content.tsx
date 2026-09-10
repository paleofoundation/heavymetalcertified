import { KAREN } from "../authorIdentity"
import { HomeHero } from "../HomeHero"
import { ComponentChildren } from "preact"
import { htmlToJsx } from "../../util/jsx"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"

const Content: QuartzComponent = ({ fileData, tree }: QuartzComponentProps) => {
  const content = htmlToJsx(fileData.filePath!, tree) as ComponentChildren
  const classes: string[] = fileData.frontmatter?.cssclasses ?? []
  const classString = ["popover-hint", ...classes].join(" ")
  const profile = fileData.frontmatter?.type === "author-profile" ? {
    "@context": "https://schema.org", "@type": "ProfilePage",
    url: `https://heavymetalcertified.com${KAREN.profile}`,
    mainEntity: {
      "@type": "Person", "@id": "https://contaminantstandards.com/people/karen-pendergrass#person",
      name: KAREN.name, description: KAREN.bio,
      image: `https://heavymetalcertified.com${KAREN.portrait}`,
      sameAs: [`https://orcid.org/${KAREN.orcid}`, "https://heavymetalindex.com/authors/karen-pendergrass"],
    },
  } : null
  return <article class={classString}>{fileData.frontmatter?.type === "home" && <HomeHero fm={fileData.frontmatter} />}{content}{profile && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profile).replace(/</g, "\\u003c") }} />}</article>
}

export default (() => Content) satisfies QuartzComponentConstructor
