# Acta Astronautica Author Guidelines for Selectron Agents

**Purpose:** Use this file when drafting, revising, checking, or rendering the Selectron manuscript for submission to *Acta Astronautica*. It condenses the journal guide into agent-facing rules and adds Selectron-specific guardrails so the manuscript remains submission-ready and does not overclaim.

**Source basis:** Acta Astronautica Guide for Authors text provided by Diego, checked against the live ScienceDirect guide on 2026-06-14.

---

## 1. Journal Fit and Framing

*Acta Astronautica* publishes original work across basic, engineering, life, and social space sciences and space technology, including space-borne and Earth-based systems, space exploration, space applications for human welfare, satellite and mission systems, space transportation, communications, power, propulsion, astrodynamics, Earth observation, and related applied astronautics topics.

For Selectron, lead with:

- Reproducible computational methodology.
- Bayesian decision analysis for analog crew-selection research.
- NASA-IMM-aligned medical-risk Monte Carlo.
- NASA HSRB Likelihood x Consequence risk mapping.
- Software verification, reproducibility, and inter-model agreement.

Do **not** frame the paper as:

- A validated clinical decision-support system.
- A flight-certification or operational crew-selection tool.
- A Mars/Artemis mission-risk model.
- A validated predictor of real analog-mission incidents.

Use this core claim:

> Selectron is a transparent, offline, reproducible methodology for analog-mission crew-selection research and risk communication, not a clinical or operational certification tool.

---

## 2. Article Type

Use **Original research paper**.

Do not use the special **Academy Transaction Note** format unless explicitly instructed. Notes are limited to four journal pages, require special Academy sponsorship rules, and use a 50-word abstract.

---

## 3. Required Submission Files

Before submission, ensure the following are present:

- Manuscript source and rendered manuscript file.
- Keywords.
- Figures as separate files.
- Figure captions.
- Tables with titles, descriptions, and footnotes.
- Highlights file, because highlights are mandatory.
- Competing interests declaration file.
- Supplemental files, if used.
- Reproducibility lock file.
- Zenodo/software DOI: `10.5281/zenodo.20693257`.

For Selectron, maintain:

- `paper/manuscript.md`
- `paper/references.bib`
- `paper/cover-letter.md`
- `paper/submission/highlights.md`
- `paper/REPRODUCIBILITY_LOCK.json`
- `paper/figures/`
- Rebuilt `paper/submission/manuscript.docx` only after final freeze.

Current rendered DOCX files must be considered stale whenever `paper/manuscript.md`, figure files, `references.bib`, or the reproducibility lock changes.

---

## 4. Title Page Requirements

The title page must include:

- Concise, informative title.
- No unnecessary abbreviations or formulae.
- Author names with accurate spelling.
- Affiliations where the work was done.
- Full postal address for each affiliation.
- Corresponding author clearly identified.
- Corresponding author e-mail address.

For Selectron:

- Corresponding author: Diego L. Malpica, MD.
- Affiliation: Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogota, Colombia.
- Keep the title method-first and avoid promotional wording.

Preferred title pattern:

> A Reproducible Bayesian Decision-Analysis and NASA-IMM/HSRB Risk-Mapping Pipeline for Analog Astronaut Crew-Selection Research

---

## 5. Manuscript Structure

Use numbered sections. The abstract is not numbered.

Recommended structure:

1. Introduction
2. Methods
   - Criterion taxonomy and accessibility tiers
   - Bayesian MCDA
   - IMM Calculator
   - HSRB LxC mapping
   - Implementation and reproducibility
   - Verification and validation
3. Results
   - Worked example
   - Stage-A posterior
   - K15 inter-model agreement
   - HSRB verdict
   - Cross-mission comparison
   - Sensitivity analysis
4. Discussion
   - Methodological contribution
   - Positioning versus precedents
   - Open risks
   - Limitations
   - Future work
5. Conclusions
6. Statements
7. References

Appendices, if used, must be lettered A, B, etc. Equations, tables, and figures in appendices use separate numbering, such as Eq. (A.1), Table A.1, Fig. A.1.

---

## 6. Abstract

The abstract must be concise, factual, and stand alone.

It should state:

- Purpose of the research.
- Principal methods.
- Main results.
- Major conclusions.

Avoid:

- References, unless essential.
- Undefined uncommon abbreviations.
- Claims of clinical, operational, or outcome validation.

For Selectron, the abstract must explicitly say:

- K15 comparison is **inter-model agreement**, not outcome validation.
- Operational ISS-HMS CHI and pEVAC/pLOCL metrics remain documented divergences.
- Selectron is not a clinical or certification tool.

---

## 7. Keywords

Provide **maximum 6 keywords**.

Rules:

- Use American spelling.
- Avoid overly general terms.
- Avoid plural terms where possible.
- Avoid multi-concept keywords using "and" or "of".
- Use abbreviations only if firmly established in the field.

Suggested Selectron keywords:

- analog astronaut
- Bayesian MCDA
- Integrated Medical Model
- probabilistic risk assessment
- Human System Risk Board
- reproducible software

---

## 8. Highlights

Highlights are mandatory and must be submitted as a separate editable file.

Rules:

- File name should include `Highlights`.
- Use 3 to 5 bullet points.
- Maximum 85 characters per bullet, including spaces.
- Emphasize novel methods and results.

Good Selectron highlight examples:

- Bayesian MCDA quantifies uncertainty in analog crew-selection scores
- NASA-IMM-aligned simulator maps mission risk to HSRB language
- K15 inter-model agreement is enforced by reproducibility gates
- Prior catalog is hash-locked with exact provenance counts
- Browser-resident software runs offline with synthetic data only

---

## 9. Formatting and Word Processing

Use simple single-column formatting.

Do:

- Save the manuscript in the native word-processor/source format.
- Use bold, italics, subscripts, and superscripts where scientifically needed.
- Use spell-check and grammar-check.
- Keep tables editable.
- Keep equations editable.
- Use one table grid per table if using grids.
- Use tabs, not spaces, for table alignment if no grid is used.

Do not:

- Justify text manually.
- Hyphenate words manually.
- Use decorative formatting.
- Use images for equations.
- Use images for tables.
- Leave field codes from reference managers in the submitted manuscript.

LaTeX:

- Elsevier recommends `elsarticle.cls` and BibTeX if using LaTeX.

---

## 10. Equations, Symbols, and Units

Equations must be editable text, not images.

Rules:

- Use SI units.
- Define uncommon symbols.
- Avoid ambiguity between `1` and `l`, and between `0` and `O`.
- Use italics for variables in principle.
- Use `exp(...)` where clearer than powers of `e`.
- Number displayed equations consecutively if referenced in the text.
- Put equation numbers in parentheses at the right.

If many symbols are used, add a Nomenclature appendix in alphabetical order.

---

## 11. Figures and Artwork

Submit each figure as a separate file.

General rules:

- Number figures in text order.
- Use a logical file naming convention.
- Use uniform lettering and sizing.
- Embed fonts when possible.
- Preferred fonts: Arial, Courier, Times New Roman, Symbol, or similar.
- Size figures close to expected publication dimensions.
- Make color figures accessible to readers with color-vision impairment.
- Indicate whether color is required in print or online only.

Allowed formats and resolution:

- Vector drawings: EPS or PDF, with embedded fonts.
- Color/grayscale halftones: TIFF or JPEG, minimum 300 dpi.
- Pure line drawings: TIFF or JPEG, minimum 1000 dpi.
- Combination line/halftone: TIFF or JPEG, minimum 500 dpi.
- Microsoft Office artwork: submit native Office file if created there.

Do not submit:

- GIF, BMP, PICT, WPG, or screen-optimized graphics.
- Low-resolution artwork.
- Graphics disproportionately large for their content.

Color:

- Elsevier provides online color at no additional charge when usable color files are supplied.
- Print color may incur costs.
- For Selectron, keep figures interpretable in grayscale or specify online-only color unless print color is essential.

Captions:

- Supply captions separately from figure files.
- Caption starts with a brief title, not embedded in the figure.
- Explain all symbols and abbreviations.
- Keep text inside figures minimal.

---

## 12. Tables

Tables must be editable text, not images.

Rules:

- Number tables in text order.
- Cite every table in the text.
- Provide titles and any needed notes below the table body.
- Avoid vertical rules.
- Avoid shaded table cells.
- Do not duplicate results already described in the text.

For Selectron:

- K15 reproduction tables must clearly label "within K15 CI95" versus "documented-divergent."
- Prior-count tables must match `src/data/imm-priors.json` and `paper/REPRODUCIBILITY_LOCK.json`.

---

## 13. References

Acta Astronautica uses numbered references.

In text:

- Cite references by number in square brackets.
- Example: `... as demonstrated [3,6].`
- Author names may be mentioned, but the reference number must still appear.

Reference list:

- Number references in order of appearance.
- Ensure every in-text citation appears in the reference list.
- Ensure every reference-list item is cited in text.
- References cited in the abstract must be given in full.
- Use "in press" only for accepted items.
- Avoid unpublished results and personal communications in the reference list unless necessary.

Journal names:

- Abbreviate journal names according to the List of Title Word Abbreviations.

Required examples:

- Journal article:
  `[1] J. van der Geer, J.A.J. Hanraads, R.A. Lupton, The art of writing a scientific article, J. Sci. Commun. 163 (2010) 51-59. https://doi.org/...`

- Dataset:
  `[dataset] [6] M. Oguro, S. Imahiro, S. Saito, T. Nakashizuka, Mortality data..., Mendeley Data, v1, 2015. https://doi.org/...`

- Software:
  `[7] E. Coon, M. Berndt, ..., Advanced Terrestrial Simulator (ATS) v0.88, Zenodo, 2020. https://doi.org/...`

For Selectron:

- Add the Zenodo software citation: `https://doi.org/10.5281/zenodo.20693257`.
- Cite `paper/REPRODUCIBILITY_LOCK.json` only if treated as a dataset/software artifact; otherwise discuss it in Code availability.
- Replace Harvard/author-date rendering with numbered Acta style before final submission.

---

## 14. Web, Data, Preprint, and Software References

Web references:

- Include full URL.
- Include access date.
- Include DOI, author, date, and source publication if known.

Data references:

- Cite datasets in text and reference list.
- Include author, dataset title, repository, version, year, and persistent identifier.
- Add `[dataset]` before the reference.

Preprints:

- Use the peer-reviewed version if it exists.
- If citing a preprint, clearly mark it as a preprint and include the DOI.

Software:

- Include name, version, repository/archive, date, and DOI when available.

---

## 15. Declarations and Statements

Include a statements section before References.

Required or expected statements:

- Competing interests.
- Funding.
- Data availability.
- Code/software availability.
- Author contributions using CRediT.
- Ethics statement.
- Generative AI declaration, if AI tools were used beyond basic grammar/spelling/reference checks.

Competing interests:

- A declaration must be provided even if there are no competing interests.
- Use the Elsevier declaration template for upload.
- Do not convert the `.docx` template to another file type.
- Author signatures are not required.

Funding:

- Identify who funded the work and the funder role.
- If no funding was received, use:
  > This research did not receive any specific grant from funding agencies in the public, commercial, or not-for-profit sectors.

Selectron ethics statement must say:

- Synthetic data only.
- No human subjects.
- No animal subjects.
- No clinical records.
- No analog-mission incident registries analyzed.
- No IRB approval required.

---

## 16. Generative AI Declaration

AI tools may support manuscript preparation but must not replace human critical thinking, expertise, or evaluation.

Authors are responsible for:

- Verifying accuracy, completeness, impartiality, and sources.
- Editing and adapting AI-assisted material.
- Ensuring the manuscript represents the author's own analysis and interpretation.
- Ensuring originality and proper attribution.
- Safeguarding data privacy, intellectual property, and confidentiality.

Do not list AI tools as authors or co-authors.

If AI tools were used, add a section before References:

**Declaration of generative AI and AI-assisted technologies in the manuscript preparation process.**

Template:

> During the preparation of this work the author(s) used [NAME OF TOOL / SERVICE] in order to [REASON]. After using this tool/service, the author(s) reviewed and edited the content as needed and take(s) full responsibility for the content of the published article.

No declaration is needed for basic grammar, spelling, or reference-checking tools.

For Selectron, disclose coding assistance, test generation, figure-rendering assistance, bibliography-verification support, and copy-editing if used.

---

## 17. Inclusive Language

Use inclusive, bias-free language.

Avoid:

- Stereotypes.
- Slang.
- Dominant-culture assumptions.
- Claims implying superiority by age, gender, race, ethnicity, culture, sexual orientation, disability, or health condition.
- Unnecessary descriptors of personal attributes.

Prefer:

- Gender-neutral plural forms where possible.
- Specific, valid descriptors only when scientifically relevant.
- Inclusive coding terms such as `primary`/`secondary` and `allowlist`/`blocklist`.

For Selectron:

- Avoid implying that candidates are inherently "good" or "bad" people.
- Prefer "higher-risk synthetic crew profile" over stigmatizing language.
- Use "sex" only for biological parameters explicitly modeled by the IMM engine; do not conflate sex and gender.

---

## 18. Sex- and Gender-Based Analysis

For research involving or pertaining to humans, animals, or eukaryotic cells, authors should address sex and/or gender dimensions or explain why they cannot.

Authors should:

- State definitions of sex and/or gender used.
- Avoid ambiguity or conflation.
- Discuss limitations to generalizability if sex/gender analysis is not possible.
- Refer to SAGER guidance when applicable.

For Selectron:

- The software uses sex-coded IMM risk-factor inputs where present in the K15-style model.
- The manuscript must clarify that synthetic crew fields are model inputs, not recruited participant demographics.
- Do not infer gender identity from IMM sex-coded parameters.

---

## 19. Author Contributions and Authorship

Use CRediT roles:

- Conceptualization
- Data curation
- Formal analysis
- Funding acquisition
- Investigation
- Methodology
- Project administration
- Resources
- Software
- Supervision
- Validation
- Visualization
- Writing - original draft
- Writing - review & editing

Authorship order and list must be final at original submission. Authorship changes require editor approval and written confirmation from all affected authors.

For Selectron:

- If sole-authored, list all applicable CRediT roles for D.L.M.

---

## 20. Copyright, Open Access, and Sharing

Upon acceptance, authors complete either:

- Journal Publishing Agreement for subscription publication.
- License Agreement for gold open access.

For no-APC strategy:

- Choose the subscription route unless a waiver or institutional agreement is confirmed.
- Do not select gold open access unless Diego explicitly approves the cost.

Color print costs:

- Online color is no extra charge.
- Print color may incur costs.
- Prefer online-only color or grayscale-safe figures.

---

## 21. Submission and Peer Review

Submission is fully online through Editorial Manager:

`https://www.editorialmanager.com/aastronautica/default.aspx`

The system converts source files to a PDF for peer review, but source files are still required for production after acceptance.

Peer review:

- Single anonymized review.
- Initial editor suitability check.
- Typically at least two independent expert reviewers.
- Editor makes final decision.

Before upload:

- Recheck the live Guide for Authors.
- Confirm portal requirements.
- Confirm separate figure upload requirements.
- Confirm whether highlights are required in a separate file.
- Confirm competing-interest template requirements.
- Confirm subscription/open-access choice.

---

## 22. Supplementary Material, Video, and Data Visualization

Supplementary material:

- Submit with the article.
- Provide a concise descriptive caption for each supplementary file.
- Files are published as received.
- Turn off Track Changes in Office files.
- Submit updates as new files rather than annotating older files.

Video:

- Provide links in manuscript text.
- Label all files clearly.
- Preferred maximum: 150 MB per file, 1 GB total.
- Provide still images.

Interactive data visualization:

- Allowed where appropriate, following Elsevier instructions.
- For Selectron, do not rely on interactive figures for the core argument; static figures must stand alone.

---

## 23. Proofs After Acceptance

Proofs must be corrected quickly, usually within two days.

Use proofs only to check:

- Typesetting.
- Editing.
- Completeness.
- Correctness of text, tables, and figures.

Do not introduce major changes at proof stage unless the editor permits them.

Send all corrections in one communication.

---

## 24. Selectron-Specific Scientific Guardrails

Mandatory wording:

- Use "inter-model agreement" for K15 comparisons.
- Use "documented divergence" for K15 metrics outside CI95.
- Use "methodology/software-validation paper" for the contribution.
- Use "synthetic data" for worked examples.

Avoid:

- "Validated selection tool."
- "Operational crew selector."
- "Clinical decision support."
- "Flight-ready."
- "Mars mission model" or "Artemis mission model."
- "Predicts analog mission incidents."

Limitations that must remain visible:

- No validation against observed analog selection outcomes.
- No validation against analog incident registries.
- K15 is itself a model output, not observed flight data.
- Stage-A to Stage-B vulnerability coupling is implemented and unit-tested but not exercised in the reported K15 reproduction path unless a coupled worked example is explicitly added.
- Mars/Artemis structural drivers are out of scope.
- Rendered DOCX files are stale after source edits until rebuilt.

---

## 25. Final Agent Checklist

Before calling the manuscript submission-ready, verify:

- [ ] Final journal target is Acta Astronautica.
- [ ] `paper/manuscript.md` title, abstract, and cover letter match Acta framing.
- [ ] References are rendered in Acta numeric style, not Harvard author-date.
- [ ] Abstract is factual, standalone, and does not overclaim validation.
- [ ] Maximum 6 keywords.
- [ ] Highlights file has 3-5 bullets, each <=85 characters.
- [ ] Every figure and table is cited in order.
- [ ] All figures have captions and separate upload files.
- [ ] Tables are editable text.
- [ ] Equations are editable text.
- [ ] Competing interests statement exists.
- [ ] Funding statement exists.
- [ ] CRediT author-contributions statement exists.
- [ ] Ethics statement exists.
- [ ] Data availability statement exists.
- [x] Code availability statement includes the final Zenodo DOI.
- [ ] Generative AI declaration exists if applicable.
- [ ] `paper/REPRODUCIBILITY_LOCK.json` is current.
- [ ] `src/data/imm-priors.json` hash in the lock matches the file.
- [ ] Prior provenance counts match source: 34 tierA-nasa, 66 tierB-pymc, 1 tierB-lit, 0 tierC-synth.
- [ ] `npm run typecheck` passes.
- [ ] `npm run validate:imm` passes.
- [ ] `npm run validate:imm:analog` passes.
- [ ] `npm run build` passes.
- [ ] Full or targeted Playwright verification is recorded.
- [ ] Rendered `paper/submission/manuscript.docx` has been rebuilt after the final source freeze.
- [ ] Live Acta Guide for Authors has been rechecked immediately before upload.
