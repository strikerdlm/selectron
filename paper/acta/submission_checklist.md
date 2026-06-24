# Acta Astronautica submission checklist — Selectron

This checklist converts the Selectron ASR package into an Acta Astronautica original research submission. It follows the Acta author guide supplied by the author and is intended to prevent accidental reuse of stale ASR files.

Legend: `[x]` complete in this workstream; `[ ]` pending before submission; `[blocked]` requires author or external action.

## 1. Journal route and article type

- [x] Target journal set to **Acta Astronautica**.
- [x] Article type set to **Original research paper**.
- [x] Academy Transactions Note route rejected as unsuitable for Selectron.
- [ ] Confirm current Acta guide for authors immediately before portal upload.
- [ ] Confirm the submission is not under consideration elsewhere.

## 2. Title page and author metadata

- [x] Corresponding author identified: Diego L. Malpica, MD.
- [x] Corresponding author email carried forward from existing manuscript source.
- [blocked] Full postal address required by Acta; current manuscript has only institutional unit + city + country.
- [blocked] Author biography required, maximum 100 words, editable format.
- [blocked] Passport-type author photograph required as separate figure/photo file.

## 3. Manuscript structure

- [x] Acta scaffold uses numbered sections and subsections.
- [x] Abstract is kept unnumbered.
- [x] Manuscript is framed as computational/probabilistic-risk methodology.
- [x] Scope explicitly limited to Earth analogs and LEO/ISS-baseline scenarios.
- [x] Operational/clinical/flight-certification claims are excluded.
- [ ] Full ASR manuscript body converted into Acta section numbering.
- [ ] Internal cross-references converted from author-date/ASR format to numbered sections, equations, figures, and tables.
- [ ] Spell check and grammar check final rendered manuscript.

## 4. Abstract and keywords

- [x] Draft Acta abstract avoids references.
- [x] Draft abstract defines MCDA, IMM, HSRB, and CHI on first use.
- [x] Keyword count reduced to six.
- [ ] Final abstract checked against all regenerated result values.
- [ ] Final keywords checked for Acta indexing style and excessive compound terms.

## 5. Highlights

- [x] Separate `highlights.md` created.
- [x] Five bullet points supplied.
- [x] Each bullet drafted under the 85-character Acta limit.
- [ ] Character count verified after final copy-edit.
- [ ] Rendered editable highlights file generated for portal upload.

## 6. References and citations

- [ ] Convert all manuscript citations from Pandoc author-date syntax to numbered square-bracket citations.
- [ ] Reference list ordered by first appearance.
- [ ] Journal titles abbreviated per LTWA where possible.
- [ ] Every in-text citation has a reference-list entry.
- [ ] Every reference-list entry is cited in text.
- [ ] Web references include full URL and access date.
- [ ] Zenodo software release cited as software in the reference list.
- [ ] Data/software references include persistent identifiers.
- [ ] DOI/reference verification gate passes before freeze.

## 7. Figures and tables

- [ ] Figure list frozen.
- [ ] All figures cited in order.
- [ ] Captions supplied separately from artwork.
- [ ] Figures exported as separate files.
- [ ] Prefer vector PDF/EPS for ECharts and schematic figures.
- [ ] Raster or mixed figures exported at journal-compliant resolution.
- [ ] Color preference stated as **online color only** unless author intentionally accepts print color charges.
- [ ] Figures checked for color-vision accessibility.
- [ ] Tables remain editable text, not images.
- [ ] Vertical rules and unnecessary shading removed from tables.
- [ ] K15 reproduction table regenerated from frozen commit.
- [ ] Sensitivity tables regenerated from frozen commit.

## 8. Required declarations

- [x] Competing-interest statement drafted in manuscript scaffold.
- [x] Funding statement uses Elsevier no-specific-grant wording.
- [x] CRediT author contribution statement drafted for sole author.
- [x] Generative-AI declaration drafted and positioned before references.
- [x] Data/code availability statement drafted.
- [x] Ethics/no-human-subjects statement drafted.
- [x] Sex/gender modeling limitation drafted.
- [ ] Elsevier declaration of competing interest `.docx` template completed and uploaded without conversion.
- [ ] Final AI-use declaration checked against actual tool use in the finished manuscript.

## 9. Scientific claim-control gates

- [x] Manuscript scaffold says inter-model agreement, not outcome validation.
- [x] Manuscript scaffold says decision-support research methodology, not autonomous selector.
- [x] Manuscript scaffold says not clinical decision support.
- [x] Manuscript scaffold says not flight certification.
- [x] Manuscript scaffold keeps Mars/Artemis out of scope.
- [ ] Prior provenance counts regenerated from `src/data/imm-priors.json` and made consistent across manuscript, README, lock file, and limitations text.
- [ ] K15 documented-divergent metrics preserved rather than hidden.
- [ ] Stage-A → Stage-B coupling described as implemented/unit-tested but not validated in K15 reproduction unless a new coupled result is added.

## 10. Reproducibility freeze

- [ ] Selectron commit SHA recorded.
- [ ] Manuscript repo commit SHA recorded.
- [ ] Zenodo DOI minted and recorded.
- [ ] `src/data/imm-priors.json` SHA-256 hash recorded.
- [ ] Figure-generation commit and command recorded.
- [ ] `npm run typecheck` result recorded.
- [ ] `npm test` result recorded or documented with exclusions.
- [ ] `npm run validate:imm` result recorded.
- [ ] `npm run validate:imm:analog` result recorded.
- [ ] K15 reproduction seed and RNG-call-sequence caveat recorded.
- [ ] Final rendered `.docx` rebuilt only after all of the above.

## 11. Handoff to manuscripts repo

- [ ] Copy `paper/acta/` to `manuscripts/selectron/acta/` after review.
- [ ] Keep `manuscripts/selectron/asr/` as ASR legacy/scope-risk package.
- [ ] Mark the Acta package as the preferred no-APC subscription-route package.
- [ ] Include rendered files only after Acta source is frozen.

## 12. Human-only items before portal submission

- [blocked] Author full postal address.
- [blocked] Author biography ≤100 words.
- [blocked] Passport-type photograph.
- [blocked] Zenodo DOI minting for frozen Selectron commit.
- [blocked] Elsevier competing-interest `.docx` template completion.
- [blocked] Final portal metadata: suggested reviewers, classifications, and declarations.
