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
