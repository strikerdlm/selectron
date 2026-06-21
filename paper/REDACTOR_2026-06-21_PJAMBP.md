# Redactor Audit for PJAMBP Manuscript

Source manuscript: `paper/manuscript.md`

Redacted submission manuscript: `paper/manuscript_pjambp.md`

Target journal: *The Polish Journal of Aviation Medicine, Bioengineering and Psychology*

## Rewritten Text

The redacted manuscript is saved as `paper/manuscript_pjambp.md` and compiled to `paper/submission/manuscript_pjambp.docx`.

## Diagnosis Summary

- Removed the Acta/astronautics-facing frame and replaced it with an aerospace-medicine decision-support frame.
- Reduced the manuscript from about 13,300 words to 2968 words, below PJAMBP's 6000-word original-article ceiling.
- Converted the abstract to a structured PJAMBP-compatible format.
- Rebuilt the title, keywords, introduction, discussion, and conclusion around aviation/space medicine, human factors, bioengineering, and risk communication.
- Preserved the non-operational disclaimer: Selectron is not a clinical, certification, or operational astronaut-selection tool.
- Scanned for the redactor taboo list; no listed phrases were found in `paper/manuscript_pjambp.md`.

## Frozen Elements Confirmation

- OK `101 conditions` - present.
- OK `100-condition K15 catalog plus one disclosed analog behavioral extension` - present.
- OK `interpersonal-conflict` - present.
- OK `100,000` trials - present.
- OK `5000` Dirichlet draws - present.
- OK `0xc0ffee` seed - present.
- OK `97.8`, `98.1`, `98.8` total-medical-event results - present.
- OK `82.8%` ISS-HMS Crew Health Index - present.
- OK `95.3%` unlimited-resource Crew Health Index - present.
- OK `9.65%` ISS-HMS pEVAC - present.
- OK `0.23%` ISS-HMS pLOCL - present.
- OK `0.18%` unlimited pLOCL - present.
- OK `86.0%` mission-success probability - present.
- OK `14.0%` mission-failure probability - present.
- OK `0.172` mission-time fraction lost - present.
- OK `23` HSRB priority score - present.
- OK `https://doi.org/10.5281/zenodo.20693257` - present.
- OK `538e16ccff94` - present.

## Verification Commands

```bash
wc -w paper/manuscript_pjambp.md
rg -n "100,000|5000|101 conditions|100-condition|interpersonal-conflict|97.8|98.1|98.8|95.3|82.8|9.65|0.23|0.18|86.0|14.0|0.172|23|0xc0ffee|10.5281/zenodo.20693257|538e16ccff94" paper/manuscript_pjambp.md
rg -n "it is worth noting that|it is important to note|Notably,|delve into|leverage|robust|in the context of|this study aims to|findings suggest that|Furthermore,|Moreover,|Additionally,|plays a crucial|plays a pivotal|plays a key role|sheds light on|in order to|it should be noted|it has been shown that|state-of-the-art|novel" paper/manuscript_pjambp.md
```
