export function HomeHero({ fm }: { fm: Record<string, any> }) {
  const rows: string[][] = Array.isArray(fm.home_snapshot) ? fm.home_snapshot : []
  return (
    <section class="hmtc-home-hero" aria-label="Heavy Metal Certified" data-no-cite>
      <div class="hmtc-home-hero-grid">
        <div class="hmtc-home-copy">
          <h1 class="hmtc-home-title">Published standards<br /><span>for heavy metals.</span></h1>
          <p class="hmtc-home-dek">Product-specific limits for eight priority metals. Independent laboratory testing and ongoing lot surveillance support every certification.</p>
          <nav class="hmtc-home-actions" aria-label="Explore certification">
            <a class="hmtc-home-action hmtc-home-action--primary" href="/standards/finder">Find your standard <span aria-hidden="true">→</span></a>
            <a class="hmtc-home-action" href="https://app.heavymetalcertified.com/hmt/get-started">Apply for certification <span aria-hidden="true">↗</span></a>
          </nav>
        </div>
        <aside class="hmtc-home-sidebar" aria-label="Program snapshot">
          <section class="hmtc-home-snapshot" aria-label="Program snapshot">
            <h2>Program at a glance</h2>
            <p class="hmtc-home-snapshot-date">As of {fm.home_snapshot_date}</p>
            <dl>{rows.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <a href="/standards">Explore the standards register <span aria-hidden="true">→</span></a>
          </section>
        </aside>
      </div>
    </section>
  )
}
