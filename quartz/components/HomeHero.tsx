export function HomeHero({ fm }: { fm: Record<string, any> }) {
  const rows: string[][] = Array.isArray(fm.home_snapshot) ? fm.home_snapshot : []
  return (
    <section class="hmtc-home-hero" aria-label="Heavy Metal Certified" data-no-cite>
      <div class="hmtc-home-hero-grid">
        <div class="hmtc-home-copy">
          <h1 class="hmtc-home-title">Published standards<br /><span>for heavy metals.</span></h1>
          <p class="hmtc-home-dek">Product-specific limits for eight priority metals. Independent laboratory testing and ongoing lot surveillance support every certification.</p>
          <div id="site-search" class="hmtc-hero-search">
            <form class="hmtc-search-form" role="search" aria-label="Search the site" action="/" method="get">
              <label class="hmi-sr-only" for="site-search-input">Search standards, briefings and analytes</label>
              <div class="hmtc-search-field">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
                <input id="site-search-input" name="q" type="search" placeholder="Search standards, briefings, analytes…" autocomplete="off" aria-describedby="site-search-status" aria-controls="site-search-results" />
                <button type="submit">Search</button>
              </div>
            </form>
            <div class="hmtc-search-response" hidden>
              <div id="site-search-status" class="hmtc-search-status" role="status" aria-live="polite"></div>
              <ul id="site-search-results" class="hmtc-search-results" aria-label="Search results" hidden></ul>
            </div>
          </div>
          <nav class="hmtc-home-actions" aria-label="Explore certification">
            <a class="hmtc-home-action hmtc-home-action--primary" href="https://app.heavymetalcertified.com/hmt/get-started">Get Started</a>
            <a class="hmtc-home-action" href="/briefings/the-big-8">The Big 8</a>
            <a class="hmtc-home-action" href="/challenge">10-Step Challenge</a>
          </nav>
        </div>
        <aside class="hmtc-home-sidebar" aria-label="Program snapshot">
          <section class="hmtc-home-snapshot" aria-label="Program snapshot">
            <div class="hmtc-home-snapshot-inner"><h2>Program at a glance</h2>
            <p class="hmtc-home-snapshot-date">As of {fm.home_snapshot_date}</p>
            <dl>{rows.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <a href="/standards">Explore the standards register <span aria-hidden="true">→</span></a></div>
          </section>
        </aside>
      </div>
    </section>
  )
}
