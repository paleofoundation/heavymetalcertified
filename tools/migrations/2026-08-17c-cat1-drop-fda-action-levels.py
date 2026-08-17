#!/usr/bin/env python3
"""
Cat-1: drop FDA action-level bindings; rebind to the tightest COVERING actual government limit.

Owner rule (Karen, 2026-08-17): "FDA action levels are not government limits." Audit wne673rzp
confirmed both FDA rows are nonbinding guidance (final action levels), and the US sets no binding
federal ML for these metals in food (only 21 CFR 165.110 bottled water, out of scope). So both drop.

Rebindings (verified against the register; the tightest covering government ML replaces the FDA
action level; value HOLDS at 10 for every lead cell — real government limits at 10 cover these
matrices — so there is NO lead loosening):
  fruit-juice            iAs 10 -> 20  EU 2023/915 3.4.4 "fruit juices" (eu2023_ias_fruit_juice_20).
                                       LOOSEN, forced: no government arsenic ML <=10 covers a fruit
                                       juice (all sub-20 iAs numbers are drinking water / formula).
                                       Arsenic, not lead. The dropped 10 was the FDA apple-juice
                                       action level (apple-only scope anyway).
  fruit-purees-general   Pb  10 -> 10  Panama "fruits" 10 (pa_decreto467_2007_pb_fruits). HOLD.
  non-root-vegetable-purees  Pb 10->10 Brazil "other foods specially formulated for infants and
                                       young children" 10 (br_pb_other-foods-specially-formulated-
                                       for-inf_10) — covers a non-cereal infant vegetable puree. HOLD.
  mixed-meals-non-rice   Pb  10 -> 10  same Brazil "other infant food" catch-all 10. HOLD. (A
                                       meat+grain infant meal is "other food specially formulated
                                       for infants", covered at 10 — tighter than the cereal-based
                                       20 classification, which the Cat-1 taxonomy keeps separate.)
  mixed-meals-rice-containing Pb 10->10 same. HOLD.

Each cell also has the FDA action-level entry removed from per_country (it is not a government
limit and must not display as a comparator on these rebound cells).

Run: python3 <this> [--check]   (run from repo root)
"""
import json, sys, os

REPO = os.getcwd()
D = os.path.join(REPO, "data/standards/cat1-compiled")
CHECK = "--check" in sys.argv

BR_CATCHALL = "br_pb_other-foods-specially-formulated-for-inf_10"

# (record, analyte, new_value, new_jur, new_id, add_per_country)
PLAN = [
    ("fruit-juice", "iAs", 20, "EU", "eu2023_ias_fruit_juice_20", None),
    ("fruit-purees-general", "Pb", 10, "PA", "pa_decreto467_2007_pb_fruits", None),
    ("non-root-vegetable-purees", "Pb", 10, "BR", BR_CATCHALL, ("BR", 10, BR_CATCHALL)),
    ("mixed-meals-non-rice", "Pb", 10, "BR", BR_CATCHALL, ("BR", 10, BR_CATCHALL)),
    ("mixed-meals-rice-containing", "Pb", 10, "BR", BR_CATCHALL, ("BR", 10, BR_CATCHALL)),
]

changes, already = [], []
for rec, an, val, jur, rid, add in PLAN:
    fp = os.path.join(D, rec + ".json")
    obj = json.load(open(fp, encoding="utf-8"))
    c = obj["variants"]["both"][an]
    if c.get("binding_id") == rid and c.get("value") == val and "US" not in (c.get("per_country") or {}):
        already.append(f"{rec} {an} already rebound to {jur} {val}"); continue
    old_val, old_bind = c.get("value"), c.get("binding_jurisdiction")
    pc = dict(c.get("per_country") or {})
    pc.pop("US", None)                         # drop the FDA action-level comparator
    if add:
        k, v, i = add
        pc[k] = {"value": v, "converted": False, "id": i}
    c["type"] = "gov"; c["value"] = val; c["value_exact"] = val
    c["binding_jurisdiction"] = jur; c["binding_id"] = rid
    c.pop("source_id", None); c.pop("source_jurisdiction", None); c.pop("label", None)
    c["per_country"] = pc
    obj["variants"]["both"][an] = c
    if not CHECK:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(json.dumps(obj, indent=2, ensure_ascii=False))
    d = "LOOSEN" if val > old_val else "HOLD"
    changes.append(f"{rec} {an} {old_val}({old_bind}) -> {val}({jur})  [{d}]")

print("CHANGES (%d):" % len(changes))
for c in changes: print("  +", c)
for c in already: print("  =", c)
if CHECK and changes:
    print("CHECK FAILED"); sys.exit(1)
print("OK")
