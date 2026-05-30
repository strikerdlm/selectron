/**
 * Creates a pandoc reference.docx template formatted for
 * Advances in Space Research (Elsevier/COSPAR) submission:
 *   - A4 paper, 2.5 cm margins all around
 *   - 12 pt Times New Roman, double-spaced body
 *   - Numbered headings (1. / 1.1 / 1.1.1)
 *   - Author-year (Harvard) references
 *   - Line numbers (via lineNumberStart)
 *   - Running header / page-number footer
 */

const {
  Document, Packer, Paragraph, TextRun,
  Header, Footer, AlignmentType,
  HeadingLevel, BorderStyle, WidthType,
  PageNumber, Table, TableRow, TableCell,
  ShadingType, TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Measurements ─────────────────────────────────────────────────────────────
const MARGIN_DXA = Math.round(2.5 / 2.54 * 1440);   // 2.5 cm → 1417 DXA
const PAGE_W     = 11906;                             // A4 width  in DXA
const PAGE_H     = 16838;                             // A4 height in DXA
const CONTENT_W  = PAGE_W - 2 * MARGIN_DXA;          // ≈ 9072 DXA
const DBL_SPACE  = 480;                               // 2× line spacing twips

// ── Font ─────────────────────────────────────────────────────────────────────
const FONT      = 'Times New Roman';
const BODY_PT   = 12;   // pt  → half-points = 24
const BODY_HP   = BODY_PT * 2;
const H1_HP     = 26;   // 13 pt bold
const H2_HP     = 24;   // 12 pt bold
const H3_HP     = 24;   // 12 pt bold italic

// ── Shared run properties ─────────────────────────────────────────────────────
function bodyRun(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: BODY_HP, ...opts });
}

// ── Shared spacing block ──────────────────────────────────────────────────────
const bodySpacing = { line: DBL_SPACE, lineRule: 'auto', before: 0, after: 0 };

// ── Styles ────────────────────────────────────────────────────────────────────
const paragraphStyles = [
  {
    id: 'Normal',
    name: 'Normal',
    quickFormat: true,
    run: { font: FONT, size: BODY_HP },
    paragraph: { spacing: bodySpacing, alignment: AlignmentType.LEFT },
  },
  {
    id: 'BodyText',
    name: 'Body Text',
    basedOn: 'Normal',
    quickFormat: true,
    run: { font: FONT, size: BODY_HP },
    paragraph: { spacing: bodySpacing, alignment: AlignmentType.JUSTIFIED },
  },
  {
    id: 'Heading1',
    name: 'Heading 1',
    basedOn: 'Normal',
    next: 'BodyText',
    quickFormat: true,
    run: { font: FONT, size: H1_HP, bold: true },
    paragraph: {
      spacing: { before: 240, after: 120, line: 360, lineRule: 'auto' },
      outlineLevel: 0,
    },
  },
  {
    id: 'Heading2',
    name: 'Heading 2',
    basedOn: 'Normal',
    next: 'BodyText',
    quickFormat: true,
    run: { font: FONT, size: H2_HP, bold: true },
    paragraph: {
      spacing: { before: 200, after: 80, line: 360, lineRule: 'auto' },
      outlineLevel: 1,
    },
  },
  {
    id: 'Heading3',
    name: 'Heading 3',
    basedOn: 'Normal',
    next: 'BodyText',
    quickFormat: true,
    run: { font: FONT, size: H3_HP, bold: true, italics: true },
    paragraph: {
      spacing: { before: 160, after: 60, line: 360, lineRule: 'auto' },
      outlineLevel: 2,
    },
  },
  {
    id: 'Abstract',
    name: 'Abstract',
    basedOn: 'Normal',
    quickFormat: true,
    run: { font: FONT, size: BODY_HP },
    paragraph: {
      spacing: bodySpacing,
      indent: { left: 720, right: 720 },
      alignment: AlignmentType.JUSTIFIED,
    },
  },
  {
    id: 'Caption',
    name: 'Caption',
    basedOn: 'Normal',
    quickFormat: true,
    run: { font: FONT, size: 20, italics: true },
    paragraph: {
      spacing: { before: 60, after: 120, line: 240, lineRule: 'auto' },
      alignment: AlignmentType.LEFT,
    },
  },
  {
    id: 'SourceCode',
    name: 'Source Code',
    basedOn: 'Normal',
    quickFormat: true,
    run: { font: 'Courier New', size: 18 },
    paragraph: {
      spacing: { before: 60, after: 60, line: 240, lineRule: 'auto' },
    },
  },
];

// ── Header: running title (right-aligned) ─────────────────────────────────────
const runningTitle = 'Mission medical risk to analog-astronaut selection';
const pageHeader = new Header({
  children: [
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      children: [bodyRun(runningTitle, { size: 18, italics: true })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000', space: 4 } },
    }),
  ],
});

// ── Footer: centered page number ──────────────────────────────────────────────
const pageFooter = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: BODY_HP }),
      ],
    }),
  ],
});

// ── Cover page (title + author) ────────────────────────────────────────────────
const titlePara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 1440, after: 480, line: 360, lineRule: 'auto' },
  children: [
    new TextRun({
      text: 'Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board\nLikelihood × Consequence Mapping for Analog-Astronaut Selection',
      font: FONT, size: 28, bold: true,
    }),
  ],
});

const authorPara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 240, after: 120 },
  children: [bodyRun('Diego L. Malpica, MD', { bold: true })],
});

const affiliationPara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 120 },
  children: [bodyRun('Direction of Aerospace Medicine, Colombian Aerospace Force (FAC), Bogotá, Colombia', { italics: true })],
});

const emailPara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 480 },
  children: [bodyRun('dlmalpica@yahoo.com')],
});

const journalPara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 480, after: 0 },
  children: [bodyRun('Submitted to: Advances in Space Research', { italics: true })],
});

const datePara = new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 60, after: 0 },
  children: [bodyRun('2026-06-19')],
});

// ── Placeholder paragraphs (abstract label + body) ───────────────────────────
function sectionHead(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: FONT, size: H1_HP, bold: true })],
  });
}

function bodyPara(text = '') {
  return new Paragraph({
    style: 'BodyText',
    children: [bodyRun(text)],
  });
}

// ── Document ─────────────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: BODY_HP } },
    },
    paragraphStyles,
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: PAGE_H },
          margin: {
            top: MARGIN_DXA, bottom: MARGIN_DXA,
            left: MARGIN_DXA, right: MARGIN_DXA,
            header: 720, footer: 720,
          },
        },
        lineNumbers: { start: 1, countBy: 5, restart: 'continuous' },
      },
      headers: { default: pageHeader },
      footers: { default: pageFooter },
      children: [
        titlePara, authorPara, affiliationPara, emailPara, journalPara, datePara,
        new Paragraph({ children: [new TextRun({ break: 1 })], pageBreakBefore: true }),

        sectionHead('Abstract'),
        bodyPara('Placeholder abstract — replace with content.'),
        bodyPara(),

        sectionHead('Keywords'),
        bodyPara('Keyword 1; Keyword 2; Keyword 3'),
        bodyPara(),

        sectionHead('1. Introduction'),
        bodyPara('Manuscript body starts here.'),
        bodyPara(),

        sectionHead('References'),
        bodyPara('[References generated by pandoc --citeproc will appear here]'),
      ],
    },
  ],
});

// ── Write output ──────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'asr-reference.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('Written:', outPath);
  console.log('Size:', buf.length, 'bytes');
});
