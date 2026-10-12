// Resolve a category manual's DOI before build-category-manual.mjs overwrites the
// landing page. A live deposit writes the same DOI to the page cert_doi, the
// manuals manifest, and the current version-history row. The manual config may
// also carry cert_doi. The next regen has to put that DOI back on the page and
// drop the "not deposited" copy. Null stays null. Disagreeing sources throw.

const DOI_RE = /^10\.\d{4,9}\/\S+$/

export function normalizeManualDoi(value) {
  if (value == null) return null
  let s = String(value).trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1).trim()
  if (!s || s.toLowerCase() === "null") return null
  if (!DOI_RE.test(s)) return null
  return s
}

export function resolveManualCertDoi({ pageDoi = null, configDoi = null, manifestDoi = null, versionDoi = null } = {}) {
  const sources = [
    ["cert_doi", pageDoi],
    ["manual config", configDoi],
    ["manifest", manifestDoi],
    ["version history", versionDoi],
  ]
  const found = []
  for (const [name, value] of sources) {
    const doi = normalizeManualDoi(value)
    if (doi) found.push({ name, doi })
  }
  const uniq = [...new Set(found.map((f) => f.doi))]
  if (uniq.length > 1) {
    throw new Error(`manual DOI sources disagree: ${found.map((f) => `${f.name}=${f.doi}`).join("; ")}`)
  }
  return uniq[0] || null
}

// Pending-deposit sentences authored for the pre-mint page. When a DOI is
// known, each one is replaced. Text with no DOI is returned unchanged.
const SWAPS = [
  [/The manual DOI suffix \S+ is reserved for deposit\.\s*/g, ""],
  [/cert_doi on this page stays empty until that deposit\./g, (doi) => `House DOI ${doi}.`],
  [/The manual DOI is not deposited yet\./g, (doi) => `House DOI ${doi}.`],
  [/The house DOI suffix \S+ is reserved for deposit and is not yet assigned\./g, (doi) => `This edition is identified by DOI ${doi}.`],
  [/A provisional PDF edition \(values current, DOI pending\) is downloadable here; a version-pinned, DOI-registered edition follows\./g, (doi) => `A PDF edition is downloadable here. House DOI ${doi}.`],
  [/a DOI is minted on deposit/g, (doi) => `house DOI ${doi} is deposited`],
]

export function depositedCopy(text, certDoi) {
  if (!text || !certDoi) return text
  const doi = normalizeManualDoi(certDoi)
  if (!doi) return text
  let out = String(text)
  for (const [re, rep] of SWAPS) out = out.replace(re, typeof rep === "function" ? rep(doi) : rep)
  out = out.replace(/[ \t]{2,}/g, " ").replace(/ +([.])/g, "$1").trim()
  if (!out.includes(doi)) out = `${out} House DOI ${doi}.`
  if (/not deposited|stays empty|not yet assigned|reserved for deposit|DOI pending/i.test(out)) {
    throw new Error(`deposited manual copy still says the DOI is pending: ${out}`)
  }
  return out
}
