# DOI Verification Log — crew-science evidence corpus

**Date:** 2026-06-07
**Trigger:** 2026-06-07 peer review found fabricated DOIs / wrong metadata in in-session-authored
evidence files. This log is the Phase-0 gate artifact: **every DOI used to justify a coefficient or a
manuscript sentence must appear here as RESOLVED (Crossref/PubMed) with matching title/authors.**
**Method:** each DOI resolved against Crossref and/or PubMed on 2026-06-07; claim text confirmed via
Consensus/Scite where noted. An identifier that does not resolve, or resolves to a different paper, is
marked ❌ and the value it backed is treated as unusable until re-grounded.

## Resolved — usable

| Source | Resolving DOI | Status |
|---|---|---|
| Xu, Le, He & Yao 2020, *J. Bus. Psychol.* 35(4):503–517 | `10.1007/s10869-019-09637-8` | ✅ resolves; **corrects** prior fabricated authors/DOI/sample |
| Halfhill et al. 2005, *Small Group Research* 36(1):83–105 | `10.1177/1046496404268538` | ✅ verified |
| Van Vianen & De Dreu 2001, *EJWOP* 10(2):97–120 | `10.1080/13594320143000573` | ✅ verified |
| Bell 2007, *J. Appl. Psychol.* 92(3):595–615 | `10.1037/0021-9010.92.3.595` | ✅ DOI/authors/title verified (effect size not re-read) |
| Clarke & Robertson 2005, *JOOP* 78(3):355–376 | `10.1348/096317905x26183` | ✅ verified; C .27, A .26 |
| Peeters et al. 2006, *Eur. J. Personality* 20(5):377–396 | `10.1002/per.588` | ✅ verified; A elevation ρ=.24 > C .20 |
| Beus, Dhanani & McCord 2015, *J. Appl. Psychol.* 100(2):481–498 | `10.1037/a0037916` | ✅ verified; "agreeableness largest safety-behavior variance" (near-tie with C) |
| Lee & Dalal 2016, *EJWOP* 25(1):120–132 | `10.1080/1359432X.2014.987231` | ✅ verified; safety-climate strength attenuates C→safety (964 employees, 17 orgs) |
| Wilmot & Ones 2019, *PNAS* 116(46):23004–23010 | `10.1073/pnas.1908430116` | ✅ verified (direction only; ρ specifics not verifiable) |
| Palinkas & Suedfeld 2008, *Lancet* 371(9607):153–163 | `10.1016/S0140-6736(07)61056-3` | ✅ verified; ~5% screened DSM floor |
| Palinkas et al. 2000, *Aviat. Space Environ. Med.* 71(6):619–625 | PMID 10870821 | ✅ verified |
| Palinkas 2003, *American Psychologist* 58(5):353–363 | `10.1037/0003-066X.58.5.353` | ✅ verified; **issue corrected** 58(5) not 58(3) |
| Kessler et al. 2005 (NCS-R), *Arch. Gen. Psychiatry* 62(6):617–627 | `10.1001/archpsyc.62.6.617` | ✅ verified; any-disorder 26.2%, serious ~5.8% |
| Bell, Brown & Mitchell 2019, *Front. Psychol.* 10:811 | `10.3389/fpsyg.2019.00811` | ✅ verified; **corrects** authors + DOI |
| Antonsen et al. 2022, *npj Microgravity* 8:8 | `10.1038/s41526-022-00193-9` | ✅ verified; constant-rate incidence, NO psych-vs-duration curve (authors say so) |

## ❌ Fabricated / wrong — removed or corrected

| Cited as | Problem | Action |
|---|---|---|
| Van Fossen et al. 2021, *Acta Astronautica* 179:246–253, `10.1016/j.actaastro.2020.10.037` | DOI resolves to an **orbital-mechanics** paper; title ∅ in PubMed/Scholar/Crossref; β=0.31/−0.27, N=71 all fabricated | **FILE DELETED** 2026-06-07 |
| Xu, Liao, Chen & Pu 2020, `10.1007/s10869-019-09638-9` | wrong authors, non-resolving DOI, "N=451/94 teams", "minimum uniquely load-bearing" | **CORRECTED** → Xu, Le, He & Yao; `…09637-8`; 70 teams; "mean/min/variance all predict" |
| Bell, Fisher, Brown, Mann, Baucom 2019, `10.3389/fpsyg.2019.01523` | wrong authors (Fisher/Mann/Baucom spurious), DOI → police-shooting paper | **CORRECTED** → Bell, Brown & Mitchell; `…00811` |
| English et al. 2004 "undergraduate 4-person teams (N₁=108, N₂=96)" | fabricated study design (real ≈ 30 cockpit crews of 3 pilots) | corrected-banner added; specifics removed pending primary-source re-read |
| Antonsen companion "8:19", `10.1038/s41526-022-00205-8` | DOI → *S. mutans* microbiology paper; title not found | do not cite; use the verified 8:8 main paper |
| Xu path coefficients 0.28 / 0.35 | not found in source | `CSC_BETA` NOT presented as derived from these — labeled operator-supplied |

## Process gate (going forward)

Per the analog proposal §4 step 1 ("record every value with its source"): a value may enter
calibration or manuscript text **only** after its DOI appears in the "Resolved — usable" table above.
A one-line `get_crossref_paper_by_doi` (or PubMed) check per citation is mandatory before use.
