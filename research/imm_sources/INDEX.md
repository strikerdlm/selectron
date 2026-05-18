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
| G12 | Gilkey et al. | 2012 | Bayesian analysis for risk assessment of selected medical events in support of the IMM effort | NASA/TP-2012-217120; [NTRS 20120013096](https://ntrs.nasa.gov/citations/20120013096); [CORE PDF](https://core.ac.uk/download/pdf/10569519.pdf) | methods | 23 | ✅ | 46 | Lognormal–Poisson + WinBUGS Gibbs; 75k MC samples; convergence = MC error <5% OR Brooks-Gelman-Rubin <1.2. |
| M18 | Myers et al. | 2018 | Validation of the NASA Integrated Medical Model: A space flight medical risk prediction tool | PSAM 14, Paper 174; [IAPSAM PDF](https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf) | methods | 24 | ✅ | 11 | Canonical 8-factor list + Poisson/Binomial verbatim + 100k trials + <5% σ convergence. |
| A22 | Antonsen et al. | 2022 | Estimating medical risk in human spaceflight | [10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9) | methods | 25 | ✅ | web | 4-step trial verbatim; CHI defined; convergence rule averages σ across CHI/EVAC/LOCL. |
| K15 | Keenan et al. | 2015 | The Integrated Medical Model: A probabilistic simulation model predicting in-flight medical risks | NASA NTRS 20150018879 | architecture | 26 | ✅ | 12 | ICES-2015 conference paper; full PDF on NTRS — IMM architectural foundation. |
| W14 | Walton, Mulugeta, Nelson, Myers | 2014 | NASA-STD-7009 guidance document for human health and performance models and simulations | NASA NTRS 20140017301 | validation | 27 | ⚠ poster | 1 | NTRS deposit is a 1-page POSTER, not the full NASA-STD-7009 standard. Has weighting table (factor names differ from M18 canonical list — use M18 for V&V dossier). |
| S20 | Walton & Kerstman | 2020 | Quantification of medical risk on the ISS using the IMM | [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | validation | 28 | ⚠ abstract | — | AsMA/kglmeridian paywall — abstract only. Task 29 (zotero-pdf-ocr) attempt backfill from Diego's library. |

## Tier 2 — Zotero library (zotero-pdf-ocr skill)

Filled by Task 29 — `zotero-pdf-ocr` searches across queries `"Integrated Medical Model"`, `"IMM Bayesian"`, `"Antonsen medical risk"`, `"Gilkey Bayesian"`, `"NASA medical risk simulation"`, `"NASA-STD-7009"`.

| Slug | First author | Year | Title | DOI | Why included | Status |
|---|---|---|---|---|---|---|

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
