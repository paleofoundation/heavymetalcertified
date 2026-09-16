import identity from "../../data/researcher-identity.json"
import { KAREN_PERSON, PALEO_ORGANIZATION } from "../../tools/lib/researcher-schema.mjs"

export default function ResearcherProfileMetadata({ frontmatter, slug }: {
  frontmatter: Record<string, unknown> | undefined
  slug: string | undefined
}) {
  if (frontmatter?.type !== "author-profile" || slug !== "authors/karen-pendergrass") return null
  const url = identity.profiles.heavyMetalCertified
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "ProfilePage", "@id": `${url}#profile`, url,
        name: identity.name, mainEntity: { "@id": identity.personId } },
      { ...KAREN_PERSON, image: "https://heavymetalcertified.com/static/authors/karen-pendergrass-red.png" },
      { "@type": "Organization", "@id": identity.affiliations[0].id,
        name: identity.affiliations[0].name, url: identity.affiliations[0].url },
      PALEO_ORGANIZATION,
    ],
  }
  return <script type="application/ld+json" data-researcher-profile
    dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }} />
}
