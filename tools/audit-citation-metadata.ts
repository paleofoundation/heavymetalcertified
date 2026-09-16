// Read-only inventory of publication fields and declared current DOI eligibility.
// This does not contact a DOI registry, mint a DOI, or override an editorial hold.
// Run: node --import tsx tools/audit-citation-metadata.ts
import fs from "node:fs"
import path from "node:path"
import matter from "gray-matter"
import { citationMetadataIssues, frontmatterBoolean } from "../quartz/components/citationMetadata"

function markdownFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? markdownFiles(file) : entry.name.endsWith(".md") ? [file] : []
  })
}

const content = path.resolve("content")
const pages = markdownFiles(content).map((file) => ({
  slug: path.relative(content, file).split(path.sep).join("/").replace(/\.md$/, ""),
  frontmatter: matter(fs.readFileSync(file, "utf8")).data,
}))
const issues = pages.flatMap((page) => citationMetadataIssues(page.slug, page.frontmatter))
const errors = issues.filter((issue) => issue.severity === "error")
console.log(
  JSON.stringify(
    {
      scope:
        "Local publication metadata and DOI declarations; registry status is not verified. Editorial holds remain in force.",
      pages: pages.length,
      scholarEligible: pages.filter((page) => frontmatterBoolean(page.frontmatter.scholar_eligible))
        .length,
      errors: errors.length,
      warnings: issues.length - errors.length,
      issues,
    },
    null,
    2,
  ),
)
if (errors.length) process.exitCode = 1
