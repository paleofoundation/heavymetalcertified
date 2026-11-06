# Standard PDF sweep — 2026-11-06

Audit of every `content/static/standards/<slug>.pdf` that has a matching standard page.
A PDF is stale when the extracted text shows any of: a Tier column, an empty ORCID slot (the digits `0000-0002-2348-7259` missing, or two separators with nothing between them), a subsumed iAs or MeHg cell printed as a number instead of `≤ tAs` or `≤ tHg`, a generic basis (`human-grade read-across` or `human-food maximum levels`), the word briefing, or a producer other than house react-pdf.
Firm numeric species ceilings are not this signal. Narrative method prose that says "government maximum level" is not a generic basis cell.

## Counts

| | Before | After |
| --- | --- | --- |
| Scanned | 320 | 320 |
| Stale | 319 | 0 |
| Clean | 1 | 320 |

### Signals before regeneration

| Signal | PDFs |
| --- | --- |
| briefing | 319 |
| generic-basis | 267 |
| orcid | 318 |
| species-number | 4 |
| tier | 318 |

After `node tools/build-standard-pdf.mjs --all`, every signal is 0. Firm numeric ceilings in the previous PDFs were compared with the regenerated files: 0 numbers changed. Compiled firm values are present in the new PDFs (313 direct records, 0 missing).

The one clean PDF before the sweep was `olive-oil`, regenerated in #137.

## Stale PDFs before regeneration

| Slug | Signals |
| --- | --- |
| aas-injectable | tier, orcid, briefing, generic-basis |
| air-product-refill-materials | tier, orcid, briefing, generic-basis |
| anti-static-products | tier, orcid, briefing, generic-basis |
| anti-wrinkle-wrinkle-release-products | tier, orcid, briefing, generic-basis |
| antiperspirant | tier, orcid, briefing, generic-basis |
| art-craft-materials | tier, orcid, briefing |
| automatic-puff-releasers | tier, orcid, briefing, generic-basis |
| baby-cereals-dry | tier, orcid, briefing, generic-basis |
| baby-lotion-cream | tier, orcid, briefing, generic-basis |
| baby-oil | tier, orcid, briefing, generic-basis |
| baby-powder-cornstarch | tier, orcid, briefing, generic-basis |
| baby-shampoo-body-wash | tier, orcid, briefing, generic-basis |
| baby-sunscreen-chemical | tier, orcid, briefing, generic-basis |
| baby-sunscreen-mineral | tier, orcid, briefing, generic-basis |
| baby-talcum-powder | tier, orcid, briefing, generic-basis |
| baby-wipes | briefing, generic-basis |
| bakeware | tier, orcid, briefing, generic-basis |
| bar-bath-soap | tier, orcid, briefing, generic-basis |
| beef-product | tier, orcid, briefing |
| bibs | tier, orcid, briefing, generic-basis |
| blankets-and-sleep-sacks | tier, orcid, briefing, generic-basis |
| bleaching-whitening-additives | tier, orcid, briefing, generic-basis |
| body-hand-leave-on-skin-care | tier, orcid, briefing, generic-basis |
| body-wash-shower-gel | tier, orcid, briefing, generic-basis |
| bone-broth | tier, orcid, briefing |
| bottled-drinking-water | tier, orcid, briefing, generic-basis |
| bouillon-seasoning-blends | tier, orcid, briefing |
| bread-and-baked-goods | tier, orcid, briefing, generic-basis |
| breakfast-cereal-non-rice | tier, orcid, briefing, generic-basis |
| breakfast-cereal-rice-based | tier, orcid, briefing, generic-basis |
| breath-fresheners | tier, orcid, briefing, generic-basis |
| cannabis-concentrates | tier, orcid, briefing, generic-basis |
| cannabis-edibles | tier, orcid, briefing, generic-basis |
| cannabis-flower | tier, orcid, briefing, generic-basis |
| cannabis-tinctures-oils | tier, orcid, briefing, generic-basis |
| cannabis-topicals | tier, orcid, briefing, generic-basis |
| cannabis-vape-cartridge-fill | tier, orcid, briefing, generic-basis |
| canned-meats | tier, orcid, briefing |
| canned-seafood | tier, orcid, briefing, generic-basis |
| capillary-reed-wood-diffusers | tier, orcid, briefing, generic-basis |
| car-seats | tier, orcid, briefing, generic-basis |
| cashews | tier, orcid, briefing, generic-basis |
| cephalopods | tier, orcid, briefing, generic-basis |
| childrens-lip-balm-mineral-bearing | tier, orcid, briefing, generic-basis |
| childrens-lip-balm-plain | tier, orcid, briefing, generic-basis |
| childrens-makeup | tier, orcid, briefing, generic-basis |
| childrens-nail-polish | tier, orcid, briefing, generic-basis |
| chocolate | tier, orcid, briefing |
| clasps-fasteners-infant-products | tier, orcid, briefing, generic-basis |
| cocoa-beverage-mixes | tier, orcid, briefing |
| coffee-ready-to-drink | tier, orcid, briefing, generic-basis |
| coffee | tier, orcid, briefing, generic-basis |
| conditioner-adult-rinse-out | tier, orcid, briefing, generic-basis |
| confectionery-candy | tier, orcid, briefing |
| cooking-oils-other | tier, orcid, briefing, generic-basis, species-number |
| cookware-ceramic-coated | tier, orcid, briefing, generic-basis |
| cookware-metal-alloy | tier, orcid, briefing, generic-basis |
| cookware-nonstick-coated | tier, orcid, briefing, generic-basis |
| cookware-specialty-alloy | tier, orcid, briefing, generic-basis |
| cribs-and-bassinets | tier, orcid, briefing, generic-basis |
| cultivated-mushrooms-oyster-shiitake | tier, orcid, briefing, generic-basis |
| cultivated-mushrooms | tier, orcid, briefing, generic-basis |
| cutting-boards | tier, orcid, briefing, generic-basis |
| dairy-cheese | tier, orcid, briefing, generic-basis |
| dairy-condensed-evaporated | tier, orcid, briefing, generic-basis |
| dairy-cream | tier, orcid, briefing, generic-basis |
| dairy-milk-camel | tier, orcid, briefing, generic-basis |
| dairy-milk-cow | tier, orcid, briefing, generic-basis |
| dairy-milk-goat-sheep | tier, orcid, briefing, generic-basis |
| dairy-milk-powders | tier, orcid, briefing, generic-basis |
| dairy-yogurt-cultured | tier, orcid, briefing, generic-basis |
| deep-conditioning-treatments-rinse-off | tier, orcid, briefing, generic-basis |
| dentifrices | tier, orcid, briefing, generic-basis |
| denture-orthodontic-care | tier, orcid, briefing, generic-basis |
| deodorants | tier, orcid, briefing, generic-basis |
| diaper-cream-non-zno | tier, orcid, briefing, generic-basis |
| diaper-cream-zno | tier, orcid, briefing, generic-basis |
| douches-vaginal-irrigation | tier, orcid, briefing, generic-basis |
| dried-fruit | tier, orcid, briefing |
| dusting-powder-cornstarch-adult | tier, orcid, briefing, generic-basis |
| dusting-talc-powders-adult | tier, orcid, briefing, generic-basis |
| eggs-product | tier, orcid, briefing, generic-basis |
| electric-plug-in-evaporators | tier, orcid, briefing, generic-basis |
| exfoliants-scrubs | tier, orcid, briefing, generic-basis |
| eye-makeup | tier, orcid, briefing, generic-basis |
| fabric-contact-combination-products | tier, orcid, briefing, generic-basis |
| fabric-contact-products-other | tier, orcid, briefing, generic-basis |
| fabric-protectants | tier, orcid, briefing, generic-basis |
| fabric-refresher-products | tier, orcid, briefing, generic-basis |
| fabric-softeners | tier, orcid, briefing, generic-basis |
| face-neck-leave-on-skin-care | tier, orcid, briefing, generic-basis |
| face-paint | tier, orcid, briefing, generic-basis |
| facial-cleansers | tier, orcid, briefing, generic-basis |
| feminine-deodorants | tier, orcid, briefing, generic-basis |
| feminine-wipes | tier, orcid, briefing, generic-basis |
| fermented-beverages-non-tea-based | tier, orcid, briefing, generic-basis |
| filter-media-and-housings | tier, orcid, briefing, generic-basis |
| fish-freshwater | tier, orcid, briefing, generic-basis |
| fish-marine-non-predatory | tier, orcid, briefing, generic-basis |
| fish-marine-predatory | tier, orcid, briefing, generic-basis |
| fish-sauce | tier, orcid, briefing, generic-basis, species-number |
| flavored-waters | tier, orcid, briefing, generic-basis |
| floss-interdental-cleaners | tier, orcid, briefing, generic-basis |
| flour-non-rice | tier, orcid, briefing, generic-basis |
| food-packaging-cans-lids | tier, orcid, briefing, generic-basis |
| food-packaging-caps-closures | tier, orcid, briefing, generic-basis |
| food-packaging-flexible-pouches-films | tier, orcid, briefing, generic-basis |
| food-packaging-foils-wraps | tier, orcid, briefing, generic-basis |
| food-packaging-glass-jars | tier, orcid, briefing, generic-basis |
| food-packaging-paperboard-cartons | tier, orcid, briefing, generic-basis |
| food-packaging-plastic-tubs | tier, orcid, briefing, generic-basis |
| food-prep-blender-jars | tier, orcid, briefing, generic-basis |
| food-prep-coffee-maker-pathways | tier, orcid, briefing, generic-basis |
| food-prep-kettle-interiors | tier, orcid, briefing, generic-basis |
| food-prep-processor-bowls | tier, orcid, briefing, generic-basis |
| food-storage-glass-containers | tier, orcid, briefing, generic-basis |
| food-storage-lids-gaskets | tier, orcid, briefing, generic-basis |
| food-storage-plastic-containers | tier, orcid, briefing, generic-basis |
| food-storage-silicone | tier, orcid, briefing, generic-basis |
| fragrance-preparations | tier, orcid, briefing, generic-basis |
| fresh-fruit | tier, orcid, briefing |
| fruit-juice-not-canned | tier, orcid, briefing, generic-basis |
| fruit-juices-apple-containing | tier, orcid, briefing |
| fruit-juices-non-apple | tier, orcid, briefing |
| fruit-purees | tier, orcid, briefing, generic-basis |
| fruit-snacks | tier, orcid, briefing |
| game-meats | tier, orcid, briefing, generic-basis |
| gel-diffusers | tier, orcid, briefing, generic-basis |
| grain-based-snacks | tier, orcid, briefing, generic-basis |
| gummies-jellies | tier, orcid, briefing |
| hair-dye-rinse-off | tier, orcid, briefing, generic-basis |
| hair-removal-products | tier, orcid, briefing, generic-basis |
| hand-soap | tier, orcid, briefing, generic-basis |
| heated-oil-diffusers | tier, orcid, briefing, generic-basis |
| herbal-botanical-infusions | tier, orcid, briefing, generic-basis |
| high-chairs-and-booster-seats | tier, orcid, briefing, generic-basis |
| home-air-emission-products-other | tier, orcid, briefing, generic-basis |
| honey | tier, orcid, briefing, generic-basis |
| hot-chili-sauces | tier, orcid, briefing |
| incense-sticks-cones | tier, orcid, briefing, generic-basis |
| infant-carriers | tier, orcid, briefing, generic-basis |
| infant-clothing | tier, orcid, briefing, generic-basis |
| infant-formula-powder | tier, orcid, briefing |
| infant-formula-ready-to-feed | tier, orcid, briefing, generic-basis |
| infant-nursery-water | tier, orcid, briefing, generic-basis |
| instant-air-refreshment-sprays | tier, orcid, briefing, generic-basis |
| intimate-washes-cleansers | tier, orcid, briefing, generic-basis |
| kombucha-tea-based | tier, orcid, briefing, generic-basis |
| lamb-mutton | tier, orcid, briefing |
| laundry-detergent-boosters-additives | tier, orcid, briefing, generic-basis |
| laundry-detergents | tier, orcid, briefing, generic-basis |
| laundry-prewash-products | tier, orcid, briefing, generic-basis |
| laundry-starch-sizing-fabric-finish | tier, orcid, briefing, generic-basis |
| leafy-vegetables-other | tier, orcid, briefing |
| leave-on-hair-preparations | tier, orcid, briefing, generic-basis |
| leave-on-preparations-other | tier, orcid, briefing, generic-basis |
| legumes-pulses-other | tier, orcid, briefing, generic-basis |
| lipstick | tier, orcid, briefing, generic-basis |
| makeup-body-paints-bases-fixatives | tier, orcid, briefing, generic-basis |
| makeup-foundation-powders-blush | tier, orcid, briefing, generic-basis |
| manicuring-preparations-leave-on | tier, orcid, briefing, generic-basis |
| matcha | tier, orcid, briefing |
| menstrual-cups | tier, orcid, briefing, generic-basis |
| menstrual-discs | tier, orcid, briefing, generic-basis |
| menstrual-intimate-products-other | tier, orcid, briefing, generic-basis |
| menstrual-pads | tier, orcid, briefing, generic-basis |
| menstrual-tampons | tier, orcid, briefing, generic-basis |
| mineral-water | tier, orcid, briefing, generic-basis |
| mixed-meals-prepared-foods | tier, orcid, briefing |
| mixed-meals | tier, orcid, briefing, generic-basis |
| mouthwash-oral-rinse | tier, orcid, briefing, generic-basis |
| mustard-mayo-dressings | tier, orcid, briefing, generic-basis |
| nebula-diffusers | tier, orcid, briefing, generic-basis |
| non-root-vegetable-purees | tier, orcid, briefing, generic-basis |
| non-root-vegetables | tier, orcid, briefing |
| nut-seed-butters-other | tier, orcid, briefing, generic-basis |
| nuts-seeds-other | tier, orcid, briefing, generic-basis |
| oral-irrigators-water-flossers | tier, orcid, briefing, generic-basis |
| oral-products-other | tier, orcid, briefing, generic-basis |
| other-grain-products | tier, orcid, briefing, generic-basis |
| pasta-rice-based | tier, orcid, briefing, generic-basis |
| pasta-wheat-based | tier, orcid, briefing, generic-basis |
| peanut-butter | tier, orcid, briefing, generic-basis |
| peanuts | tier, orcid, briefing, generic-basis |
| peptides-injectable-hormones | tier, orcid, briefing, generic-basis |
| peptides-nasal-sublingual | tier, orcid, briefing, generic-basis |
| period-underwear-reusable-garments | tier, orcid, briefing, generic-basis |
| permanent-hair-dyes-tints | tier, orcid, briefing, generic-basis |
| pet-chews-dental | tier, orcid, briefing, generic-basis |
| pet-food-canned-wet | tier, orcid, briefing, generic-basis |
| pet-food-dry-kibble | tier, orcid, briefing, generic-basis |
| pet-food-fermentation-derived-protein | tier, orcid, briefing, generic-basis |
| pet-food-fish-marine-protein | tier, orcid, briefing, generic-basis |
| pet-food-freeze-dried | tier, orcid, briefing, generic-basis |
| pet-food-raw | tier, orcid, briefing, generic-basis |
| pet-food-semi-moist | tier, orcid, briefing, generic-basis |
| pet-milk-replacers-specialty-liquids | tier, orcid, briefing, generic-basis |
| pet-supplements-botanical-herbal | tier, orcid, briefing, generic-basis |
| pet-supplements-calming-behavioral | tier, orcid, briefing, generic-basis |
| pet-supplements-functional-blends | tier, orcid, briefing, generic-basis |
| pet-supplements-oils | tier, orcid, briefing, generic-basis |
| pet-supplements-other | tier, orcid, briefing, generic-basis |
| pet-supplements-probiotics-digestive | tier, orcid, briefing, generic-basis |
| pet-supplements-vitamin-mineral | tier, orcid, briefing, generic-basis |
| pet-toppers-mixers-broths | tier, orcid, briefing, generic-basis |
| pet-treats-snacks | tier, orcid, briefing, generic-basis |
| pickled-fermented-vegetables | tier, orcid, briefing, generic-basis |
| plant-based-meat-alternatives | tier, orcid, briefing |
| plant-milks-non-soy-non-rice | tier, orcid, briefing, generic-basis |
| plant-milks-rice-based | tier, orcid, briefing, generic-basis |
| plant-milks-soy-based | tier, orcid, briefing, generic-basis |
| play-yards-and-gates | tier, orcid, briefing, generic-basis |
| pork-product | tier, orcid, briefing |
| potpourri-sachets | tier, orcid, briefing, generic-basis |
| poultry-product | tier, orcid, briefing |
| pre-treaters-stain-removers | tier, orcid, briefing, generic-basis |
| processed-meats | tier, orcid, briefing |
| refined-sugar | tier, orcid, briefing, generic-basis, species-number |
| research-chem-raw-powders | tier, orcid, briefing, generic-basis |
| rice-beverages-rice-milk | tier, orcid, briefing, generic-basis |
| rice-bulk-grain | tier, orcid, briefing, generic-basis |
| rice-grain-syrup | tier, orcid, briefing, generic-basis |
| rice-noodles | tier, orcid, briefing, generic-basis |
| rice-snacks-crackers | tier, orcid, briefing, generic-basis |
| rinse-off-preparations-other | tier, orcid, briefing, generic-basis |
| root-tuber-vegetables | tier, orcid, briefing |
| root-vegetable-purees | tier, orcid, briefing, generic-basis |
| salt | tier, orcid, briefing |
| sarms-oral | tier, orcid, briefing, generic-basis |
| scented-candles | tier, orcid, briefing, generic-basis |
| scented-wax-blocks-melts | tier, orcid, briefing, generic-basis |
| seaweed-kelp-foods | tier, orcid, briefing, generic-basis |
| sensor-puff-releasers | tier, orcid, briefing, generic-basis |
| shampoo-adult | tier, orcid, briefing, generic-basis |
| shaving-cream-gel-foam | tier, orcid, briefing, generic-basis |
| shellfish | tier, orcid, briefing, generic-basis |
| soft-drinks-carbonated-beverages | tier, orcid, briefing, generic-basis |
| soups-broths-stocks | tier, orcid, briefing |
| soy-products | tier, orcid, briefing, generic-basis |
| soy-sauce-fermented | tier, orcid, briefing, generic-basis |
| sparkling-carbonated-water | tier, orcid, briefing, generic-basis |
| spices | tier, orcid, briefing |
| spinach | tier, orcid, briefing |
| sports-energy-drinks | tier, orcid, briefing, generic-basis |
| strollers | tier, orcid, briefing, generic-basis |
| sun-suntan-mineral | tier, orcid, briefing, generic-basis |
| sun-suntan-products | tier, orcid, briefing, generic-basis |
| sunflower-seed-butter | tier, orcid, briefing, generic-basis |
| sunflower-seeds | tier, orcid, briefing, generic-basis |
| supplements-algae-seaweed-based | tier, orcid, briefing, generic-basis |
| supplements-amino-acids-isolates | tier, orcid, briefing, generic-basis |
| supplements-bars-labeled | tier, orcid, briefing, generic-basis |
| supplements-botanicals-herbs | tier, orcid, briefing, generic-basis |
| supplements-clay-mineral-earth | tier, orcid, briefing, generic-basis |
| supplements-enzymes | tier, orcid, briefing, generic-basis |
| supplements-greens-superfood | tier, orcid, briefing, generic-basis |
| supplements-mushroom-fungal | tier, orcid, briefing, generic-basis |
| supplements-oil-based | tier, orcid, briefing, generic-basis |
| supplements-oral-liquids-droppers | tier, orcid, briefing, generic-basis |
| supplements-oral-liquids-shots | tier, orcid, briefing, generic-basis |
| supplements-oral-liquids-syrups | tier, orcid, briefing, generic-basis |
| supplements-oral-liquids-tinctures | tier, orcid, briefing, generic-basis |
| supplements-oral-solids-capsules | tier, orcid, briefing, generic-basis |
| supplements-oral-solids-effervescent | tier, orcid, briefing, generic-basis |
| supplements-oral-solids-gummies | tier, orcid, briefing, generic-basis |
| supplements-oral-solids-lozenges | tier, orcid, briefing, generic-basis |
| supplements-oral-solids-powders | tier, orcid, briefing, generic-basis |
| supplements-oral-solids-softgels | tier, orcid, briefing, generic-basis |
| supplements-oral-solids-tablets | tier, orcid, briefing, generic-basis |
| supplements-probiotics | tier, orcid, briefing, generic-basis |
| supplements-protein-collagen-powders | tier, orcid, briefing, generic-basis |
| supplements-teas-labeled | tier, orcid, briefing, generic-basis |
| supplements-vitamin-mineral | tier, orcid, briefing, generic-basis |
| swings-and-bouncers | tier, orcid, briefing, generic-basis |
| syrups-maple-agave-molasses | tier, orcid, briefing, generic-basis, species-number |
| tableware-ceramicware | tier, orcid, briefing, generic-basis |
| tableware-decorative-decals-coatings | tier, orcid, briefing, generic-basis |
| tableware-glassware | tier, orcid, briefing, generic-basis |
| tableware-metal-bottles-tumblers | tier, orcid, briefing, generic-basis |
| tableware-plastic-drinkware | tier, orcid, briefing, generic-basis |
| tattoo-inks | tier, orcid, briefing |
| teething-and-snacks | tier, orcid, briefing, generic-basis |
| tomato-condiments | tier, orcid, briefing, generic-basis |
| tongue-cleaners-scrapers | tier, orcid, briefing, generic-basis |
| toothbrushes | tier, orcid, briefing, generic-basis |
| toothpaste | tier, orcid, briefing, generic-basis |
| toy-chests | tier, orcid, briefing |
| toy-pacifiers | tier, orcid, briefing |
| toys-attached-cribs-playpens | tier, orcid, briefing |
| toys-balloons | tier, orcid, briefing |
| toys-balls | tier, orcid, briefing |
| toys-battery-electronic | tier, orcid, briefing |
| toys-crafts-other | tier, orcid, briefing |
| toys-marbles | tier, orcid, briefing |
| toys-painted | tier, orcid, briefing |
| toys-pompoms-fibrous-craft | tier, orcid, briefing |
| toys-projectile-guns | tier, orcid, briefing |
| toys-rattles | tier, orcid, briefing |
| toys-sound-producing | tier, orcid, briefing |
| toys-squeeze | tier, orcid, briefing |
| toys-stroller-carriage | tier, orcid, briefing |
| toys-stuffed-bean-bag | tier, orcid, briefing |
| toys-stuffing-materials | tier, orcid, briefing |
| toys-substrate-materials | tier, orcid, briefing |
| toys-with-magnets | tier, orcid, briefing |
| toys-yo-yo-elastic-tether | tier, orcid, briefing |
| traditional-eye-cosmetics | tier, orcid, briefing, generic-basis |
| tree-nuts-high-nickel | tier, orcid, briefing, generic-basis |
| true-tea-camellia-sinensis | tier, orcid, briefing |
| utensils-metal | tier, orcid, briefing, generic-basis |
| utensils-plastic-silicone-tools | tier, orcid, briefing, generic-basis |
| vacuum-cleaner-fragrance-additives | tier, orcid, briefing, generic-basis |
| vegetable-juices-non-root | tier, orcid, briefing, generic-basis |
| vegetable-juices-root-vegetable-containing | tier, orcid, briefing, generic-basis |
| vinegar | tier, orcid, briefing, generic-basis |
| walkers | tier, orcid, briefing, generic-basis |
| water-filters | tier, orcid, briefing, generic-basis |
| whitening-products | tier, orcid, briefing, generic-basis |
| wild-mushrooms | tier, orcid, briefing, generic-basis |
