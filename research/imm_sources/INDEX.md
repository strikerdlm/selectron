# NASA Integrated Medical Model — Source Corpus

Curated grounding for Selectron Iter 3 (analog-mission risk module). Every
source here is referenced by the Iter-3 spec or directly informs the
hierarchical Lognormal–Poisson model in Phase 3B.

**Provenance policy:** each `*.md` carries a YAML frontmatter with
`mcp_tool_used`, `fetched_utc`, `verified`, and `spec_sections_supported`.
Sources that fail DOI verification are flagged in the table with `⚠`. Do not
remove a flagged row — annotate the failure and move on; the failure mode is
itself data.

**Resume-pointer:** the rows below are the unit of work. Each row corresponds
to one task in [`docs/superpowers/plans/2026-05-18-selectron-iter3-risk.md`](../../docs/superpowers/plans/2026-05-18-selectron-iter3-risk.md). When a row is fully
fetched and verified, its Status flips to ✅. Pending rows show `…`. Failed
rows show `⚠ <reason>`.

**Math memory:** verbatim formulas, parameters, and convergence rules
extracted from the corpus are mirrored into the memory MCP under entities
`NASA-IMM`, `Lognormal-Poisson-MCMC`, `IMM-Four-Step-Trial`,
`NASA-STD-7009-Eight-Factors`, plus one entity per paper
(`G12-Gilkey-2012`, …). A resumed agent should `mcp__memory__search_nodes`
with query `"NASA IMM"` to recover the math without re-OCRing.

## Tier 1 — Primary NASA-IMM methodology (firecrawl + Mistral OCR)

| Ref | First author | Year | Title | DOI / NTRS | Classification | Task | Status | Pages | Notes |
|---|---|---|---|---|---|---|---|---|---|
| G12 | Gilkey et al. | 2012 | Bayesian analysis for risk assessment of selected medical events in support of the IMM effort | NASA/TP-2012-217120; [NTRS 20120013096](https://ntrs.nasa.gov/citations/20120013096); [CORE PDF](https://core.ac.uk/download/pdf/10569519.pdf); [OneDrive (NTRS original)](https://1drv.ms/b/c/6122c89c30f64940/IQBASfYwnMgiIIBhuKMBAAAAAbJ3m4Xb44drHcOihAAxjRc) | methods | 23 | ✅✅ | 46 | Lognormal–Poisson + WinBUGS Gibbs; 75k MC samples; convergence = MC error <5% OR Brooks-Gelman-Rubin <1.2. **Cross-source verified 2026-05-18:** Diego's OneDrive NTRS original re-OCR'd via Mistral; verbatim WinBUGS model block + Appendix-B CI→EF pipeline + Appendix-C.1 sample-monitor template now anchored in frontmatter + Selectron-Iter-3 synthesis section. CORE OCR had Eq. (1) rendered with σ collapsed to "0"; corrected ln(EF)=Φ(0.95)·σ=1.645·σ in synthesis. |
| M18 | Myers et al. | 2018 | Validation of the NASA Integrated Medical Model: A space flight medical risk prediction tool | PSAM 14, Paper 174; [IAPSAM PDF](https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf) | methods | 24 | ✅ | 11 | Canonical 8-factor list + Poisson/Binomial verbatim + 100k trials + <5% σ convergence. |
| A22 | Antonsen et al. | 2022 | Estimating medical risk in human spaceflight | [10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9) | methods | 25 | ✅ | web | 4-step trial verbatim; CHI defined; convergence rule averages σ across CHI/EVAC/LOCL. |
| K15 | Keenan et al. | 2015 | The Integrated Medical Model: A probabilistic simulation model predicting in-flight medical risks | NASA NTRS 20150018879 | architecture | 26 | ✅ | 12 | ICES-2015 conference paper; full PDF on NTRS — IMM architectural foundation. |
| W14 | Walton, Mulugeta, Nelson, Myers | 2014 | NASA-STD-7009 guidance document for human health and performance models and simulations | NASA NTRS 20140017301 | validation | 27 | ⚠ poster | 1 | NTRS deposit is a 1-page POSTER, not the full NASA-STD-7009 standard. Has weighting table (factor names differ from M18 canonical list — use M18 for V&V dossier). |
| S20 | Walton & Kerstman | 2020 | Quantification of medical risk on the ISS using the IMM | [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | validation | 28 | ⚠ abstract | — | AsMA/kglmeridian paywall — abstract only. Task 29 (zotero-pdf-ocr) attempt backfill from Diego's library. |
| R21 | Roma et al. | 2021 | Assessment of spaceflight medical conditions' and treatments' potential impacts on behavioral health and performance | [Acta Astronautica](https://www.sciencedirect.com/science/article/abs/pii/S2214552421000420) | methods (behavioral) | (new) | ✅ | ~10 | EMCL 100-condition × RDoC 6-domain × treatment-side BHP impact matrix. 94% of conditions hit Cognitive Systems; up to 481 adverse BHP effects/py from treatments. Upgrades Selectron's worst-case multiplier from a flat 1.5 to a condition-specific BHP factor. |
| SP09 | NASA Office of Safety & Mission Assurance | 2009 | Bayesian Inference for NASA Probabilistic Risk and Reliability Analysis | NASA/SP-2009-569 | methods (Bayesian PRA reference) | (new) | ✅ | 275 | The NASA canonical text behind IMM, Stage B, and the V&V dossier — Lognormal-Poisson conjugacy, hierarchical Bayes, posterior-predictive diagnostics. Underwrites NASA-STD-7009 Factor 1 (Verification). |

## Tier 2 — Zotero library (zotero-pdf-ocr skill)

Filled by Task 29 — `zotero-pdf-ocr` ran 9 queries (`"Integrated Medical Model"`, `"IMM Bayesian"`, `"Antonsen medical risk"`, `"Gilkey Bayesian"`, `"NASA medical risk simulation"`, `"NASA-STD-7009"`, `"Walton Kerstman"`, `"Boley IMM"`, `"Myers IMM validation"`) → 26 unique items → 12 curated (excluded 4 already in Tier 1, 14 out-of-scope: AI/CNN imaging, non-IMM clinical reviews, ISS engineering reqs) → 10 OCRed + 1 backfill (S20) + 1 duplicate-of-W14 (2BU96HSF). Resume contract: [`zotero_imm/_query_results.json`](zotero_imm/_query_results.json).

| Slug | First author | Year | Title | DOI | Why included | Status |
|---|---|---|---|---|---|---|
| (backfill) | Walton & Kerstman | 2020 | Quantification of Medical Risk on the ISS using the IMM (FULL TEXT) | [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | S20 full-text backfill — replaces paywalled abstract in `validation/S20_*.md`. Now has all numeric anchors (100k trials, ≤5% σ convergence, DRM1/DRM2 5.0% EVAC, 0.017 events/person-year, ISS PRA v2.1.1 historical underestimates 0.0035/0.0017, Antarctic + submarine analog rates). | ✅ full text |
| [antonsen-2023-updates-to-the-nasa-human](zotero_imm/antonsen-2023-updates-to-the-nasa-human.md) | Antonsen | 2023 | Updates to the NASA human system risk management process for space exploration | [10.1038/s41526-023-00299-8](https://doi.org/10.1038/s41526-023-00299-8) | Successor to A22; introduces HSRB 5×5 LxC scoring, DRM categories by destination/environment/duration, 30 active human-system risks — directly analogous to Selectron's MCDA score. | ✅ |
| [antonsen-2021-comparison-of-health-and-performance](zotero_imm/antonsen-2021-comparison-of-health-and-performance.md) | Antonsen | 2021 | Comparison of Health and Performance Risk for Accelerated Mars Mission Scenarios (NASA-TM-20210009779) | — (NTRS) | Two Mars DRMs (AMM 426d/30d EVA vs SMM 923d/401d EVA) with 100k-trial IMM forecasting; 3% excess-risk NASA threshold. | ✅ |
| [myers-2009-verification-validation-and-credibility-of](zotero_imm/myers-2009-verification-validation-and-credibility-of.md) | Myers | 2009 | V&V and Credibility of the NASA IMM Sleep Disruption-Medical Intervention Forecasting Tool | — | Earliest known application of NASA-STD-7009 8-factor credibility scoring to an IMM sub-tool (precedes W14 by 5 years). | ✅ |
| [goodenowmessman-2022-numerical-characterization-of-astronaut-caox](zotero_imm/goodenowmessman-2022-numerical-characterization-of-astronaut-caox.md) | Goodenow-Messman | 2022 | Numerical characterization of astronaut CaOx renal stone incidence rates to quantify in-flight risk | [10.1038/s41526-021-00187-z](https://doi.org/10.1038/s41526-021-00187-z) | Peer-reviewed precedent for replacing empirical IMM incidence priors with deterministic physiology-model-derived priors — directly relevant to Selectron's prior elicitation strategy (Phase 3B). | ✅ |
| [thomspon-2018-fingernail-injuries-and-nasas-integrated](zotero_imm/thomspon-2018-fingernail-injuries-and-nasas-integrated.md) | Thompson | 2008 | Fingernail Injuries and NASA's IMM (NTRS-20080043663) | — | Concrete IMM incidence-rate example: 0.046 events/person-year fingernail injury (10/27.85 py); IMM use-philosophy quote on comparative-cohort framing. | ✅ pdftotext fallback |
| [blue-2019-development-of-an-accepted-medical](zotero_imm/blue-2019-development-of-an-accepted-medical.md) | Blue | 2019 | Development of an Accepted Medical Condition List for ExMC Scoping | — (NTRS) | 40-page technical report on the institutional-knowledge-consensus method that informs IMPACT 1.0 and Selectron's criterion-list ratification step. | ✅ |
| [kreykes-2023-selecting-medical-conditions-relevant-to](zotero_imm/kreykes-2023-selecting-medical-conditions-relevant-to.md) | Kreykes | 2023 | Selecting Medical Conditions Relevant to Exploration Spaceflight to Create the IMPACT 1.0 Medical Condition List | [10.3357/AMHP.6199.2023](https://doi.org/10.3357/AMHP.6199.2023) | IMPACT 1.0 ICL = 120 conditions / 210-d cis-lunar DRM / 9-list reconciliation; canonical IMM-successor framework. | ✅ |
| [perkins-2023-modeling-and-simulation-credibility-assessments](zotero_imm/perkins-2023-modeling-and-simulation-credibility-assessments.md) | Perkins | 2023 | Modeling and simulation credibility assessments of whole-body finite element computational human-body model | [10.1080/10255842.2023.2206367](https://doi.org/10.1080/10255842.2023.2206367) | Worked NASA-STD-7009 eight-factor V&V dossier on a recent peer-reviewed FE model — template for Selectron's Iter-3 V&V deliverable (Task 60). | ✅ |
| [babocs-2024-reaching-mars-medical-risks-and](zotero_imm/babocs-2024-reaching-mars-medical-risks-and.md) | Babocs | 2024 | Reaching Mars: Medical risks and potential surgical conditions in the Martian environment | (Zotero metadata) | Up-to-date (2024) Mars-mission medical-risk taxonomy — useful frame for which medical events Selectron's analog-mission module should cover. | ✅ |
| [sides-2021-bellagio-ii-report-terrestrial-applications](zotero_imm/sides-2021-bellagio-ii-report-terrestrial-applications.md) | Sides | 2021 | Bellagio II Report: Terrestrial Applications of Space Medicine Research | [10.3357/AMHP.5843.2021](https://doi.org/10.3357/AMHP.5843.2021) | Sole Tier-2 source that explicitly bridges IMM/spaceflight evidence to terrestrial analog deployments — anchors Selectron's design rationale to import IMM priors into analog-mission risk estimation. | ✅ |

## Tier 3 — Citation graph (scite MCP)

Filled by Task 30 — scite inbound citations on G12, M18, A22.

| Source | Inbound count | High-signal hits | Status |
|---|---|---|---|

## Tier 4 — Follow-on literature (paper-search MCP)

Filled by Task 31 — `paper-search.search_papers` over IMM, hierarchical Poisson-Lognormal, analog-mission medical risk, PRA medical event tree.

| Slug | First author | Year | Title | DOI | Selectron-relevance | Status |
|---|---|---|---|---|---|---|

## Key V&V finding (Task 27 audit)

**Eight credibility factor names DIFFER between W14 (2014 poster) and M18 (2018 paper)** — the standard was apparently revised between these dates:

| # | W14 poster (2014) | M18 verbatim (2018) — CANONICAL |
|---|---|---|
| 1 | Verification | Verification |
| 2 | Validation | Validation |
| 3 | Input Pedigree | Development Data Pedigree |
| 4 | Results Uncertainty | Input Data Pedigree |
| 5 | Results Robustness | Uncertainty Characterization |
| 6 | Use History | Results Robustness |
| 7 | M&S Management | Model Use History |
| 8 | People Qual. | Model Management |

Selectron Iter-3 V&V dossier (Task 60) **uses M18's names**. The W14 poster's weight table (Verification 0.20, Validation 0.25, …) is mapped onto M18 names where possible. Mismatched W14 factor "People Qual." → Selectron-spec extension covered under git-history audit (Iter-3 spec §9 factor 8 "Model Management").

## Build history

- 2026-05-18 16:18 UTC — Task 22: skeleton created (folders + INDEX.md + `_fetch_imm_sources.py` + `.gitignore`).
- 2026-05-18 16:22 UTC — Task 23 DONE: G12 fetched via firecrawl-mcp from CORE PDF (46 p, 173 KB MD).
- 2026-05-18 16:29 UTC — Tasks 24-28 DONE: M18 (firecrawl + curl + pdftotext, 11 p), K15 (NTRS + pdftotext, 12 p), W14 (NTRS + pdftotext, 1-page poster), A22 (firecrawl from Nature, 95 KB MD), S20 (firecrawl abstract; paywall). Memory MCP now holds verbatim math anchors for all 6 papers under entities `NASA-IMM`, `G12-Gilkey-2012`, `M18-Myers-2018`, `A22-Antonsen-2022`, `K15-Keenan-2015`, `W14-Walton-2014`, `S20-Walton-Kerstman-2020`, `Lognormal-Poisson-MCMC`, `IMM-Four-Step-Trial`, `NASA-STD-7009-Eight-Factors`.
- 2026-05-18 22:00 UTC — Task 29 DONE: `zotero-pdf-ocr` ran 9 Zotero queries (6 required + 3 opportunistic) → 26 unique items → 12 curated → 10 OCRed to `zotero_imm/` + S20 full-text backfill of `validation/S20_*.md` (now 11 p with full numeric anchors) + Z8IQ9GCV pdftotext fallback (Mistral failed on multi-column poster). 2BU96HSF turned out to be the same NTRS poster Diego already has as W14 — full NASA-STD-7009 standard NOT in his library (gap flagged). CRLF on MISTRAL_API_KEY in skill .env detected and stripped (same trap as Task 20 — root cause likely in the original .env write; consider hardening `.env.example`). New Tier-2 corpus = ~671 KB markdown across 10 papers + 1 backfill, all with task-spec frontmatter and verbatim math anchors. Resume contract at `zotero_imm/_query_results.json`.
- 2026-05-18 22:55 UTC — G12 CROSS-SOURCE VERIFICATION: Diego shared the NTRS original PDF of G12 (`20120013096.pdf`, 727 KB, 46 pp, md5 `28897e5168c3b501fb793f9dc61a4e8f`) via OneDrive (`https://1drv.ms/b/c/6122c89c30f64940/IQBASfYwnMgiIIBhuKMBAAAAAbJ3m4Xb44drHcOihAAxjRc`). curl/curl-with-UA returned 403/HTML; `api.onedrive.com/v1.0/shares` returned 401 (auth-only now); Playwright MCP successfully clicked Download in the OneDrive viewer. Re-OCR'd via Mistral `mistral-ocr-latest`. Equations and convergence rule match the CORE-derived OCR semantically — but CORE's Eq. (1) had σ collapsed to "0" and the Appendix-B equations were garbled LaTeX. NTRS OCR rendered the WinBUGS model block, the Appendix-B CI→EF pipeline (Eqs. B1-B3), and the Appendix-C.1 sample-monitor / reporting template cleanly. `methods/G12_gilkey_2012_bayesian_imm.md` upgraded with a new "Selectron-Iter-3 relevance synthesis" block (right after frontmatter, ~150 lines), 11 verbatim `math_anchors` (replacing the previous 5 summary anchors), and `cross_source_verified: true`. Memory entities `G12-Gilkey-2012` and `Lognormal-Poisson-MCMC` extended with 8 + 5 new verbatim observations. Cache PDF kept at `_pdfs_tmp/onedrive_g12_gilkey_2012.pdf` for future diffing; raw OCR at `_ocr_raw/2026-05-18_ocr_onedrive_g12_gilkey_2012.md`. Status flipped to ✅✅ (double-tick = cross-source verified).
