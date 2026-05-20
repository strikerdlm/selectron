// Emit a 12-criterion × 3-tier matrix as SVG.
// Rows: criteria (grouped by family). Cols: tiers Minimum/Medium/Elite.
// Cell color: green if criterion is active at that tier; gray if not.
// Output: paper/figures/F2_criterion_tiers.svg

import { writeFileSync } from "node:fs";
import { PLACEHOLDER_CRITERIA } from "../src/data/placeholder-criteria";
import {
  isCriterionAvailableAtTier,
  type AccessTier,
} from "../src/types/scenario";

const TIERS: AccessTier[] = ["minimum", "medium", "elite"];
const TIER_LABELS: Record<AccessTier, string> = {
  minimum: "Minimum",
  medium: "Medium",
  elite: "Elite",
};
const TIER_SUBTITLES: Record<AccessTier, string> = {
  minimum: "(Tier 1 · 8 criteria)",
  medium: "(Tier 2 · 10 criteria)",
  elite: "(Tier 3 · 12 criteria)",
};

// Family display names and colour accents for row-group separators
const FAMILY_LABEL: Record<string, string> = {
  psychological: "Psychological",
  physical: "Physical",
  professional: "Professional",
  behavioral: "Behavioral",
  cognitive: "Cognitive",
};
const FAMILY_COLOR: Record<string, string> = {
  psychological: "#ede9fe",
  physical: "#dcfce7",
  professional: "#fef9c3",
  behavioral: "#ffedd5",
  cognitive: "#dbeafe",
};

const ROW_H = 30;
const COL_W = 120;
const LABEL_W = 340;
const HEADER_H = 56;   // two-line header (tier name + subtitle)
const TITLE_H = 28;    // space for chart title above header
const TOP = TITLE_H + HEADER_H;
const LEGEND_H = 40;
const W = LABEL_W + TIERS.length * COL_W + 24;
const H = TOP + PLACEHOLDER_CRITERIA.length * ROW_H + LEGEND_H + 16;

// --- alternating row backgrounds and family group separators ---
let lastFamily = "";
const rowBgs: string[] = [];
const familySeparators: string[] = [];
PLACEHOLDER_CRITERIA.forEach((c, i) => {
  const y = TOP + i * ROW_H;
  const bg = i % 2 === 0 ? "#f9fafb" : "#ffffff";
  rowBgs.push(`<rect x="0" y="${y}" width="${W}" height="${ROW_H}" fill="${bg}" />`);

  if (c.family !== lastFamily) {
    // Draw a left-side family colour tab
    const fColor = FAMILY_COLOR[c.family] ?? "#f3f4f6";
    rowBgs.push(`<rect x="0" y="${y}" width="6" height="${ROW_H}" fill="${fColor}" />`);
    // Family label on the left margin (rotated or inline above first row of group)
    const familyText = FAMILY_LABEL[c.family] ?? c.family;
    familySeparators.push(
      `<text x="9" y="${y + 11}" font-family="ui-sans-serif, sans-serif" font-size="9" ` +
      `font-weight="700" fill="#6b7280" letter-spacing="0.08em" text-transform="uppercase">${familyText.toUpperCase()}</text>`
    );
    lastFamily = c.family;
  }
});

// --- column grid lines ---
const gridLines = TIERS.map((_, j) => {
  const x = LABEL_W + j * COL_W;
  return `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${TOP + PLACEHOLDER_CRITERIA.length * ROW_H}" stroke="#e5e7eb" stroke-width="1" />`;
}).join("\n");

// --- rows: label + tier cells ---
const rows = PLACEHOLDER_CRITERIA.map((c, i) => {
  const cells = TIERS.map((t, j) => {
    const active = isCriterionAvailableAtTier(c.minimumTier, t);
    const x = LABEL_W + j * COL_W + 6;
    const y = TOP + i * ROW_H + 4;
    const fill = active ? "#16a34a" : "#d1d5db";
    const textFill = active ? "#ffffff" : "#6b7280";
    const cellLabel = active ? "✓" : "–";
    return (
      `<rect x="${x}" y="${y}" width="${COL_W - 12}" height="${ROW_H - 8}" rx="4" fill="${fill}" />` +
      `<text x="${x + (COL_W - 12) / 2}" y="${y + (ROW_H - 8) / 2 + 5}" ` +
      `font-family="ui-sans-serif, sans-serif" font-size="13" font-weight="700" ` +
      `text-anchor="middle" fill="${textFill}">${cellLabel}</text>`
    );
  }).join("\n");

  // Criterion label — truncate long labels gracefully
  const rawLabel = c.label;
  const label =
    `<text x="18" y="${TOP + i * ROW_H + 19}" font-family="ui-monospace, monospace" ` +
    `font-size="11.5" fill="#111827">${rawLabel}</text>`;
  return label + "\n" + cells;
}).join("\n");

// --- two-line tier headers ---
const headers = TIERS.map((t, j) => {
  const cx = LABEL_W + j * COL_W + (COL_W - 12) / 2 + 6;
  return (
    `<text x="${cx}" y="${TITLE_H + 20}" font-family="ui-sans-serif, sans-serif" font-size="13" ` +
    `font-weight="700" text-anchor="middle" fill="#111827">${TIER_LABELS[t]}</text>` +
    `<text x="${cx}" y="${TITLE_H + 36}" font-family="ui-sans-serif, sans-serif" font-size="10" ` +
    `text-anchor="middle" fill="#6b7280">${TIER_SUBTITLES[t]}</text>`
  );
}).join("\n");

// --- chart title ---
const title =
  `<text x="${W / 2}" y="18" font-family="ui-sans-serif, sans-serif" font-size="14" ` +
  `font-weight="700" text-anchor="middle" fill="#111827">Criterion × Accessibility-Tier Matrix</text>`;

// --- header background band ---
const headerBg =
  `<rect x="0" y="${TITLE_H}" width="${W}" height="${HEADER_H}" fill="#f3f4f6" />`;

// --- horizontal rule under header ---
const headerRule =
  `<line x1="0" y1="${TOP}" x2="${W}" y2="${TOP}" stroke="#d1d5db" stroke-width="1.5" />`;

// --- bottom rule ---
const bottomY = TOP + PLACEHOLDER_CRITERIA.length * ROW_H;
const bottomRule =
  `<line x1="0" y1="${bottomY}" x2="${W}" y2="${bottomY}" stroke="#d1d5db" stroke-width="1.5" />`;

// --- legend ---
const legendY = bottomY + 10;
const legendItems = [
  { fill: "#16a34a", textFill: "#ffffff", symbol: "✓", label: "Active at this tier" },
  { fill: "#d1d5db", textFill: "#6b7280", symbol: "–", label: "Not active at this tier" },
];
const legend = legendItems.map((item, k) => {
  const lx = LABEL_W + 10 + k * 190;
  return (
    `<rect x="${lx}" y="${legendY}" width="22" height="20" rx="4" fill="${item.fill}" />` +
    `<text x="${lx + 11}" y="${legendY + 14}" font-family="ui-sans-serif, sans-serif" font-size="12" ` +
    `font-weight="700" text-anchor="middle" fill="${item.textFill}">${item.symbol}</text>` +
    `<text x="${lx + 28}" y="${legendY + 14}" font-family="ui-sans-serif, sans-serif" font-size="11" ` +
    `fill="#374151">${item.label}</text>`
  );
}).join("\n");

// --- Dirichlet weight annotation ---
const weightNote =
  `<text x="${LABEL_W + 4}" y="${legendY + 14}" font-family="ui-sans-serif, sans-serif" ` +
  `font-size="10" fill="#6b7280" text-anchor="end">Dirichlet α = 1/K per active criterion</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- background -->
  <rect width="100%" height="100%" fill="white"/>
  <!-- outer border -->
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" fill="none" stroke="#e5e7eb" stroke-width="1" rx="2"/>
  <!-- title -->
  ${title}
  <!-- header band -->
  ${headerBg}
  <!-- tier headers -->
  ${headers}
  <!-- header / body divider -->
  ${headerRule}
  <!-- row backgrounds + family tabs -->
  ${rowBgs.join("\n  ")}
  <!-- family group labels -->
  ${familySeparators.join("\n  ")}
  <!-- column grid -->
  ${gridLines}
  <!-- rows -->
  ${rows}
  <!-- bottom rule -->
  ${bottomRule}
  <!-- legend -->
  ${legend}
  <!-- weight note -->
  ${weightNote}
</svg>`;

writeFileSync("paper/figures/F2_criterion_tiers.svg", svg);
console.log(`wrote paper/figures/F2_criterion_tiers.svg (${svg.length} bytes)`);
