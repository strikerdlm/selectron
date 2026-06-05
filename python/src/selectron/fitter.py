"""PyMC Gamma-Poisson posterior fitter for tier-B conditions."""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import arviz as az
import numpy as np
import pymc as pm

logger = logging.getLogger(__name__)

RHAT_THRESHOLD = 1.01
ESS_BULK_THRESHOLD = 400
ESS_TAIL_THRESHOLD = 400

# Weakly-informative base prior the fitter fits FROM (Diego 2026-05-29).
#
# CRITICAL: the fit is conjugate Gamma-Poisson, so the posterior is
# Gamma(alpha_0 + Σevents, beta_0 + Σperson_days). Earlier the fitter read
# alpha_0/beta_0 from incidence.alpha/beta — i.e. the *fitted posterior* — so
# every re-run re-applied the evidence on top of the previous fit and
# double-counted it (depression alpha 29.67 -> 55.55 on a second run). Fitting
# from a FIXED base instead makes re-runs idempotent and the posteriors
# reproducible from (base + evidence).
#
# alpha=1, beta=1 is one pseudo-event over one pseudo-person-day — negligible
# against the real evidence (Σperson_days ranges ~7e3 .. ~6e12), so the
# posterior is evidence-driven. A condition may override this with an explicit
# incidence.prior_alpha / incidence.prior_beta.
BASE_PRIOR_ALPHA = 1.0
BASE_PRIOR_BETA = 1.0


def base_prior_for(incidence: dict[str, Any]) -> tuple[float, float]:
    """Return the (alpha_0, beta_0) base prior the fitter should fit FROM.

    Uses an explicit per-condition base (``incidence.prior_alpha`` /
    ``prior_beta``) when present, else the fixed weakly-informative default.
    NEVER returns the live ``incidence.alpha`` / ``incidence.beta`` — those are
    the fitted posterior, and fitting from them double-counts the evidence.
    """
    return (
        float(incidence.get("prior_alpha", BASE_PRIOR_ALPHA)),
        float(incidence.get("prior_beta", BASE_PRIOR_BETA)),
    )


@dataclass
class FitResult:
    """Result of a single-condition PyMC Gamma-Poisson fit."""

    condition_id: str
    posterior_alpha: float
    posterior_beta: float
    posterior_lambda_mean: float
    posterior_lambda_sd: float
    r_hat: float
    ess_bulk: float
    ess_tail: float
    divergences: int
    n_studies: int
    total_person_days: int
    total_events: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def check_convergence(result: FitResult) -> tuple[bool, list[str]]:
    """Check if a fit result meets convergence criteria."""
    reasons: list[str] = []
    if result.r_hat > RHAT_THRESHOLD:
        reasons.append(f"R_hat {result.r_hat:.4f} > {RHAT_THRESHOLD}")
    if result.ess_bulk < ESS_BULK_THRESHOLD:
        reasons.append(f"ESS_bulk {result.ess_bulk:.0f} < {ESS_BULK_THRESHOLD}")
    if result.ess_tail < ESS_TAIL_THRESHOLD:
        reasons.append(f"ESS_tail {result.ess_tail:.0f} < {ESS_TAIL_THRESHOLD}")
    if result.divergences > 0:
        reasons.append(f"Divergences: {result.divergences}")
    return (len(reasons) == 0, reasons)


def fit_gamma_poisson(
    condition_id: str,
    alpha_0: float,
    beta_0: float,
    observations: list[dict[str, int]],
    *,
    seed: int = 42,
    draws: int = 2000,
    tune: int = 1000,
    chains: int = 4,
    output_dir: Path | None = None,
) -> FitResult:
    """Fit a Gamma-Poisson posterior for one condition."""
    person_days = np.array([o["person_days"] for o in observations], dtype=np.float64)
    events = np.array([o["events"] for o in observations], dtype=np.int64)

    with pm.Model() as model:
        lam = pm.Gamma("lambda", alpha=alpha_0, beta=beta_0)
        obs = pm.Poisson("obs", mu=lam * person_days, observed=events)

        try:
            idata = pm.sample(
                draws=draws,
                tune=tune,
                chains=chains,
                nuts_sampler="nutpie",
                random_seed=seed,
                return_inferencedata=True,
                progressbar=False,
            )
        except Exception:
            logger.warning(
                "nutpie sampler failed for %s, falling back to default NUTS",
                condition_id,
            )
            idata = pm.sample(
                draws=draws,
                tune=tune,
                chains=chains,
                random_seed=seed,
                return_inferencedata=True,
                progressbar=False,
            )

    summary = az.summary(idata, var_names=["lambda"])
    lambda_samples = idata.posterior["lambda"].values.flatten()

    r_hat = float(summary["r_hat"].iloc[0])
    ess_bulk = float(summary["ess_bulk"].iloc[0])
    ess_tail = float(summary["ess_tail"].iloc[0])

    if hasattr(idata, "sample_stats") and "diverging" in idata.sample_stats:
        divergences = int(idata.sample_stats["diverging"].values.sum())
    else:
        divergences = 0

    post_mean = float(lambda_samples.mean())
    post_var = float(lambda_samples.var())
    if post_var > 0:
        post_alpha = post_mean ** 2 / post_var
        post_beta = post_mean / post_var
    else:
        post_alpha = alpha_0
        post_beta = beta_0

    result = FitResult(
        condition_id=condition_id,
        posterior_alpha=post_alpha,
        posterior_beta=post_beta,
        posterior_lambda_mean=post_mean,
        posterior_lambda_sd=float(lambda_samples.std()),
        r_hat=r_hat,
        ess_bulk=ess_bulk,
        ess_tail=ess_tail,
        divergences=divergences,
        n_studies=len(observations),
        total_person_days=int(person_days.sum()),
        total_events=int(events.sum()),
    )

    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)
        try:
            idata.to_netcdf(str(output_dir / f"{condition_id}.nc"))
        except (ValueError, ImportError):
            pass  # h5netcdf/netCDF4 not installed — skip trace save
        with open(output_dir / f"{condition_id}.json", "w") as f:
            json.dump(result.to_dict(), f, indent=2)

    return result


# ── Batch fitting ───────────────────────────────────────────────────────────

from selectron.priors_io import load_priors, get_tier_b_conditions, get_tier_c_conditions, load_evidence_proposals


@dataclass
class BatchFitReport:
    """Report from a batch tier-B fitting run."""

    n_total: int
    n_fitted: int
    n_skipped: int
    n_failed: int
    fitted: dict[str, FitResult]
    skipped: dict[str, str]
    failed: dict[str, tuple[FitResult, list[str]]]

    def to_dict(self) -> dict[str, Any]:
        return {
            "n_total": self.n_total,
            "n_fitted": self.n_fitted,
            "n_skipped": self.n_skipped,
            "n_failed": self.n_failed,
            "fitted": {k: v.to_dict() for k, v in self.fitted.items()},
            "skipped": self.skipped,
            "failed": {k: (v[0].to_dict(), v[1]) for k, v in self.failed.items()},
        }


def fit_all_tier_b(
    *,
    draws: int = 2000,
    tune: int = 1000,
    chains: int = 4,
    seed: int = 42,
    output_dir: Path | None = None,
    dry_run: bool = False,
    condition_filter: str | None = None,
) -> BatchFitReport:
    """Fit all (or one) tier-B conditions that have evidence data."""
    priors_data = load_priors()
    tier_b = get_tier_b_conditions(priors_data)
    evidence = load_evidence_proposals()

    evidence_by_condition: dict[str, list[dict[str, Any]]] = {}
    for row in evidence:
        pid = row["mapped_prior_id"]
        if pid is not None:
            evidence_by_condition.setdefault(pid, []).append(row)

    fitted: dict[str, FitResult] = {}
    skipped: dict[str, str] = {}
    failed: dict[str, tuple[FitResult, list[str]]] = {}

    for cond_id, prior in sorted(tier_b.items()):
        if condition_filter and cond_id != condition_filter:
            continue

        dist = prior["incidence"]["distribution"]

        if dist == "Beta-Bernoulli":
            skipped[cond_id] = "Beta-Bernoulli fitting deferred (CSV schema lacks proportion data)"
            continue

        obs_rows = evidence_by_condition.get(cond_id, [])
        if not obs_rows:
            skipped[cond_id] = "No evidence data in proposal CSVs"
            continue

        if dry_run:
            skipped[cond_id] = f"DRY_RUN: would fit with {len(obs_rows)} observations"
            continue

        observations = [
            {"person_days": r["person_days"], "events": r["events"]}
            for r in obs_rows
        ]
        # Fit FROM the fixed weakly-informative base — never the live posterior
        # (incidence.alpha/beta), which would double-count the evidence on re-run.
        alpha_0, beta_0 = base_prior_for(prior["incidence"])

        logger.info("Fitting %s: %d observations, alpha_0=%.2f, beta_0=%.2f",
                     cond_id, len(observations), alpha_0, beta_0)

        result = fit_gamma_poisson(
            condition_id=cond_id,
            alpha_0=alpha_0,
            beta_0=beta_0,
            observations=observations,
            seed=seed,
            draws=draws,
            tune=tune,
            chains=chains,
            output_dir=output_dir / cond_id if output_dir else None,
        )

        ok, reasons = check_convergence(result)
        if ok:
            fitted[cond_id] = result
        else:
            failed[cond_id] = (result, reasons)
            logger.warning("Convergence failed for %s: %s", cond_id, reasons)

    n_total = len(tier_b) if not condition_filter else 1
    return BatchFitReport(
        n_total=n_total,
        n_fitted=len(fitted),
        n_skipped=len(skipped),
        n_failed=len(failed),
        fitted=fitted,
        skipped=skipped,
        failed=failed,
    )


def fit_all_tier_c(
    *,
    draws: int = 2000,
    tune: int = 1000,
    chains: int = 4,
    seed: int = 42,
    output_dir: Path | None = None,
    dry_run: bool = False,
    condition_filter: str | None = None,
) -> BatchFitReport:
    """Fit all (or one) tier-C conditions that have evidence data."""
    priors_data = load_priors()
    tier_c = get_tier_c_conditions(priors_data)
    evidence = load_evidence_proposals()

    evidence_by_condition: dict[str, list[dict[str, Any]]] = {}
    for row in evidence:
        pid = row["mapped_prior_id"]
        if pid is not None:
            evidence_by_condition.setdefault(pid, []).append(row)

    fitted: dict[str, FitResult] = {}
    skipped: dict[str, str] = {}
    failed: dict[str, tuple[FitResult, list[str]]] = {}

    for cond_id, prior in sorted(tier_c.items()):
        if condition_filter and cond_id != condition_filter:
            continue

        dist = prior["incidence"]["distribution"]

        if dist == "Beta-Bernoulli":
            skipped[cond_id] = "Beta-Bernoulli fitting deferred (CSV schema lacks proportion data)"
            continue

        obs_rows = evidence_by_condition.get(cond_id, [])
        if not obs_rows:
            skipped[cond_id] = "No evidence data in proposal CSVs"
            continue

        if dry_run:
            skipped[cond_id] = f"DRY_RUN: would fit with {len(obs_rows)} observations"
            continue

        observations = [
            {"person_days": r["person_days"], "events": r["events"]}
            for r in obs_rows
        ]
        # Fit FROM the fixed weakly-informative base — never the live posterior
        # (incidence.alpha/beta), which would double-count the evidence on re-run.
        alpha_0, beta_0 = base_prior_for(prior["incidence"])

        logger.info("Fitting %s: %d observations, alpha_0=%.2f, beta_0=%.2f",
                     cond_id, len(observations), alpha_0, beta_0)

        result = fit_gamma_poisson(
            condition_id=cond_id,
            alpha_0=alpha_0,
            beta_0=beta_0,
            observations=observations,
            seed=seed,
            draws=draws,
            tune=tune,
            chains=chains,
            output_dir=output_dir / cond_id if output_dir else None,
        )

        ok, reasons = check_convergence(result)
        if ok:
            fitted[cond_id] = result
        else:
            failed[cond_id] = (result, reasons)
            logger.warning("Convergence failed for %s: %s", cond_id, reasons)

    n_total = len(tier_c) if not condition_filter else 1
    return BatchFitReport(
        n_total=n_total,
        n_fitted=len(fitted),
        n_skipped=len(skipped),
        n_failed=len(failed),
        fitted=fitted,
        skipped=skipped,
        failed=failed,
    )


def _cli() -> None:
    """CLI entrypoint for python -m selectron.fitter."""
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="Fit Gamma-Poisson posteriors for tier-B IMM conditions."
    )
    parser.add_argument("--condition", type=str, default=None)
    parser.add_argument("--tier", type=str, choices=["B"], default="B")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--draws", type=int, default=2000)
    parser.add_argument("--chains", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--output-dir", type=str, default=None)

    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    out_dir = Path(args.output_dir) if args.output_dir else Path("outputs/fitted_priors")

    report = fit_all_tier_b(
        draws=args.draws,
        tune=args.draws // 2,
        chains=args.chains,
        seed=args.seed,
        output_dir=out_dir,
        dry_run=args.dry_run,
        condition_filter=args.condition,
    )

    print(f"\n{'='*60}")
    print(f"Batch Fit Report: {report.n_total} conditions")
    print(f"  Fitted:  {report.n_fitted}")
    print(f"  Skipped: {report.n_skipped}")
    print(f"  Failed:  {report.n_failed}")
    print(f"{'='*60}")

    if report.fitted:
        print("\nFitted conditions:")
        for cid, r in report.fitted.items():
            print(f"  {cid}: lambda={r.posterior_lambda_mean:.2e} "
                  f"[alpha={r.posterior_alpha:.2f}, beta={r.posterior_beta:.2f}] "
                  f"R-hat={r.r_hat:.4f} ESS={r.ess_bulk:.0f}")

    if report.skipped:
        print("\nSkipped conditions:")
        for cid, reason in report.skipped.items():
            print(f"  {cid}: {reason}")

    if report.failed:
        print("\nFailed conditions:")
        for cid, (r, reasons) in report.failed.items():
            print(f"  {cid}: {', '.join(reasons)}")

    out_dir.mkdir(parents=True, exist_ok=True)
    with open(out_dir / "batch_report.json", "w") as f:
        json.dump(report.to_dict(), f, indent=2)
    print(f"\nReport saved to {out_dir / 'batch_report.json'}")

    sys.exit(1 if report.n_failed > 0 else 0)


if __name__ == "__main__":
    _cli()
