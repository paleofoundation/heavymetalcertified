#!/usr/bin/env node
// Release gate for Google Search and Google Scholar crawlability. Audits the
// emitted site—not source frontmatter—so it catches generator and postbuild
// regressions as well as content mistakes.

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const ORIGIN = "https://heavymetalcertified.com";
const errors = [];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

// A tag ends at the first ">" that is OUTSIDE a quoted attribute value. A
// description such as "USP <2232>" is legal HTML inside content="..." (only <
// and & must be escaped in attribute values), so the naive [^>]* scan truncated
// the tag and reported 23 supplement standards as missing their description.
function tags(html, name) {
  return (
    html.match(new RegExp(`<${name}\\b(?:[^>"']|"[^"]*"|'[^']*')*>`, "gi")) ??
    []
  );
}

function attribute(tag, name) {
  const m = tag.match(
    new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i"),
  );
  return m ? (m[1] ?? m[2]) : undefined;
}

function selectedAttribute(
  html,
  tagName,
  selectorName,
  selectorValue,
  resultName,
) {
  for (const tag of tags(html, tagName)) {
    if (
      attribute(tag, selectorName)?.toLowerCase() ===
      selectorValue.toLowerCase()
    ) {
      const value = attribute(tag, resultName);
      if (value !== undefined) return value;
    }
  }
}

function meta(html, name) {
  return selectedAttribute(html, "meta", "name", name, "content");
}

function property(html, name) {
  return selectedAttribute(html, "meta", "property", name, "content");
}

function link(html, rel) {
  return selectedAttribute(html, "link", "rel", rel, "href");
}

function htmlRoute(file) {
  const rel = path.relative(PUBLIC, file).split(path.sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html"))
    return `/${rel.slice(0, -"/index.html".length)}`;
  return `/${rel.slice(0, -".html".length)}`;
}

function expectedCanonical(route) {
  return route === "/" ? `${ORIGIN}/` : `${ORIGIN}${route}`;
}

function xmlLocations(file) {
  if (!fs.existsSync(file)) return [];
  return [
    ...fs.readFileSync(file, "utf8").matchAll(/<loc>([^<]+)<\/loc>/g),
  ].map((m) => m[1].replace(/&amp;/g, "&"));
}

function publicTargetExists(pathname) {
  let clean;
  try {
    clean = decodeURIComponent(pathname);
  } catch {
    clean = pathname;
  }
  const rel = clean.replace(/^\/+/, "");
  if (clean === "/") return fs.existsSync(path.join(PUBLIC, "index.html"));
  if (clean.endsWith("/"))
    return fs.existsSync(path.join(PUBLIC, rel, "index.html"));
  if (path.extname(clean)) return fs.existsSync(path.join(PUBLIC, rel));
  return (
    fs.existsSync(path.join(PUBLIC, `${rel}.html`)) ||
    fs.existsSync(path.join(PUBLIC, rel, "index.html")) ||
    fs.existsSync(path.join(PUBLIC, rel))
  );
}

function sameValues(label, actual, expected) {
  const a = [...new Set(actual)].sort();
  const e = [...new Set(expected)].sort();
  for (const value of e.filter((item) => !a.includes(item)))
    errors.push(`${label}: missing ${value}`);
  for (const value of a.filter((item) => !e.includes(item)))
    errors.push(`${label}: unexpected ${value}`);
  if (actual.length !== a.length)
    errors.push(`${label}: contains duplicate URLs`);
}

for (const required of [
  "robots.txt",
  "sitemap.xml",
  "sitemap-scholarly.xml",
  "llms.txt",
]) {
  if (!fs.existsSync(path.join(PUBLIC, required)))
    errors.push(`missing public/${required}`);
}

const htmlFiles = walk(PUBLIC).filter((file) => file.endsWith(".html"));
const indexable = [];
const scholarly = [];
const canonicalOwners = new Map();
const brokenLinks = new Set();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const route = htmlRoute(file);
  const robots = meta(html, "robots") ?? "";
  const noindex = /(?:^|,)\s*noindex\b/i.test(robots);
  const is404 = route === "/404";

  if (!/<title>[^<]+<\/title>/i.test(html))
    errors.push(`${route}: missing title`);
  if (!meta(html, "description"))
    errors.push(`${route}: missing meta description`);
  if (!robots) errors.push(`${route}: missing robots meta`);
  for (const required of ["og:title", "og:description", "og:url", "og:image"]) {
    if (!property(html, required)) errors.push(`${route}: missing ${required}`);
  }
  for (const required of [
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
  ]) {
    if (!meta(html, required)) errors.push(`${route}: missing ${required}`);
  }

  if (is404 && !noindex) errors.push("/404: must be noindex");

  const canonical = link(html, "canonical");
  if (!noindex && !is404) {
    const expected = expectedCanonical(route);
    if (!canonical) errors.push(`${route}: missing canonical`);
    else if (canonical !== expected)
      errors.push(`${route}: canonical ${canonical} != ${expected}`);
    if (canonical) {
      indexable.push(canonical);
      const owner = canonicalOwners.get(canonical);
      if (owner && owner !== route)
        errors.push(`${route}: duplicate canonical also owned by ${owner}`);
      canonicalOwners.set(canonical, route);
    }
  }

  const citationTitle = meta(html, "citation_title");
  if (citationTitle && !noindex) {
    if (!meta(html, "citation_author"))
      errors.push(`${route}: Scholar record missing citation_author`);
    const date = meta(html, "citation_publication_date");
    if (!date || !/^\d{4}(?:\/\d{2}\/\d{2})?$/.test(date)) {
      errors.push(
        `${route}: invalid Scholar publication date ${date ?? "(missing)"}`,
      );
    }
    if (!meta(html, "citation_abstract_html_url"))
      errors.push(`${route}: missing citation_abstract_html_url`);
    if (!meta(html, "citation_fulltext_html_url"))
      errors.push(`${route}: missing citation_fulltext_html_url`);
    if (
      meta(html, "citation_technical_report_institution") &&
      !meta(html, "citation_technical_report_number")
    ) {
      errors.push(
        `${route}: technical report missing citation_technical_report_number`,
      );
    }
    const pdf = meta(html, "citation_pdf_url");
    if (pdf) {
      const pdfUrl = new URL(pdf, ORIGIN);
      if (pdfUrl.origin !== ORIGIN)
        errors.push(`${route}: Scholar PDF must use the canonical origin`);
      if (path.posix.dirname(pdfUrl.pathname) !== path.posix.dirname(route)) {
        errors.push(
          `${route}: Scholar PDF is not in the same directory (${pdfUrl.pathname})`,
        );
      }
      if (!publicTargetExists(pdfUrl.pathname))
        errors.push(
          `${route}: Scholar PDF does not exist (${pdfUrl.pathname})`,
        );
    }
    if (canonical) scholarly.push(canonical);
  }

  const base = canonical ?? expectedCanonical(route);
  for (const tag of tags(html, "a")) {
    const href = attribute(tag, "href");
    if (!href || href.startsWith("#")) continue;
    let target;
    try {
      target = new URL(href, base);
    } catch {
      continue;
    }
    if (
      !["http:", "https:"].includes(target.protocol) ||
      target.origin !== ORIGIN
    )
      continue;
    if (target.pathname !== "/" && target.pathname.endsWith("/")) {
      brokenLinks.add(
        `${route} -> ${target.pathname} (redirecting trailing slash)`,
      );
    } else if (!publicTargetExists(target.pathname)) {
      brokenLinks.add(`${route} -> ${target.pathname} (missing)`);
    }
  }
}

for (const item of brokenLinks) errors.push(`internal link: ${item}`);

const mainSitemap = xmlLocations(path.join(PUBLIC, "sitemap.xml"));
const scholarSitemap = xmlLocations(path.join(PUBLIC, "sitemap-scholarly.xml"));
sameValues("sitemap.xml", mainSitemap, indexable);
sameValues("sitemap-scholarly.xml", scholarSitemap, scholarly);

for (const url of mainSitemap) {
  if (!url.startsWith(`${ORIGIN}/`))
    errors.push(`sitemap.xml: wrong origin ${url}`);
  if (new URL(url).pathname !== "/" && new URL(url).pathname.endsWith("/")) {
    errors.push(`sitemap.xml: redirecting trailing-slash URL ${url}`);
  }
}

if (fs.existsSync(path.join(PUBLIC, "robots.txt"))) {
  const robots = fs.readFileSync(path.join(PUBLIC, "robots.txt"), "utf8");
  for (const sitemap of [
    `${ORIGIN}/sitemap.xml`,
    `${ORIGIN}/sitemap-scholarly.xml`,
  ]) {
    if (!robots.includes(`Sitemap: ${sitemap}`))
      errors.push(`robots.txt: missing ${sitemap}`);
  }
}

if (errors.length) {
  console.error(`seo-audit: FAILED (${errors.length} issues)`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `seo-audit: PASS — ${indexable.length} indexable pages, ${scholarly.length} Scholar records, 0 broken internal links`,
);
