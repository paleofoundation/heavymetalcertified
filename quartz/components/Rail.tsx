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
          <div class="hmtc-verify-title">Verify a certificate</div>
          <p class="hmtc-verify-body">
            Check a lot number, certificate number or product code against the register. Public
            and open to regulators.
          </p>
          <a class="hmtc-verify-cta" href={`${base}/verify`}>
            Look up a lot
          </a>
        </div>
      </>
    )
  }
  return Rail
}) satisfies QuartzComponentConstructor
