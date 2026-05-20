// Emit an SVG table of per-mission Stage B diagnostics for the 8 canonical
// analog missions (the same set the manuscript walks in §3.5). For each
// mission, run a real T=100 000 forward Monte Carlo, then capture:
//   • trials
//   • ESS (forward MC IID Dirichlet → ESS ≈ trials by construction)
//   • σ-final (the M18/A22 trailing-window standard deviation in the last
//     1 000-trial window — the metric of the convergence rule)
//   • χ mean + 90 % CI
//   • LxC L · C · score · color
//
// Output: paper/figures/S2_ess_table.svg + .png

import { writeFileSync } from "node:fs";
import { ANALOG_MISSIONS } from "../src/data/analog-missions";
import { ANALOG_CONDITIONS } from "../src/risk/conditions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "../src/data/synthetic-iter3";
import { simulateMission } from "../src/risk/simulate";
import { assessLxC } from "../src/risk/lxc";

const PAPER_SEED_BASE = 0xfeed;
const T = 100_000;

function sd(xs: number[]): number {
  if (xs.length === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance =
    xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / xs.length;
  return Math.sqrt(Math.max(0, variance));
}

type Row = {
  alias: string;
  duration: string;
  trials: string;
  ess: string;
  sigmaFinal: string;
  chi: string;
  lxc: string;
  color: string;
};

const missions = [...ANALOG_MISSIONS].sort(
  (a, b) => a.durationDays - b.durationDays,
);

const rows: Row[] = [];
for (let k = 0; k < missions.length; k++) {
  const m = missions[k];
  const crew = synthesizeCrew(
    { id: "DEMO-01", alias: "DEMO-01", scores: {} },
    m.crewSize,
  );
  const seed = (PAPER_SEED_BASE + k * 0x1234) | 0;
  const post = simulateMission(crew, m, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, {
    seed,
    trials: T,
    chiStar: 0.7,
    diagnostics: true,
  });
  const samples = post.diagnostics?.chiSamples;
  if (!samples) throw new Error("diagnostics not enabled");
  const lastWindow = samples.slice(-1000);
  const sigmaFinal = sd(lastWindow);
  const lxc = assessLxC(post);
  rows.push({
    alias: m.label ?? m.id,
    duration: `${m.durationDays} d × n=${m.crewSize}`,
    trials: T.toLocaleString(),
    ess: Math.round(post.ess).toLocaleString(),
    sigmaFinal: sigmaFinal.toFixed(4),
    chi: `${post.chi.mean.toFixed(3)} [${post.chi.ci90[0].toFixed(3)}, ${post.chi.ci90[1].toFixed(3)}]`,
    lxc: `L${lxc.likelihood} × C${lxc.consequence} = ${lxc.score}`,
    color: lxc.color,
  });
}

// ─── render ──────────────────────────────────────────────────────────────────

const COLS = [
  { key: "alias" as const, label: "Mission", w: 180 },
  { key: "duration" as const, label: "Duration · crew", w: 110 },
  { key: "trials" as const, label: "T", w: 80 },
  { key: "ess" as const, label: "ESS", w: 80 },
  { key: "sigmaFinal" as const, label: "σ final (last 1 000)", w: 130 },
  { key: "chi" as const, label: "χ mean [CI₉₀]", w: 200 },
  { key: "lxc" as const, label: "HSRB LxC", w: 120 },
  { key: "color" as const, label: "Verdict", w: 80 },
];

const PAD = 16;
const HEAD = 36;
const ROWH = 28;
const W = COLS.reduce((s, c) => s + c.w, 0) + 2 * PAD;
const H = HEAD + rows.length * ROWH + 2 * PAD;

const HEADER_FILL = "#0f172a";
const TEXT_HEAD = "#ffffff";
const TEXT_BODY = "#0f172a";
const ROW_FILL_A = "#f8fafc";
const ROW_FILL_B = "#ffffff";
const BORDER = "#cbd5e1";
const COLOR_FILL: Record<string, string> = {
  green: "#16a34a",
  yellow: "#eab308",
  red: "#dc2626",
};

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

let x = PAD;
const headerCells = COLS.map((c) => {
  const cell = `<text x="${x + 6}" y="${PAD + 22}" font-family="ui-sans-serif, sans-serif" font-size="12" font-weight="700" fill="${TEXT_HEAD}">${xmlEscape(c.label)}</text>`;
  x += c.w;
  return cell;
}).join("\n");

const headerBg = `<rect x="${PAD}" y="${PAD}" width="${W - 2 * PAD}" height="${HEAD - 8}" fill="${HEADER_FILL}" />`;

const bodyRows = rows
  .map((r, i) => {
    const y = HEAD + i * ROWH;
    const fill = i % 2 === 0 ? ROW_FILL_A : ROW_FILL_B;
    let cx = PAD;
    const cells = COLS.map((c) => {
      const value = r[c.key];
      let cell: string;
      if (c.key === "color") {
        cell = `<rect x="${cx + 6}" y="${y + 6}" width="${c.w - 16}" height="${ROWH - 12}" fill="${COLOR_FILL[value] ?? "#94a3b8"}" rx="4"/><text x="${cx + c.w / 2}" y="${y + 19}" font-family="ui-sans-serif, sans-serif" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">${xmlEscape(value)}</text>`;
      } else {
        cell = `<text x="${cx + 6}" y="${y + 19}" font-family="ui-monospace, monospace" font-size="11" fill="${TEXT_BODY}">${xmlEscape(value)}</text>`;
      }
      cx += c.w;
      return cell;
    }).join("\n");
    return `<rect x="${PAD}" y="${y}" width="${W - 2 * PAD}" height="${ROWH}" fill="${fill}" stroke="${BORDER}" stroke-width="0.5"/>${cells}`;
  })
  .join("\n");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="white"/>
  ${headerBg}
  ${headerCells}
  ${bodyRows}
</svg>`;

writeFileSync("paper/figures/S2_ess_table.svg", svg);
console.log(`wrote paper/figures/S2_ess_table.svg (${svg.length} bytes); ${rows.length} missions`);
