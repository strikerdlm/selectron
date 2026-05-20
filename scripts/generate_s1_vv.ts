// Emit a 3-row SVG table (Factor / Test / Evidence) for the V&V dossier
// supplementary figure S1. Mapping covers NASA-STD-7009A credibility
// factors 1-3 (Verification, Validation, Input Pedigree) — factors 4-8
// are deferred and explicitly out-of-scope for the manuscript.
//
// Output: paper/figures/S1_vv_dossier.svg

import { writeFileSync } from "node:fs";

type Row = { factor: string; test: string; evidence: string };

const ROWS: Row[] = [
  {
    factor: "1 — Verification",
    test: "Closed-form Dirichlet moments; verbatim JSC-66705 Rev A Fig. 4 grid check",
    evidence: "tests/engine/dirichlet.test.ts; tests/risk/lxc.test.ts",
  },
  {
    factor: "2 — Validation",
    test: "Poisson-Gamma conjugate check; σ < 5 % convergence rule at T = 100 000",
    evidence:
      "tests/risk/poisson_gamma_conjugate.test.ts; tests/risk/m18_convergence.test.ts",
  },
  {
    factor: "3 — Input Pedigree",
    test: "Crossref-verified DOIs for every cited reference; Phase-0 evidence-table provenance",
    evidence: "paper/references.bib (Crossref-checked); research/evidence_tables/",
  },
];

const COL = {
  factor: { w: 200, x: 16 },
  test: { w: 460, x: 230 },
  evidence: { w: 400, x: 704 },
};
const HEAD = 36;
const ROW = 96;
const PAD = 16;
const W = COL.evidence.x + COL.evidence.w + PAD;
const H = HEAD + ROWS.length * ROW + PAD;

const HEADER_FILL = "#0f172a"; // slate-900
const ROW_FILL_A = "#f8fafc"; // slate-50
const ROW_FILL_B = "#ffffff";
const BORDER = "#cbd5e1"; // slate-300
const TEXT_HEAD = "#ffffff";
const TEXT_BODY = "#0f172a";

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrap(s: string, max: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let buf = "";
  for (const w of words) {
    const tentative = buf ? `${buf} ${w}` : w;
    if (tentative.length <= max) {
      buf = tentative;
    } else {
      if (buf) lines.push(buf);
      buf = w;
    }
  }
  if (buf) lines.push(buf);
  return lines;
}

const header = `
  <rect x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${HEAD - 8}" fill="${HEADER_FILL}" />
  <text x="${COL.factor.x + 8}" y="${PAD + 20}" font-family="ui-sans-serif, sans-serif" font-size="13" font-weight="700" fill="${TEXT_HEAD}">NASA-STD-7009A factor</text>
  <text x="${COL.test.x + 8}" y="${PAD + 20}" font-family="ui-sans-serif, sans-serif" font-size="13" font-weight="700" fill="${TEXT_HEAD}">Test (this paper)</text>
  <text x="${COL.evidence.x + 8}" y="${PAD + 20}" font-family="ui-sans-serif, sans-serif" font-size="13" font-weight="700" fill="${TEXT_HEAD}">Evidence path</text>
`;

const rowsSvg = ROWS.map((r, i) => {
  const y = HEAD + i * ROW;
  const fill = i % 2 === 0 ? ROW_FILL_A : ROW_FILL_B;
  const factorLines = wrap(r.factor, 20);
  const testLines = wrap(r.test, 60);
  const evidenceLines = wrap(r.evidence, 50);
  const renderLines = (lines: string[], xCol: number) =>
    lines
      .map(
        (line, k) =>
          `<text x="${xCol + 8}" y="${y + 22 + k * 16}" font-family="ui-monospace, monospace" font-size="11" fill="${TEXT_BODY}">${xmlEscape(line)}</text>`,
      )
      .join("\n");
  return `
    <rect x="${PAD}" y="${y}" width="${W - 2 * PAD}" height="${ROW}" fill="${fill}" stroke="${BORDER}" stroke-width="0.5" />
    ${renderLines(factorLines, COL.factor.x)}
    ${renderLines(testLines, COL.test.x)}
    ${renderLines(evidenceLines, COL.evidence.x)}
  `;
}).join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="white"/>
  ${header}
  ${rowsSvg}
</svg>`;

writeFileSync("paper/figures/S1_vv_dossier.svg", svg);
console.log(`wrote paper/figures/S1_vv_dossier.svg (${svg.length} bytes)`);
