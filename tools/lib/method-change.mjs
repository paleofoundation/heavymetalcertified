// Canonical Method v1 → Method v2 pointer. One sentence, one URL.
// The essay lives on /program/method. Other surfaces link; they do not reprint it.

export const METHOD_PAGE_HREF = "/program/method"
export const METHOD_PAGE_URL = "https://heavymetalcertified.com/program/method"
export const METHOD_PAGE_LABEL = "Method v1 to Method v2"

export const METHOD_CONN = Object.freeze({
  label: METHOD_PAGE_LABEL,
  href: METHOD_PAGE_HREF,
})

const LINK = "#1c43ad"

export const METHOD_POINTER_HTML =
  `This is Method v2. Why Method v1 was retired is on <a href="${METHOD_PAGE_HREF}" style="color:${LINK}">the method page</a>.`

export function withMethodConn(conns = []) {
  const list = Array.isArray(conns) ? conns.slice() : []
  if (list.some((c) => c && c.href === METHOD_PAGE_HREF)) return list
  list.push({ ...METHOD_CONN })
  return list
}
