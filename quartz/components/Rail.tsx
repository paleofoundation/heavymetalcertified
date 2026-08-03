import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { pathToRoot, type FullSlug } from "../util/path"

// The v3 right rail (Heavy Metal Certified v3.dc.html 585–599): a "Connections"
// list of blue cross-links, then the certificate Verify box. Emits `.hmtc-conn*`
// / `.hmtc-verify*` markup styled to the comp in cert-chrome.scss. renderPage
// wraps it in <aside class="rail">.

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
      </>
    )
  }
  return Rail
}) satisfies QuartzComponentConstructor
