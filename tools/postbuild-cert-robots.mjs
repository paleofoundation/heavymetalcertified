#!/usr/bin/env node
// postbuild-cert-robots.mjs — write the cert site's robots.txt at the site root.
//
// Purpose: advertise the auto-generated sitemap for crawler auto-discovery.
// Per-page indexing control is handled separately by the noindex meta tag
// (Head.tsx emits <meta name="robots" content="noindex, nofollow"> for pages
// with `noindex: true` frontmatter, e.g. /portal and /brands/specimen), and
// those pages are already excluded from sitemap.xml. So robots.txt stays a
// clean allow-all plus the Sitemap directive; it deliberately does NOT list the
// private paths (a public Disallow would only advertise their existence).

import fs from "node:fs"
import path from "node:path"

const PUBLIC = path.join(process.cwd(), "public")
const SITE = "https://heavymetalcertified.com"

const body = `# heavymetalcertified.com
# Heavy Metal Tested & Certified — published standards & certification authority.

User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
Sitemap: ${SITE}/sitemap-scholarly.xml
`

fs.mkdirSync(PUBLIC, { recursive: true })
fs.writeFileSync(path.join(PUBLIC, "robots.txt"), body, "utf8")
console.log("postbuild-cert-robots: wrote public/robots.txt")
