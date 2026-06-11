# ASR Submission Checklist — Selectron
## Advances in Space Research — Elsevier/COSPAR
**ISSN:** 0273-1177 | **Portal:** https://www.editorialmanager.com/AISR (verify code at the live guide)
**Track:** Subscription (no APC) unless OA elected
**Prepared:** 2026-05-30 via `/asr-submit` skill (pandoc author–date Harvard build)  
**Version of record:** Selectron v0.5.6 (matches `package.json`, `CITATION.cff`, README badge, and app chrome)
**Source status:** `paper/manuscript.md` redacted, app-aligned, and rebuilt on 2026-06-11; `submission/manuscript.docx` and `submission/cover-letter.docx` are current except for the final Zenodo DOI.

---

## Scope gate — BORDERLINE → ASR-eligible (with honest risk note)
- [x] Primary contribution is **computational / probabilistic-risk methodology** (Bayesian MCDA + IMM Monte Carlo + HSRB LxC mapping + reproducible software), not a biological/physiological finding.
- [x] Medical/biological content is **input data and validation targets**, not the scientific claim.
- [x] Method-led title and abstract; "**methodology contribution, not an outcome-prediction study**" disclosed (§4.4, Conclusion); outcome validation against biological data declared out of scope.
- [x] Lineage cited in the computational space-research literature (IMM: Keenan 2015 / Myers 2018 / Antonsen 2022; HSRB JSC-66705; NASA-STD-7009A).
- [ ] ⚠️ **RESIDUAL RISK:** ASR dropped life-sciences-in-space (→ LSSR). An editor *could* read "analog-astronaut selection / crew medical risk" as life sciences and desk-reject/redirect. Mitigated by framing, but not eliminated. The cover letter's scope paragraph is the place to pre-empt this. LSSR is the fallback venue if redirected.

## Files in this submission/ folder (upload set)
- [x] `manuscript.docx` — rebuilt 2026-06-11 from current `paper/manuscript.md` source (ASR format: TNR 12 pt, A4, single-column, double-spaced, continuous line numbers; author–date Harvard refs; running header).
- [x] `cover-letter.docx` — rebuilt 2026-06-11; short, scope + novelty; declaration-free.
- [x] `highlights.docx` (+ `highlights.md` source) — 5 bullets, all ≤ 85 chars.
- [x] `declaration-of-competing-interest.docx` — separate Elsevier declarations file ("I have nothing to declare").
- [x] `figures/Figure_1.pdf … Figure_7` + `Figure_S1.pdf` — separate files; line art as **vector PDF** (1, 2, 5, S1), data plots as **PNG** (3, 4, 6, 7).

## Manuscript content checks (PASS unless noted)
- [x] Title concise, no unexplained abbreviations
- [x] Abstract **242 words**, **unstructured** (≤ 250 ✓)
- [x] Keywords: **7** (within 1–7). WARN: several are multi-word — allowed (none use "and"/"of").
- [x] Sections numbered (1. / 1.1 / 1.1.1); Abstract not numbered
- [x] In-text citations **author–date (Harvard)**, 3+ authors → et al.
- [x] Reference list alphabetical, **LTWA-abbreviated**, DOIs present (29 DOIs rendered); **0 note-field leakage** rechecked after the 2026-06-11 rebuild
- [x] **AI-declaration title FIXED** → "Declaration of generative AI and AI-assisted technologies in the **manuscript preparation process**", placed before References (§ Statements)
- [x] Competing-interests section in manuscript + separate .docx
- [x] Funding statement (no external funding)
- [x] Data availability + Code availability statements
- [x] Author contributions (CRediT, sole author)
- [x] Ethics statement (no human/animal subjects)
- [N/A] Acknowledgements — none (sole author, self-funded); legitimately absent
- [x] Figures cited in order; captions present; `[@fig:x]` → "Fig. N" resolved (Fig. 5 referenced as literal "Figure 5" in prose — intentional, faithful to source)
- [x] Tables: editable, numbered, cited (6 tables)

## Software/artifact verification
- [x] Selectron version aligned across `package.json`, `package-lock.json`, `CITATION.cff`, README, app chrome, manuscript, and this checklist: **v0.5.6**
- [x] `npm run verify:fast` passed on 2026-06-11 (`typecheck` + targeted Vitest; 38 tests)
- [x] `npm run build` passed on 2026-06-11; Vite emitted only chunk/dynamic-import warnings
- [x] Python calibration/API non-slow lane passed on 2026-06-11: `pytest -m "not slow"` → 71 passed, 14 slow deselected
- [x] Calibration dry-run completed on 2026-06-11: 66 conditions skipped, 0 failed (`/tmp/selectron-calibration-dry-run/batch_report.json`)
- [x] Targeted Crew Composition Playwright smoke passed on 2026-06-11: 4/4, using manual Vite server + `PLAYWRIGHT_SKIP_WEBSERVER=1` because the managed sandbox blocks Playwright's webServer health check and Chromium sandbox launch
- [ ] Full Playwright suite not rerun in this pass; rerun before final archive tagging if the upload package claims full-browser coverage

## Figure resolution
- [x] Line art / diagrams as **vector PDF**: Figure_1 (pipeline), Figure_2 (criterion matrix), Figure_5 (convergence), Figure_S1 (ESS table)
- [x] Data halftones ≥ 300 dpi PNG: Figure_3 (1600px), Figure_4 (1600px), Figure_6 (1600px), Figure_7 (1600px) — adequate for single-column
- [x] No generative-AI-created/altered images (figures are code-rendered from data)

---

## TODOs before final submission (human-only)
- [x] **Rebuild `submission/manuscript.docx` and `submission/cover-letter.docx`** from the current 2026-06-11 sources and verify line numbers, tables, references, expected statements, and embedded figures in the rendered file.
- [ ] **Mint the Zenodo DOI** and record it in the manuscript (§ Code availability) and cover letter. Refresh the **figure-generation commit SHA** only if the final archive commit changes figure-generating source.
- [ ] **Suggested reviewers** — enter 3–5 in the portal (NOT the cover letter). Candidates: NASA IMM community (Antonsen, Myers, Kerstman/Walton), space-PRA / mission-risk modelers, MCDA methodologists. Verify institutional emails; exclude editorial-board members and recent co-authors.
- [ ] **Complete the Elsevier declarations tool** in the portal (competing interests, funding, data availability, generative-AI, ethics) — the in-manuscript statements must match.
- [ ] **Upload figures as SEPARATE files** (staged in `submission/figures/`) — do not rely on the embedded copies in the docx.
- [ ] **Re-verify the live ASR Guide for Authors** before submitting (Elsevier updates without notice) and confirm the exact Editorial Manager code at the live submission link.
- [ ] Decide subscription vs open-access track (APC applies only to OA).

## Build commands (reproducible, from paper/ directory)
```bash
# Manuscript (TNR 12pt, author–date Harvard, line numbers, running header from YAML):
~/.claude/skills/asr-submit/bin/build-asr-docx --manuscript manuscript.md --auto-header

# Cover letter:
node make_cover_letter.cjs

# Highlights / COI as separate .docx:
pandoc submission/highlights.md --reference-doc=~/.claude/skills/asr-submit/assets/asr-reference.docx -o submission/highlights.docx

# Line-art figures → vector PDF:
rsvg-convert -f pdf -o figures/F1_pipeline.pdf figures/F1_pipeline.svg
```
