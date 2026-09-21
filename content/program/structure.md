---
title: Program structure
type: program
audience: [regulator, brand-legal, retailer-compliance, certifier]
description: "How a limit is set, how a product is tested against it, and what happens when a lot fails. The rules are published in advance so that neither the program nor a brand can decide them after the result is known."
snapshot:
  - { k: "Priority metals", v: "8" }
  - { k: "Analytes tested", v: "10" }
  - { k: "Certification statuses", v: "4" }
  - { k: "Baseline lots required", v: "3" }
connections:
  - { label: "Method v1 to Method v2", href: "/program/method" }
  - { label: "The subcategory standards register", href: "/standards" }
  - { label: "Program Manual, 2026 Edition", href: "/manuals" }
  - { label: "Verify a certificate", href: "/verify" }
  - { label: "Institute of Contaminant Standards", href: "https://contaminantstandards.com" }
rail_box:
  title: "Apply"
  body: "348 subcategory standards are in force across 34 categories, and 320 already carry a firm limit, with more clearing each edition."
  cta_label: "Start an application"
  cta_href: "/apply"
---

<section id="method-edition" class="hmtc-section">
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">This is Method v2. Why Method v1 was retired is on <a href="/program/method" style="color:#1c43ad">the method page</a>.</p>
</section>

<section id="panel" class="hmtc-section">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">The analyte panel</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">Eight priority metals, tested as ten analytes because arsenic and chromium are speciated to the toxic form; methylmercury is a conditional eleventh, speciated by reflex on trigger and bounded by the total-mercury limit. Every claim analyte is equal at the gate. Pass or fail is 100% of the published government floor or disclosed read-across. An exceedance on any metal enters Remediation and carries no mark.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1px;background:#e8e1db;border:1px solid #e8e1db;margin-bottom:16px">
    <div style="background:#fffdfb;padding:19px">
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:10px">
        <span style="font-family:Lora,serif;font-size:20px;color:#2b1f1f">Eight totals</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;background:#fdf4f3;border:1px solid #f2dcda;border-radius:2px;padding:3px 8px;white-space:nowrap">Pb &middot; Cd &middot; tAs &middot; tHg &middot; Ni &middot; Sn &middot; Al &middot; Cr</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0 0 12px">The claim-surface panel. Lead, cadmium, inorganic arsenic, and mercury may be named as priority toxics for toxicological clarity; that label is not a status ladder. Every published limit binds the same way.</p>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Overage allowed</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">none</span></div>
    </div>
    <div style="background:#fffdfb;padding:19px">
      <div style="display:flex;align-items:baseline;gap:12px;margin-bottom:10px">
        <span style="font-family:Lora,serif;font-size:20px;color:#2b1f1f">Pathway species</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;background:#fdf4f3;border:1px solid #f2dcda;border-radius:2px;padding:3px 8px;white-space:nowrap">iAs &middot; MeHg &middot; Cr(VI)</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0 0 12px">Speciation is a pathway reflex. The species result never replaces the parent total; both ceilings must be met. Any quantifiable hexavalent chromium on a credible pathway is a hard fail.</p>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Overage allowed</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">none</span></div>
    </div>
  </div>
  <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch">Cr(III) is an essential nutrient and is assumed in food; Cr(VI) is an IARC Group&nbsp;1 carcinogen by ingestion. Speciation fires where a credible hexavalent pathway exists; it does not create a second certification track.</p>
</section>

<section id="calibration" class="hmtc-section">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">How a limit is set</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">The default limit for any analyte is the strictest maximum level set by a credible government regulator, the EU, Codex, the FDA, WHO/JECFA, FSANZ, or Health Canada, converted to the row&rsquo;s native basis. It is a lookup, not a computation: most claim analytes take that government value directly, and where the law splits a limit by formulation the standard adopts the law&rsquo;s own split and cites it. The percentile machinery below runs only where the program sets a number itself: the four priority toxics, floored against the government maximum so the published value is the stricter of the two, and the cells no government regulates. That is how a number is set. It is not a second certification track.</p>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">For those occurrence-set cells, subcategories are paired. Within a pair, one form carries a structurally higher contamination burden than the other: rice cereal against non-rice, soy formula against cow-milk, root vegetables against above-ground. Pooling the pair would raise the clean limit and flatter the dirty one in the same move, so they are separated.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;margin-bottom:16px">
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">P97</span>
        <span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">Clean subcategory</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">The lower-burden form within a pair: non-rice cereal, cow-milk formula, above-ground vegetables. Where the program sets this cell from occurrence rather than a government limit, the limit sits at the 97th percentile of the pooled distribution.</p>
    </div>
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">P45</span>
        <span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">Dirty subcategory</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">The structurally higher-burden form: rice cereal, soy formula, root vegetables, fish-containing. A far tighter percentile, because the point is to separate the better operators within a hard category rather than bless the category.</p>
    </div>
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">P97</span>
        <span style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f">Independent row</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">A subcategory with no within-pair partner defaults to P97.</p>
    </div>
  </div>
  <div style="border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px">
    <p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0">The percentile is a calibration choice, disclosed as one. A brand certifies a row of ten analytes at once, so per-analyte limits set at a raw P90 would produce a joint pass rate near 35%. For the occurrence-set cells only, the priority toxics floored against the government maximum, and the cells no government regulates, P97 and P45 are the values that deliver the program&rsquo;s stated row-level outcomes: roughly 90% of clean-subcategory brands and 40% of dirty-subcategory brands pass, confirmed at 94% and 42% against FDA per-sample lot data. A subcategory whose every published limit binds on a government maximum has no percentile-set cell, and this calibration does not touch it: infant formula powder is one, with all eight of its published values set by government lookup.</p>
  </div>
  <div style="border:1px solid #e8e1db;background:#fffdfb;padding:20px 22px;margin-top:16px">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:10px">Why we publish the pass rate</div>
    <p style="font-size:15px;line-height:1.75;color:#3f3a3a;margin:0 0 14px;max-width:74ch">We are not aware of another certifier that publishes this number, and disclosing it invites an obvious reading: that the threshold was set to a commercial outcome rather than a health one. The reading is worth answering directly, because the alternative, not saying it, does not make the calibration disappear. It only makes it undiscoverable.</p>
    <p style="font-size:15px;line-height:1.75;color:#3f3a3a;margin:0 0 14px;max-width:74ch">Every percentile-based standard in food safety embeds a pass rate. Codex maximum levels, EU regulation 2023/915 and FDA action levels are all set against achievability, using occurrence data and explicit statements about what industry can meet. The choice is never whether a pass rate exists; it is whether the body setting the limit tells you what it is.</p>
    <p style="font-size:15px;line-height:1.75;color:#3f3a3a;margin:0;max-width:74ch">The health-based floor is separate and binds first: no published value ever exceeds the lowest applicable regulatory ceiling in that basis. The calibration operates only in the space beneath that ceiling, where the literature alone does not determine a single number. Where the ceiling binds, the rationale tag reads <span style="font-family:'IBM Plex Mono',monospace;font-size:13px;color:#9f2727">regulatory-alignment</span> and where an occurrence pool exists beneath a binding ceiling the pooled value is shown so the gap is visible. On infant formula powder no cell is occurrence-set: every published value binds directly on a government maximum: lead on the EU&rsquo;s 20 ppb.</p>
  </div>
</section>

<section id="basis" class="hmtc-section">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">Native basis</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">Every standard is published in the form the product is actually sold in: powder as placed on market, ready-to-feed as consumed, dry cereal as sold, pur&eacute;e as consumed. A brand ships and tests in one form, and the mark matches that form.</p>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">Sources reporting in another basis are converted inward during pooling, using documented factors: never the reverse. Where a cross-basis equivalent is shown next to a published value it is a reading convenience for audiences working in other units, not a second standard a brand may choose between.</p>
</section>

<section id="gates" class="hmtc-section">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">Publication gates</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">A per-analyte value publishes only when it clears every gate below. A cell that fails any one of them stays unpublished rather than shipping with a caveat.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;margin-bottom:16px">
    <div style="padding:16px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:7px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Gate 01</span>
        <span style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f">Sufficient pool</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">For a cell the program sets from occurrence: the priority toxics and the analytes no government regulates: enough contributing sources for the pooled distribution to mean something, with no single survey exceeding 50% relative share.</p>
    </div>
    <div style="padding:16px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:7px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Gate 02</span>
        <span style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f">Native basis resolved</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">Every contributing source converted into the row&rsquo;s native basis using a documented factor, with the conversion recorded.</p>
    </div>
    <div style="padding:16px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:7px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Gate 03</span>
        <span style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f">Regulatory ceiling loaded</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">The strictest applicable government maximum identified and expressed in the row&rsquo;s basis. For most analytes it is the standard; for a priority toxic it is the floor the occurrence value is capped against. Certification still requires 100% of the published number, whichever way it was set.</p>
    </div>
    <div style="padding:16px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:7px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Gate 04</span>
        <span style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f">Analytical feasibility</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">The value must be measurable. Where the limit of quantitation binds above the pooled value, the limit is feasibility-driven and says so.</p>
    </div>
    <div style="padding:16px 19px;border-bottom:1px solid #f2ece7">
      <div style="display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:7px">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:#9f2727;white-space:nowrap">Gate 05</span>
        <span style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f">Rationale tagged</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">Exactly one of literature-baseline, regulatory-alignment, feasibility-driven or precautionary. An untagged value does not publish.</p>
    </div>
  </div>
  <div style="border:1px dotted #e8e1db;background:#faf7f4;padding:15px 18px">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:7px">Gate names not quoted verbatim</div>
    <p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">These are the program&rsquo;s stated publication conditions, drawn from the manual&rsquo;s methodology sections. The manual refers to &ldquo;publication gates&rdquo; without a single numbered list, so the names here are descriptive rather than quoted.</p>
  </div>
</section>

<section id="statuses" class="hmtc-section">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">The four statuses</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">Defined in Program Manual Part 2. A status attaches to a product, not to a brand, and it is visible on the certificate. Certified is the only status that carries the mark.</p>
  <div style="overflow-x:auto">
  <table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:42rem;border-collapse:collapse">
    <thead><tr style="background:#9f2727;color:#fff">
      <th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Status</th>
      <th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Meaning</th>
      <th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Mark usable</th>
      <th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Condition</th>
    </tr></thead>
    <tbody>
      <tr>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">Certified</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#2b1f1f">Full compliance</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#3f3a3a">yes</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b;line-height:1.55">At or below every value in the Master Limit Table, all ten analytes, native basis, confirmed under the measurement-uncertainty rule.</td>
      </tr>
      <tr>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">Remediation</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#2b1f1f">Not certified: applicant or corrective</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#3f3a3a">no</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b;line-height:1.55">Any analyte above its published limit, or a new applicant not yet at 100%. Not a softer certification and not an allowed overage: no mark, not listed as certified. Corrective action and intensified surveillance apply the same way on every claim analyte. The Confidential Remediation Track is the confidential form of this status and is likewise unmarked.</td>
      </tr>
      <tr>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">Suspension</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#2b1f1f">Certification halted: hard stop</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#3f3a3a">no</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b;line-height:1.55">A government legal-limit violation, a data-integrity failure, or failure to execute testing, CAPA, or directives. The mark is removed from all units and marketing. Reinstatement requires a completed CAPA with verified effectiveness, a run of consecutive compliant lots set by the Program Operator, and restored data integrity: not a fresh baseline.</td>
      </tr>
      <tr>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">Revocation</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#2b1f1f">Permanent termination</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;font-size:12px;color:#3f3a3a">no</td>
        <td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b;line-height:1.55">Willful misconduct, data fraud, concealment of a known exceedance, or persistent unremediated suspension. Re-entry by full re-application only.</td>
      </tr>
    </tbody>
  </table>
  </div>
  <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:14px 0 0">The mark is never displayed above the published limit, on any metal, at any margin. There is no transitional band and no allowed overage: a product above any published limit is not Certified and carries no mark. Every claim analyte is equal at the gate.</p>
</section>

<section id="surveillance" class="hmtc-section">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">Lot surveillance</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">Certification is continuous. Every SKU entering the program is tested across a minimum of three production lots to establish a baseline before any status is assigned at all: a single passing lot certifies nothing.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;margin-bottom:16px">
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Baseline before any status</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">3 lots minimum</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Qualifying prior accredited data</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">credits up to 2 lots</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Certified</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">routine protocol</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Remediation (any claim-analyte exceedance)</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">every-lot, hold-and-release</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Speciation</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">on reflex trigger</span></div>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Chain of custody</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">documented per lot</span></div>
  </div>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">A brand that already runs a mature, accredited lot-testing program does not repeat work it has already done. Up to two of the three baseline lots may be credited to qualifying prior results, and the baseline is completed with a single new full-panel lot that the program sizes and runs. This is the expedited baseline. Prior results qualify only where they come from an ISO/IEC 17025-accredited laboratory, are quantified at or below the program's reporting limit, were produced within the preceding twelve months, are supplied as structured data under chain of custody, are expressed in or convertible to the product's native basis, and are credited only for the analytes they actually measured. The completing lot is sampled independently and run across the full panel, including every analyte the prior data did not cover, so no analyte enters the baseline on a brand's word alone; where a single analyte rests on that one completing lot, the next two routine surveillance lots confirm it. The credit is available at ordinary program entry, not on the confidential remediation track.</p>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">Surveillance intensity follows status: routine while Certified; in Remediation it is every-lot with mandatory hold-and-release, on any claim analyte. Reflex testing triggers add speciation when a result or a formulation change indicates a credible pathway, and sampling follows a documented chain of custody so a result can survive challenge years later.</p>
  <div style="border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px">
    <p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0">The readiness and corrective-action pathways exist so a brand that finds a problem is better off reporting it than concealing it. While a self-reported item is open and on schedule, its register visibility and retailer disclosure follow the published status rules; a released lot confirmed above its applicable limit on product represented as certified is never shielded from a required register status change or from retailer, withdrawal, or recall action. A brand that conceals a known exceedance loses its certificate.</p>
  </div>
</section>

<section id="pathways" class="hmtc-section">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">Two remediation pathways</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">When a lot falls short, a brand chooses how the correction is handled. Both routes require the same corrective action and the same re-testing; what differs is who sees it, and what the brand gets in return for that visibility.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(19rem,1fr));gap:1px;background:#e8e1db;border:1px solid #e8e1db;margin-bottom:16px">
    <div style="background:#fffdfb;padding:19px">
      <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-family:Lora,serif;font-size:20px;line-height:1.3;color:#2b1f1f">Confidential track</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;background:#fdf4f3;border:1px solid #f2dcda;border-radius:2px;padding:3px 8px;white-space:nowrap">default</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0 0 14px">The finding, the affected lots and the corrective action stay between the brand and the program while the item is open and on schedule. Register visibility, retailer disclosure, and the effect on the certificate all follow the published status rules, according to whether the affected lot was released and whether the product is currently represented as certified; a released lot confirmed above its applicable limit is never shielded from a required register status change or from retailer, withdrawal, or recall action.</p>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:6px">What the brand gets</div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Visible in register</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">per status rules</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Disclosed to retailers</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">per status rules</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Certificate effect</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">per status rules</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Corrective action</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">required</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Re-testing</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">required</span></div>
    </div>
    <div style="background:#fffdfb;padding:19px">
      <div style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:10px">
        <span style="font-family:Lora,serif;font-size:20px;line-height:1.3;color:#2b1f1f">Public track</span>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#9f2727;background:#fdf4f3;border:1px solid #f2dcda;border-radius:2px;padding:3px 8px;white-space:nowrap">elective</span>
      </div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0 0 14px">The brand elects to publish the finding and its remediation on its own brand page. The record shows what was found, what was done and when it closed: a documented history of catching and fixing a problem rather than an unexplained gap.</p>
      <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:6px">What the brand gets</div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Visible in register</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">yes, with outcome</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Citable by the brand</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">yes</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Retailer questionnaire</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">answers itself</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Corrective action</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">required</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Re-testing</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">required</span></div>
    </div>
  </div>
  <div style="border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px;margin-bottom:16px">
    <p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0">Neither route is a way out of the corrective action. The choice is about disclosure, and it exists because a program that punished self-reporting would simply stop being told anything: which would make the mark worth less, not more.</p>
  </div>
  <a href="/program/remediation" style="display:inline-block;background:#9f2727;color:#fff;font-size:12.5px;padding:9px 15px;border-radius:3px;text-decoration:none">Readiness and corrective action &rarr;</a>
</section>

<section id="governance">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px">Governance</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">The program is operated and governed by the <a href="https://contaminantstandards.com" style="color:#1c43ad">Institute of Contaminant Standards (ICS)</a>, which sets how limits are established without testing products or selling marks itself.</p>
  <div style="border:1px solid #e8e1db;background:#fffdfb;margin-bottom:16px">
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7">
      <div style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">The Institute of Contaminant Standards</div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">Governs how limits are set. It does not test products, sell marks, or publish threshold values or brand-level data itself: that separation is what lets it arbitrate.</p>
    </div>
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7">
      <div style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">Technical Committee</div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">Toxicology, food-safety and analytical-chemistry experts with documented independence from licensees. Reviews methodology and the panel. It reports recommendations; it does not render binding decisions.</p>
    </div>
    <div style="padding:17px 19px;border-bottom:1px solid #f2ece7">
      <div style="font-family:Lora,serif;font-size:19px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">Independent Appeals Committee</div>
      <p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0;max-width:74ch">Holds binding review authority on contested certification decisions. The Program Operator retains final authority on classification and methodology, subject to that review.</p>
    </div>
  </div>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:var(--prose-max)">Substantive changes to a published limit run through the Standards Ratchet Mechanism, which requires a stated trigger and caps how far a limit may move in a single step. Limits tighten as evidence and analytical feasibility improve.</p>
</section>
