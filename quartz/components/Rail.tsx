import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot, simplifySlug, type FullSlug } from "../util/path"

// The v3 right rail (Heavy Metal Certified v3.dc.html 585–599): a "Connections"
// list of blue cross-links, then the certificate Verify box, then a discreet
// inline Share row. Emits `.hmtc-conn*` / `.hmtc-verify*` / `.hmtc-share*`
// markup styled to the comp in cert-chrome.scss. renderPage wraps it in
// <aside class="rail">.

// Discreet inline share icons (X · LinkedIn · Reddit · Facebook · Email). These
// are PLAIN LINKS with server-built hrefs — no popup, no JavaScript — so they
// always function, and the SVGs carry explicit width/height (not just CSS) so an
// icon can never balloon if styles are slow to load. Monochrome brand glyphs
// tint to the site red (#9f2727) in cert-chrome.scss. hrefs point at the page's
// absolute canonical URL, so a shared link is always the production page.
const SHARE_GLYPH: Record<string, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  reddit:
    "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z",
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  email:
    "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
}
function shareIcon(d: string) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
const SHARE_ITEMS: { key: string; label: string; external: boolean }[] = [
  { key: "x", label: "Share on X", external: true },
  { key: "linkedin", label: "Share on LinkedIn", external: true },
  { key: "reddit", label: "Share on Reddit", external: true },
  { key: "facebook", label: "Share on Facebook", external: true },
  { key: "email", label: "Email a link", external: false },
]
function ShareRow({ hrefs }: { hrefs: Record<string, string> }) {
  return (
    <div class="hmtc-share">
      <span class="hmtc-share-label">Share</span>
      {SHARE_ITEMS.map((it) => (
        <a
          class="hmtc-share-link"
          href={hrefs[it.key]}
          aria-label={it.label}
          title={it.label}
          {...(it.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {shareIcon(SHARE_GLYPH[it.key])}
        </a>
      ))}
    </div>
  )
}

export default (() => {
  const Rail: QuartzComponent = ({ fileData, cfg }: QuartzComponentProps) => {
    const slug = (fileData.slug ?? "index") as FullSlug
    const base = pathToRoot(slug)
    const fm = (fileData.frontmatter ?? {}) as Record<string, any>

    // Absolute canonical URL for the share icons (matches Head.tsx's socialUrl),
    // so a shared link is always the production page, not a relative or local one.
    const canonical = cfg?.baseUrl ? `https://${cfg.baseUrl}/${simplifySlug(slug)}` : ""
    const shareTitle = String(fm.title ?? "")
    const enc = encodeURIComponent
    const shareHrefs: Record<string, string> = {
      x: `https://twitter.com/intent/tweet?url=${enc(canonical)}&text=${enc(shareTitle)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(canonical)}`,
      reddit: `https://www.reddit.com/submit?url=${enc(canonical)}&title=${enc(shareTitle)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(canonical)}`,
      email: `mailto:?subject=${enc(shareTitle)}&body=${enc(canonical + "\n\n")}`,
    }

    // Connections: an explicit `connections:` frontmatter array wins (the ported
    // static pages set their own); otherwise repo-derived cross-links.
    let conns: { label: string; href: string }[] = []
    if (Array.isArray(fm.connections)) {
      conns = (fm.connections as any[])
        .map((c) => ({ label: String(c.label ?? c.text ?? ""), href: String(c.href ?? c.slug ?? "#") }))
        .filter((c) => c.label)
    } else {
      if (fm.hmi_literature_link) {
        conns.push({ label: "Heavy Metal Index — literature baseline", href: String(fm.hmi_literature_link) })
      }
      conns.push({ label: "The standards register", href: `${base}/standards` })
      conns.push({ label: "How limits are derived", href: `${base}/program/structure` })
      conns.push({ label: "Verify a certificate", href: `${base}/verify` })
    }

    // The call-to-action box under the connections. Defaults to the certificate
    // Verify box; a page may override it with a `rail_box:` frontmatter object
    // ({ title, body, cta_label, cta_href }) — the brands directory, for one,
    // shows a "Report a misuse of the mark" box instead.
    const boxFm = fm.rail_box && typeof fm.rail_box === "object" ? (fm.rail_box as Record<string, any>) : null
    // variant "note" is a muted dotted advisory (e.g. the remediation page's
    // "Needs confirmation"); default is the red call-to-action box.
    const variant = boxFm && boxFm.variant === "note" ? "note" : "cta"
    const box = boxFm
      ? {
          title: String(boxFm.title ?? "Verify a certificate"),
          body: String(boxFm.body ?? ""),
          ctaLabel: boxFm.cta_label != null ? String(boxFm.cta_label) : "",
          ctaHref: String(boxFm.cta_href ?? `${base}/verify`),
        }
      : {
          title: "Verify a certificate",
          body: "Check a lot number, certificate number or product code against the register. Public and open to regulators.",
          ctaLabel: "Look up a lot",
          ctaHref: `${base}/verify`,
        }

    if (variant === "note") {
      return (
        <>
          <div class="hmtc-conn-head">Connections</div>
          <div class="hmtc-conn-list">
            {conns.map((c) => (
              <a class="hmtc-conn-link" href={c.href}>
                {c.label}
              </a>
            ))}
          </div>
          <div class="hmtc-railnote">
            <div class="hmtc-railnote-label">{box.title}</div>
            <p class="hmtc-railnote-body">{box.body}</p>
          </div>
          <ShareRow hrefs={shareHrefs} />
        </>
      )
    }

    return (
      <>
        <div class="hmtc-conn-head">Connections</div>
        <div class="hmtc-conn-list">
          {conns.map((c) => (
            <a class="hmtc-conn-link" href={c.href}>
              {c.label}
            </a>
          ))}
        </div>
        <div class="hmtc-verify">
          <div class="hmtc-verify-title">{box.title}</div>
          <p class="hmtc-verify-body">{box.body}</p>
          {box.ctaLabel ? (
            <a class="hmtc-verify-cta" href={box.ctaHref}>
              {box.ctaLabel}
            </a>
          ) : null}
        </div>
        <ShareRow hrefs={shareHrefs} />
      </>
    )
  }
  return Rail
}) satisfies QuartzComponentConstructor
