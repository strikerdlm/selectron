"""Regression: posterior draws must be bit-reproducible across interpreter processes.

The original implementation seeded per-condition RNGs with builtin hash(cid),
which is randomized per process via PYTHONHASHSEED — so a server restart
changed every posterior draw despite a fixed seed. Determinism is a
load-bearing contract in this repo (0xc0ffee canonical seed, K15 canary).
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

PRIORS_PATH = Path(__file__).resolve().parents[2] / "src" / "data" / "imm-priors.json"
PYTHON_SRC = Path(__file__).resolve().parents[1] / "src"

_SNIPPET = """
import json, sys
from pathlib import Path
from selectron.posterior import sample_posterior
from selectron.priors_io import load_priors

priors = load_priors(Path(sys.argv[1]))
draws = sample_posterior(priors, condition_ids=["ankle-sprain-strain", "dental-abscess"], n_draws=8, seed=42)
print(json.dumps({cid: arr.tolist() for cid, arr in draws.lambdas.items()}))
"""


def _run_in_fresh_process(hash_seed: str) -> dict[str, list[float]]:
    existing_path = os.environ.get("PYTHONPATH", "")
    env = dict(
        os.environ,
        PYTHONHASHSEED=hash_seed,
        PYTHONPATH=f"{PYTHON_SRC}{os.pathsep}{existing_path}" if existing_path else str(PYTHON_SRC),
    )
    out = subprocess.run(
        [sys.executable, "-c", _SNIPPET, str(PRIORS_PATH)],
        capture_output=True, text=True, check=True, env=env,
    )
    return json.loads(out.stdout)


def test_sample_posterior_is_reproducible_across_processes():
    """Same seed → identical draws in two separate interpreters with different PYTHONHASHSEED."""
    a = _run_in_fresh_process("0")
    b = _run_in_fresh_process("1")
    assert a == b
