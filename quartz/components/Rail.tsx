import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot, type FullSlug } from "../util/path"
// @ts-ignore — inline script resolved by Quartz's esbuild loader
import shareScript from "./scripts/railShare.inline"

// The v3 right rail (Heavy Metal Certified v3.dc.html 585–599): a "Connections"
// list of blue cross-links, then the certificate Verify box, then a discreet
// Share popup. Emits `.hmtc-conn*` / `.hmtc-verify*` / `.hmtc-share*` markup
// styled to the comp in cert-chrome.scss. renderPage wraps it in
// <aside class="rail">.

// The discreet rail Share popup (Copy link / X / LinkedIn / Reddit / Email),
// ported from the Heavy Metal Index rail (commit 2e5b81c0e). The trigger is a
// menu button; targets are built at runtime from the live URL by
// scripts/railShare.inline.ts, so canonical or not the link is always correct.
// Stroked line icons for the trigger + neutral actions; filled brand glyphs for
// the social targets.
const SHARE_ICON: Record<string, string> = {
  share:
    "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4",
  link: "M9 17H7A5 5 0 0 1 7 7h2 M15 7h2a5 5 0 0 1 0 10h-2 M8 12h8",
  mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
}
const SHARE_BRAND: Record<string, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  linkedin:
    "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  reddit:
    "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z",
}
function shareLineIcon(d: string) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
function shareBrandIcon(d: string) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
function ShareBlock() {
  return (
    <div class="hmtc-share" data-hmtc-share>
      <button
        type="button"
        class="hmtc-share-toggle"
        aria-haspopup="menu"
        aria-expanded="false"
        data-hmtc-share-toggle
      >
        {shareLineIcon(SHARE_ICON.share)}
        <span>Share this page</span>
      </button>
      <div class="hmtc-share-menu" role="menu" hidden data-hmtc-share-menu>
        <button type="button" class="share-item" role="menuitem" data-hmtc-share-copy>
          {shareLineIcon(SHARE_ICON.link)}
          <span>Copy link</span>
        </button>
        <a
          class="share-item"
          role="menuitem"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          data-hmtc-share-x
        >
          {shareBrandIcon(SHARE_BRAND.x)}
          <span>Share on X</span>
        </a>
        <a
          class="share-item"
          role="menuitem"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          data-hmtc-share-linkedin
        >
          {shareBrandIcon(SHARE_BRAND.linkedin)}
          <span>Share on LinkedIn</span>
        </a>
        <a
          class="share-item"
          role="menuitem"
          href="#"
          target="_blank"
          rel="noopener noreferrer"
          data-hmtc-share-reddit
        >
          {shareBrandIcon(SHARE_BRAND.reddit)}
          <span>Share on Reddit</span>
        </a>
        <a class="share-item" role="menuitem" href="#" data-hmtc-share-email>
          {shareLineIcon(SHARE_ICON.mail)}
          <span>Email a link</span>
        </a>
        <div class="hmtc-share-status" data-hmtc-share-status aria-live="polite"></div>
      </div>
    </div>
  )
}

export default (() => {
  const Rail: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = (fileData.slug ?? "index") as FullSlug
    const base = pathToRoot(slug)
    const fm = (fileData.frontmatter ?? {}) as Record<string, any>

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
          <ShareBlock />
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
        <ShareBlock />
      </>
    )
  }
  Rail.afterDOMLoaded = shareScript
  return Rail
}) satisfies QuartzComponentConstructor
