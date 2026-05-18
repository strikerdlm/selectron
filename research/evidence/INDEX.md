# Evidence — Isolation & Confinement

Source: Diego's personal Zotero library (`ZOTERO_USER_ID=8347077`) → Koofr WebDAV
→ Mistral OCR (`mistral-ocr-latest`) → markdown with YAML frontmatter.

**Pipeline driver:** `/root/.claude/skills/zotero-pdf-ocr` (Zotero search + WebDAV
fetch) handed to `/root/.claude/skills/ocr-pipeline` (OCR). Reproducibility script
for the frontmatter pass lives at `_build_evidence.py`.

**Topic:** isolation and confinement (I&C) — analog missions, Antarctic winter-over,
Mars500/SIRIUS, HI-SEAS, polar drift, simulated long-duration spaceflight.

**Run history:**
- 2026-05-18 (Tier 1, pilot) — 11 papers, 213 pages.
- 2026-05-18 (Tier 2, this run) — 20 papers, 209 pages.
- **Total: 31 papers, 422 OCR pages.**

## Files (Tier 1 — pilot, I&C explicit)

| Slug | First author | Year | Pages | Kind | DOI |
|---|---|---|---:|---|---|
| `pagel-chouker-2016-effects-isolation-confinement.md` | Pagel & Choukèr | 2016 | 9 | review | [10.1152/japplphysiol.00928.2015](https://doi.org/10.1152/japplphysiol.00928.2015) |
| `ponomarev-2021-immunological-aspects-isolation-confinement.md` | Ponomarev et al. | 2021 | 16 | review | [10.3389/fimmu.2021.697435](https://doi.org/10.3389/fimmu.2021.697435) |
| `spinelli-werner-2022-antarctic-physiological-adaptation.md` | Spinelli & Werner | 2022 | 18 | review | [10.1002/wsbm.1556](https://doi.org/10.1002/wsbm.1556) |
| `landon-communication-delay-research-state.md` | Landon et al. | n.d. | 45 | review | — |
| `inoue-tachibana-2013-isolation-facility-astronaut-selection.md` | Inoue & Tachibana | 2013 | 5 | primary | [10.3357/ASEM.3188.2013](https://doi.org/10.3357/ASEM.3188.2013) |
| `abeln-2022-exercise-isolation-confinement-mars500.md` | Abeln et al. | 2022 | 21 | primary | [10.1186/s12868-022-00723-x](https://doi.org/10.1186/s12868-022-00723-x) |
| `dunn-rosenberg-2022-biobehavioral-stress-mars-analog.md` | Dunn Rosenberg et al. | 2022 | 16 | primary | [10.3389/fphys.2022.898841](https://doi.org/10.3389/fphys.2022.898841) |
| `malpica-2024-thor-isolation-confinement-responses.md` | Malpica et al. | 2024 | 16 | primary | [10.17981/JACN.4.2.2023.4](https://doi.org/10.17981/JACN.4.2.2023.4) |
| `giacon-2024-emmpol6-stress-biomarkers.md` | Giacon et al. | 2024 | 13 | primary | [10.1007/s00421-024-05575-3](https://doi.org/10.1007/s00421-024-05575-3) |
| `hudson-pre-antarctic-training.md` | Hudson et al. | n.d. | 8 | primary | — |
| `barros-delben-2026-analog-habitat-health-safety-protocol.md` | Barros-Delben et al. | 2026 | 37 | methodology | [10.1016/j.lssr.2026.01.011](https://doi.org/10.1016/j.lssr.2026.01.011) |

## Files (Tier 2 — broader I&C analog evidence)

Selected to fill Tier-1 gaps: Mars500 psych/behavioral, Antarctic-specific psych
and sleep research, team dynamics in long-duration extreme environments,
isolation countermeasures, and foundational long-term-isolation studies.

| Slug | First author | Year | Pages | Kind | DOI |
|---|---|---|---:|---|---|
| `basner-2014-mars500-psychological-behavioral-changes.md` | Basner et al. | 2014 | 10 | primary | [10.1371/journal.pone.0093298](https://doi.org/10.1371/journal.pone.0093298) |
| `sandal-2018-psychological-hibernation-antarctica.md` | Sandal et al. | 2018 | 8 | primary | [10.3389/fpsyg.2018.02235](https://doi.org/10.3389/fpsyg.2018.02235) |
| `tortello-2020-antarctic-isolation-confinement-coping.md` | Tortello et al. | 2020 | 11 | primary | [10.1002/smi.3006](https://doi.org/10.1002/smi.3006) |
| `palinkas-2004-antarctic-psychiatric-disorders.md` | Palinkas et al. | 2004 | 13 | primary | [10.3402/ijch.v63i2.17702](https://doi.org/10.3402/ijch.v63i2.17702) |
| `roma-2017-team-dynamics-long-duration-extreme.md` | Roma & Bedwell | 2017 | 34 | review | [10.1108/S1534-085620160000018007](https://doi.org/10.1108/S1534-085620160000018007) |
| `bell-2019-team-dynamics-long-distance-space-missions.md` | Bell et al. | 2019 | 21 | review | [10.3389/fpsyg.2019.00811](https://doi.org/10.3389/fpsyg.2019.00811) |
| `shved-2022-isolation-crowding-countermeasures.md` | Shved et al. | 2022 | 11 | primary | [10.3389/fphys.2022.963301](https://doi.org/10.3389/fphys.2022.963301) |
| `gemignani-2014-105d-isolation-sleep-cortisol.md` | Gemignani et al. | 2014 | 9 | primary | [10.1016/j.ijpsycho.2014.04.008](https://doi.org/10.1016/j.ijpsycho.2014.04.008) |
| `leon-2011-human-performance-polar-environments.md` | Leon et al. | 2011 | 10 | review | [10.1016/j.jenvp.2011.08.001](https://doi.org/10.1016/j.jenvp.2011.08.001) |
| `tafforin-2015-confinement-vs-isolation-mars-analogs.md` | Tafforin | 2015 | 5 | review | [10.3357/AMHP.4100.2015](https://doi.org/10.3357/AMHP.4100.2015) |
| `glos-2026-sleep-ans-four-month-isolation.md` | Glos et al. | 2026 | 10 | primary | [10.3389/fnhum.2026.1720237](https://doi.org/10.3389/fnhum.2026.1720237) |
| `cromwell-2021-earth-based-analogs-space-health-risks.md` | Cromwell et al. | 2021 | 13 | review | [10.1089/space.2020.0048](https://doi.org/10.1089/space.2020.0048) |
| `zimmer-2013-antarctic-psychological-changes-systematic-overview.md` | Zimmer et al. | 2013 | 9 | review | — |
| `pattyn-2017-antarctic-sleep-polar-insomnia.md` | Pattyn et al. | 2017 | 7 | primary | [10.1152/japplphysiol.00606.2016](https://doi.org/10.1152/japplphysiol.00606.2016) |
| `vermeulen-1977-small-group-long-term-isolation.md` | Vermeulen | 1977 | 7 | primary | [10.1080/02580144.1977.10429245](https://doi.org/10.1080/02580144.1977.10429245) |
| `mcmenamin-2020-amadee18-mars-analog-team-processes.md` | McMenamin et al. | 2020 | 8 | primary | [10.1089/ast.2019.2035](https://doi.org/10.1089/ast.2019.2035) |
| `tafforin-2013-mars500-crew-ethological-study.md` | Tafforin | 2013 | 8 | primary | [10.1016/j.actaastro.2013.05.001](https://doi.org/10.1016/j.actaastro.2013.05.001) |
| `vigo-2013-mars500-circadian-cardiovascular-autonomic.md` | Vigo et al. | 2013 | 6 | primary | [10.3357/ASEM.3612.2013](https://doi.org/10.3357/ASEM.3612.2013) |
| `nirwan-2022-antarctic-psychophysiology.md` | Nirwan | 2022 | 7 | review | [10.25259/SRJHS_4_2022](https://doi.org/10.25259/SRJHS_4_2022) |
| `verhoeven-2022-multiteam-systems-long-duration-exploration.md` | Verhoeven et al. | 2022 | 12 | review | [10.3389/fpsyg.2022.877509](https://doi.org/10.3389/fpsyg.2022.877509) |

## Why these papers (Selectron-relevant signal)

### Tier 1 — explicitly I&C / closest fit to selection
- **Inoue & Tachibana 2013** — only paper in the corpus directly addressing
  the *selection of astronaut candidates* through I&C exposure. Closest match
  to Selectron's scoring problem.
- **Pagel & Choukèr 2016** and **Ponomarev 2021** — canonical psycho-physio and
  immunology reviews of I&C — useful for criterion definition (iter 2).
- **Dunn Rosenberg 2022 (HI-SEAS)**, **Abeln 2022 (Mars500/SIRIUS)**, **Giacon
  2024 (EMMPOL 6)**, **Malpica 2024 (THOR)** — primary analog-mission studies
  with measured biomarkers; ground criterion weights in observed outcomes.
- **Barros-Delben 2026** — replicable analog-habitat health & safety protocol;
  directly useful for iter 2/3 framework design.
- **Landon**, **Spinelli & Werner**, **Hudson** — context on communication
  delay, Antarctic physiology, and pre-deployment training.

### Tier 2 — gap-fill across constructs Selectron must score
- **Basner 2014 (Mars500)** — the canonical 520-day confinement psych/behavioral
  paper. Individual-level trajectories on BDI-II, POMS, PVT, conflict, sleep
  — exactly the construct-level evidence Selectron needs for weight elicitation.
- **Bell 2019** and **Roma & Bedwell 2017** — systematic reviews of team
  dynamics in long-duration extreme environments. Foundational for any
  team-fit criterion in Iter 2.
- **Verhoeven 2022** — multiteam-system analysis for LDEM (Earth + crew + MCC).
- **McMenamin 2020 (AMADEE-18)** — primary team-process study in a Mars analog.
- **Palinkas 2004**, **Sandal 2018**, **Tortello 2020**, **Zimmer 2013** —
  Antarctic-specific psychological-adjustment evidence (psychiatric incidence,
  hibernation, coping, systematic overview). Bound the prior on adverse
  selection-relevant psychological outcomes.
- **Leon 2011** and **Nirwan 2022** — broader polar-environment performance
  syntheses.
- **Pattyn 2017**, **Gemignani 2014**, **Glos 2026**, **Vigo 2013** — sleep and
  autonomic-nervous-system biomarkers during I&C; relevant if Selectron's
  physical/circadian-fitness family is to be grounded in objective measures.
- **Shved 2022** — direct primary evidence on isolation, crowding, and
  countermeasures. Informs intervention-as-mitigator priors.
- **Cromwell 2021** — Earth-based analog taxonomy. Useful for iter 2 framing
  of analog-mission selection criteria.
- **Tafforin 2013 (Mars-500)** and **Tafforin 2015 (Tara + Mars-500)** —
  ethological observation of crews, isolation-vs-confinement decomposition.
- **Vermeulen 1977** — foundational small-group I&C reference; classic citation
  worth having in the corpus.

## Skipped this round

### No PDF synced (3 papers — manual sync needed before OCR is possible)

Highly relevant to I&C but Zotero has no PDF attachment uploaded to Koofr.
Re-checked 2026-05-18 (post-pilot): still unavailable. Open Zotero desktop,
attach + sync the PDFs, then re-run the pipeline:

| Title | Zotero item |
|---|---|
| Yi 2014 — 520-d Isolation/confinement (Mars500), immune & leukocyte | `KEZLKKIG` |
| Yi 2015 — 520-d I&C, acute stress challenge response | `LW3RZ8YB` |
| Shea 2009 — Antarctica meta-analysis: psychosocial factors in I&C | `LWJKVRGG` |

### Lower-priority I&C-adjacent (not run this round)

These have PDFs and are I&C-adjacent but ranked below Tier 2 for Selectron.
Run on demand if the criterion taxonomy expands into spaceflight-only
domains:

| Title | Zotero item |
|---|---|
| Tomsia 2024 — Long-term space-mission effects on human organism | `IVANYT9F` |
| Stahn 2021 — Brains in space: prolonged spaceflight neurocognition | `Q8AVSDTX` |
| Stahn 2023 — Neural bases of prolonged spaceflight | `VFTMZMUZ` |
| Smith 2024 — Automated psychotherapy in spaceflight environment | `F4LCYQ74` |
| Pagnini 2023 — Behavior & performance in deep space exploration | `ZG269P55` |
| Rozanov 2022 — Psychological-support methods (astronaut→medical) | `7LV3N6GN` |
| Terhorst 2022 — Terrestrial-analogue research for Mars HP review | `IPAN3CV5` |
| Marchal 2024 — Immune challenges after leaving Earth | `IBMBWVVN` |
| Capri 2023 — Inflammaging in long-term human spaceflight | `RGNQ9D3A` |
| Yin 2023 — Long-term spaceflight composite stress / depression | `Z33WQMS8` |

## Reproducing this batch

```bash
# 1. Search candidates (multiple queries cover the I&C / analog space)
for q in "isolation and confinement" "Mars500" "Antarctic winter-over" "HI-SEAS" \
         "SIRIUS" "analog mission"; do
  python3 /root/.claude/skills/zotero-pdf-ocr/scripts/zotero_search.py --query "$q"
done

# 2. Fetch each PDF (example for one)
python3 /root/.claude/skills/zotero-pdf-ocr/scripts/fetch_pdf.py <ATTACHMENT_KEY> \
    --out-dir /root/repos/Selectron/research/evidence/pdfs_tmp

# 3. OCR (per-file)
export MISTRAL_API_KEY=$(grep '^MISTRAL_API_KEY=' /root/repos/Selectron/.env \
    | cut -d= -f2 | tr -d '\r\n')
export OCR_EXPORTS_DIR=/root/repos/Selectron/research/evidence/_ocr_raw
python3 /root/.claude/skills/ocr-pipeline/ocr_pipeline.py <pdf> --output <slug>

# 4. Frontmatter pass (idempotent — re-running overwrites)
python3 /root/repos/Selectron/research/evidence/_build_evidence.py
```

The `.env` files have CRLF line endings; the `tr -d '\r\n'` strip is required
or the Mistral SDK rejects the `Authorization` header as malformed.

## Known-gotchas (carried forward + Tier-2 additions)

- **Attachment-key vs. item-key.** Zotero free-text search often returns the
  attachment record, not the bibliographic parent. The search script walks
  attachments back to parents — trust the `item_key` it reports.
- **Encrypted PDFs / weird text layers.** None encountered. The OCR pipeline
  silently degrades on form-only PDFs (empty markdown). Spot-check files where
  `ocr_pages` is much smaller than the visible PDF.
- **Tier-2 gotcha — multipart-envelope PDF.** Tortello 2020 (`BK6GUSDZ`) was
  stored in Koofr as a multipart/form-data HTTP request body rather than the
  raw PDF. Mistral OCR rejected it with `Document type 'application/octet-stream'
  is not supported`. The extracted PDF (boundary-split, headers stripped) OCRed
  cleanly. If another paper triggers the same 400 error, run:
  `file <path>` — if output is `data` not `PDF document`, extract the embedded
  PDF via the boundary marker (see `pdfs_tmp/full-text.pdf` repro).
- **Zotero metadata is NOT authoritative for author lists.** Multiple Tier-2
  papers had wrong/incomplete authors in Zotero (Spanish double-surnames split
  into the wrong field for Tortello 2020; fabricated co-authors absent from
  the actual PDF for Nirwan 2022). The build script now sources `title`,
  `authors`, `year`, `doi`, and `publication` directly from the Zotero API
  record, with **OCR-body verification of DOIs where Zotero is empty**
  (overrides table inside `_build_evidence.py`).
- **OCR cost.** 31-paper / 422-page batch ran in ~150s wall-clock and roughly
  $0.40–$0.80. A 200-paper scale-up (~4 000 pages of typical research papers)
  is ~$4–$8.
- **Parallelism.** Three concurrent Mistral OCR calls work without throttling.
  Six concurrent fetches from Koofr WebDAV also work. Don't push past those.

## Status

Pilot + Tier-2 complete. The 31-paper corpus now covers:
- I&C-specific psychophysiology (reviews + primary)
- Mars500 / SIRIUS / HI-SEAS / EMMPOL-6 / THOR analog-mission data
- Antarctic winter-over psychological adjustment
- Team dynamics in LDEM
- Sleep / autonomic / circadian biomarkers
- Foundational small-group isolation studies (1977)
- Selection-facility precedent (Inoue 2013)

Ready to scale to additional Selectron queries
(`countermeasures`, `astronaut selection`, `HRV analog`, `crew composition`,
`personality traits selection`, …) using the same pipeline.
