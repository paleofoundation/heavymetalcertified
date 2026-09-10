import { AuthorCard } from "./authorIdentity"

export function HomeHero({ fm }: { fm: Record<string, any> }) {
  const rows: string[][] = Array.isArray(fm.home_snapshot) ? fm.home_snapshot : []
  return (
    <section class="hmtc-home-hero" aria-label="Heavy Metal Certified" data-no-cite>
      <div class="hmtc-home-hero-grid">
        <div class="hmtc-home-copy">
          <div class="hmtc-home-masthead">
            <img src="/static/hmtc-mark-white.svg" alt="Heavy Metal Tested and Certified" width="80" height="80" />
            <span>Published standards<br />2026 edition</span>
          </div>
          <h1 class="hmtc-home-title">Published limits.<br /><em>Verifiable certification.</em></h1>
          <p class="hmtc-home-dek">Heavy Metal Tested &amp; Certified publishes product-specific limits for eight priority metals. Independent laboratory testing and ongoing lot surveillance support every certification.</p>
          <nav class="hmtc-home-actions" aria-label="Explore certification">
            <a class="hmtc-home-action hmtc-home-action--primary" href="/standards/finder">Find your standard <span aria-hidden="true">→</span></a>
            <a class="hmtc-home-action" href="https://app.heavymetalcertified.com/hmt/get-started">Apply for certification <span aria-hidden="true">↗</span></a>
          </nav>
          <div class="hmtc-home-evidence">
            <a href="/briefings/the-big-8"><span>01</span> Eight priority metals</a>
            <a href="/program/structure"><span>02</span> Published methodology</a>
            <a href="/mark"><span>03</span> A mark you can check</a>
          </div>
        </div>
        <aside class="hmtc-home-sidebar" aria-label="Standards architect and program snapshot">
          <AuthorCard label="Standards architect" />
          <section class="hmtc-home-snapshot" aria-label="Program snapshot">
            <h2>Program snapshot</h2>
            <p class="hmtc-home-snapshot-date">As of {fm.home_snapshot_date}</p>
            <dl>{rows.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <a href="/standards">Explore the standards register <span aria-hidden="true">→</span></a>
          </section>
        </aside>
      </div>
    </section>
  )
}
