const cashBurns = [
  ["Dual labs", "Paying again to settle doubt about the first result."],
  ["Holds", "Inventory and working capital waiting for an answer."],
  ["Retailer QA loops", "Teams asking suppliers for the same proof again."],
  ["Counsel friction", "Time spent defending what a report can actually support."],
  ["Unverifiable COAs", "PDF trust where a checkable lab record should be."],
]

const proofChain = [
  { name: "HMI", question: "What’s true on floors?", detail: "The Heavy Metal Index makes the evidence and government floors traceable to their sources.", href: "https://heavymetalindex.com", action: "Read the evidence" },
  { name: "TECRID", question: "Can this lab result be checked?", detail: "A checkable record connects the result to its laboratory evidence. Core verification is free, like resolving a DOI.", href: "https://tecrid.com", action: "Check a lab record" },
  { name: "VLE", question: "Is this bounded lot QUALIFIED before the floor?", detail: "The Verified Lot Exchange checks a bounded ingredient lot against a frozen Compliance Profile before it reaches the production floor.", href: "https://vle.exchange", action: "Qualify an input lot" },
  { name: "HMTc", question: "Do the finished goods meet the published numbers?", detail: "Heavy Metal Tested & Certified evaluates the finished product against its published standard.", href: "/apply", action: "Apply for certification" },
]

export function HomeHero({ fm }: { fm: Record<string, any> }) {
  const rows: string[][] = Array.isArray(fm.home_snapshot) ? fm.home_snapshot : []
  return (
    <>
      <section class="hmtc-home-hero" aria-label="Heavy Metal Certified" data-no-cite>
        <div class="hmtc-home-hero-grid">
          <div class="hmtc-home-copy">
            <h1 class="hmtc-home-title">You’re already paying for metals failure.</h1>
            <p class="hmtc-home-dek">We move that spend upstream to checkable proof.</p>
            <p class="hmtc-home-house-line">Heavy metals in food aren’t a content problem. They’re a proof problem.</p>
            <nav class="hmtc-home-actions" aria-label="Choose your next step">
              <a class="hmtc-home-action hmtc-home-action--primary" href="https://app.heavymetalcertified.com/hmt/get-started">Start with your lot <span aria-hidden="true">↗</span></a>
              <a class="hmtc-home-action" href="#buy-the-step">Buy the step where cash burns <span aria-hidden="true">↓</span></a>
            </nav>
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
          </div>
          <aside class="hmtc-home-sidebar hmtc-cash-burn" aria-label="Brand and retailer costs">
            <h2>Already on your P&amp;L</h2>
            <p>Brands and retailers pay for missing proof in different budget lines.</p>
            <dl>{cashBurns.map(([label, detail]) => <div key={label}><dt>{label}</dt><dd>{detail}</dd></div>)}</dl>
          </aside>
        </div>
      </section>

      <section id="proof-chain" class="hmtc-sell-section" aria-labelledby="proof-chain-title" data-no-cite>
        <h2 id="proof-chain-title">Move proof ahead of the next costly decision.</h2>
        <p class="hmtc-sell-intro">HMI → TECRID → VLE → HMTc. Evidence, a checkable result, a qualified input lot, then finished-goods certification.</p>
        <ol class="hmtc-proof-chain">
          {proofChain.map((step) => <li key={step.name}>
            <span class="hmtc-sell-label">{step.name}</span>
            <h3>{step.question}</h3>
            <p>{step.detail}</p>
            <a href={step.href}>{step.action} <span aria-hidden="true">→</span></a>
          </li>)}
        </ol>
        <p class="hmtc-sell-note">A checkable lab result does not itself qualify a lot. A QUALIFIED input lot does not itself certify the finished goods. Each step answers its own question.</p>
      </section>

      <section id="buy-the-step" class="hmtc-sell-section" aria-labelledby="buy-the-step-title" data-no-cite>
        <h2 id="buy-the-step-title">Buy the step where cash burns.</h2>
        <p class="hmtc-sell-intro">TECRID core is free, like a DOI: checking the record is the starting point. Paid work completes the lot, evaluates the finished product, or handles the coordination for your team.</p>
        <div class="hmtc-buy-grid">
          <section>
            <span class="hmtc-sell-label">Completing-lot</span>
            <h3>A missing result is holding the lot.</h3>
            <p>Bring the evidence you already have. Identify what can be used and buy the sampling and testing still needed to complete the lot’s evidence.</p>
            <a href="https://app.heavymetalcertified.com/hmt/get-started">Complete your lot’s evidence <span aria-hidden="true">↗</span></a>
          </section>
          <section>
            <span class="hmtc-sell-label">Certification</span>
            <h3>Finished goods need a checkable claim.</h3>
            <p>Pay for evaluation against the published numbers and the certification process. The mark depends on the evidence meeting the applicable standard.</p>
            <a href="/apply">See certification and fees <span aria-hidden="true">→</span></a>
          </section>
          <section>
            <span class="hmtc-sell-label">White-glove</span>
            <h3>Your team is carrying the coordination.</h3>
            <p>Scope hands-on help with lab handoffs, evidence completion, and retailer QA preparation. Start with the work consuming your team’s time.</p>
            <a href="/apply#start">Scope hands-on support <span aria-hidden="true">→</span></a>
          </section>
        </div>
        <p class="hmtc-sell-note">Exploring the 10-Step Challenge? <a href="/challenge">Read the DRAFT overview</a>. Enrollment remains closed while the pending review gates are resolved.</p>
      </section>

      <section id="register-facts" class="hmtc-sell-section hmtc-register-facts" aria-label="Published register facts" data-no-cite>
        <div>
          <h2>The published numbers behind the decision.</h2>
          <p class="hmtc-sell-intro">Use the register to find the standard, analytes, basis, and edition that apply to your product. These are the reference facts behind the proof.</p>
          <a href="/briefings/the-big-8">Read about the Big 8 <span aria-hidden="true">→</span></a>
        </div>
        <section class="hmtc-home-snapshot" aria-label="Program snapshot">
          <div class="hmtc-home-snapshot-inner">
            <h2>Program at a glance</h2>
            <p class="hmtc-home-snapshot-date">As of {fm.home_snapshot_date}</p>
            <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
            <a href="/standards">Explore the standards register <span aria-hidden="true">→</span></a>
          </div>
        </section>
      </section>
    </>
  )
}
