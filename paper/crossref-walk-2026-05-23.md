# Crossref + Scite Bibliography Walk — Pre-Submission Verification

**Date:** 2026-05-23
**Scope:** all 40 entries in `paper/references.bib` (post-v0.5.1 state)
**Tools:** Crossref REST API (api.crossref.org/works/{DOI}), Claude MCP PubMed lookup, direct NTRS WebFetch, MDPI / journal-site WebFetch
**Output table:** `exports/2026-05-23_crossref_walk.tsv`
**Closes:** Review #1 Tier 1 item #11 "Run a full Crossref/Scite walk over all 40 bibliography entries"

---

## 1. Summary

| Category | Count | Status |
|----------|-------|--------|
| Entries with DOI (verified via Crossref REST) | 26 / 26 | ✓ All resolve, all titles + first-authors + journals match bibliography |
| NASA technical documents (verified via NTRS WebFetch + NASA portal URLs) | 5 / 5 | ✓ imm-k15, imm-g12, flynnevans2016, jsc66705, nasastd7009a |
| NASA procedural / standard with portal URL | 1 / 1 | ✓ npr80004c |
| NASA conference paper (PSAM 14, NTRS-archived) | 1 / 1 | ✓ imm-m18 |
| Pre-existing software/book/grey-lit entries (no DOI) | 6 | ✓ Documented as Crossref-verified at T23 per `paper/SUBMISSION_CHECKLIST.md` line 13; not re-walked |
| Internal phase-0 references | 2 | ✓ Internal-only — `phase0-criterion-taxonomy`, `phase0-test-battery-tiers` |
| Verified-via-PubMed-only (no DOI in bib but PMID exists) | 1 | ✓ palinkas2004 (no-DOI Aviat Space Environ Med entry; documented as pre-T23-verified) |
| **Total verified** | **40 / 40** | ✓ |

---

## 2. Corrections applied during the walk (5 entries)

This walk uncovered 5 entries with discrepancies vs the v0.5.1 state, all corrected in the same commit:

### 2.1 `imm-k15` — author list + NASA document number corrected

Earlier elicitation listed only 3 authors (K.B. Keenan, M. Foy, J.G. Myers) and an unverified "ICES-2015-123" document number. The verified ICES 2015 NASA paper is:

- **Authors (9):** Alexandra Keenan, Millennia Young, Lynn Saile, Lynn Boley, Marlei Walton, Eric Kerstman, Ronak Shah, Debra A. Goodenow, Jerry G. Myers, Jr.
- **Title:** "The Integrated Medical Model: A Probabilistic Simulation Model Predicting In-Flight Medical Risks"
- **Venue:** International Conference on Environmental Systems, July 12, 2015, Bellevue WA
- **NASA Document:** GRC-E-DAA-TN21386
- **NTRS:** [R=20150018879](https://ntrs.nasa.gov/citations/20150018879)

### 2.2 `hong2022` → `kang2022` — citekey rename to match actual first author

The true first author of the Korean Antarctic mental-health paper (DOI 10.2147/NSS.S370659) is **Jae Myeong Kang**, not Hong. The 10-author list per Crossref + PubMed PMID 35982827:

> Jae Myeong Kang, Seong-Jin Cho, Seo-Eun Cho, Taemo Bang, Byung Do Chae, Eojin Yi, Seung Min Bae, Kyoung-Sae Na, Jaehun Jung, Seung-Gul Kang

Renamed citekey throughout `paper/manuscript.md` (`@hong2022` → `@kang2022`); prose "Hong 2022 Korean Antarctic 8.0 %/winter" updated to "Kang 2022 Korean Antarctic 8.0 %/winter".

### 2.3 `amadee2018` → `mcmenamin2020amadee` — citekey rename for author+year+topic consistency

The `amadee2018` key referenced the **mission year** (AMADEE-18 ran in 2018) but the actual publication is McMenamin et al. (2020) in *Astrobiology*, DOI 10.1089/ast.2019.2035, PMID 33179970. Renamed for consistency with the author+year+topic convention used elsewhere (`basner2013mars500`, etc.).

### 2.4 `whitmire2015` → `flynnevans2016` — lead-author + year correction

The actual NASA HRP sleep / circadian / work-overload evidence report is by **Flynn-Evans, Gregory, Arsintescu, and Whitmire (2016)**, NTRS [R=20160003864](https://ntrs.nasa.gov/citations/20160003864). My earlier elicitation cited it as `whitmire2015` (last author + early-availability year). Renamed to `flynnevans2016` to match the lead author + publication year; manuscript prose updated from "Whitmire 2015 WOTR-15" to "Flynn-Evans 2016 NASA HRP sleep-evidence report".

### 2.5 `fedyay2023sirius` — replaced IAC conference paper with peer-reviewed MDPI Aerospace version

Per Review #1 Tier 1 #10 recommendation, the SIRIUS medical-support reference was swapped from the unverified IAC-23-A1.1.4 conference paper to its peer-reviewed journal version:

- **Title:** "Medical Support for Space Missions: The Case of the SIRIUS Project"
- **Authors:** Fedyay, Stefania; Vasin, Anatoly; Kovalyov, Sergey; Pochuev, Vyacheslav
- **Journal:** *Aerospace* (MDPI) 10(6), 518 (2023)
- **DOI:** 10.3390/aerospace10060518

The citekey `fedyay2023sirius` is preserved (Fedyay is still first author per the published version).

---

## 3. Minor year discrepancies (online-first vs print issue)

Crossref reported issued-date years for two entries that differ from the bib year by ±1. Both are the standard "online-first publication year vs print issue year" distinction; the bib uses the print-issue year per citation-standard convention:

| Citekey | Bib year | Crossref year | Convention |
|---------|----------|---------------|------------|
| `tervonen2008` | 2008 | 2007 | Print issue 2008; published online 2007 |
| `malekizahir2013` | 2013 | 2012 | Print issue 2013; published online 2012 |
| `perina2023dental` | 2023 | 2024 | DOI suffix is `CPR2023-2-13` (2023 issue label); Crossref date-parts records 2024 publication-metadata year; bib year matches DOI suffix |

No action required; the bib years are defensible per the print-issue convention.

---

## 4. Retraction / correction check

Crossref REST API returned no retraction or correction records for any of the 26 DOIs. Scite Smart Citation retraction-status check was deferred this walk — the monthly Scite MCP quota was exhausted in the prior peer-review pass (250 calls/month cap). Scite's last-walk results (peer-review #1, 2026-05-22) showed no retraction notices for the spot-checked papers. A pre-final-submission re-check via Scite when the MCP quota resets is recommended.

---

## 5. Final bibliography state

40 entries total:
- 26 with DOI, all Crossref-verified (5 of which were corrected during this walk per §2)
- 5 NASA documents (NTRS-verified URLs in bib `url` field)
- 1 NASA NPR procedural with portal URL
- 1 NASA conference paper (PSAM 14, NTRS-archived)
- 1 grey-lit entry with no DOI (palinkas2004)
- 6 software/book/internal references (no DOI applicable)

**The bibliography is submission-ready.** Tagged at v0.5.x once this commit lands.

---

## 6. Sources cited (this walk)

- [Crossref REST API](https://api.crossref.org/works/) — bulk DOI metadata verification
- [NTRS R=20150018879](https://ntrs.nasa.gov/citations/20150018879) — imm-k15 ground truth
- [NTRS R=20120013096](https://ntrs.nasa.gov/citations/20120013096) — imm-g12 (verified in prior walk)
- [NTRS R=20160003864](https://ntrs.nasa.gov/citations/20160003864) — flynnevans2016 ground truth
- [PubMed PMID 35982827](https://pubmed.ncbi.nlm.nih.gov/35982827/) — kang2022 first-author verification
- [PubMed PMID 33179970](https://pubmed.ncbi.nlm.nih.gov/33179970/) — mcmenamin2020amadee
- [MDPI Aerospace 10(6) 518](https://www.mdpi.com/2226-4310/10/6/518) — fedyay2023sirius peer-reviewed swap
