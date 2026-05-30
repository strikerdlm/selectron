/**
 * Generates an ASR-formatted cover letter DOCX.
 */
const {
  Document, Packer, Paragraph, TextRun,
  AlignmentType, BorderStyle
} = require('docx');
const fs = require('fs');
const path = require('path');

const FONT    = 'Times New Roman';
const BODY_HP = 24;  // 12 pt
const MARGIN  = Math.round(2.5 / 2.54 * 1440);
const PAGE_W  = 11906;
const PAGE_H  = 16838;

function p(text, opts = {}) {
  const { bold = false, italics = false, align = AlignmentType.LEFT,
          before = 0, after = 200 } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { before, after, line: 360, lineRule: 'auto' },
    children: [new TextRun({ text: text || '', font: FONT, size: BODY_HP, bold, italics })],
  });
}

function blank() {
  return new Paragraph({ spacing: { before: 0, after: 200 }, children: [] });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: BODY_HP } } },
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_W, height: PAGE_H },
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      },
    },
    children: [
      // Header block
      p('Diego L. Malpica, MD', { bold: true }),
      p('Direction of Aerospace Medicine, Colombian Aerospace Force (FAC)'),
      p('Bogotá, Colombia'),
      p('dlmalpica@yahoo.com'),
      blank(),
      p('2026-06-19'),
      blank(),
      p('To: The Editors, Advances in Space Research', { bold: true }),
      p('Elsevier / COSPAR'),
      blank(),

      // Subject
      new Paragraph({
        spacing: { before: 0, after: 200, line: 360, lineRule: 'auto' },
        children: [
          new TextRun({ text: 'Re: Manuscript submission — ', font: FONT, size: BODY_HP, bold: true }),
          new TextRun({
            text: 'From Mission Medical Risk to Crew Selection: A Reproducible NASA-IMM and HSRB Pipeline for Analog Astronauts',
            font: FONT, size: BODY_HP, bold: true, italics: true,
          }),
        ],
      }),
      blank(),

      // Salutation
      p('Dear Editors,'),
      blank(),

      // Body paragraph 1
      new Paragraph({
        spacing: { before: 0, after: 200, line: 360, lineRule: 'auto' },
        children: [
          new TextRun({ text: 'I am submitting the attached manuscript for consideration as an original research article in ', font: FONT, size: BODY_HP }),
          new TextRun({ text: 'Advances in Space Research', font: FONT, size: BODY_HP, italics: true }),
          new TextRun({ text: '. The paper presents ', font: FONT, size: BODY_HP }),
          new TextRun({ text: 'Selectron', font: FONT, size: BODY_HP, bold: true }),
          new TextRun({ text: ', a reproducible TypeScript pipeline that combines two methodological contributions for analog-astronaut selection:', font: FONT, size: BODY_HP }),
        ],
      }),

      // Contribution 1
      new Paragraph({
        spacing: { before: 0, after: 120, line: 360, lineRule: 'auto' },
        indent: { left: 720 },
        children: [new TextRun({ text: '1. A Bayesian multi-criteria decision analysis (MCDA) pipeline that produces a posterior distribution over each candidate\'s total score with credible-interval rank semantics — to our knowledge the first Bayesian MCDA pipeline delivering per-candidate composite-score posteriors and rank credible intervals for analog-astronaut selection (deterministic and fuzzy MCDM for pilot/aircrew selection is established — e.g. Taylan et al., 2024 — but a Bayesian formulation coupled to a mission-risk model is not).', font: FONT, size: BODY_HP })],
      }),

      new Paragraph({
        spacing: { before: 0, after: 200, line: 360, lineRule: 'auto' },
        indent: { left: 720 },
        children: [new TextRun({ text: '2. A formal mapping from the Stage-B IMM-style mission-risk Monte Carlo posterior to NASA\'s institutional Human System Risk Board Likelihood × Consequence framework as published in JSC-66705 Revision A — the first such mapping for analog-mission programs.', font: FONT, size: BODY_HP })],
      }),

      // Body paragraph 2 — IMM
      p('The IMM Calculator aligns to the NASA Integrated Medical Model of Keenan et al. (2015) and reproduces the K15 §II.A.9 sum-of-products per-event quality-time-lost formula across the canonical 100-condition K15 catalogue at T = 100,000 trials. All 100 per-condition priors are evidence-based (34 tier-A NASA-attributed, 66 tier-B PyMC NUTS-fitted from terrestrial, Antarctic, submarine, and military population epidemiological data across iterative calibration passes); zero synthetic placeholders remain. A two-panel condition-set sensitivity analysis demonstrates that the K15 reproduction is non-circular: the 34 NASA-sourced conditions alone produce issHMS CHI within K15\'s published CI₉₅, and the 66 independently-fitted tier-B conditions add evidence-based risk that is not back-calibrated against K15 aggregates.'),

      // Body paragraph 3 — V&V
      p('Internal validation follows NASA-STD-7009A\'s first three credibility factors: closed-form Dirichlet moments, ESS, the Poisson-Gamma conjugate test, the verbatim JSC-66705 Figure 4 grid check, and the σ < 5% convergence rule at the NASA-canonical T = 100,000 trials per Myers (2018) and Antonsen (2022). Outcome validation against analog-mission incident catalogues is explicitly out-of-scope and disclosed as a limitation; the paper is framed as a methodology contribution, not an outcome-prediction study.'),

      // Body paragraph 4 — software
      new Paragraph({
        spacing: { before: 0, after: 200, line: 360, lineRule: 'auto' },
        children: [
          new TextRun({ text: 'The software artifact is MIT-licensed and Zenodo-archived (DOI ', font: FONT, size: BODY_HP }),
          new TextRun({ text: 'assigned upon archival', font: FONT, size: BODY_HP, italics: true }),
          new TextRun({ text: ') at the commit used to generate every figure. The repository at ', font: FONT, size: BODY_HP }),
          new TextRun({ text: 'github.com/strikerdlm/selectron', font: FONT, size: BODY_HP }),
          new TextRun({ text: ' contains the full source, the test suite (355+ vitest + 20 Playwright tests), the V&V dossier, and reproducibility instructions.', font: FONT, size: BODY_HP }),
        ],
      }),

      // Scope alignment
      p('The manuscript fits Advances in Space Research\'s scope on (a) computational modeling of medical risk in spaceflight and analog environments, (b) probabilistic risk assessment methodology for crewed space missions, and (c) quantitative translation of NASA institutional frameworks (HSRB, JSC-66705 Rev A, NASA-STD-7009A) into reproducible, externally usable artifacts. The NASA IMM community — Antonsen et al. (2022), Myers et al. (2018), Keenan et al. (2015) — provides the methodological foundation; we extend that line of work into the analog-mission domain with a Bayesian selection pipeline coupled to a fully open-source IMM-aligned simulator.'),

      // Ethics / declarations
      p('The manuscript is original work, has not been published elsewhere, and is not under consideration by any other journal. I am the sole author and declare no conflicts of interest. The work received no external funding. The submission complies with the journal\'s requirements: data availability, code availability, author contributions, funding, competing-interests, and ethics statements are included in the manuscript.'),

      blank(),
      p('I appreciate your time and look forward to your editorial decision.'),
      blank(),
      p('Sincerely,'),
      blank(),
      p('Diego L. Malpica, MD', { bold: true }),
      p('Direction of Aerospace Medicine, Colombian Aerospace Force (FAC)'),
      p('Bogotá, Colombia'),
      p('dlmalpica@yahoo.com'),
    ],
  }],
});

const outPath = path.join(__dirname, 'submission', 'cover-letter.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('Written:', outPath, '—', buf.length, 'bytes');
});
