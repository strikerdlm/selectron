#!/usr/bin/env python3
"""
Apply rev3-f severity evidence to imm-priors.json.

For each condition with evidence rows in severity_f.proposals_rev3f.csv:
  - Compute treated mean impairment fraction
  - Compute untreated mean (or infer from treated + pathophysiology)
  - Update treated.fi_cp3 and untreated.fi_cp3 Beta-Pert parameters
  - Update source_ref with rev3-f provenance note
"""

import csv
import json
from collections import defaultdict
from datetime import datetime, timezone

CSV_PATH = "research/evidence_extracted/severity_f.proposals_rev3f.csv"
PRIORS_PATH = "src/data/imm-priors.json"

def load_evidence():
    rows_by_condition = defaultdict(list)
    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                row["impairment_fraction"] = float(row["impairment_fraction"])
            except (ValueError, TypeError):
                continue
            rows_by_condition[row["condition_id"]].append(row)
    return rows_by_condition

def compute_stats(rows, status_filter):
    filtered = [r for r in rows if r["treated_or_untreated"] == status_filter]
    if not filtered:
        return None, None, 0
    vals = [r["impairment_fraction"] for r in filtered]
    mean = sum(vals) / len(vals)
    min_v = min(vals)
    max_v = max(vals)
    return mean, (min_v, max_v), len(filtered)

def pert_params(mode, min_v, max_v):
    """Return Beta-Pert min/mode/max, clamped to [0,1]."""
    return {
        "min": round(max(0.0, min_v), 3),
        "mode": round(min(1.0, max(0.0, mode)), 3),
        "max": round(min(1.0, max_v), 3),
    }

def infer_untreated(treated_mean, condition_id):
    """Infer untreated mean when no direct evidence exists."""
    # For conditions with very high treated impairment, untreated is near-universal
    if treated_mean >= 0.8:
        return min(treated_mean + 0.15, 0.99)
    # For moderate conditions, untreated is roughly 1.5-2x treated, capped
    inferred = treated_mean * 1.8
    return min(inferred, 0.98)

def main():
    evidence = load_evidence()

    with open(PRIORS_PATH) as f:
        priors = json.load(f)

    updated = 0
    untouched = 0
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    for cid, rows in evidence.items():
        if cid not in priors["conditions"]:
            print(f"WARNING: {cid} not in priors, skipping")
            continue

        cond = priors["conditions"][cid]
        treated_mean, treated_range, n_t = compute_stats(rows, "treated")
        untreated_mean, untreated_range, n_u = compute_stats(rows, "untreated")

        if treated_mean is None:
            # No treated rows — skip (shouldn't happen for conditions we care about)
            continue

        # Treated fi_cp3
        t_min = treated_range[0] if treated_range else max(treated_mean - 0.2, 0.0)
        t_max = treated_range[1] if treated_range else min(treated_mean + 0.2, 1.0)
        # Ensure min < mode < max
        t_min = min(t_min, treated_mean * 0.7)
        t_max = max(t_max, treated_mean * 1.2, treated_mean + 0.05)
        t_min = max(0.0, min(t_min, treated_mean - 0.01))
        t_max = min(1.0, max(t_max, treated_mean + 0.01))

        cond["treated"]["fi_cp3"] = pert_params(treated_mean, t_min, t_max)

        # Untreated fi_cp3
        if untreated_mean is None:
            untreated_mean = infer_untreated(treated_mean, cid)
            u_min = max(0.0, untreated_mean - 0.15)
            u_max = min(1.0, untreated_mean + 0.1)
        else:
            u_min = untreated_range[0] if untreated_range else max(untreated_mean - 0.2, 0.0)
            u_max = untreated_range[1] if untreated_range else min(untreated_mean + 0.2, 1.0)
        u_min = max(0.0, min(u_min, untreated_mean - 0.01))
        u_max = min(1.0, max(u_max, untreated_mean + 0.01))

        cond["untreated"]["fi_cp3"] = pert_params(untreated_mean, u_min, u_max)

        # Update source_ref provenance note
        base_ref = cond.get("source_ref", "")
        rev_note = (
            f"rev3-f ({timestamp}): severity tuned against persistent-impairment literature — "
            f"treated mean={treated_mean:.2f}, n_treated={n_t}, n_untreated={n_u}"
        )
        if "rev3-f" in base_ref:
            # Already has rev3-f note — do not duplicate
            pass
        else:
            cond["source_ref"] = f"{base_ref}; {rev_note}" if base_ref else rev_note

        updated += 1

    print(f"Updated {updated} conditions with rev3-f evidence.")

    # For all remaining placeholder conditions (mode=0), leave as-is
    placeholder_count = 0
    for cid, cond in priors["conditions"].items():
        if cid not in evidence:
            if cond["treated"]["fi_cp3"].get("mode") == 0:
                placeholder_count += 1
            untouched += 1

    print(f"Left {untouched} conditions untouched (including {placeholder_count} with mode=0 placeholders).")

    with open(PRIORS_PATH, "w") as f:
        json.dump(priors, f, indent=2)
    print(f"Wrote {PRIORS_PATH}")

if __name__ == "__main__":
    main()
