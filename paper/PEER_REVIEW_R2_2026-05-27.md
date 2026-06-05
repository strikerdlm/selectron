# Peer Review Report — Round 2 (npj Microgravity compliance audit)

**Manuscript**: Bayesian MCDA with NASA HSRB LxC Mapping for Analog-Astronaut Selection
**Date**: 2026-05-27
**Tier**: Deep (npj Microgravity author guidelines scraped via Firecrawl)
**Source**: https://www.nature.com/npjmgrav/for-authors-and-referees/submission-guidelines
**Previously**: Round 1 — Minor Revision (all 3 Major + 13/14 Minor addressed)

---

## Prior Major Concerns (Round 1)

- [A-M1] Degenerate worked example: **ADDRESSED** — 3-candidate table added (ALPHA/BRAVO/CHARLIE)
- [B-M1] K15 reproduction framing: **ADDRESSED** — reframed around operational TME + unlimited CHI
- [D-M1] Missing AI disclosure: **ADDRESSED** — statement added to Statements section

---

## npj Microgravity Compliance Audit

### Critical (policy, not formatting — required at initial submission)

**E-M1. AI disclosure must be in Methods, not Statements.**
npj Microgravity guidelines state verbatim: *"Use of an LLM should be properly documented in the **Methods section** (and if a Methods section is not available, in a suitable alternative part) of the manuscript."*

The current AI disclosure is in the Statements section (after Conclusion). It must be moved to or duplicated in §2 Methods. This is a **policy** requirement, not a formatting rule — it applies at initial submission.

**E-M2. References must use numbered Nature style, not author-year.**
Guidelines: *"References are numbered sequentially as they appear in the text."* Example format given: `Schott, D. H., Collins, R. N. & Bretscher, A. ... J. Cell Biol. **156**, 35-39 (2002).`

The manuscript uses pandoc `[@key]` author-year citations throughout. **However**, the guidelines also state: *"Manuscripts submitted to npj Microgravity do not need to adhere to our formatting requirements at the point of initial submission; formatting requirements only apply at the time of acceptance."*

This means numbered references are **not required for initial submission** but will be required at acceptance. Flag for revision stage. Pandoc can render numbered style with `--csl nature.csl`.

### Required sections / ordering (for acceptance stage)

**E-m1. Data Availability and Code Availability placement.**
Guidelines: *"Data availability statements should be provided as a separate section after the Methods section before the References."* Code availability should also be *"in the Methods section, under the heading 'Code availability'."*

Currently both are in the Statements section after the Conclusion. Move to between Methods and References at acceptance.

**E-m2. Funding should be in Acknowledgements.**
Guidelines: *"Funding information should be placed in the Acknowledgement section"* with the recommended phrasing *"This study received no funding."*

Currently funding is a standalone statement. Add an Acknowledgements section or move at acceptance.

**E-m3. Author Contributions format.**
Guidelines: *"Please use initials to refer to each author's contribution."*
Current text uses "D.L.M." which is correct for a sole author. The CRediT role listing is appropriate. ✓ OK.

### Figure requirements (for acceptance stage)

**E-m4. Figure legends limited to 350 words.**
- F6 caption: ~188 words ✓
- F7 caption: ~212 words ✓
- All other captions: well within limit ✓

**E-m5. Figure format at acceptance: 300 dpi, RGB, Arial/Helvetica.**
Current PNGs are 1600×1200 screenshots. At acceptance, provide:
- Individual figure files (not embedded in manuscript)
- 300 dpi minimum
- Arial or Helvetica typeface
- RGB color mode
- Accessible color palette (no red-green contrast)

The ECharts "scientific" theme already uses colorblind-safe palettes. ✓ OK at acceptance.

**E-m6. Supplementary Methods not permitted.**
Guidelines: *"The journal does not permit Supplementary Methods, all Methods should be reported in the main manuscript file."*
Currently no supplementary methods exist — all methods are in §2. ✓ OK.

### Reporting requirements

**E-m7. Reporting Summary and Editorial Policy Checklist.**
Guidelines: *"Authors are encouraged to include completed reporting summaries and editorial policy checklists at the time of submission."*
- Nature Portfolio Reporting Summary form (downloadable PDF)
- Editorial Policy Checklist (downloadable PDF)

These are not in the manuscript but should be completed and uploaded with the submission. Not a text issue — a portal-upload checklist item.

**E-m8. ORCID required for corresponding author before final version.**
The YAML metadata includes email but not ORCID. ORCID `0000-0002-7082-1846` (from CITATION.cff) should be added to the submission portal account.

### Statistical guidelines

**E-m9. Statistics and reproducibility section.**
Guidelines: *"The Methods must include a statistics and reproducibility section."*
The manuscript describes Monte Carlo methods, convergence rules, and seed-determinism throughout §2 but does not have a dedicated "Statistics and reproducibility" subsection. Consider adding a brief subsection or renaming §2.5 to include "Statistics and reproducibility" in the heading.

---

## New Concerns (post-Round-1 fixes)

**D-m11. "pass 4" internal nomenclature persists.**
Lines 79, 102, 219, 326: references to "community/military incidence calibration (pass 4)" use internal development nomenclature. A reviewer unfamiliar with the project will not know what "pass 4" means. Rephrase as "community/military incidence recalibration" without the "pass 4" qualifier.

**D-m12. `src/imm/` path remains in §2.3 opening.**
Line 77: "(`src/imm/` in the released artifact)" — one remaining inline file path in prose. This one is arguably useful (tells a reader where to find the code), but per the Round 1 cleanup, it could be moved to a parenthetical in §2.5 (Implementation).

---

## Updated Recommendation

**Accept with Minor Revision (conditional on E-M1 AI disclosure placement)**

The single blocking item is moving the AI disclosure from Statements to Methods per npj Microgravity policy. All other items are acceptance-stage formatting that the guidelines explicitly exempt from initial submission. The manuscript is otherwise submission-ready.

### Pre-submission checklist

| Item | Status | Action needed |
|---|---|---|
| AI disclosure in Methods | **REQUIRED NOW** | Move/duplicate from Statements to §2 |
| Numbered references (Nature style) | Deferred to acceptance | Use `--csl nature.csl` at acceptance |
| Data/Code availability after Methods | Deferred to acceptance | Move sections |
| Funding in Acknowledgements | Deferred to acceptance | Add Acknowledgements section |
| Reporting Summary form | Upload with submission | Complete PDF form |
| Editorial Policy Checklist | Upload with submission | Complete PDF form |
| ORCID on portal account | Before final version | Link 0000-0002-7082-1846 |
| Figures as separate files, 300 dpi | Deferred to acceptance | Re-export at acceptance |
| "pass 4" nomenclature | Nice to fix now | Rephrase 4 occurrences |
