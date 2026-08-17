#!/usr/bin/env python3
"""
SUPERSEDED IN PART: the iAs=50 (parent-bound) assignments below were replaced the same day by
2026-08-17b-cat1-ias-category-floor-20.py (iAs=20, owner decision). Running --check will report those
4 iAs cells as not-at-target — that is expected. The soy-Cd and converted-flag corrections here remain
current.

Cat-1 arsenic + soy-cadmium scope corrections — deterministic, idempotent patch-as-code.

WHY THIS EXISTS AS A CERT-SIDE TRANSFORM (not an upstream recompile):
  The canonical register at heavy-metal-index is missing 11 hk_cap132v rows the current
  compiled Cat-1 records cite, and that repo sits on a 702-file WIP branch. A clean upstream
  recompile is neither safe nor fast today. The compiled JSON is a committed, versioned cert-repo
  artifact; the correct isolation boundary is to apply the audited corrections here as reviewable
  code, guard them (species/total coherence lint + golden-value check), and file the upstream
  compiler/register reconciliation as a follow-up so the next recompile reproduces these values.

Corrections (each traces to the wf2uta7ck audit, adversarially verified):
  1-2. rice iAs 100 -> 50   (baby-cereals-dry-rice-based, teething-and-snacks-rice-based)
       Parent-bound: India tAs 50 caps total arsenic, iAs <= tAs, so operative iAs = 50.
  3-4. non-rice iAs 20 -> 50 (baby-cereals-dry-non-rice, teething-and-snacks-non-rice)
       Current 20 is EU "baby food" 2023/915 3.4.3, which by the 2006/125 definition EXCLUDES
       processed cereal-based food -> non-traceable. No covering sovereign iAs < 50; parent-bound 50.
  5.   soy formula powder Cd 10 -> 20   (infant-formula-powder [soy])
  6.   soy formula liquid Cd 5 -> 10    (infant-formula-rtf-liquid [soy])
       Register soy_class mistag: bound to Israel's NON-soy row; Israel writes dedicated soy rows at
       double, and EU/UK/GSO/IL-soy all set the soy value. Retarget to EU soy row.
  7.   Clear spurious converted:true on RTF-liquid Sn+Cd India entries (both variants):
       asserts an 8:1 conversion that v1.1 deliberately refused; makes the page render a false mark.

Run:  python3 apply-cat1-arsenic-corrections.py [--check]
      --check exits nonzero if any cell is NOT already at its target (no writes).
"""
import json, sys, os

REPO = os.getcwd()  # committed record of the applied transform; run from repo root
D = os.path.join(REPO, "data/standards/cat1-compiled")
CHECK = "--check" in sys.argv

IN_TAS_ID = "in_tas_infant-milk-substitute-and-infant-foods_50"

def load(rec): return json.load(open(os.path.join(D, rec + ".json"), encoding="utf-8"))
def save(rec, obj):
    with open(os.path.join(D, rec + ".json"), "w", encoding="utf-8") as f:
        f.write(json.dumps(obj, indent=2, ensure_ascii=False))   # matches compiler formatting exactly

changes, already = [], []

def parent_bound_ias(rec, variant, label, drop_jurs):
    """Convert a gov iAs cell to a read_across cell bounded by the parent total (50)."""
    obj = load(rec)
    c = obj["variants"][variant]["iAs"]
    if c.get("type") == "read_across" and c.get("value") == 50 and c.get("source_id") == IN_TAS_ID:
        already.append(f"{rec}[{variant}] iAs already 50 parent-bound"); return
    old = c.get("value")
    pc = {k: v for k, v in (c.get("per_country") or {}).items() if k not in drop_jurs}
    obj["variants"][variant]["iAs"] = {
        "type": "read_across", "value": 50, "value_exact": 50,
        "source_id": IN_TAS_ID, "source_jurisdiction": "IN",
        "label": label, "basis_note": "parent-bound (iAs <= tAs)",
        "per_country": pc,
    }
    if not CHECK: save(rec, obj)
    changes.append(f"{rec}[{variant}] iAs {old} -> 50 (parent-bound; dropped per_country {sorted(drop_jurs)})")

def soy_cd(rec, variant, new_val, eu_id, il_id):
    obj = load(rec)
    c = obj["variants"][variant]["Cd"]
    if c.get("binding_id") == eu_id and c.get("value") == new_val:
        already.append(f"{rec}[{variant}] Cd already {new_val} EU-soy"); return
    old = c.get("value")
    c["value"] = new_val; c["value_exact"] = new_val
    c["binding_jurisdiction"] = "EU"; c["binding_id"] = eu_id
    # Israel's covering row for a soy formula is its dedicated soy row, not the non-soy row.
    if "IL" in (c.get("per_country") or {}):
        c["per_country"]["IL"] = {"value": new_val, "converted": c["per_country"]["IL"].get("converted", False), "id": il_id}
    if not CHECK: save(rec, obj)
    changes.append(f"{rec}[{variant}] Cd {old} -> {new_val} (EU soy row; IL retargeted to soy row)")

def clear_converted(rec, variant, analyte, jur):
    obj = load(rec)
    pc = obj["variants"][variant][analyte].get("per_country") or {}
    if jur in pc and pc[jur].get("converted"):
        pc[jur]["converted"] = False
        if not CHECK: save(rec, obj)
        changes.append(f"{rec}[{variant}] {analyte}.{jur} converted flag cleared (no 8:1 applied)")
    else:
        already.append(f"{rec}[{variant}] {analyte}.{jur} converted already clear")

RICE_CEREAL_LABEL = ("Inorganic arsenic bounded by the parent total-arsenic ceiling. Total arsenic is "
    "capped at 50 by India FSSAI row " + IN_TAS_ID + ", and iAs <= tAs by definition, so the operative "
    "inorganic-arsenic ceiling is 50. The tightest sovereign iAs ceiling written for infant rice cereal "
    "(US FDA / Health Canada, 100) is looser and is retained as the species reference.")
RICE_SNACK_LABEL = ("Inorganic arsenic bounded by the parent total-arsenic ceiling. Total arsenic is "
    "capped at 50 by India FSSAI row " + IN_TAS_ID + ", and iAs <= tAs, so the operative inorganic-arsenic "
    "ceiling is 50. The species reference is Health Canada 'rice-based foods intended specifically for "
    "infants and young children' (100); the US FDA infant-rice-cereal action level does not extend to rice snacks.")
NONRICE_LABEL = ("Inorganic arsenic bounded by the parent total-arsenic ceiling. Total arsenic is capped "
    "at 50 by India FSSAI row " + IN_TAS_ID + ", and iAs <= tAs, so the operative inorganic-arsenic ceiling "
    "is 50. The EU 'baby food' iAs 20 does not apply: Regulation (EU) 2023/915 point 3.4.3 uses the "
    "Directive 2006/125/EC definition, which excludes processed cereal-based food. No sovereign sets a "
    "covering inorganic-arsenic ceiling below 50.")

# 1-2. rice iAs -> 50
parent_bound_ias("baby-cereals-dry-rice-based", "both", RICE_CEREAL_LABEL, drop_jurs=set())
parent_bound_ias("teething-and-snacks-rice-based", "both", RICE_SNACK_LABEL, drop_jurs={"US"})  # FDA scope excludes snacks
# 3-4. non-rice iAs -> 50
parent_bound_ias("baby-cereals-dry-non-rice", "both", NONRICE_LABEL, drop_jurs={"EU", "KR"})    # EU excludes cereal; KR rice-bran only
parent_bound_ias("teething-and-snacks-non-rice", "both", NONRICE_LABEL, drop_jurs={"EU", "KR"})
# 5-6. soy Cd mistag
soy_cd("infant-formula-powder", "soy", 20, "eu2023_cd_formula_soy_powder_20", "il_fcs2016_cd_14_3_infant_and_toddler_formulas_from_soy_or_containing_s_20")
soy_cd("infant-formula-rtf-liquid", "soy", 10, "eu2023_cd_formula_soy_liquid_10", "il_fcs2016_cd_14_2_infant_and_toddler_formulas_from_soy_or_containing_s_10")
# 7. clear spurious converted flags on RTF-liquid Sn+Cd (both variants)
for v in ("cow", "soy"):
    for a in ("Sn", "Cd"):
        clear_converted("infant-formula-rtf-liquid", v, a, "IN")

print("CHANGES (%d):" % len(changes))
for c in changes: print("  +", c)
print("ALREADY-AT-TARGET (%d):" % len(already))
for c in already: print("  =", c)
if CHECK and changes:
    print("\nCHECK FAILED: %d cell(s) not at target" % len(changes)); sys.exit(1)
print("\nOK" + (" (check passed, no writes)" if CHECK else " (%d file writes applied)" % len({c.split('[')[0] for c in changes})))
