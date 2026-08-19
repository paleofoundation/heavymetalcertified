---
title: Verify a certificate
type: verify
audience: [regulator, consumer, retailer-compliance]
description: "Check a lot number, a certificate number or a product code against the register. One query returns one record: what it was certified against, on which analyte panel, in which basis, and whether that certificate is in force today."
snapshot:
  - { k: "Certificates in force", v: "0" }
  - { k: "Standards available", v: "15" }
  - { k: "Register opened", v: "pending" }
  - { k: "Lookup routes", v: "3" }
connections:
  - { label: "The standard this certifies against", href: "/standards" }
  - { label: "Mark usage and scope", href: "/program/structure" }
  - { label: "Apply for certification", href: "/apply" }
  - { label: "Heavy Metal Index: evidence base", href: "https://heavymetalindex.com" }
---

<section id="lookup" style="margin-bottom:52px">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Look up a certificate</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">Three routes into the same record. A lot number is the one printed on the pack; a certificate number appears on the license and in brand communications; a product code is the GTIN or UPC.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(13rem,1fr));gap:1px;background:#e8e1db;border:1px solid #e8e1db;margin-bottom:16px">
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:8px">Lot number</div><p style="font-size:13px;line-height:1.6;color:#736b6b;margin:0 0 12px">Printed on the pack, usually near the best-before date.</p><div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#a9a1a1;border:1px dotted #e8e1db;background:#faf7f4;padding:8px 10px">L2604-118A</div></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:8px">Certificate number</div><p style="font-size:13px;line-height:1.6;color:#736b6b;margin:0 0 12px">On the license and in the brand&rsquo;s permissions letter.</p><div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#a9a1a1;border:1px dotted #e8e1db;background:#faf7f4;padding:8px 10px">HMTC-IF-0001</div></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:8px">Product code</div><p style="font-size:13px;line-height:1.6;color:#736b6b;margin:0 0 12px">The GTIN or UPC as sold at retail.</p><div style="font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:#a9a1a1;border:1px dotted #e8e1db;background:#faf7f4;padding:8px 10px">0 12345 67890 5</div></div>
  </div>
  <label for="certificate-lookup" style="display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#736b6b;margin:0 0 7px">Certificate lookup</label>
  <div style="display:flex;align-items:stretch;border:2px solid #c9bdb8;max-width:38rem;overflow:hidden;background:#faf7f4">
    <input id="certificate-lookup" name="certificate_lookup" type="text" autocomplete="off" placeholder="Lot, certificate or product code" aria-describedby="certificate-lookup-status" disabled style="flex:1 1 auto;min-width:0;border:0;outline:none;font:inherit;font-size:15px;padding:13px 15px;color:#736b6b;background:transparent" />
    <button type="button" disabled aria-disabled="true" style="border:0;background:#736b6b;color:#fff;font:inherit;font-family:'IBM Plex Mono',monospace;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;padding:0 20px;cursor:not-allowed">Pending</button>
  </div>
  <p id="certificate-lookup-status" role="status" style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:12px 0 0">Lookup will open when the first certificate is issued. The register will require one exact lot, certificate or product code; it will not support wildcard or multi-brand browsing.</p>
</section>

<section id="record" style="margin-bottom:52px">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">The record</h2>
  <div style="border:1px dotted #e8e1db;background:#faf7f4;padding:15px 18px;margin-bottom:20px">
    <div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#a9a1a1;margin-bottom:7px">Specimen: no certificates issued yet</div>
    <p style="font-size:13px;line-height:1.65;color:#a9a1a1;margin:0">The register opens with the first certificate issued against a published subcategory standard. The record below shows the shape a real result takes, with a placeholder holder name. It is a specimen, not a certified product.</p>
  </div>
  <div style="border:1px solid #e8e1db;background:#fffdfb;margin-bottom:16px">
    <div style="display:flex;align-items:baseline;justify-content:space-between;gap:20px;padding:14px 18px;border-bottom:1px solid #e8e1db;background:#fdf4f3">
      <div><div style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9f2727;margin-bottom:6px">Certificate in force</div><div style="font-family:Lora,serif;font-size:20px;line-height:1.3;color:#2b1f1f">&lt;Brand name&gt;: Stage&nbsp;1 Infant Formula, Powder</div></div>
      <span style="font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.08em;text-transform:uppercase;color:#fff;background:#9f2727;border:1px solid #9f2727;border-radius:2px;padding:3px 8px;white-space:nowrap">Conformant</span>
    </div>
    <div style="padding:16px 18px 14px">
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Certificate number</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">HMTC-IF-0001</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Holder</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">&lt;Brand name&gt;</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Product</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">Stage 1 Infant Formula, Powder</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Standard applied</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">HMTc Part 3.1 &middot; 2026 Edition</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Analyte panel</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">10 analytes</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Basis</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">powder as placed on market</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Certification status</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">Compliant</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Laboratory</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">ISO/IEC 17025 accredited</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0;border-bottom:1px dotted #f2ece7"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Issued</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">2026-05-18</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:baseline;padding:10px 0"><span style="font-size:13px;line-height:1.5;color:#3f3a3a">Valid through</span><span style="font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:#9f2727;white-space:nowrap">2027-05-18</span></div>
      <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:14px 0 0">Threshold values are deliberately absent here. The certificate asserts conformity to a named, versioned standard; the numbers live on that standard so a single source governs them.</p>
    </div>
  </div>
  <div style="border-left:3px solid #9f2727;background:#fdf4f3;padding:18px 22px">
    <p style="font-size:15.5px;line-height:1.75;color:#5a4141;margin:0">What this record asserts: that the named product was tested at or below every value in the named standard, on the stated analyte panel, in the stated basis, by an accredited laboratory, within the stated period. What it does not assert: that the product is safe, that analytes outside the panel were controlled, or anything at all about a product form other than the one named.</p>
  </div>
</section>

<section id="lots" style="margin-bottom:52px">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">Lot surveillance</h2>
  <p style="font-size:13.5px;line-height:1.7;color:#736b6b;margin:0 0 20px;max-width:84ch">Certification is continuous, not a single pass. Each lot tested under the program appears here with its date, its laboratory and the panel run: the contemporaneous, independent record that makes a certificate defensible years later.</p>
  <div style="overflow-x:auto">
  <table style="width:100%;font-size:13.5px;border:1px solid #e8e1db;min-width:44rem">
    <thead><tr style="background:#9f2727;color:#fff"><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Lot</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Sampled</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Laboratory</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Panel run</th><th style="text-align:left;padding:11px 15px;font-family:'IBM Plex Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase">Outcome</th></tr></thead>
    <tbody>
      <tr><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">L2604-118A</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">2026-04-28</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b">Accredited third party</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">10 of 10</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#3f3a3a">Conformant to Part 3.1</td></tr>
      <tr><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">L2605-131B</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">2026-05-11</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b">Accredited third party</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">10 of 10</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#3f3a3a">Conformant to Part 3.1</td></tr>
      <tr><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">L2606-144A</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">2026-06-02</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b">Accredited third party</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">10 of 10</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#3f3a3a">Conformant to Part 3.1</td></tr>
      <tr><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;white-space:nowrap;color:#2b1f1f;font-family:'IBM Plex Mono',monospace">L2607-159C</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">2026-07-19</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#736b6b">Accredited third party</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;font-family:'IBM Plex Mono',monospace;color:#3f3a3a">10 of 10</td><td style="padding:13px 15px;vertical-align:top;border-bottom:1px solid #f2ece7;color:#3f3a3a">Conformant to Part 3.1</td></tr>
    </tbody>
  </table>
  </div>
  <p style="font-size:11.5px;line-height:1.55;color:#a9a1a1;max-width:84ch;margin:14px 0 0">Specimen rows. Outcome is stated as conformity to the standard in force at the sampling date, never as a measured concentration: per-lot values are the brand&rsquo;s confidential data and are not published.</p>
</section>

<section id="regulators">
  <h2 style="font-family:Lora,serif;font-weight:400;font-size:30px;line-height:1.2;color:#2b1f1f;border-bottom:1px solid #e8e1db;padding-bottom:10px;margin:0 0 20px">For regulators</h2>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">A regulator or a state attorney general needs three things from a certifier: the standard a product was held to, the evidence that standard rests on, and the ability to check both without asking permission. All three are public here.</p>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(17rem,1fr));gap:1px;background:#e8e1db;border:1px solid #e8e1db;margin-bottom:20px">
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">The standard, in full</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Every threshold, its pooled value before rounding, the rationale tag, the contributing source count and the sensitivity band. Published, versioned and dated.</p></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">The evidence beneath it</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Each limit traces to source records on the Heavy Metal Index, which is operated separately and does not depend on this program.</p></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">The gap, named</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Where a limit sits tighter or looser than the literature strictly supports, the standard says so and says why. Nothing is asserted as settled that is not.</p></div>
    <div style="background:#fffdfb;padding:18px 19px"><div style="font-family:Lora,serif;font-size:18px;line-height:1.3;color:#2b1f1f;margin-bottom:8px">The conformity record</div><p style="font-size:14px;line-height:1.7;color:#3f3a3a;margin:0">Lot-level laboratory reports and chain of custody are produced to a regulator on request, without a subpoena.</p></div>
  </div>
  <p style="font-size:16.5px;line-height:1.78;color:#3f3a3a;margin:0 0 18px;max-width:72ch">Requests for the full lot-level record behind a certificate, including laboratory reports and chain of custody, are handled directly. The program does not require a subpoena to produce its own conformity evidence to a regulator.</p>
</section>
