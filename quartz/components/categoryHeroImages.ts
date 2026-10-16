/** Subject-matched HMI editorial still lifes. Presentation only: no frontmatter/SEO mutation.
 * Deliberate exact slug allowlist. Missing subjects get a plain navy hero, never an
 * unrelated category image. Source registry and gaps: docs/design-canon/HERO-IMAGERY.md.
 */
const origin = "/static/heroes/hmi/"
const images: Record<string, string> = {
  index: "lead-food-soil-water.webp",
  "heavy-metals-in-rice": "arsenic-rice-water-soil.webp",
  "manuals/grains-cereals-rice": "arsenic-rice-water-soil.webp",
  "manuals/seafood": "mercury-fish-water.webp",
  "manuals/legumes-and-pulses": "essential-metals-legumes-grains-seeds.webp",
  "manuals/nuts-seeds-and-their-butters": "nickel-legumes-nuts-cocoa.webp",
  "manuals/food-contact-consumer-goods-and-kitchenware": "aluminum-tea-food-contact.webp",
  "standards/rice-bulk-grain": "arsenic-rice-water-soil.webp",
  "standards/rice-noodles": "arsenic-rice-water-soil.webp",
  "standards/pasta-rice-based": "arsenic-rice-water-soil.webp",
  "standards/breakfast-cereal-rice-based": "arsenic-rice-water-soil.webp",
  "standards/rice-snacks-crackers": "arsenic-rice-water-soil.webp",
  "standards/baby-cereals-dry": "essential-metals-legumes-grains-seeds.webp",
  "standards/breakfast-cereal-non-rice": "essential-metals-legumes-grains-seeds.webp",
  "standards/chocolate": "cadmium-cocoa-grains-crops.webp",
  "standards/cocoa-beverage-mixes": "cadmium-cocoa-grains-crops.webp",
  "standards/fish-marine-predatory": "mercury-fish-water.webp",
  "standards/fish-marine-non-predatory": "mercury-fish-water.webp",
  "standards/fish-freshwater": "mercury-fish-water.webp",
  "standards/shellfish": "organotins-shellfish-marine-context.webp",
  "standards/tree-nuts-high-nickel": "nickel-legumes-nuts-cocoa.webp",
  "standards/nuts-seeds-other": "essential-metals-legumes-grains-seeds.webp",
  "standards/legumes-pulses-other": "essential-metals-legumes-grains-seeds.webp",
  "standards/tomato-condiments": "tin-canned-tomatoes-juice.webp",
  "standards/true-tea-camellia-sinensis": "aluminum-tea-food-contact.webp",
  "analytes/lead": "lead-food-soil-water.webp",
  "analytes/arsenic": "arsenic-rice-water-soil.webp",
  "analytes/cadmium": "cadmium-cocoa-grains-crops.webp",
  "analytes/mercury": "mercury-fish-water.webp",
  "analytes/nickel": "nickel-legumes-nuts-cocoa.webp",
  "analytes/aluminum": "aluminum-tea-food-contact.webp",
  "analytes/tin": "tin-canned-tomatoes-juice.webp",
  "analytes/chromium": "chromium-water-soil-materials.webp",
}
export function categoryHeroImage(slug: string): string | undefined {
  const name = images[slug.replace(/\/$/, "")]
  return name ? origin + name : undefined
}
export const categoryHeroMappings = Object.freeze(images)
