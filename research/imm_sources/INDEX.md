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

| Ref | First author | Year | Title | DOI / NTRS | Classification | Task | Status |
|---|---|---|---|---|---|---|---|
| G12 | Gilkey et al. | 2012 | Bayesian analysis for risk assessment of selected medical events in support of the IMM effort | NASA/TP-2012-217120; [NTRS 20120013096](https://ntrs.nasa.gov/citations/20120013096); [CORE PDF](https://core.ac.uk/download/pdf/10569519.pdf) | methods | 23 | … |
| M18 | Myers et al. | 2018 | Validation of the NASA Integrated Medical Model: A space flight medical risk prediction tool | PSAM 14, Paper 174; [IAPSAM PDF](https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf) | methods | 24 | … |
| A22 | Antonsen et al. | 2022 | Estimating medical risk in human spaceflight | [10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9) | methods | 25 | … |
| K15 | Keenan et al. | 2015 | The Integrated Medical Model: A probabilistic simulation model predicting in-flight medical risks | NASA NTRS 20150018879 | architecture | 26 | … |
| W14 | Walton, Mulugeta, Nelson, Myers | 2014 | NASA-STD-7009 guidance document for human health and performance models and simulations | NASA NTRS 20140017301 | validation | 27 | … |
| S20 | Walton & Kerstman | 2020 | Quantification of medical risk on the ISS using the IMM | [10.3357/AMHP.5432.2020](https://doi.org/10.3357/AMHP.5432.2020) | validation | 28 | … |

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

## Build history

- 2026-05-18 — Task 22: skeleton created (folders + INDEX.md + `_fetch_imm_sources.py` + `.gitignore`). No sources fetched yet.
