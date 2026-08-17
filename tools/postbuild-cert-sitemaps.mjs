#!/usr/bin/env node
// Generate a focused discovery sitemap for citable technical documents after
// Quartz has emitted the final HTML and Scholar metadata.
//
// SCOPE (load-bearing). Every published standard row carries citation_* metadata,
// so keying the scholarly sitemap on "has citation_title" swept ~150 per-row
// specification pages into it alongside ~44 actual documents. A specification is
// not a scholarly work: Google Scholar's inclusion guidelines cover articles,
// technical reports and their drafts, and exclude catalog-style listings. A corpus
// that is 78% specification rows gives Scholar's classifier a weak signal on a
// domain that also serves /apply and /for-brands.
//
// The scholarly sitemap therefore carries only the document-shaped sections below.
// Nothing is hidden by this: the standards rows stay in the main sitemap and
// remain fully indexable by ordinary Googlebot.

import fs from "node:fs";
import path from "node:path";

const PUBLIC = path.join(process.cwd(), "public");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function attr(html, tag, attribute, value, result) {
  const tags = html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) ?? [];
  for (const candidate of tags) {
    const wanted = candidate.match(
      new RegExp(`\\b${attribute}=["']${value}["']`, "i"),
    );
    if (!wanted) continue;
    const match = candidate.match(
      new RegExp(`\\b${result}=["']([^"']+)["']`, "i"),
    );
    if (match) return match[1];
  }
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Sections whose pages are documents (research analyses, standards briefings,
// program manuals) rather than specification rows.
const SCHOLARLY_SECTIONS = ["articles/", "briefings/", "manuals/"]

const skipped = []
const urls = walk(PUBLIC)
  .filter(
    (file) => file.endsWith(".html") && path.basename(file) !== "404.html",
  )
  .flatMap((file) => {
    const html = fs.readFileSync(file, "utf8");
    const robots = attr(html, "meta", "name", "robots", "content") ?? "";
    const title = attr(html, "meta", "name", "citation_title", "content");
    const canonical = attr(html, "link", "rel", "canonical", "href");
    if (!title || !canonical || /noindex/i.test(robots)) return [];
    const rel = path.relative(PUBLIC, file).split(path.sep).join("/");
    if (!SCHOLARLY_SECTIONS.some((section) => rel.startsWith(section))) {
      skipped.push(rel);
      return [];
    }
    return [canonical];
  });

const unique = [...new Set(urls)].sort();
const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique
  .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

fs.writeFileSync(path.join(PUBLIC, "sitemap-scholarly.xml"), body, "utf8");
// Report the exclusions so a future section that should be scholarly, but is not
// listed above, shows up in the build log instead of silently vanishing.
const skippedSections = {}
for (const rel of skipped) {
  const section = rel.split("/")[0]
  skippedSections[section] = (skippedSections[section] ?? 0) + 1
}
console.log(
  `postbuild-cert-sitemaps: wrote ${unique.length} scholarly URLs ` +
    `(sections: ${SCHOLARLY_SECTIONS.join(", ")})`,
)
if (skipped.length) {
  console.log(
    `postbuild-cert-sitemaps: excluded ${skipped.length} citation-bearing page(s) ` +
      `as non-scholarly — ${Object.entries(skippedSections)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")} (still in sitemap.xml)`,
  )
}
