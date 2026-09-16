import identity from "../../data/researcher-identity.json" with { type: "json" }

export const KAREN_PERSON = {
  "@type": "Person",
  "@id": identity.personId,
  name: identity.name,
  givenName: identity.givenName,
  familyName: identity.familyName,
  url: identity.profileUrl,
  jobTitle: identity.jobTitle,
  description: identity.description,
  knowsAbout: identity.researchTopics,
  worksFor: { "@id": identity.affiliations[0].id },
  affiliation: identity.affiliations.map(({ id, name, url }) => ({
    "@type": "Organization", "@id": id, name, url,
  })),
  sameAs: Object.values(identity.profiles),
  identifier: {
    "@type": "PropertyValue", propertyID: "ORCID",
    value: identity.orcid, url: identity.profiles.orcid,
  },
}

export const PALEO_ORGANIZATION = {
  "@type": "Organization",
  "@id": identity.affiliations[1].id,
  name: identity.affiliations[1].name,
  url: identity.affiliations[1].url,
  founder: { "@id": identity.personId },
}

export function personEntity(name = identity.name, orcid) {
  const normalizedName = String(name).trim()
  const normalizedOrcid = typeof orcid === "string"
    ? orcid.trim().replace(/^https:\/\/orcid\.org\//i, "") : undefined
  const matchesName = [identity.name, identity.citationName].some(n =>
    n.toLowerCase() === normalizedName.toLowerCase())
  if (matchesName) {
    if (normalizedOrcid && normalizedOrcid !== identity.orcid) {
      throw new Error("Karen Pendergrass has a conflicting ORCID in author metadata")
    }
    return KAREN_PERSON
  }
  if (normalizedOrcid === identity.orcid) {
    throw new Error("A different named author cannot inherit Karen Pendergrass's ORCID")
  }
  const orcidUrl = normalizedOrcid ? `https://orcid.org/${normalizedOrcid}` : undefined
  return {
    "@type": "Person", name: normalizedName,
    ...(orcidUrl ? {
      sameAs: [orcidUrl],
      identifier: { "@type": "PropertyValue", propertyID: "ORCID", value: normalizedOrcid, url: orcidUrl },
    } : {}),
  }
}
