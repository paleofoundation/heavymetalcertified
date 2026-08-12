#!/usr/bin/env node
// Generate a focused discovery sitemap for citable technical documents after
// Quartz has emitted the final HTML and Scholar metadata.

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

const urls = walk(PUBLIC)
  .filter(
    (file) => file.endsWith(".html") && path.basename(file) !== "404.html",
  )
  .flatMap((file) => {
    const html = fs.readFileSync(file, "utf8");
    const robots = attr(html, "meta", "name", "robots", "content") ?? "";
    const title = attr(html, "meta", "name", "citation_title", "content");
    const canonical = attr(html, "link", "rel", "canonical", "href");
    return title && canonical && !/noindex/i.test(robots) ? [canonical] : [];
  });

const unique = [...new Set(urls)].sort();
const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${unique
  .map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`)
  .join("\n")}\n</urlset>\n`;

fs.writeFileSync(path.join(PUBLIC, "sitemap-scholarly.xml"), body, "utf8");
console.log(`postbuild-cert-sitemaps: wrote ${unique.length} scholarly URLs`);
