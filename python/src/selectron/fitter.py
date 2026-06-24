"""Analytic Gamma-Poisson posterior fitter for tier-B/tier-C conditions.

The current calibration model is conjugate: λ ~ Gamma(α₀, β₀) and
y_j ~ Poisson(λ T_j). The analytic posterior is therefore the authoritative fit
for this single-rate model. PyMC/NUTS can still be run explicitly as a diagnostic
canary, but ordinary fitting must not depend on sampler estimates.
"""

from __future__ import annotations

import json
import logging
import math
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

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


def gamma_poisson_conjugate_posterior(
    alpha_0: float,
    beta_0: float,
    observations: list[dict[str, int]],
) -> tuple[float, float, float, float]:
    """Analytic Gamma-Poisson posterior used as the fitter oracle.

    With λ ~ Gamma(alpha_0, beta_0) and y_j ~ Poisson(λ T_j), the posterior is
    Gamma(alpha_0 + Σevents, beta_0 + Σperson_days). This is the authoritative
    returned fit for the current single-rate model; NUTS is retained only as a
    diagnostic canary until hierarchical source models are introduced.
    """
    _validate_gamma_poisson_inputs(alpha_0, beta_0, observations)
    total_events = sum(int(o["events"]) for o in observations)
    total_person_days = sum(int(o["person_days"]) for o in observations)
    posterior_alpha = float(alpha_0 + total_events)
    posterior_beta = float(beta_0 + total_person_days)
    posterior_mean = posterior_alpha / posterior_beta
    posterior_sd = float(math.sqrt(posterior_alpha) / posterior_beta)
    return posterior_alpha, posterior_beta, posterior_mean, posterior_sd


def _validate_gamma_poisson_inputs(
    alpha_0: float,
    beta_0: float,
    observations: list[dict[str, int]],
) -> None:
    if not math.isfinite(alpha_0) or alpha_0 <= 0:
        raise ValueError(f"alpha_0 must be positive and finite, got {alpha_0}")
    if not math.isfinite(beta_0) or beta_0 <= 0:
        raise ValueError(f"beta_0 must be positive and finite, got {beta_0}")
    if not observations:
        raise ValueError("Gamma-Poisson fitting requires at least one observation")
    for idx, obs in enumerate(observations):
        if "person_days" not in obs or "events" not in obs:
            raise ValueError(f"observation {idx} must contain person_days and events")
        person_days = obs["person_days"]
        events = obs["events"]
        if not isinstance(person_days, int) or person_days <= 0:
            raise ValueError(f"observation {idx}.person_days must be a positive integer, got {person_days!r}")
        if not isinstance(events, int) or events < 0:
            raise ValueError(f"observation {idx}.events must be a non-negative integer, got {events!r}")


@dataclass
class FitResult:
    """Result of a single-condition analytic Gamma-Poisson fit."""

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
    calibration_method: str = "gamma-poisson-analytic"
    sampler_diagnostic: str = "not-run"

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
    run_sampler_diagnostic: bool = False,
) -> FitResult:
    """Fit a Gamma-Poisson posterior for one condition.

    By default this returns the exact conjugate posterior without running MCMC.
    Set ``run_sampler_diagnostic=True`` to run the legacy PyMC/NUTS canary and
    populate R-hat/ESS/divergence diagnostics from the sampler. The returned
    posterior parameters remain analytic either way.
    """
    _validate_gamma_poisson_inputs(alpha_0, beta_0, observations)

    post_alpha, post_beta, post_mean, post_sd = gamma_poisson_conjugate_posterior(
        alpha_0,
        beta_0,
        observations,
    )
    total_person_days = sum(int(o["person_days"]) for o in observations)
    total_events = sum(int(o["events"]) for o in observations)

    r_hat = 1.0
    ess_bulk = 1_000_000_000.0
    ess_tail = 1_000_000_000.0
    divergences = 0
    sampler_diagnostic = "not-run"
    idata = None

    if run_sampler_diagnostic:
        r_hat, ess_bulk, ess_tail, divergences, idata = _run_sampler_diagnostic(
            condition_id=condition_id,
            alpha_0=alpha_0,
            beta_0=beta_0,
            observations=observations,
            seed=seed,
            draws=draws,
            tune=tune,
            chains=chains,
        )
        sampler_diagnostic = "pymc-nuts"

    result = FitResult(
        condition_id=condition_id,
        posterior_alpha=post_alpha,
        posterior_beta=post_beta,
        posterior_lambda_mean=post_mean,
        posterior_lambda_sd=post_sd,
        r_hat=r_hat,
        ess_bulk=ess_bulk,
        ess_tail=ess_tail,
        divergences=divergences,
        n_studies=len(observations),
        total_person_days=total_person_days,
        total_events=total_events,
        calibration_method="gamma-poisson-analytic",
        sampler_diagnostic=sampler_diagnostic,
    )

    if output_dir is not None:
        output_dir.mkdir(parents=True, exist_ok=True)
        if idata is not None:
            try:
                idata.to_netcdf(str(output_dir / f"{condition_id}.nc"))
            except (ValueError, ImportError):
                pass  # h5netcdf/netCDF4 not installed — skip trace save
        with open(output_dir / f"{condition_id}.json", "w") as f:
            json.dump(result.to_dict(), f, indent=2)

    return result


def _run_sampler_diagnostic(
    *,
    condition_id: str,
    alpha_0: float,
    beta_0: float,
    observations: list[dict[str, int]],
    seed: int,
    draws: int,
    tune: int,
    chains: int,
) -> tuple[float, float, float, int, Any]:
    """Run the optional PyMC/NUTS diagnostic canary for the analytic fit."""
    try:
        import arviz as az
        import numpy as np
        import pymc as pm
    except ImportError as exc:
        raise RuntimeError(
            "run_sampler_diagnostic=True requires optional PyMC/ArviZ/NumPy dependencies"
        ) from exc

    person_days = np.array([o["person_days"] for o in observations], dtype=np.float64)
    events = np.array([o["events"] for o in observations], dtype=np.int64)

    with pm.Model() as model:
        lam = pm.Gamma("lambda", alpha=alpha_0, beta=beta_0)
        pm.Poisson("obs", mu=lam * person_days, observed=events)

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
    r_hat = float(summary["r_hat"].iloc[0])
    ess_bulk = float(summary["ess_bulk"].iloc[0])
    ess_tail = float(summary["ess_tail"].iloc[0])
    divergences = (
        int(idata.sample_stats["diverging"].values.sum())
        if hasattr(idata, "sample_stats") and "diverging" in idata.sample_stats
        else 0
    )
    return r_hat, ess_bulk, ess_tail, divergences, idata


# ── Batch fitting ───────────────────────────────────────────────────────────

from selectron.priors_io import (
    load_priors,
    get_tier_b_conditions,
    get_tier_c_conditions,
    load_accepted_evidence,
    load_evidence_proposals,
)


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
    evidence_source: str = "accepted",
    run_sampler_diagnostic: bool = False,
) -> BatchFitReport:
    """Fit all (or one) tier-B conditions that have evidence data."""
    if evidence_source not in {"accepted", "proposals"}:
        raise ValueError("evidence_source must be 'accepted' or 'proposals'")
    priors_data = load_priors()
    tier_b = get_tier_b_conditions(priors_data)
    evidence = (
        load_evidence_proposals()
        if evidence_source == "proposals"
        else load_accepted_evidence()
    )

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
            skipped[cond_id] = f"No {evidence_source} evidence data"
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
            run_sampler_diagnostic=run_sampler_diagnostic,
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
    evidence_source: str = "accepted",
    run_sampler_diagnostic: bool = False,
) -> BatchFitReport:
    """Fit all (or one) tier-C conditions that have evidence data."""
    if evidence_source not in {"accepted", "proposals"}:
        raise ValueError("evidence_source must be 'accepted' or 'proposals'")
    priors_data = load_priors()
    tier_c = get_tier_c_conditions(priors_data)
    evidence = (
        load_evidence_proposals()
        if evidence_source == "proposals"
        else load_accepted_evidence()
    )

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
            skipped[cond_id] = f"No {evidence_source} evidence data"
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
            run_sampler_diagnostic=run_sampler_diagnostic,
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
    parser.add_argument(
        "--sampler-diagnostic",
        action="store_true",
        help="run optional PyMC/NUTS diagnostics; posterior parameters remain analytic",
    )

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
        run_sampler_diagnostic=args.sampler_diagnostic,
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
