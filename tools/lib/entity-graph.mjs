import identity from "../../data/researcher-identity.json" with { type: "json" }
export { KAREN_PERSON, PALEO_ORGANIZATION, personEntity } from "./researcher-schema.mjs"

export const CERT_BASE = "https://heavymetalcertified.com"
export const CERT_ORGANIZATION_ID = `${CERT_BASE}/#organization`
export const CERT_WEBSITE_ID = `${CERT_BASE}/#website`
export const CERT_SERVICE_ID = `${CERT_BASE}/#certification`

export const ICS_BASE = "https://contaminantstandards.com"
export const ICS_ORGANIZATION_ID = `${ICS_BASE}/#organization`

export const KAREN_PROFILE_URL = identity.profileUrl
export const KAREN_PERSON_ID = identity.personId
export const KAREN_ORCID_URL = identity.profiles.orcid

export const HMI_BASE = "https://heavymetalindex.com"
export const HMI_WEBSITE_ID = `${HMI_BASE}/#website`
export const TECRID_BASE = "https://tecrid.com"
export const TECRID_WEBSITE_ID = `${TECRID_BASE}/#website`
export const TECRID_SERVICE_ID = `${TECRID_BASE}/#service`
export const ICS_LINKEDIN_URL = "https://www.linkedin.com/company/institute-of-contaminant-standards"
export const HMTC_LINKEDIN_URL = "https://www.linkedin.com/company/heavy-metal-tested-certified"
export const HMTC_FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61593815109297"

export const ICS_ORGANIZATION = {
  "@type": "Organization",
  "@id": ICS_ORGANIZATION_ID,
  name: "Institute of Contaminant Standards",
  alternateName: "ICS",
  legalName: "Paleo Certified, Inc.",
  url: ICS_BASE,
  sameAs: [ICS_LINKEDIN_URL],
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
  sameAs: [HMTC_LINKEDIN_URL, HMTC_FACEBOOK_URL],
  description:
    "The standards and certification organization for third-party heavy-metal testing of food, supplements, and supply-chain products.",
  parentOrganization: { "@id": ICS_ORGANIZATION_ID },
  founder: { "@id": KAREN_PERSON_ID },
  employee: { "@id": KAREN_PERSON_ID },
  subjectOf: { "@id": CERT_WEBSITE_ID },
  makesOffer: { "@type": "Offer", itemOffered: { "@id": CERT_SERVICE_ID } },
}
