# `notebooks/` — Iter-3 Phase 3B offline PyMC fit

The notebooks in this directory run the **offline** MCMC fit that
produces `src/risk/priors.json` (the frozen posterior consumed by the
in-browser Stage-B simulator). MCMC never runs in the browser; this
boundary is non-negotiable per Iter-3 spec §3.6.

## Venv setup

```bash
python3.12 -m venv ~/.venvs/selectron-imm
source ~/.venvs/selectron-imm/bin/activate
pip install --upgrade pip
pip install -r notebooks/requirements.txt
```

System Python 3.12 is required — PyMC 5.16.2 has no wheel for Python
3.13/3.14 yet. Use `/usr/bin/python3.12` explicitly.

## Notebooks

| Notebook | Task | Purpose |
|---|---|---|
| `iter3_imm_fit.ipynb` | 40 | Main PyMC hierarchical Lognormal-Poisson fit. Reads `research/evidence_extracted/incidence_rates.csv`, samples NUTS, exports `src/risk/priors.json`. |
| `iter3_jags_crosscheck.ipynb` | 42 | JAGS Gibbs cross-check on a 4-conditions × 3-missions subset. Confirms NUTS posterior matches Gibbs to within MC error (< 5%). |

## JAGS for the cross-check (T42 only)

`pyjags==1.3.8` is intentionally **disabled** in `requirements.txt` —
it needs the JAGS C library installed system-wide. To enable T42:

```bash
sudo apt install jags          # Debian/Ubuntu
pip install pyjags==1.3.8      # then enable in requirements.txt
```

The main fit (T40) does NOT need JAGS — only the cross-check does.

## Reproducibility contract

The PyMC seed is hard-coded to `0xC0FFEE` in the notebook so a clean
re-run reproduces a byte-identical `priors.json` (per Iter-3 spec §9
acceptance criterion 4 + Task 59 step 4). The intermediate
`iter3_imm_fit.trace.nc` checkpoint is **non-negotiable**: if a
downstream cell crashes, we don't re-run a 30-min sample.

## Input contract

`research/evidence_extracted/incidence_rates.csv` (the input) is
populated by:
1. Subagents proposing rows into `.proposals.csv` (Task 36, P-A/P-B/P-C).
2. Diego curating proposals → final by setting `extracted_by = "Diego"`
   (Task 37). The notebook asserts all rows satisfy this — proposals
   never enter the fit.
