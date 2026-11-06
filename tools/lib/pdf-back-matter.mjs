// Back-matter copy for the scholarly PDF. Kept out of the renderer module so a
// test can assert the wording without loading @react-pdf/renderer.

export function documentClass(pathSeg) {
  if (pathSeg === "synthesis") return "finding"
  if (pathSeg === "briefings") return "briefing"
  if (pathSeg === "manuals") return "manual"
  if (pathSeg === "standards") return "standard"
  return "reference"
}

export function backMatterBlocks(m) {
  const doc = documentClass(m.pathSeg)
  const pageWord = doc === "briefing" ? "briefing page" : `${doc} page`
  return [
    ["Status and licence", m.isStandard
      ? `A normative certification ${doc}, editorially reviewed and version-controlled in-house; every value traces to a named sovereign maximum level, disclosed in the derivation. ${m.licenseLine}`
      : `Editorially reviewed in-house; no external peer review has been completed on this ${doc}. Published as a preprint with its review state tracked on the article page. ${m.licenseLine}`],
    ["Competing interests", `This ${doc} is published by the Heavy Metal Tested & Certified (HMTc) program, operated by the Institute of Contaminant Standards. Its statements about government regulations, toxicology, and occurrence are sourced to the cited primary and expert-body records and to the independently maintained Heavy Metal Index; the program's own certification thresholds are not used as evidence for any factual claim made here.`],
    ["Data availability", `The works this ${doc} draws on are listed in full in the references above and on the ${pageWord} at ${m.url}. Primary legal instruments and expert-body assessments are named with their public identifiers; the underlying occurrence and toxicology corpus is maintained on the Heavy Metal Index.`],
    ["Publication history", `${m.firstPublished ? "First published " + m.firstPublished + ". " : ""}${m.revision ? "This revision " + m.revision + ". " : ""}The full dated record is maintained at ${m.url}.`],
  ]
}
