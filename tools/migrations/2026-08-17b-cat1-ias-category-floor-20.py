#!/usr/bin/env python3
"""
Cat-1 inorganic-arsenic category floor — set iAs = 20 on the four dry cereal/snack records.

SUPERSEDES the parent-bound iAs=50 applied earlier the same day (migration
2026-08-17-cat1-arsenic-corrections.py). Owner decision (Karen, 2026-08-17): set total arsenic to
50 (India, already in place) and inorganic arsenic to 20 (EU baby-food 2023/915 point 3.4.3),
adopted as a protective read-across across the whole HMTc Infant-and-Child category (ages 0-5).

Rationale: EU's "baby food" iAs 20 is the strictest sovereign inorganic-arsenic ceiling any
government sets for infant food. Its scope is drafted narrowly — Directive 2006/125/EC excludes
processed cereal-based food, and the limit is set for infants up to 24 months — but HMTc's category
covers ages 0-5 and holds every food in it to the tightest sovereign iAs number, applied as a
disclosed read-across (the same mechanism the program uses wherever no government regulates the
exact product). 20 <= tAs 50, so coherence holds. Rice-based products will not meet iAs 20; that is
intended and is disclosed on the "what will struggle" page.

Run: python3 <this> [--check]   (run from repo root)
"""
import json, sys, os

REPO = os.getcwd()
D = os.path.join(REPO, "data/standards/cat1-compiled")
CHECK = "--check" in sys.argv

EU_IAS_ID = "eu2023_ias_babyfood_20"
RECORDS = ["baby-cereals-dry-rice-based", "teething-and-snacks-rice-based",
           "baby-cereals-dry-non-rice", "teething-and-snacks-non-rice"]

LABEL = ("Held to the strictest sovereign infant inorganic-arsenic ceiling: EU baby-food iAs 20 "
    "(Regulation (EU) 2023/915 point 3.4.3), adopted as a protective read-across across the HMTc "
    "Infant and Child Foods category (ages 0-5). EU's 'baby food' term is drafted narrowly "
    "(Directive 2006/125/EC excludes processed cereal-based food, and the limit is set for infants "
    "up to 24 months); HMTc applies the tightest sovereign inorganic-arsenic number to every food in "
    "this 0-5 category. Total arsenic is separately capped at 50 (India FSSAI); iAs <= tAs.")

changes, already = [], []
for rec in RECORDS:
    fp = os.path.join(D, rec + ".json")
    obj = json.load(open(fp, encoding="utf-8"))
    c = obj["variants"]["both"]["iAs"]
    if c.get("value") == 20 and c.get("source_id") == EU_IAS_ID:
        already.append(f"{rec} iAs already 20 EU read-across"); continue
    old = c.get("value")
    pc = dict(c.get("per_country") or {})
    pc["EU"] = {"value": 20, "converted": False, "id": EU_IAS_ID}   # adopted read-across source
    obj["variants"]["both"]["iAs"] = {
        "type": "read_across", "value": 20, "value_exact": 20,
        "source_id": EU_IAS_ID, "source_jurisdiction": "EU",
        "label": LABEL, "basis_note": "protective read-across (category-wide infant iAs floor)",
        "per_country": pc,
    }
    if not CHECK:
        with open(fp, "w", encoding="utf-8") as f:
            f.write(json.dumps(obj, indent=2, ensure_ascii=False))
    changes.append(f"{rec} iAs {old} -> 20 (EU read-across)")

print("CHANGES (%d):" % len(changes))
for c in changes: print("  +", c)
for c in already: print("  =", c)
if CHECK and changes:
    print("CHECK FAILED"); sys.exit(1)
print("OK")
