# Peer Review Report - Selectron App Publication Readiness

**Date:** 2026-06-09  
**Artifact reviewed:** Selectron repository as checked out locally (`/root/repos/Selectron`)  
**Target publication context:** Advances in Space Research submission package plus public software artifact  
**Review tier:** Standard adapted peer review: source inspection, manuscript/package inspection, and local verification commands. No external literature search was performed in this round.  
**Review mode:** Initial report-only review, followed by a same-day remediation pass. This report preserves the original findings and records current fix status below.

---

## 2026-06-09 Remediation Status

The original review found upload-blocking release and verification contradictions. The main software/documentation blockers have now been addressed on the v0.5.6 source tree.

| Original blocker | Current status |
|---|---|
| TypeScript fixture broke `npm run typecheck` and `npm run build` | **Fixed.** `tests/imm/conditions.test.ts` now uses a typed `IMMCrewMember` fixture helper. |
| Version metadata disagreed across package, CFF, README, UI | **Fixed.** `package.json`, `package-lock.json`, `CITATION.cff`, README, app chrome, manuscript, and ASR checklist now identify Selectron v0.5.6. |
| README and submission checklist disagreed on DOCX readiness | **Fixed.** Both now state that `paper/manuscript.md` is the current redacted source and `paper/submission/manuscript.docx` must be rebuilt before upload. |
| Manuscript overstated the Stage-A-to-Stage-B coupling in reported results | **Fixed.** The manuscript now states that `stageAScores` can modulate Stage B when present, while the reported K15 validation and cross-mission results use the uncoupled K15 reference path. |
| Public verification claims lacked a dated local run | **Partially fixed.** README and checklist now record the 2026-06-09 commands that passed. Full Playwright and optional Python calibration lanes remain pre-archive tasks. |

Verification after remediation:

```bash
npm run typecheck
# Passed

npx vitest run tests/imm/conditions.test.ts
# Passed: 7/7

npm run build
# Passed; Vite warnings only for chunk size / dynamic-import chunking.
```

Remaining before portal upload: rebuild `paper/submission/manuscript.docx` from the redacted source, mint/fill the Zenodo DOI and figure-generation commit SHA, rerun any full-suite lanes claimed in the final package, and recheck the rebuilt DOCX.

## Summary

Selectron is a serious, unusually complete computational-methods artifact: the repository contains a React/Vite TypeScript application, a Python calibration package/API, a paper manuscript, submission assets, reproducible figures, and a large test suite. The strongest publication argument remains the integrated software-methods story: Bayesian MCDA for analog-astronaut selection, a NASA-IMM-style 100-condition Monte Carlo, HSRB LxC mapping, and K15 reproduction gates.

At initial review, the repository was **not upload-ready** because the public release/readiness surface did not match the observed verification state. `npm run typecheck` and `npm run build` failed on stale TypeScript test fixtures. Python tests could not collect in the active environment because PyMC/ArviZ dependencies were absent. The README, package metadata, citation metadata, UI banner, and submission checklist disagreed about version, iteration, and readiness. The same-day remediation status above records which blockers are now fixed and which final packaging tasks remain.

## Initial Overall Recommendation

**Major Revision before submission.**

Rationale: the science/methodology case appears publication-capable, but the release artifact currently fails the build gate and presents inconsistent readiness claims. Once the build/typecheck failure, metadata drift, and submission-package contradictions are corrected and re-verified, the recommendation would likely move to **Minor Revision / Submit** for ASR, with residual scope risk.

**Current recommendation after remediation:** **Minor Revision / Submit after final packaging.** The code/release blockers identified in this report are cleared for the checked commands. The remaining blockers are submission-package tasks: DOCX rebuild/recheck, Zenodo DOI, figure-generation commit SHA, and any full-suite verification claims the final archive will make.

---

## Initial Desk-Rejection Pre-Screen

| Check | Result | Evidence |
|---|---:|---|
| Public build works | **Fail** | `npm run build` exits 1 because `tests/imm/conditions.test.ts` fixtures do not satisfy `IMMCrewMember`. |
| TypeScript strict check works | **Fail** | `npm run typecheck` exits 2 with the same three fixture errors at `tests/imm/conditions.test.ts:74`, `:90`, `:106`. |
| Scientific gate observed | **Partial pass** | During `npm test`, observed passing domain tests included `tests/imm/simulate.test.ts`, `tests/imm/validation_k15.test.ts`, `tests/imm/posterior_predictive.test.ts`, `tests/imm/validation_k15_loo.test.ts`, and `tests/imm/rhat_convergence.test.ts`; no final all-suite summary was captured from the tool session. |
| Python calibration tests reproducible in active env | **Fail to collect** | `python -m pytest -q` fails during collection: `ModuleNotFoundError: No module named 'arviz'` and `No module named 'pymc'`. |
| Version/release metadata coherent | **Fail** | `package.json` says `0.0.1`; README badge says `v0.5.6`; `CITATION.cff` says `0.5.5`; live UI says `iter 03 · phase 3f`. |
| Submission package coherent | **Mixed** | `paper/submission/SUBMISSION_CHECKLIST.md` says docx files were rebuilt 2026-05-30, while README still warns the docx/cover letter are stale and should not be submitted. |
| DOI/commit archival complete | **Open** | Manuscript and checklist still carry Zenodo DOI / commit SHA placeholders to be filled at final submission. |

**Initial desk result:** **Blocked for upload** until the build/typecheck gate and release metadata were reconciled. Current status: build/typecheck and release metadata blockers are reconciled; final package upload remains blocked until DOCX rebuild, DOI, and archive metadata are complete.

---

## Major Concerns

### A-M1. The production build is red because test fixtures are stale

**Severity:** Major, upload blocker  
**Reviewer perspective:** Methods/software reproducibility reviewer

The repo invites readers to run:

```bash
npm run typecheck
npm run build
```

Both fail. The immediate cause is `tests/imm/conditions.test.ts`, where three locally constructed crew arrays include only `id`, `name`, `EVA_eligible`, and `EVA_count`, but `IMMCrewMember` now also requires `sex`, `contacts`, `crowns`, `CAC_positive`, and `abdominal_surgery_history`.

Affected sites:

- `tests/imm/conditions.test.ts:69-74`
- `tests/imm/conditions.test.ts:85-90`
- `tests/imm/conditions.test.ts:101-106`

Because `tsconfig.json` includes both `src` and `tests`, this is not merely a test-only nuisance; it breaks the public production build path (`tsc -b && vite build`). A reviewer following the README will hit a failed build before evaluating the app.

**Recommended fix:** create a small typed fixture helper, for example `makeCrewMember(...)`, and use it in `tests/imm/conditions.test.ts` instead of partial object literals. Then re-run:

```bash
npm run typecheck
npm run build
npm test
```

**Acceptance criterion:** `typecheck` and `build` exit 0 from a clean checkout.

### A-M2. The README says the verification surface is all green, but current commands disagree

**Severity:** Major, credibility blocker  
**Reviewer perspective:** Reproducibility auditor

The README front matter advertises passing Vitest and Playwright badges (`README.md:11-13`), the quick start tells users to run the verification commands (`README.md:53-57`), and the v0.5.6 section states "All green: typecheck 0..." (`README.md:427`). The local state contradicts that:

- `npm run typecheck` fails.
- `npm run build` fails.
- Python pytest cannot collect in the active environment.
- The full Vitest run did not return a final all-suite summary in this session, although several high-value domain tests were observed passing.

This mismatch is more damaging than the fixture bug itself because it asks reviewers to trust a readiness statement that is immediately falsifiable.

**Recommended fix:** update the README only after the commands are green. Use real CI badges if possible, not static success badges. Add a "last verified" block with exact command, date, Node/Python versions, and outcome.

**Acceptance criterion:** a fresh clone can reproduce the README's green claims without manual code edits.

### A-M3. Python calibration reproducibility is not verified in the active environment

**Severity:** Major for the calibration claim; minor for browser-only runtime  
**Reviewer perspective:** Methods/statistics reviewer

The Python package is central to the prior-calibration story, but `python -m pytest -q` cannot collect because `arviz` and `pymc` are missing. The `python/pyproject.toml` does declare these dependencies, so this may simply be an unprepared environment. However, for publication, "works if the reviewer installs the right things" is weaker than a demonstrable, scripted verification lane.

**Recommended fix:**

1. Add or document a single calibration verification command that starts from a clean virtual environment.
2. Consider a pinned lockfile or constraints file for the submission archive.
3. Add a fast Python smoke lane that excludes slow PyMC NUTS tests but still verifies API import, model schemas, and deterministic writer behavior.
4. Keep the slow calibration lane separate and explicitly marked.

**Acceptance criterion:** fresh venv install plus a documented command verifies the Python package, and CI or release notes clearly state which Python tests were run.

### B-M1. Release version, app banner, README, and CFF metadata disagree

**Severity:** Major for software-paper polish  
**Reviewer perspective:** Artifact evaluator

Observed inconsistencies:

- `package.json:4` says `"version": "0.0.1"`.
- `CITATION.cff:14-15` says version `0.5.5`, date released `2026-05-29`.
- `README.md:11` presents `v0.5.6`.
- `src/ui/App.tsx:92` renders `iter 03 · phase 3f`, while README says engineering reached Iter 6 / v0.5.6.

For a software paper, inconsistent artifact identity creates avoidable doubt about what version generated the figures and what version is being archived.

**Recommended fix:** define one version of record for submission, then update:

- `package.json`
- `CITATION.cff`
- README badges and release section
- UI banner/footer
- manuscript code-availability statement
- Zenodo archive metadata

**Acceptance criterion:** the archived DOI, git tag, UI, package metadata, and manuscript all name the same release.

### B-M2. Submission-package status is internally contradictory

**Severity:** Major before upload  
**Reviewer perspective:** Associate editor / submission technical check

The active ASR checklist says `paper/submission/manuscript.docx` and `cover-letter.docx` were rebuilt on 2026-05-30 and marks the upload set as ready (`paper/submission/SUBMISSION_CHECKLIST.md:16-21`). The README still warns that those same rendered files are stale and says "Do not submit the current docx" (`README.md:401-410`).

A reviewer may not see both files, but an editor, archive reader, or co-reviewer can. This contradiction should be resolved before submission because it makes the package look uncontrolled.

**Recommended fix:** choose the authoritative state:

- If the docx files are now current, delete the stale warning from the README and update `STATUS.md`.
- If the README warning is still true, downgrade the submission checklist from `[x]` to open TODOs and rebuild the package.

**Acceptance criterion:** README, `STATUS.md`, and `paper/submission/SUBMISSION_CHECKLIST.md` all agree on whether the current docx files are submit-ready.

### B-M3. Zenodo DOI and commit SHA remain final-submission placeholders

**Severity:** Major at upload time, not a scientific flaw  
**Reviewer perspective:** Reproducibility editor

The ASR checklist correctly keeps this as a final human task (`paper/submission/SUBMISSION_CHECKLIST.md:47-53`). The manuscript and cover-letter ecosystem still refer to "DOI assigned upon archival" and a figure-generation commit SHA to be recorded at submission.

**Recommended fix:** after all build/test fixes land, tag the release, archive it on Zenodo, and fill:

- manuscript code availability
- `CITATION.cff`
- cover letter
- README citation instructions
- submission checklist

**Acceptance criterion:** no `assigned upon archival`, `__COMMIT_SHA__`, or equivalent placeholder remains in the upload package.

### C-M1. ASR fit remains plausible but borderline

**Severity:** Major strategic risk  
**Reviewer perspective:** Associate editor

The ASR checklist already states the residual scope risk: ASR could redirect content that appears primarily life-sciences-in-space oriented. The strongest ASR framing is computational/probabilistic risk engineering, not analog-astronaut selection as a biomedical outcome study.

**Recommended fix:** keep the title, abstract, cover letter, and first paragraph centered on:

- reproducible NASA-IMM-style risk simulation,
- HSRB LxC mapping,
- software verification and validation,
- methodological bridge from analog mission risk to institutional risk language.

Move "selection panel" language into the application/use-case role rather than the leading claim.

**Acceptance criterion:** a desk editor can understand the contribution as space-systems risk methodology within the first 150 words of the abstract/cover letter.

---

## Minor Concerns

### D-m1. The README is too much like a development log for a submission-facing artifact

The README is detailed and useful to the project owner, but a publication reviewer needs a shorter artifact page:

1. What the software does.
2. How to reproduce the manuscript figures.
3. How to run the validation gates.
4. What is out of scope.
5. How to cite the archive.

Move iteration history, deferred plans, and long status narratives into `docs/` or `STATUS.md`. Keep the root README boring, current, and reproducible.

### D-m2. Static success badges should be replaced with real CI badges or removed

Static "passing" badges are risky when local commands fail. A real CI badge tied to the submission tag is ideal. If CI is unavailable, use a dated verification table instead.

### D-m3. `CITATION.cff` should not imply journal publication before acceptance

`CITATION.cff` lists a preferred article citation in *Advances in Space Research* (`CITATION.cff:16-24`). If the article is not accepted yet, prefer either:

- a software citation only, tied to the Zenodo DOI, or
- a manuscript/preprint citation with accurate status and DOI.

### D-m4. Internal names still leak into user-facing/publication-facing surfaces

The live UI banner says `iter 03 · phase 3f`, and source/data names still include `placeholder-criteria`. Some internal names are harmless in code, but the public UI and manuscript-facing README should use stable product language.

### D-m5. Full test runtime needs a bounded public recipe

The heavy K15 and R-hat tests are valuable, but the suite is long. Provide explicit lanes:

- `npm run verify:fast`: typecheck + non-slow tests.
- `npm run verify:paper`: figure regeneration + K15 gate + build.
- `npm run verify:e2e`: Playwright.
- `python -m pytest -m "not slow"` and `python -m pytest -m slow`.

This makes reviewer reproduction more likely.

---

## Reviewer Assessments

### Reviewer A - Methods, Statistics, and Verification

**Strengths:** The repository contains deterministic seeds, a K15 validation gate, convergence tests, typed risk/model boundaries, and substantial domain-specific tests. The observed Vitest output includes several high-value tests passing, including K15 validation and posterior-predictive checks.

**Major concerns:** A-M1, A-M2, A-M3.

**Most important improvement:** make the verification story boring: a fresh clone should pass `typecheck`, `build`, and the documented validation lanes without contradictions.

### Reviewer B - Domain and Scientific Rigor

**Strengths:** The method has a clear niche: uncertainty-aware candidate scoring plus NASA-style mission medical risk mapped into HSRB decision language. The manuscript appears to acknowledge important limitations: no clinical clearance, no operational validation claim, and deferred NASA-STD-7009A factors beyond the current scope.

**Major concern:** C-M1.

**Most important improvement:** frame Selectron as a computational risk-methods artifact first, and an analog-astronaut selection application second.

### Reviewer C - Artifact, Citation, and Release Integrity

**Strengths:** MIT license, CFF metadata, submission checklist, manuscript source, code, tests, research evidence files, and figures are all present.

**Major concerns:** B-M1, B-M2, B-M3.

**Most important improvement:** create one release identity: one tag, one DOI, one version number, one build result, one submission package.

### Reviewer D - Writing, Usability, and LLM/Dev-Jargon Screen

**Strengths:** The core claims are specific and technical rather than generic. The README also does a good job stating what the software is not.

**Concerns:** the README reads partly like a project diary, and the UI exposes old iteration language. For publication, remove transient development language from first-contact surfaces.

**Most important improvement:** separate "public artifact documentation" from "internal project history."

### Reviewer E - Journal Fit and Publication Strategy

**Strengths:** ASR is plausible if the submission leads with space research methodology, probabilistic risk, reproducible software, NASA IMM lineage, and HSRB mapping.

**Concerns:** the ASR scope risk is real, and the package must not give editors any easy technical reason to redirect or reject.

**Most important improvement:** fix the artifact gates before upload; then use the cover letter to pre-empt scope concerns.

---

## Prioritized Improvement Plan

### Must Fix Before Submission

1. Fix `tests/imm/conditions.test.ts` crew fixtures so `npm run typecheck` and `npm run build` pass.
2. Re-run and capture final output for `npm test`; do not rely on partial observed passes.
3. Verify Python from a fresh venv with documented install commands, or clearly mark Python calibration tests as an optional slow lane with a reproducible setup.
4. Reconcile version metadata across `package.json`, `CITATION.cff`, README, UI, manuscript, and Zenodo.
5. Resolve the README vs `paper/submission/SUBMISSION_CHECKLIST.md` contradiction about whether the current docx submission files are stale.
6. Mint Zenodo DOI, record commit SHA, and remove all final-submission placeholders.

### Should Fix To Increase Acceptance Odds

1. Replace static success badges with real CI badges or a dated verification table.
2. Add a one-command paper verification lane that regenerates figures and runs the K15 gate.
3. Shorten the root README and move iteration history to `docs/`.
4. Remove stale iteration labels from the app chrome.
5. Make `CITATION.cff` cite the software archive until the article is accepted.
6. Add a short "reviewer quickstart" that reproduces one figure and one K15 gate result in under 10 minutes, with a note for the full slow validation.

### Nice To Have

1. Add CI matrix entries for Node and Python verification.
2. Add a release checklist that fails if README, CFF, package version, and UI version disagree.
3. Add screenshots or a hosted static demo URL for the browser app.
4. Add a clear data/provenance map from `research/` evidence files to `src/data/imm-priors.json`.

---

## Verification Log From This Review

Commands run locally on 2026-06-09:

```bash
npm run typecheck
# Failed: three TS2322 errors in tests/imm/conditions.test.ts.

npm run build
# Failed: same TypeScript errors before Vite build.

npm test
# Partial observed output: major IMM/domain tests passed, including K15 validation.
# No final all-suite summary captured from the tool session.

cd python && python -m pytest -q
# Failed during collection: missing arviz and pymc in active environment.
```

No external literature or citation verification was performed in this round. This report therefore focuses on the app/repository/submission artifact as-is, not on re-adjudicating the scientific bibliography.

---

## Final Publication Readiness Verdict

**The software source is publication-ready for v0.5.6 packaging, but the portal upload package is not final yet.**

The path from here is short and practical: rebuild and inspect the ASR DOCX from the redacted manuscript source, archive the exact passing commit, fill the Zenodo DOI and figure-generation commit SHA placeholders, and rerun the full verification lanes that the final package claims. After those packaging steps, the app should support the manuscript rather than distracting reviewers from it.
