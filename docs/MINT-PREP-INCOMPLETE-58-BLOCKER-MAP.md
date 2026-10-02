# ORDER MINT-PREP-INCOMPLETE-58 blocker map

Generated 2026-10-02 by the mint-prep sweep. Read-only analysis; no claim cell was filled and no DOI was minted.

**Sources of truth (origin/main, per order):**
- Fail list / scorecard: `data/standards/claim-surface-fail-list.json` via `node tools/standard-readiness-lint.mjs` (cert origin/main @ 58fd773). Not hand-edited.
- Government register and read-across source: `heavy-metal-index/data/evidence/regulatory_limits.csv` (HMI origin/main @ 85e108cf1f, 3049 rows).
- Credible-regulator set (enforced in `heavy-metal-index/tools/standards/compile-category.mjs`): EU, UK, CODEX, international, US, AU-NZ, CA, HK. Widening it is a dated Karen governance ruling requiring `credible_note`.

## Headline

| metric | value |
|---|---|
| standards total | 323 |
| COMPLETE | 265 |
| incomplete | 58 |
| claim-surface empty cells | 174 |
| cells legitimately fillable now (admitted-credible same-basis ML) | **0** |
| COMPLETE delta from this sweep | **0** |
| slugs newly mint-eligible | **0** |

**Finding.** Re-running every affected category compiler against HMI origin/main (categories 4, 5, 8, 10, 11, 13, 20, 33, 34, 35) reproduces all 174 empty claim cells as non-numeric (136 control, 23 not_material, 15 not emitted). Not one cell resolves to a firm numeric limit. The method is government-limit-only; with the current admitted-credible register there is no sovereign same-basis maximum level for any of these cells, so filling one would mean inventing a number, which the order, the method, and counsel liability all forbid. The order premise (drain cells so standards can mint) cannot be met here without a governance decision; the honest disposition is a blocker map for every remaining empty cell (order DONE criterion 3b).

## STATUS (single sweep; no edits so no per-10 increments)

```
COMPLETE delta: +0
remaining incomplete: 58 / 58
blockers: 174 / 174 empty claim cells (0 fillable, 14 governance-unlockable, 160 true gaps)
```

## A. Governance-unlockable (14 cells, 6 slugs) HARD BLOCKER: non-admitted jurisdiction only

A same-basis food cap EXISTS for these cells, but only from a jurisdiction NOT in the admitted-credible set. Each would flip numeric ONLY on a dated Karen ruling admitting that regulator (with `credible_note`). WARNING: the available caps are far looser than a floor should be (for example tea total-arsenic at 200 to 1000 ug/kg), so admitting a regulator to fill these cells would publish a ceiling weaker than the current control posture and could WEAKEN the standard. This is a governance decision, not an engineering fill.

| slug | metal | available same-basis caps (non-admitted, ug/kg) |
|---|---|---|
| herbal-botanical-infusions | tAs | TH 200, PY/MERCOSUR 600, SG/TT/IL 1000 |
| herbal-botanical-infusions | Cd | TH 300, PY/MERCOSUR 400, IL 100 |
| herbal-botanical-infusions | tHg | IL 50, VN 50 (tea) |
| matcha | tAs | TH 200, PY/MERCOSUR 600, SG/TT/IL 1000 |
| matcha | Cd | TH 300, PY/MERCOSUR 400, IL 100 |
| matcha | tHg | IL 50, VN 50 (tea) |
| true-tea-camellia-sinensis | tAs | TH 200, PY/MERCOSUR 600, SG/TT/IL 1000 |
| true-tea-camellia-sinensis | Cd | TH 300, PY/MERCOSUR 400, IL 100 |
| true-tea-camellia-sinensis | tHg | IL 50, VN 50 (tea) |
| cocoa-beverage-mixes | Pb | SG 2000, IL 1000, PY 200-500, MERCOSUR 200-500 (cocoa/chocolate scope) |
| cocoa-beverage-mixes | tAs | SG 1000, IL 1000, PY 200-500, MERCOSUR 200-500 |
| cocoa-beverage-mixes | tHg | IL 200, VN 50 (cocoa/chocolate) |
| fermented-beverages-non-tea-based | tAs | TH 200; PY/MERCOSUR/UY 100 (fermented alcoholic beverage scope) |
| kombucha-tea-based | tAs | TH 200 (tea/herbal tea, as-prepared) |

**Lever (one, no menu):** a dated governance ruling in `heavy-metal-index/tools/standards/compile-category.mjs` DEFAULT_CREDIBLE (or a per-category `credible` + `credible_note`) admitting a named regulator. Absent that ruling, these 14 cells stay control.

## B. True gaps (160 cells) HARD BLOCKER: no admitted or non-admitted same-basis sovereign ML

No credible sovereign (admitted or not) writes a same-basis maximum level for these commodity-by-metal cells; the only values in the register are in an incompatible basis (for example canned-liquid tin applied to a dry powder, or litre-of-water aluminium applied to a food). The compiler correctly disposes each as control or not_material with a substantiated rationale and `jurisdictions_checked`. Inventing a number here is a FAIL (order HARD LOCK + method + counsel liability). Register checked: `heavy-metal-index/data/evidence/regulatory_limits.csv` @ 85e108cf1f.

| metal | affected slugs (count) | one-line hard blocker |
|---|---|---|
| Al | 44 (herbal-botanical-infusions, matcha, true-tea-camellia-sinensis, cocoa-beverage-mixes, confectionery-candy, gummies-jellies, fermented-beverages-non-tea-based, fruit-juices-apple-containing, fruit-juices-non-apple, kombucha-tea-based, soft-drinks-carbonated-beverages, sports-energy-drinks, spices, bouillon-seasoning-blends, dried-fruit, fresh-fruit, fruit-snacks, hot-chili-sauces, plant-milks-non-soy-non-rice, plant-milks-rice-based, plant-milks-soy-based, salt, beef-product, bone-broth, chocolate, eggs-product, game-meats, lamb-mutton, pork-product, poultry-product, processed-meats, tattoo-inks, canned-meats, plant-based-meat-alternatives, leafy-vegetables-other, mixed-meals-prepared-foods, non-root-vegetables, pickled-fermented-vegetables, root-tuber-vegetables, soups-broths-stocks, spinach, antiperspirant, vegetable-juices-non-root, vegetable-juices-root-vegetable-containing) | no sovereign writes a food aluminium ML; only litre-of-water (Cat 8) and infant-formula (Cat 1) values exist, an incompatible basis |
| Cd | 11 (confectionery-candy, gummies-jellies, fermented-beverages-non-tea-based, fruit-juices-apple-containing, fruit-juices-non-apple, kombucha-tea-based, soft-drinks-carbonated-beverages, sports-energy-drinks, plant-milks-non-soy-non-rice, plant-milks-rice-based, plant-milks-soy-based) | no same-basis cadmium food ML for this commodity form; only incompatible-basis values exist |
| Cr | 31 (herbal-botanical-infusions, matcha, true-tea-camellia-sinensis, cocoa-beverage-mixes, confectionery-candy, gummies-jellies, fermented-beverages-non-tea-based, fruit-juices-apple-containing, fruit-juices-non-apple, kombucha-tea-based, soft-drinks-carbonated-beverages, sports-energy-drinks, spices, bouillon-seasoning-blends, dried-fruit, fresh-fruit, fruit-snacks, hot-chili-sauces, plant-milks-non-soy-non-rice, plant-milks-rice-based, plant-milks-soy-based, salt, chocolate, tattoo-inks, bibs, blankets-and-sleep-sacks, floss-interdental-cleaners, infant-clothing, oral-irrigators-water-flossers, tongue-cleaners-scrapers, toothbrushes) | no sovereign writes a total-chromium food ML; only packaged-water and water-utility values exist (Cat 8 / not food law) |
| Ni | 21 (herbal-botanical-infusions, matcha, true-tea-camellia-sinensis, confectionery-candy, gummies-jellies, spices, bouillon-seasoning-blends, dried-fruit, fresh-fruit, fruit-snacks, hot-chili-sauces, salt, beef-product, bone-broth, eggs-product, game-meats, lamb-mutton, pork-product, poultry-product, processed-meats, canned-meats) | EU 2024/1987 is the only comprehensive nickel instrument and its cells cover other commodity families; none covers these commodities in this basis |
| Sn | 38 (herbal-botanical-infusions, matcha, true-tea-camellia-sinensis, cocoa-beverage-mixes, confectionery-candy, gummies-jellies, spices, bouillon-seasoning-blends, dried-fruit, fresh-fruit, fruit-snacks, hot-chili-sauces, salt, beef-product, bone-broth, chocolate, eggs-product, game-meats, lamb-mutton, pork-product, poultry-product, processed-meats, tattoo-inks, plant-based-meat-alternatives, leafy-vegetables-other, mixed-meals-prepared-foods, non-root-vegetables, pickled-fermented-vegetables, root-tuber-vegetables, soups-broths-stocks, spinach, dentifrices, mouthwash-oral-rinse, whitening-products, bottled-drinking-water, infant-nursery-water, mineral-water, sparkling-carbonated-water) | EU 2023/915 3.5 and the Codex/FSANZ/HK tin cells scope to canned beverages/foods and except dried and powdered products; only a ready-to-drink canned basis exists |
| tAs | 7 (fruit-juices-apple-containing, fruit-juices-non-apple, soft-drinks-carbonated-beverages, sports-energy-drinks, plant-milks-non-soy-non-rice, plant-milks-rice-based, plant-milks-soy-based) | regulators write beverage arsenic on the inorganic species or only in packaged-water schedules; no same-basis total-arsenic food ML for this form |
| tHg | 8 (confectionery-candy, gummies-jellies, fermented-beverages-non-tea-based, fruit-juices-apple-containing, fruit-juices-non-apple, kombucha-tea-based, soft-drinks-carbonated-beverages, sports-energy-drinks) | no same-basis total-mercury food ML for this commodity form; only fish/seafood or packaged-water values exist |

## Appendix: full per-slug inventory (order step 0 queue)

Each claim-empty cell with its committed disposition and class (GU = governance-unlockable, TG = true gap).

| cat | slug | claim-empty cells (disposition / class) |
|---|---|---|
| 5 | herbal-botanical-infusions | tAs (control/GU), Cd (control/GU), tHg (control/GU), Ni (control/TG), Sn (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | matcha | tAs (control/GU), Cd (control/GU), tHg (control/GU), Ni (control/TG), Sn (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | true-tea-camellia-sinensis | tAs (control/GU), Cd (control/GU), tHg (control/GU), Ni (control/TG), Sn (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | cocoa-beverage-mixes | Pb (control/GU), tAs (control/GU), tHg (control/GU), Sn (control/TG), Al (control/TG), Cr (control/TG) |
| 33 | confectionery-candy | Cd (absent/TG), tHg (not_material/TG), Ni (absent/TG), Sn (not_material/TG), Al (not_material/TG), Cr (absent/TG) |
| 33 | gummies-jellies | Cd (not_material/TG), tHg (not_material/TG), Ni (not_material/TG), Sn (not_material/TG), Al (not_material/TG), Cr (absent/TG) |
| 5 | fermented-beverages-non-tea-based | tAs (control/GU), Cd (control/TG), tHg (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | fruit-juices-apple-containing | tAs (control/TG), Cd (control/TG), tHg (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | fruit-juices-non-apple | tAs (control/TG), Cd (control/TG), tHg (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | kombucha-tea-based | tAs (control/GU), Cd (control/TG), tHg (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | soft-drinks-carbonated-beverages | tAs (control/TG), Cd (control/TG), tHg (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | sports-energy-drinks | tAs (control/TG), Cd (control/TG), tHg (control/TG), Al (control/TG), Cr (control/TG) |
| 34 | spices | Ni (absent/TG), Sn (absent/TG), Al (not_material/TG), Cr (absent/TG) |
| 34 | bouillon-seasoning-blends | Ni (absent/TG), Sn (not_material/TG), Al (not_material/TG), Cr (absent/TG) |
| 4 | dried-fruit | Ni (control/TG), Sn (not_material/TG), Al (control/TG), Cr (control/TG) |
| 4 | fresh-fruit | Ni (control/TG), Sn (not_material/TG), Al (control/TG), Cr (control/TG) |
| 4 | fruit-snacks | Ni (control/TG), Sn (control/TG), Al (control/TG), Cr (control/TG) |
| 34 | hot-chili-sauces | Ni (absent/TG), Sn (not_material/TG), Al (absent/TG), Cr (absent/TG) |
| 5 | plant-milks-non-soy-non-rice | tAs (control/TG), Cd (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | plant-milks-rice-based | tAs (control/TG), Cd (control/TG), Al (control/TG), Cr (control/TG) |
| 5 | plant-milks-soy-based | tAs (control/TG), Cd (control/TG), Al (control/TG), Cr (control/TG) |
| 34 | salt | Ni (absent/TG), Sn (not_material/TG), Al (not_material/TG), Cr (absent/TG) |
| 11 | beef-product | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 35 | bone-broth | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 33 | chocolate | Sn (not_material/TG), Al (not_material/TG), Cr (absent/TG) |
| 11 | eggs-product | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 11 | game-meats | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 11 | lamb-mutton | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 11 | pork-product | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 11 | poultry-product | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 11 | processed-meats | Ni (control/TG), Sn (control/TG), Al (control/TG) |
| 13 | tattoo-inks | Sn (control/TG), Al (control/TG), Cr (control/TG) |
| 11 | canned-meats | Ni (control/TG), Al (control/TG) |
| 11 | plant-based-meat-alternatives | Sn (control/TG), Al (control/TG) |
| 4 | leafy-vegetables-other | Sn (not_material/TG), Al (control/TG) |
| 35 | mixed-meals-prepared-foods | Sn (control/TG), Al (control/TG) |
| 4 | non-root-vegetables | Sn (not_material/TG), Al (control/TG) |
| 4 | pickled-fermented-vegetables | Sn (control/TG), Al (control/TG) |
| 4 | root-tuber-vegetables | Sn (not_material/TG), Al (control/TG) |
| 35 | soups-broths-stocks | Sn (control/TG), Al (control/TG) |
| 4 | spinach | Sn (not_material/TG), Al (control/TG) |
| 13 | antiperspirant | Al (not_material/TG) |
| 10 | bibs | Cr (control/TG) |
| 10 | blankets-and-sleep-sacks | Cr (control/TG) |
| 20 | dentifrices | Sn (control/TG) |
| 20 | floss-interdental-cleaners | Cr (control/TG) |
| 10 | infant-clothing | Cr (control/TG) |
| 20 | mouthwash-oral-rinse | Sn (control/TG) |
| 20 | oral-irrigators-water-flossers | Cr (control/TG) |
| 20 | tongue-cleaners-scrapers | Cr (control/TG) |
| 20 | toothbrushes | Cr (control/TG) |
| 5 | vegetable-juices-non-root | Al (control/TG) |
| 5 | vegetable-juices-root-vegetable-containing | Al (control/TG) |
| 20 | whitening-products | Sn (control/TG) |
| 8 | bottled-drinking-water | Sn (control/TG) |
| 8 | infant-nursery-water | Sn (control/TG) |
| 8 | mineral-water | Sn (control/TG) |
| 8 | sparkling-carbonated-water | Sn (control/TG) |

_No em dashes, brand names, or retired MaxPoL language appear in this document, per order style locks. Baby-wipes antimony untouched. Already-COMPLETE canaries not reopened._
