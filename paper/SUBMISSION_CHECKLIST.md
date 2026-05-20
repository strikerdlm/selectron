# npj Microgravity submission checklist — Selectron (2026-07)

Walked against the draft at commit `899254f` + the T24–T28 batch. Re-walk before submission to capture any last-minute revisions.

## Manuscript shape

- [x] **Title ≤ 20 words.** Current: 14 words — *"Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection"*.
- [x] **Running header ≤ 50 characters.** Current: 50 chars — *"Bayesian MCDA + LxC for analog-astronaut selection"*.
- [x] **Structured abstract present.** Background / Methods / Results / Conclusions, 200 words exactly.
- [x] **Main body ≤ 7 000 words.** Current: 7 000 words (§1 Introduction through §5 Conclusion, exclusive of Abstract, Statements, and References).
- [x] **Figures ≤ 8 main + unlimited supplementary.** Current: 7 main (F1–F7) + 2 supplementary (S1, S2).
- [x] **All figures regenerable from cited commit SHA.** Generation scripts in `scripts/generate_f2.ts`, `scripts/generate_f5_convergence.ts`, `scripts/generate_s1_vv.ts`, `scripts/generate_s2_ess_table.ts`; F1 pipeline source `paper/figures/F1_pipeline.mmd`; Playwright snapshots F3/F4/F6/F7 in `src/ui/testing/TestFigureHost.tsx`.
- [x] **All DOIs verified.** 18/18 DOI entries in `paper/references.bib` Crossref-resolved with matching titles (T23). Scite verification was the plan's preferred path but requires authentication; Crossref no-auth was used per the plan's documented fallback.

## Mandatory statements (added in T31, see §Statements in `manuscript.md`)

- [x] **Data availability statement.** Synthetic data only; reproducible from repository.
- [x] **Code availability statement.** MIT-licensed on GitHub; Zenodo DOI tied to the figure-generation commit.
- [x] **Author contributions (CRediT).** D.L.M. sole author covers all 13 CRediT roles.
- [x] **Funding statement.** No external funding; FAC institutional affiliation only.
- [x] **Competing interests statement.** None declared.
- [x] **Ethics statement.** No human subjects, no clinical or operational records, IRB not applicable.

## Render and packaging

- [x] **`manuscript.docx` renders cleanly with images embedded.** 736 KB with all 7 figure PNGs embedded (pandoc `--resource-path=paper`). Re-render after the Zenodo placeholder backfill at T29.
- [ ] **References Vancouver/numeric style.** Current pandoc citeproc default is APA author–year. npj Microgravity uses a Vancouver-style numeric format. Resolution: download the npj Microgravity CSL from Zotero Style Repository (or use `nature.csl` as an interim approximation) and add `--csl=...` to the pandoc call at T30 re-render.
- [ ] **Cover letter present.** T32 deliverable — track separately.
- [ ] **Figure cross-references resolved.** The 7 `[@fig:pipeline]`, `[@fig:tiers]`, etc. citations currently render as literal text because `pandoc-crossref` is not installed in this environment. Resolution: `pip install pandoc-crossref` or `cabal install pandoc-crossref`, then add `--filter pandoc-crossref` ahead of `--citeproc`.

## Placeholders to populate at T29 (Zenodo mint)

- [ ] `__COMMIT_SHA__` in `paper/manuscript.md` Methods §2.5 and the Code-availability statement.
- [ ] `__ZENODO_DOI__` in `paper/manuscript.md` Methods §2.5 and the Code-availability statement.

## Pre-submission re-walk (W5 end / W6 start)

When Diego is ready to upload to the npj portal:
1. Re-run `pandoc paper/manuscript.md --bibliography=paper/references.bib --citeproc --csl=path/to/nature.csl --filter pandoc-crossref --resource-path=paper -o paper/manuscript.docx`.
2. Re-check every checkbox here against the rendered docx.
3. Open `paper/manuscript.docx` in Word/LibreOffice; verify equations render, all 7 figures appear, References list is populated and Vancouver-numbered, Statements section is intact.
4. Update the commit SHA + Zenodo DOI placeholders.
5. Tag the submission commit: `git tag v1.0-submitted && git push origin v1.0-submitted`.
