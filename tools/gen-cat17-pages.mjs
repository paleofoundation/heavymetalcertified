#!/usr/bin/env node
// gen-cat17-pages.mjs — reconstruct data/standards/cat17-pages.json (Pet Foods) so the generic
// build-category-standard-pages.mjs renderer can regenerate the pet-food standard pages from the
// now-complete cat17-compiled records. Per-page display metadata is lifted from the existing
// content/standards/<slug>.md frontmatter; _meta mirrors the sibling food categories.
import fs from "node:fs";
import path from "node:path";
const REPO = process.cwd();
const COMPILED = "data/standards/cat17-compiled";
const CONTENT = "content/standards";
const fm = (s) => { const m = s.match(/^---\n([\s\S]*?)\n---/); if (!m) return {}; const o = {}; for (const line of m[1].split("\n")) { const mm = line.match(/^([a-z_]+):\s*(.*)$/i); if (mm) o[mm[1]] = mm[2].replace(/^"|"$/g, ""); } return o; };
const records = fs.readdirSync(path.join(REPO, COMPILED)).filter((f) => f.endsWith(".json") && !f.startsWith("deriv") && !f.startsWith("_"));
const pages = [];
for (const rf of records) {
  const slug = rf.replace(/\.json$/, "");
  const mdPath = path.join(REPO, CONTENT, `${slug}.md`);
  const f = fs.existsSync(mdPath) ? fm(fs.readFileSync(mdPath, "utf8")) : {};
  pages.push({
    slug,
    name: f.subcategory || slug,
    description: f.description || `The Heavy Metal Tested & Certified human-grade standard for ${f.subcategory || slug}.`,
    version: f.standard_version || "1.0 (2026-08-13)",
    hmi_link: f.hmi_literature_link || undefined,
    connections: [
      { label: "Method v1 to Method v2", href: "/program/method" },
      { label: "How limits are derived", href: "/program/structure" },
      { label: "Regulation references (source documents)", href: "/regulations" },
      { label: "All HMTc standards", href: "/standards" },
    ],
    variants: [{ label: "all", variant: "default", record: slug }],
  });
}
const doc = {
  _doc: "Per-page metadata for Category-17 (Pet Foods) standard renderer (tools/build-category-standard-pages.mjs). Numbers come from data/standards/cat17-compiled/<record>.json; no values authored here. Reconstructed 2026-08-30 to re-render pages after the completeness sweep filled Ni/Sn/Al.",
  _meta: {
    category: 17,
    category_name: "Pet Foods",
    volume_name: "Pet Foods",
    panel: ["Pb", "Cd", "tAs", "iAs", "tHg", "MeHg", "Ni", "Sn", "Al", "Cr", "Cr-VI"],
    tier1: ["Pb", "iAs", "tHg", "MeHg", "Cd"],
    tier2: ["tAs", "Ni", "Sn", "Al", "Cr", "Cr-VI"],
    tier_footnote: "Pet food is legally feed; HMTc voluntarily certifies each analyte to the strictest human-food sovereign maximum for the nearest analog, with the laxer feed-law floor disclosed for contrast. Inorganic arsenic and hexavalent chromium are reflex-speciation screens bounded by total arsenic and total chromium; methylmercury is bounded by total mercury. Nickel, tin and aluminium carry disclosed read-across limits where no government sets a general pet-food maximum.",
    reconstitution_note: false,
    compiled_dir: "cat17-compiled",
    methodology_version: "Method v2.0: human-grade over-compliance (CLAUDE.md Part 19; feed floor disclosed, never selected)",
    method_label: "HMTc human-grade over-compliance: the strictest human-food sovereign maximum for the nearest analog, applied to a legally-feed product; the feed-law floor is disclosed for contrast and never selected.",
    effective_date: "2026-08-13",
    default_version: "1.0 (2026-08-13)",
  },
  pages,
};
fs.writeFileSync(path.join(REPO, "data/standards/cat17-pages.json"), JSON.stringify(doc, null, 2) + "\n");
console.log(`gen-cat17-pages: wrote cat17-pages.json with ${pages.length} pages`);
