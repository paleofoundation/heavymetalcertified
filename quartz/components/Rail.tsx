import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore — inline script resolved by Quartz's esbuild loader
import citeScript from "./scripts/citeSuperscript.inline"

// The proof's right rail (.rail) for the cert site: the certificate-verify
// affordance + a compact page-provenance note. renderPage wraps it in
// <aside class="rail">. Styled by proof-design.scss (.rail …).

export default (() => {
  const Rail: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const fm = (fileData.frontmatter ?? {}) as Record<string, unknown>
    const updated = fm.updated ? String(fm.updated).slice(0, 10) : undefined
    const effective = fm.effective_date ? String(fm.effective_date).slice(0, 10) : undefined
    const version = fm.standard_version ? String(fm.standard_version) : undefined

    return (
      <>
        <div class="rail-verify">
          <h4>Verify a certificate</h4>
          <p>
            Check a lot number, certificate number or product code against the register. Public
            and open to regulators.
          </p>
          <a class="rail-verify-cta" href="/verify">
            Look up a lot
          </a>
        </div>
        <div class="card">
          <h4>Page provenance</h4>
          <div class="meta">
            {updated ? (
              <>
                Updated {updated}
                <br />
              </>
            ) : null}
            {effective ? (
              <>
                Effective {effective}
                <br />
              </>
            ) : null}
            {version ? (
              <>
                Version {version}
                <br />
              </>
            ) : null}
            Institute of Contaminant Standards
          </div>
        </div>
      </>
    )
  }
  Rail.afterDOMLoaded = citeScript
  return Rail
}) satisfies QuartzComponentConstructor
