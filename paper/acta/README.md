# Selectron — Acta Astronautica conversion package

Status: **conversion workstream started**.

This folder is the working Acta Astronautica package for the Selectron manuscript. It is intentionally separate from the existing ASR-oriented `paper/` and `paper/submission/` material so that stale ASR-rendered files are not reused by accident.

## Target journal

- Journal: **Acta Astronautica**
- Route: **Original research paper**
- Do **not** submit as an Academy Transactions Note. Notes are a special IAA route, require IAA sponsorship unless an author is an IAA member/corresponding member, and are limited to four journal pages with a 50-word abstract. Selectron is too large and methodologically substantive for that route.
- Submission system: Acta Astronautica Editorial Manager.
- Reference style: numbered references in square brackets, ordered by first appearance.
- Required extras: Highlights file, declaration of competing interest, CRediT author statement, funding statement, data/code availability statement, generative-AI declaration if AI tools were used, short author biography (≤100 words), and passport-type author photograph.

## Scientific framing

The Acta version must be framed as a **computational and probabilistic-risk methodology paper** for Earth-based analog missions and LEO/ISS-baseline scenarios.

Safe lead claim:

> Selectron is a reproducible Bayesian MCDA and NASA-IMM/HSRB risk-mapping pipeline for analog-astronaut selection research.

Unsafe lead claims to avoid:

- “Validated analog-astronaut selector.”
- “Clinical decision-support system.”
- “Flight-certification tool.”
- “Mars/Artemis-ready medical-risk engine.”
- “Validated predictor of real analog-mission outcomes.”

The manuscript should say **inter-model agreement** against the public K15 reference model, not real-world outcome validation.

## Directory contents

```text
paper/acta/
├── README.md
├── manuscript.md                    # Acta-format manuscript scaffold/source
├── cover-letter.md                  # Acta-specific cover letter draft
├── highlights.md                    # 3–5 mandatory bullets, ≤85 characters each
├── submission_checklist.md          # Acta compliance checklist and freeze gates
└── reproducibility-lock.template.json
```

Future rendered files should go under `paper/acta/rendered/` only after the Selectron software commit is frozen and a Zenodo DOI has been minted.

## Required handoff to `strikerdlm/manuscripts`

The user’s manuscript repository is the version-of-record for journal material. After this branch is reviewed, copy this package to:

```text
manuscripts/selectron/acta/
```

The handoff must include the frozen Selectron commit SHA, the manuscript-repo commit SHA, the Zenodo DOI, and the `imm-priors.json` hash in `reproducibility-lock.json`.

## Do not submit until these are true

1. The Acta manuscript uses numbered citations, not ASR/Harvard author-date citations.
2. The prior counts are generated from the frozen `src/data/imm-priors.json` and are internally consistent everywhere.
3. The K15 reproduction table is regenerated from the frozen Selectron commit.
4. All figures are regenerated from the frozen commit and exported as separate journal artwork files.
5. The DOI/reference gate passes for every cited item and every coefficient-bearing evidence file.
6. The rendered `.docx` package is rebuilt last from the Acta source.
