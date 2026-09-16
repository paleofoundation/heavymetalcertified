// Shared by HMTc and HMI. Keep this module dependency-free and identical in both repositories.
import crypto from "node:crypto"

const copy = (value) => structuredClone(value)
const key = (value) => String(value ?? "").trim().replace(/\s+/g, " ").toLowerCase()
const isOrcid = (id) => key(id?.nameIdentifierScheme) === "orcid"

export function requireRealText(value, label) {
  if (typeof value !== "string" || !value.trim() || /^(?:pending|todo|tbd|placeholder|your[_ -]|unknown\b)/i.test(value.trim()) || /[<>]|\$\{/.test(value)) {
    throw new Error(`${label} must be real, non-placeholder text`)
  }
  return value.trim()
}

export function normalizeOrcid(value) {
  const bare = requireRealText(value, "ORCID").replace(/^https?:\/\/orcid\.org\//i, "")
  if (!/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(bare) || /^0{4}-0{4}-0{4}-0{3}/.test(bare)) throw new Error("Invalid ORCID format")
  const digits = bare.replaceAll("-", "")
  let total = 0
  for (const digit of digits.slice(0, 15)) total = (total + Number(digit)) * 2
  const check = (12 - (total % 11)) % 11
  if (digits[15] !== (check === 10 ? "X" : String(check))) throw new Error("Invalid ORCID checksum")
  return `https://orcid.org/${bare}`
}

export function creatorDigest(value) {
  const stable = (v) => Array.isArray(v) ? v.map(stable) : v && typeof v === "object"
    ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, stable(v[k])])) : v
  return crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex")
}

export function buildResearcherCreator(identity) {
  const givenName = requireRealText(identity.givenName, "givenName")
  const familyName = requireRealText(identity.familyName, "familyName")
  const name = requireRealText(identity.citationName, "citationName")
  requireRealText(identity.name, "name")
  if (name !== `${familyName}, ${givenName}` || identity.name !== `${givenName} ${familyName}`) throw new Error("Inconsistent researcher names")
  if (!Array.isArray(identity.affiliations) || !identity.affiliations.length) throw new Error("Researcher affiliations are required")
  return {
    name, nameType: "Personal", givenName, familyName,
    nameIdentifiers: [{ nameIdentifier: normalizeOrcid(identity.orcid), nameIdentifierScheme: "ORCID", schemeUri: "https://orcid.org" }],
    // Website/entity URLs are not registry identifiers. Preserve actual identifiers in existing records below.
    affiliation: identity.affiliations.map((a) => ({ name: requireRealText(a.name, "affiliation name") })),
  }
}

export function validateCreators(creators) {
  if (!Array.isArray(creators) || !creators.length) throw new Error("At least one explicit creator is required")
  for (const c of creators) {
    if (!c || typeof c !== "object" || Array.isArray(c)) throw new Error("Creator must be an object")
    requireRealText(c.name, "creator name")
    if (c.nameType && !["Personal", "Organizational"].includes(c.nameType)) throw new Error("Invalid creator nameType")
    if (c.nameIdentifiers != null && !Array.isArray(c.nameIdentifiers)) throw new Error("nameIdentifiers must be an array")
    for (const id of c.nameIdentifiers ?? []) {
      requireRealText(id.nameIdentifierScheme, "identifier scheme")
      requireRealText(id.nameIdentifier, "identifier")
      if (isOrcid(id)) normalizeOrcid(id.nameIdentifier)
    }
    if (c.affiliation != null && !Array.isArray(c.affiliation)) throw new Error("affiliation must be an array")
    for (const a of c.affiliation ?? []) {
      requireRealText(typeof a === "string" ? a : a.name, "affiliation name")
      if (typeof a === "object" && a.affiliationIdentifier) {
        requireRealText(a.affiliationIdentifier, "affiliation identifier")
        requireRealText(a.affiliationIdentifierScheme, "affiliation identifier scheme")
      }
    }
  }
  return creators
}

// Match only the full canonical name or the canonical identifier already in metadata.
// Initials alone are intentionally insufficient. Never add Karen to a different author's record.
export function updateMatchingCreators(existing, identity) {
  if (!Array.isArray(existing) || !existing.length) throw new Error("Existing creators must be a nonempty array")
  const canonical = buildResearcherCreator(identity)
  const orcid = canonical.nameIdentifiers[0].nameIdentifier
  let matches = 0
  const result = existing.map((creator) => {
    const named = [identity.name, identity.citationName].some((n) => key(n) === key(creator.name))
    const identifiers = creator.nameIdentifiers ?? []
    if (!Array.isArray(identifiers)) throw new Error("Existing nameIdentifiers must be an array")
    const orcids = identifiers.filter(isOrcid)
    const identified = orcids.some((id) => { try { return normalizeOrcid(id.nameIdentifier) === orcid } catch { return false } })
    if (!named && !identified) return copy(creator)
    if (creator.nameType === "Organizational") throw new Error("Researcher match has organizational nameType")
    if (orcids.some((id) => normalizeOrcid(id.nameIdentifier) !== orcid)) throw new Error("Conflicting ORCID on researcher match")
    matches++
    const existingAffiliations = copy(creator.affiliation ?? [])
    if (!Array.isArray(existingAffiliations)) throw new Error("Existing affiliation must be an array")
    const remaining = existingAffiliations.map((a) => typeof a === "string" ? { name: a } : a)
    const affiliation = []
    const affiliationKey = (n) => key(n).replace(/^the /, "")
    for (const required of canonical.affiliation) {
      const index = remaining.findIndex((a) => affiliationKey(a.name) === affiliationKey(required.name))
      // Canonical names/order, with existing registry identifiers and any extra fields intact.
      affiliation.push(index < 0 ? copy(required) : { ...remaining.splice(index, 1)[0], name: required.name })
    }
    affiliation.push(...remaining)
    return {
      ...copy(creator), ...canonical, affiliation,
      nameIdentifiers: identified
        ? identifiers.map((id) => isOrcid(id) ? { ...copy(id), ...canonical.nameIdentifiers[0] } : copy(id))
        : [...copy(identifiers), ...copy(canonical.nameIdentifiers)],
    }
  })
  if (matches > 1) throw new Error("Multiple researcher matches; resolve duplicates before updating")
  return result
}

export function buildCreators(frontmatter, identity, { fallback } = {}) {
  const field = ["creators", "authors", "author"].find((name) => Object.hasOwn(frontmatter, name))
  const source = field ? frontmatter[field] : (fallback ?? [buildResearcherCreator(identity)])
  const list = Array.isArray(source) ? source : [source]
  const creators = list.map((entry) => {
    const c = typeof entry === "string" ? { name: requireRealText(entry, "creator name") } : copy(entry)
    if (!c || typeof c !== "object" || Array.isArray(c)) throw new Error("Creator must be a name or object")
    // Author frontmatter can use an ORCID shorthand. Carry it into DataCite's identifier shape,
    // and never assign a page-level author ORCID to every person in a coauthor list.
    const pageOrcid = list.length === 1 || (typeof frontmatter.author === "string" && key(frontmatter.author) === key(c.name))
      ? frontmatter.author_orcid ?? frontmatter.orcid : undefined
    const supplied = c.orcid ?? pageOrcid
    if (supplied !== undefined) {
      const orcid = normalizeOrcid(supplied)
      const identifiers = c.nameIdentifiers ?? []
      if (!Array.isArray(identifiers)) throw new Error("nameIdentifiers must be an array")
      if (identifiers.filter(isOrcid).some((id) => normalizeOrcid(id.nameIdentifier) !== orcid)) throw new Error("Conflicting author ORCID declarations")
      c.nameIdentifiers = identifiers.some(isOrcid) ? identifiers : [...identifiers, { nameIdentifier: orcid, nameIdentifierScheme: "ORCID", schemeUri: "https://orcid.org" }]
      delete c.orcid
    }
    return c
  })
  validateCreators(creators)
  return validateCreators(updateMatchingCreators(creators, identity))
}
