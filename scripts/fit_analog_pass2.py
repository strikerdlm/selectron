#!/usr/bin/env python3
"""Standalone PyMC fit for analog/Antarctic evidence pass 2 upgrade candidates.

Runs Gamma-Poisson NUTS fits for two HIGH-priority tierA-nasa conditions:
  - herpes-zoster-reactivation-shingles: Antarctic rate 33.3/1000/PY (Zhang 2026)
  - nephrolithiasis: 7 post-flight stones / 358 PY (Goodenow-Messman 2022)

Evidence file: research/evidence_extracted/incidence_rates.proposals_p-k.csv
Research evidence: research/analog_incidence_pass2_immune_msk_renal.md

Usage (from repo root, with python/.venv active):
    python scripts/fit_analog_pass2.py [--dry-run]
"""
from __future__ import annotations

import argparse
import json
import logging
import math
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).parent.parent.resolve()
sys.path.insert(0, str(_REPO_ROOT / "python" / "src"))

from selectron.fitter import fit_gamma_poisson, check_convergence
from selectron.priors_io import load_priors, save_priors

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")
logger = logging.getLogger("fit_analog_pass2")

# ── Observations ──────────────────────────────────────────────────────────────

# herpes-zoster-reactivation-shingles
# Zhang 2026 (PMC13149593): Antarctic research station HZ rate = 33.3/1000/PY
# Synthetic observation anchored at rate: 2 events / 60 person-years = 21,915 person-days
# rate = 2 / 21915 = 9.13e-5/pd = 9.13e-5 × 365.25 × 1000 = 33.3/1000/PY ✓
HZ_OBS = [{"events": 2, "person_days": 21915}]
HZ_ALPHA0 = 2.0
HZ_BETA0 = 176056.0  # current tierA-nasa prior (λ_mean = 4.1/1000/PY)

# nephrolithiasis
# Goodenow-Messman 2022 (PMC8799707): 7 post-flight CaOx stones / 358 post-flight PY
# person_days = 358 × 365.25 = 130,760
# Note: converting Lognormal-Poisson → Gamma-Poisson
# Current Lognormal prior: mu_log_lambda=-11.5, sigma=0.116
# E[λ] = exp(-11.5 + 0.116²/2) = exp(-11.493) ≈ 1.013e-5/pd = 3.7/1000/PY
# Equivalent Gamma prior: Gamma(2, β) where β = 2 / 1.013e-5 = 197432
NEPR_OBS = [{"events": 7, "person_days": 130760}]
NEPR_ALPHA0 = 2.0
NEPR_BETA0 = 197432.0  # equiv Gamma prior matching Lognormal mean


def _lambda_per_py(alpha: float, beta: float) -> float:
    return (alpha / beta) * 365.25 * 1000


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true", help="Fit but do not write to imm-priors.json")
    args = parser.parse_args()

    logger.info("=== Fit: herpes-zoster-reactivation-shingles ===")
    logger.info("Prior: Gamma(%.1f, %.0f) → λ_mean = %.2f/1000/PY", HZ_ALPHA0, HZ_BETA0,
                _lambda_per_py(HZ_ALPHA0, HZ_BETA0))
    logger.info("Observation: %d events / %d person-days (Antarctic 33.3/1000/PY anchor)",
                HZ_OBS[0]["events"], HZ_OBS[0]["person_days"])

    hz = fit_gamma_poisson(
        condition_id="herpes-zoster-reactivation-shingles",
        alpha_0=HZ_ALPHA0,
        beta_0=HZ_BETA0,
        observations=HZ_OBS,
        seed=42,
        draws=2000,
        tune=1000,
        chains=4,
    )
    hz_ok, hz_reasons = check_convergence(hz)
    logger.info("  Posterior: Gamma(%.4f, %.4f) → λ_mean = %.2f/1000/PY",
                hz.posterior_alpha, hz.posterior_beta,
                _lambda_per_py(hz.posterior_alpha, hz.posterior_beta))
    logger.info("  R-hat=%.4f, ESS_bulk=%.0f, ESS_tail=%.0f, div=%d, converged=%s",
                hz.r_hat, hz.ess_bulk, hz.ess_tail, hz.divergences, hz_ok)
    if not hz_ok:
        logger.error("  CONVERGENCE FAIL: %s", "; ".join(hz_reasons))
        return 1

    logger.info("")
    logger.info("=== Fit: nephrolithiasis ===")
    logger.info("Prior: Gamma(%.1f, %.0f) → λ_mean = %.2f/1000/PY (Lognormal→Gamma equiv)",
                NEPR_ALPHA0, NEPR_BETA0, _lambda_per_py(NEPR_ALPHA0, NEPR_BETA0))
    logger.info("Observation: %d events / %d person-days (post-flight astronaut 19.6/1000/PY)",
                NEPR_OBS[0]["events"], NEPR_OBS[0]["person_days"])

    nepr = fit_gamma_poisson(
        condition_id="nephrolithiasis",
        alpha_0=NEPR_ALPHA0,
        beta_0=NEPR_BETA0,
        observations=NEPR_OBS,
        seed=42,
        draws=2000,
        tune=1000,
        chains=4,
    )
    nepr_ok, nepr_reasons = check_convergence(nepr)
    logger.info("  Posterior: Gamma(%.4f, %.4f) → λ_mean = %.2f/1000/PY",
                nepr.posterior_alpha, nepr.posterior_beta,
                _lambda_per_py(nepr.posterior_alpha, nepr.posterior_beta))
    logger.info("  R-hat=%.4f, ESS_bulk=%.0f, ESS_tail=%.0f, div=%d, converged=%s",
                nepr.r_hat, nepr.ess_bulk, nepr.ess_tail, nepr.divergences, nepr_ok)
    if not nepr_ok:
        logger.error("  CONVERGENCE FAIL: %s", "; ".join(nepr_reasons))
        return 1

    # ── Summary ────────────────────────────────────────────────────────────────
    print("\n" + "="*60)
    print("PASS 2 ANALOG FIT SUMMARY")
    print("="*60)
    print(f"herpes-zoster: {_lambda_per_py(HZ_ALPHA0, HZ_BETA0):.1f} → "
          f"{_lambda_per_py(hz.posterior_alpha, hz.posterior_beta):.1f}/1000/PY  "
          f"[α={hz.posterior_alpha:.4f}, β={hz.posterior_beta:.4f}]  "
          f"R-hat={hz.r_hat:.4f}  ESS={hz.ess_bulk:.0f}")
    print(f"nephrolithiasis: {_lambda_per_py(NEPR_ALPHA0, NEPR_BETA0):.1f} → "
          f"{_lambda_per_py(nepr.posterior_alpha, nepr.posterior_beta):.1f}/1000/PY  "
          f"[α={nepr.posterior_alpha:.4f}, β={nepr.posterior_beta:.4f}]  "
          f"R-hat={nepr.r_hat:.4f}  ESS={nepr.ess_bulk:.0f}")

    if args.dry_run:
        print("\nDRY RUN — imm-priors.json NOT modified.")
        return 0

    # ── Write to imm-priors.json ───────────────────────────────────────────────
    data = load_priors()
    conds = data["conditions"]

    # herpes-zoster (stays Gamma-Poisson)
    conds["herpes-zoster-reactivation-shingles"]["incidence"]["alpha"] = round(hz.posterior_alpha, 4)
    conds["herpes-zoster-reactivation-shingles"]["incidence"]["beta"] = round(hz.posterior_beta, 4)
    conds["herpes-zoster-reactivation-shingles"]["provenance"] = "tierB-pymc"
    conds["herpes-zoster-reactivation-shingles"]["source_ref"] = (
        "research/evidence_extracted/incidence_rates.proposals_p-k.md "
        f"(Zhang 2026 PMC13149593: Antarctic HZ 33.3/1000/PY; "
        f"PyMC Gamma-Poisson, R-hat={hz.r_hat:.3f}, ESS={hz.ess_bulk:.0f})"
    )

    # nephrolithiasis — convert Lognormal-Poisson → Gamma-Poisson
    inc = conds["nephrolithiasis"]["incidence"]
    inc["distribution"] = "Gamma-Poisson"
    inc["alpha"] = round(nepr.posterior_alpha, 4)
    inc["beta"] = round(nepr.posterior_beta, 4)
    inc.pop("mu_log_lambda", None)
    inc.pop("sigma_log_lambda", None)
    conds["nephrolithiasis"]["provenance"] = "tierB-pymc"
    conds["nephrolithiasis"]["source_ref"] = (
        "research/evidence_extracted/incidence_rates.proposals_p-k.md "
        f"(Goodenow-Messman 2022 PMC8799707: 7 post-flight stones/358 PY; "
        f"PyMC Gamma-Poisson, R-hat={nepr.r_hat:.3f}, ESS={nepr.ess_bulk:.0f})"
    )

    save_priors(data)
    logger.info("imm-priors.json updated.")

    print("\nMerged posteriors → imm-priors.json")
    print("Run `npm run validate:imm` to confirm K15 gate still passes.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
