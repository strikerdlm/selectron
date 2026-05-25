#!/usr/bin/env python3
"""Orchestrate tier-B Gamma-Poisson fit and merge converged posteriors.

Usage (from repo root, with python/.venv active):
    python scripts/apply_fit.py [--dry-run] [--condition <id>]
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(_REPO_ROOT / "python" / "src"))

from selectron.fitter import fit_all_tier_b, FitResult
from selectron.writer import merge_fitted_priors

_BRIDGES_DIR = _REPO_ROOT / "research" / "evidence" / "bridges"

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger("apply_fit")


def write_diagnostics(
    result: FitResult,
    reasons: list[str],
    bridges_dir: Path = _BRIDGES_DIR,
) -> None:
    """Write fit diagnostics JSON for a non-converged condition."""
    bridges_dir.mkdir(parents=True, exist_ok=True)
    out = bridges_dir / f"{result.condition_id}_fit_diagnostics.json"
    data = {
        "condition_id": result.condition_id,
        "r_hat": result.r_hat,
        "ess_bulk": result.ess_bulk,
        "ess_tail": result.ess_tail,
        "divergences": result.divergences,
        "posterior_alpha": result.posterior_alpha,
        "posterior_beta": result.posterior_beta,
        "n_studies": result.n_studies,
        "total_person_days": result.total_person_days,
        "total_events": result.total_events,
        "reasons": reasons,
    }
    out.write_text(json.dumps(data, indent=2))
    logger.info("Diagnostics written: %s", out)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--condition", default=None, help="Fit a single condition by ID")
    args = parser.parse_args()

    logger.info("Running tier-B fit (dry_run=%s, condition_filter=%s)", args.dry_run, args.condition)

    report = fit_all_tier_b(
        draws=2000,
        tune=1000,
        chains=4,
        seed=42,
        condition_filter=args.condition,
        dry_run=args.dry_run,
    )

    logger.info(
        "Fit complete: %d fitted, %d failed, %d skipped",
        report.n_fitted, report.n_failed, report.n_skipped,
    )

    for cid, result in report.fitted.items():
        logger.info("  PASS %s (R-hat=%.4f, div=%d)", cid, result.r_hat, result.divergences)

    for cid, (result, reasons) in report.failed.items():
        write_diagnostics(result, reasons)
        logger.warning("  FAIL %s: %s", cid, "; ".join(reasons))

    for cid, reason in report.skipped.items():
        logger.info("  SKIP %s: %s", cid, reason)

    to_merge = report.fitted
    if to_merge and not args.dry_run:
        writer_report = merge_fitted_priors(fitted=to_merge)
        logger.info("Merged %d conditions into imm-priors.json", writer_report.n_updated)
        for cid, diffs in writer_report.updated.items():
            for d in diffs:
                logger.info("  %s.%s: %s -> %s", cid, d.field, d.old_value, d.new_value)
    elif args.dry_run:
        logger.info("DRY RUN: would merge %d conditions", len(to_merge))

    print(f"\nSummary: {len(to_merge)} merged, {report.n_failed} failed fit, {report.n_skipped} skipped")
    return 0


if __name__ == "__main__":
    sys.exit(main())
