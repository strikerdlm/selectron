# ASR Submission Checklist
## Advances in Space Research — Elsevier/COSPAR
**ISSN:** 0273-1177 | **Portal:** https://www.editorialmanager.com/AISR
**Track:** Subscription (non-OA, no APC)

---

## Before uploading to Editorial Manager

### Files to upload
- [x] `manuscript.docx` — main manuscript (pandoc-generated, ASR format)
- [x] `cover-letter.docx` — cover letter addressed to ASR editors
- [x] `highlights.md` → convert to plain text or simple .docx (3–5 bullets ≤85 chars)
- [x] `figures/F1_pipeline.png` — Fig. 1: Selectron pipeline overview
- [x] `figures/F2_criterion_tiers.png` — Fig. 2: 12-criterion × 3-tier matrix
- [x] `figures/F3.png` — Fig. 3: Stage A posterior (3-candidate worked example)
- [x] `figures/F4.png` — Fig. 4: Calculation trace
- [x] `figures/F5_convergence.png` — Fig. 5: Monte Carlo convergence
- [x] `figures/F6.png` — Fig. 6: HSRB 5×5 LxC grid
- [x] `figures/F7.png` — Fig. 7: Cross-mission CHI comparison
- [ ] `competing-interests-declaration.docx` — from Elsevier declarations tool

### Supplementary materials (peer-review R4, 2026-05-29)
- [x] **S-Methods-1 / S-Methods-2 dossiers EXCLUDED** — stale; describe the retired `src/risk/` 12-condition engine and contradict the manuscript's V&V / 100 %-evidence-based claims. Banners added in-place; the manuscript body (§2.6) is the authoritative, self-contained V&V statement. Rewrite against the current IMM Calculator before any future inclusion.
- [x] Broken `Figure S3 / S4` references removed from §3.6 (the data is in Tables 4 and 5 inline).
- [ ] **Supplementary figures:** only `Figure S2` (per-mission ESS table, `figures/S2_ess_table.png`) is cited in the body (§3.5). `figures/S1_vv_dossier.png` is an orphan tied to the excluded V&V dossier — drop it and renumber the ESS table S2 → **S1** (sole supplementary figure) when the package is built, so the body reference and the shipped file agree.

### Manuscript content checks
- [x] Title ≤ ~150 characters
- [x] Abstract ≤ 250 words (unstructured plain paragraph per ASR)
- [x] Keywords: 1–7 entries
- [x] Sections numbered (1. / 1.1 / 1.1.1)
- [x] References: author-year Harvard, alphabetical, LTWA-abbreviated journal names
- [x] AI disclosure in Methods section (§2.7)
- [x] Funding statement: no external funding
- [x] Competing interests: none declared
- [x] Data/code availability: Zenodo DOI + GitHub URL
- [x] Author contributions statement
- [x] Ethics statement: no human/animal subjects
- [x] Life sciences content excluded (ASR scopes computational/PRA only)

### TODOs before final submission
- [ ] Mint Zenodo DOI — replace `__ZENODO_DOI__` placeholder in manuscript + cover letter
- [ ] Update `__COMMIT_SHA__` placeholder in manuscript (paper/manuscript.md)
- [ ] Upload figures as SEPARATE files (not embedded in manuscript per ASR rules)
- [ ] Complete Elsevier declarations tool → download competing-interests .docx
- [ ] Abstract: verify it is ≤ 250 words with word counter
- [ ] Word count of main body: verify within reasonable range for methods paper
- [ ] Note: ASR explicitly excludes life-sciences content → manuscript keeps computational/PRA framing ✓

### Reference style compliance
ASR uses author-year Harvard (NOT numbered):
- Inline: `(Author et al., 2022)` or `Author et al. (2022)`
- List: alphabetical by first author, LTWA-abbreviated journal titles
- All entries include DOI where available

---

## Build commands (from paper/ directory)
```bash
make all           # rebuild manuscript.docx + cover-letter.docx
make template      # rebuild asr-reference.docx Word template only
make clean         # remove generated files in submission/
```

Pandoc command verbatim:
```bash
pandoc manuscript.md \
  --from=markdown+tex_math_dollars+raw_tex \
  --to=docx \
  --reference-doc=asr-reference.docx \
  --bibliography=references.bib \
  --csl=elsevier-harvard.csl \
  --lua-filter=figcrossref.lua \
  --citeproc \
  --resource-path=. \
  --output=submission/manuscript.docx
```
