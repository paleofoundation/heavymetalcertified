import { documentPdf, isDocument } from "./documentMetadata"

export function DocumentActions({ fm, slug }: { fm: Record<string, unknown>; slug: string }) {
  if (!isDocument(fm, slug)) return null
  const feed = `/feeds/${slug}.xml`
  return <nav class="hmtc-document-actions" aria-label="Document actions">
    <a href="#hmtc-page-citation">Cite this page</a>
    <a class="hmtc-document-pdf" href={documentPdf(fm, slug)} download>Download PDF</a>
    <details class="hmtc-follow">
      <summary>Follow <span aria-hidden="true">＋</span></summary>
      <div class="hmtc-follow-panel">
        <p>Follow this page in your RSS reader to receive its published updates.</p>
        <a href={feed} target="_blank" rel="noopener noreferrer">Open page feed ↗</a>
        <button type="button" data-copy-feed={feed}>Copy feed link</button>
        <span role="status" aria-live="polite" />
      </div>
    </details>
  </nav>
}
