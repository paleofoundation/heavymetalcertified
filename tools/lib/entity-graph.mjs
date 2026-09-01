export const CERT_BASE = "https://heavymetalcertified.com"
export const CERT_ORGANIZATION_ID = `${CERT_BASE}/#organization`
export const CERT_WEBSITE_ID = `${CERT_BASE}/#website`
export const CERT_SERVICE_ID = `${CERT_BASE}/#certification`

export const ICS_BASE = "https://contaminantstandards.com"
export const ICS_ORGANIZATION_ID = `${ICS_BASE}/#organization`

export const KAREN_PROFILE_URL = `${ICS_BASE}/people/karen-pendergrass`
export const KAREN_PERSON_ID = `${KAREN_PROFILE_URL}#person`
export const KAREN_ORCID_URL = "https://orcid.org/0000-0002-2348-7259"

export const HMI_BASE = "https://heavymetalindex.com"
export const HMI_WEBSITE_ID = `${HMI_BASE}/#website`
export const TECRID_BASE = "https://tecrid.com"
export const TECRID_WEBSITE_ID = `${TECRID_BASE}/#website`
export const TECRID_SERVICE_ID = `${TECRID_BASE}/#service`
export const LEGACY_HMTC_BASE = "https://heavymetaltested.com"

export const KAREN_PERSON = {
  "@type": "Person",
  "@id": KAREN_PERSON_ID,
  name: "Karen Pendergrass",
  url: KAREN_PROFILE_URL,
  jobTitle: "Founder, Chief Executive Officer, Standards Architect, and Research Lead",
  worksFor: { "@id": ICS_ORGANIZATION_ID },
  affiliation: { "@id": CERT_ORGANIZATION_ID },
  sameAs: [KAREN_ORCID_URL],
  identifier: {
    "@type": "PropertyValue",
    propertyID: "ORCID",
    value: "0000-0002-2348-7259",
    url: KAREN_ORCID_URL,
  },
}

export const ICS_ORGANIZATION = {
  "@type": "Organization",
  "@id": ICS_ORGANIZATION_ID,
  name: "Institute of Contaminant Standards",
  alternateName: "ICS",
  legalName: "Paleo Certified, Inc.",
  url: ICS_BASE,
  founder: { "@id": KAREN_PERSON_ID },
  employee: { "@id": KAREN_PERSON_ID },
  subOrganization: { "@id": CERT_ORGANIZATION_ID },
  hasPart: [
    { "@type": "WebSite", "@id": HMI_WEBSITE_ID, name: "Heavy Metal Index", url: HMI_BASE },
    { "@type": "WebSite", "@id": TECRID_WEBSITE_ID, name: "TECRID", url: TECRID_BASE },
  ],
}

export const CERT_ORGANIZATION = {
  "@type": "Organization",
  "@id": CERT_ORGANIZATION_ID,
  name: "Heavy Metal Tested & Certified",
  alternateName: ["HMTc", "Heavy Metal Certified", "Heavy Metal Tested"],
  url: CERT_BASE,
  sameAs: [LEGACY_HMTC_BASE],
  description:
    "The standards and certification organization for third-party heavy-metal testing of food, supplements, and supply-chain products.",
  parentOrganization: { "@id": ICS_ORGANIZATION_ID },
  founder: { "@id": KAREN_PERSON_ID },
  employee: { "@id": KAREN_PERSON_ID },
  subjectOf: { "@id": CERT_WEBSITE_ID },
  makesOffer: { "@type": "Offer", itemOffered: { "@id": CERT_SERVICE_ID } },
}

export function personEntity(name = "Karen Pendergrass", orcid = "0000-0002-2348-7259") {
  const orcidUrl = orcid ? `https://orcid.org/${orcid}` : null
  if (name === "Karen Pendergrass" || orcidUrl === KAREN_ORCID_URL) return KAREN_PERSON
  return {
    "@type": "Person",
    name,
    ...(orcidUrl
      ? {
          url: orcidUrl,
          sameAs: [orcidUrl],
          identifier: { "@type": "PropertyValue", propertyID: "ORCID", value: orcid, url: orcidUrl },
        }
      : {}),
  }
}
