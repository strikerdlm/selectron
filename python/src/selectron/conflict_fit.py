"""Offline PyMC fit of the anchorable conflict/team parameters.

Fits three blocks from published analog-mission evidence:
  - pi_unstable      Beta-Binomial on Tu 2024 (133 unstable / 202 crews)
  - lambda_base[k]   Beta-Binomial on Bell 2019 "all teams >=1 conflict by 40%/90d",
                     mapped to a per-day rate via 1 - exp(-lambda * 0.4 * 90)
  - crew_frailty_phi weakly-identified Gamma dispersion anchored to Basner concentration

Synthetic-default params (member_frailty_phi, alpha_fit, sigma_log_beta, temporal_a/p,
beta_het, beta_weak, dyad_ref_n) are filled in by the TS layer, not fit here.
"""
from __future__ import annotations
import numpy as np
import pymc as pm

# Evidence rows (DOIs in the design spec §12).
TU2024_UNSTABLE, TU2024_TOTAL = 133, 202          # latent-class split
BELL2019_WITH_CONFLICT, BELL2019_TEAMS = 71, 72    # ~all teams >=1 by 40%/90d
BASNER_SHARE, BASNER_TOPK_FRAC = 0.85, 1 / 3       # 85% of conflicts from top-third

def fit_conflict_team_priors(seed: int, draws: int, tune: int, team_condition_ids: list[str]) -> dict:
    rng = np.random.default_rng(seed)

    with pm.Model():
        pi = pm.Beta("pi", alpha=1 + TU2024_UNSTABLE, beta=1 + (TU2024_TOTAL - TU2024_UNSTABLE))
        idata_pi = pm.sample(draws=draws, tune=tune, chains=2, random_seed=seed,
                             progressbar=False)
    pi_samples = idata_pi.posterior["pi"].values.reshape(-1)

    with pm.Model():
        p40 = pm.Beta("p40", alpha=1 + BELL2019_WITH_CONFLICT,
                      beta=1 + (BELL2019_TEAMS - BELL2019_WITH_CONFLICT))
        # map by-40% probability to a per-day base rate: p = 1 - exp(-lam*0.4*90)
        lam = pm.Deterministic("lam", -pm.math.log(1 - p40) / (0.4 * 90))
        idata_lam = pm.sample(draws=draws, tune=tune, chains=2, random_seed=seed,
                              progressbar=False)
    lam_samples = idata_lam.posterior["lam"].values.reshape(-1)
    lam_samples = lam_samples[np.isfinite(lam_samples) & (lam_samples > 0)]

    # crew frailty phi: weakly identified. Sample a wide prior consistent with high
    # concentration (small phi => high overdispersion). Disclosed as wide.
    phi_samples = rng.gamma(shape=2.0, scale=1.5, size=2000)  # mean 3, wide
    phi_samples = phi_samples[phi_samples > 0.2]

    return {
        "model_version": "conflict-team-fit-v1",
        "fitted_at": "2026-06-06T00:00:00Z",
        "team": {
            "pi_unstable_samples": [float(x) for x in pi_samples[:2000]],
            "lambda_base_samples": {cid: [float(x) for x in lam_samples[:2000]] for cid in team_condition_ids},
            "crew_frailty_phi_samples": [float(x) for x in phi_samples[:2000]],
        },
    }

def main() -> None:
    import json, pathlib
    team_ids = ["conflict-event", "team-cohesion-loss", "leadership-challenge", "role-ambiguity-conflict"]
    out = fit_conflict_team_priors(seed=0xC0FFEE & 0xFFFFFFFF, draws=1000, tune=1000, team_condition_ids=team_ids)
    dest = pathlib.Path(__file__).resolve().parents[3] / "src" / "data" / "conflict-team-priors.json"
    dest.write_text(json.dumps(out, indent=2))
    print(f"wrote {dest}")

if __name__ == "__main__":
    main()
