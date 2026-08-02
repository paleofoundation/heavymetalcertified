import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

// The v3 footer (Heavy Metal Certified v3.dc.html 2573–2597): a 1.5fr brand
// column + four link columns on a deep-red (#7f1f1f) ground, closed by a
// two-line legal bar. Column labels follow the design; every href resolves to a
// page that exists in this repo (or a one-way external), so nothing 404s.
const footerSections = [
  {
    title: "Standards",
    links: [
      ["All standards", "/standards"],
      ["Infant & Child Foods", "/manuals/infant-and-child-foods"],
      ["Program Manuals", "/manuals"],
      ["The analyte panel", "/#panel"],
      ["Standards Briefings", "/briefings"],
    ],
  },
  {
    title: "Methodology",
    links: [
      ["How limits are derived", "/program/structure"],
      ["Two remediation pathways", "/program/two-pathways"],
      ["Native basis and conversion", "/program/structure"],
      ["The five publication gates", "/program/structure"],
    ],
  },
  {
    title: "Institute",
    links: [
      ["Institute of Contaminant Standards", "https://contaminantstandards.com"],
      ["Heavy Metal Index", "https://heavymetalindex.com"],
      ["Paleo Foundation", "https://paleofoundation.com"],
    ],
  },
  {
    title: "Verify & apply",
    links: [
      ["Verify a certificate", "/verify"],
      ["Certified brands", "/brands"],
      ["Apply for certification", "/apply"],
    ],
  },
]

export default (() => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const year = new Date().getFullYear()
    return (
      <footer id="site-footer" class={`site-footer ${displayClass ?? ""}`}>
        <div class="site-footer-inner">
          <section class="site-footer-brand" aria-label="Heavy Metal Certified">
            <a class="site-footer-logo" href="/">
              Heavy Metal Certified
            </a>
            <p>
              Published heavy-metal standards, set per subcategory in each product's native basis,
              and derived from a pooled distribution of the peer-reviewed and agency literature.
            </p>
          </section>
          <nav class="site-footer-nav" aria-label="Footer">
            {footerSections.map((section) => (
              <section class="site-footer-column">
                <h2>{section.title}</h2>
                <ul>
                  {section.links.map(([text, link]) => {
                    const isExternal = /^https?:\/\//.test(link)
                    return (
                      <li>
                        <a
                          href={link}
                          {...(isExternal
                            ? { target: "_blank", rel: "noopener noreferrer", class: "site-footer-external" }
                            : {})}
                        >
                          {text}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </nav>
        </div>
        <div class="site-footer-bottom">
          <p>© {year} Paleo Certified, Inc.</p>
          <p>Operated by the Institute of Contaminant Standards.</p>
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
