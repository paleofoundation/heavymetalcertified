// Shared identity, verified in HMI's September 9 author-profile record.
export const KAREN = {
  name: "Karen Pendergrass",
  orcid: "0000-0002-2348-7259",
  profile: "/authors/karen-pendergrass",
  portrait: "/static/authors/karen-pendergrass.webp",
  bio: "Standards architect and microbiome researcher connecting contaminant evidence, food exposure, and microbial metallomics.",
}

export function isKarenAuthor(fm: Record<string, unknown>, slug = ""): boolean {
  // Published standards already cite Pendergrass, K. in their generated citation.
  if (!fm.author && !fm.authors && fm.type === "standard" && slug.startsWith("standards/")) return true
  const authors = Array.isArray(fm.authors) ? fm.authors : [fm.author]
  return authors.some((name) => typeof name === "string" &&
    /^(Karen Pendergrass|Pendergrass, Karen)$/i.test(name.trim()))
}

const OrcidIcon = () => (
  <svg width="16" height="16" viewBox="0 0 256 256" aria-hidden="true" focusable="false">
    <circle cx="128" cy="128" r="128" fill="#A6CE39" />
    <path fill="#fff" d="M86.3 186.2H70.9V79.1h15.4v107.1zm22.6-107.1h41.6c39.6 0 57 28.3 57 53.6 0 27.5-21.5 53.6-56.8 53.6h-41.8V79.1zm15.4 93.3h24.5c34.9 0 42.9-26.5 42.9-39.7 0-21.5-13.7-39.7-43.7-39.7h-23.7v79.4z" />
    <circle cx="78.6" cy="56.8" r="10.1" fill="#fff" />
  </svg>
)

export function AuthorCard({ updated }: { updated?: string }) {
  return (
    <section class="hmtc-author-card" aria-label="Author">
      <div class="hmtc-author-hover" data-author-card>
        <a class="hmtc-author-portrait" href={KAREN.profile} aria-label="About Karen Pendergrass" aria-describedby="hmtc-author-summary">
          <img src={KAREN.portrait} alt="Karen Pendergrass" width="72" height="72" />
        </a>
        <section class="hmtc-author-popover" aria-label="About the author">
          <a class="hmtc-author-popover-name" href={KAREN.profile}>{KAREN.name}</a>
          <p id="hmtc-author-summary">{KAREN.bio}</p>
          <p class="hmtc-author-affiliations">Institute of Contaminant Standards · Paleo Foundation · Microbiome Medicine · WikiBiome</p>
          <a class="hmtc-author-popover-orcid" href={`https://orcid.org/${KAREN.orcid}`} target="_blank" rel="noopener noreferrer"><OrcidIcon /> {KAREN.orcid}</a>
          <a class="hmtc-author-more" href={KAREN.profile}>Biography &amp; public works <span aria-hidden="true">→</span></a>
        </section>
      </div>
      <div class="hmtc-author-details">
        <a class="hmtc-author-label" href={KAREN.profile}>Author</a>
        <div class="hmtc-author-byline">
          <a class="hmtc-author-name" href={KAREN.profile}>{KAREN.name}</a>
          <a class="hmtc-author-orcid" href={`https://orcid.org/${KAREN.orcid}`} target="_blank" rel="noopener noreferrer" aria-label={`ORCID iD ${KAREN.orcid}`} title={`ORCID iD ${KAREN.orcid}`}><OrcidIcon /></a>
        </div>
        {updated && <p class="hmtc-author-updated">Last updated: {updated}</p>}
      </div>
    </section>
  )
}
