import json
import importlib.util
import numpy as np
import pytest
from selectron.conflict_fit import fit_conflict_team_priors

pytestmark = pytest.mark.skipif(
    importlib.util.find_spec("pymc") is None,
    reason="optional PyMC dependency is not installed",
)

def test_pi_unstable_recovers_tu2024():
    out = fit_conflict_team_priors(seed=42, draws=500, tune=500, team_condition_ids=["conflict-event"])
    pi = np.array(out["team"]["pi_unstable_samples"])
    assert 0.55 < pi.mean() < 0.76  # Tu 2024 133/202 ≈ 0.658

def test_lambda_base_hits_bell_anchor():
    out = fit_conflict_team_priors(seed=42, draws=500, tune=500, team_condition_ids=["conflict-event"])
    lam = np.array(out["team"]["lambda_base_samples"]["conflict-event"])
    # P(>=1 by 40% of 90d) = 1 - exp(-lam*0.4*90); expect ~0.9-0.99
    p = 1 - np.exp(-lam.mean() * 0.4 * 90)
    assert 0.85 < p < 0.995

def test_emitted_json_is_deterministic():
    a = fit_conflict_team_priors(seed=7, draws=300, tune=300, team_condition_ids=["conflict-event"])
    b = fit_conflict_team_priors(seed=7, draws=300, tune=300, team_condition_ids=["conflict-event"])
    assert a["team"]["pi_unstable_samples"][:5] == b["team"]["pi_unstable_samples"][:5]
