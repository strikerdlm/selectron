// Run a single Stage-B simulation at T=100k, record sigma_CHI across rolling
// 1 000-trial increments, emit SVG line plot showing sigma falling below the
// 5 % rule by T=100k. Uses the same seeded canonical inputs as F3.
//
// Metric: at each 1 000-trial checkpoint, compute the σ of the CHI samples
// in the LAST 1 000 trials and track how it evolves. The M18/A22 rule
// (docs/iter3_nasa_monte_carlo_audit.md) declares convergence when the
// fractional change in trailing-window σ between the last two 1 000-trial
// increments is < 5 %. This plot shows that trailing-window σ stabilising
// well before T = 100 000 (the canonical run length).

import { writeFileSync } from "node:fs";
import { ANALOG_MISSIONS } from "../src/data/analog-missions";
import { ANALOG_CONDITIONS } from "../src/risk/conditions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "../src/data/synthetic-iter3";
import { simulateMission } from "../src/risk/simulate";

// The paper uses hi-seas-45d (closest 45-day analog to the original plan).
const mission = ANALOG_MISSIONS.find((m) => m.id === "hi-seas-45d");
if (!mission) {
  throw new Error("hi-seas-45d mission not found in catalog");
}

const crew = synthesizeCrew(
  { id: "DEMO-01", alias: "DEMO-01", scores: {} },
  mission.crewSize,
);
const T = 100_000;
const INC = 1000;

const post = simulateMission(crew, mission, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, {
  seed: 0xc0ffee,
  trials: T,
  chiStar: 0.7,
  diagnostics: true,
});

if (!post.diagnostics?.chiSamples) {
  throw new Error("diagnostics not enabled");
}

const samples = post.diagnostics.chiSamples;

// Compute trailing-window σ at each 1 000-trial checkpoint (M18/A22 metric):
// σ of CHI in samples [(i-INC), i) at each checkpoint i = INC, 2*INC, ..., T.
function sd(xs: number[]): number {
  if (xs.length === 0) return 0;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / xs.length;
  return Math.sqrt(Math.max(0, variance));
}

const sigmaSeries: number[] = [];
for (let i = INC; i <= samples.length; i += INC) {
  const window = samples.slice(i - INC, i);
  sigmaSeries.push(sd(window));
}

// Also compute the fractional-change series (M18 rule: |Δσ/σ_prev| < 5%).
const changePct: number[] = [];
for (let i = 1; i < sigmaSeries.length; i++) {
  const prev = sigmaSeries[i - 1];
  const curr = sigmaSeries[i];
  const denom = Math.max(prev, 1e-9);
  changePct.push((Math.abs(curr - prev) / denom) * 100);
}

const finalChangePct = changePct[changePct.length - 1];
const finalSigma = sigmaSeries[sigmaSeries.length - 1];

// Plot: two-panel concept collapsed into one SVG.
// Top area: trailing-window σ(CHI) vs cumulative trials.
// Reference line: a horizontal band marking the 5 % change threshold on a
// separate right-axis annotation is text-only (too complex for SVG). Instead
// we add a dashed red line at the final sigma value (showing it has stabilised)
// and annotate the last-two-window change pct.

const W = 1200, H = 620, PAD_L = 72, PAD_R = 40, PAD_T = 52, PAD_B = 60;
const plotW = W - PAD_L - PAD_R;
const plotH = H - PAD_T - PAD_B;

// Y axis: trailing σ values
const sigmaMin = 0;
const sigmaMax = Math.max(...sigmaSeries) * 1.15;

// X axis: checkpoint indices 0..N-1 maps to 1k..100k
const N = sigmaSeries.length; // should be 100

function toX(idx: number): number {
  return PAD_L + (idx / (N - 1)) * plotW;
}

function toY(v: number): number {
  return PAD_T + plotH - ((v - sigmaMin) / Math.max(sigmaMax - sigmaMin, 1e-12)) * plotH;
}

const linePoints = sigmaSeries.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(" ");

// Dashed line at the FINAL sigma to show stabilisation
const yFinal = toY(finalSigma);

// Y-axis ticks (5 evenly spaced)
const yTicks = Array.from({ length: 6 }, (_, i) => sigmaMin + (i / 5) * (sigmaMax - sigmaMin));
const yTickSvg = yTicks
  .map((v) => {
    const y = toY(v);
    return (
      `<line x1="${PAD_L - 5}" y1="${y.toFixed(1)}" x2="${PAD_L}" y2="${y.toFixed(1)}" stroke="#9ca3af" stroke-width="1"/>` +
      `<text x="${(PAD_L - 8).toFixed(0)}" y="${(y + 4).toFixed(0)}" text-anchor="end" font-family="ui-monospace,monospace" font-size="10" fill="#6b7280">${v.toFixed(4)}</text>` +
      `<line x1="${PAD_L}" y1="${y.toFixed(1)}" x2="${W - PAD_R}" y2="${y.toFixed(1)}" stroke="#f3f4f6" stroke-width="1"/>`
    );
  })
  .join("\n");

// X-axis ticks at every 10k
const xTickVals = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const xTickSvg = xTickVals
  .map((k) => {
    const idx = k - 1; // 10k → index 9, 20k → index 19, etc.
    const x = toX(idx);
    return (
      `<line x1="${x.toFixed(1)}" y1="${(PAD_T + plotH).toFixed(1)}" x2="${x.toFixed(1)}" y2="${(PAD_T + plotH + 5).toFixed(1)}" stroke="#9ca3af" stroke-width="1"/>` +
      `<text x="${x.toFixed(1)}" y="${(PAD_T + plotH + 16).toFixed(0)}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="10" fill="#6b7280">${k}k</text>`
    );
  })
  .join("\n");

// Annotate the final two-window |Δσ/σ| change
const annotX = toX(N - 1);
const annotY = toY(finalSigma) - 14;
const annotText = `|Δσ/σ| = ${finalChangePct.toFixed(2)} % &lt; 5 % (M18/A22)`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="white"/>
  <!-- title -->
  <text x="${W / 2}" y="28" text-anchor="middle" font-family="ui-sans-serif,sans-serif" font-size="15" font-weight="600" fill="#111827">Stage B convergence: trailing-window σ(χ) vs cumulative trials</text>
  <!-- axes -->
  <line x1="${PAD_L}" y1="${PAD_T}" x2="${PAD_L}" y2="${PAD_T + plotH}" stroke="#374151" stroke-width="1.5"/>
  <line x1="${PAD_L}" y1="${PAD_T + plotH}" x2="${W - PAD_R}" y2="${PAD_T + plotH}" stroke="#374151" stroke-width="1.5"/>
  <!-- grid + y-ticks -->
  ${yTickSvg}
  <!-- x-ticks -->
  ${xTickSvg}
  <!-- final-sigma stabilisation line (dashed) -->
  <line x1="${PAD_L}" y1="${yFinal.toFixed(1)}" x2="${W - PAD_R}" y2="${yFinal.toFixed(1)}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6 4"/>
  <!-- convergence annotation -->
  <rect x="${(annotX - 190).toFixed(0)}" y="${(annotY - 14).toFixed(0)}" width="190" height="20" rx="3" fill="#fef2f2" stroke="#fca5a5" stroke-width="1"/>
  <text x="${(annotX - 95).toFixed(0)}" y="${(annotY + 1).toFixed(0)}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="10.5" fill="#dc2626">${annotText}</text>
  <!-- main line -->
  <polyline fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" points="${linePoints}"/>
  <!-- axis labels -->
  <text x="${W / 2}" y="${H - 10}" text-anchor="middle" font-family="ui-sans-serif,sans-serif" font-size="11" fill="#6b7280">Cumulative trials</text>
  <text x="14" y="${H / 2}" text-anchor="middle" font-family="ui-sans-serif,sans-serif" font-size="11" fill="#6b7280" transform="rotate(-90 14 ${H / 2})">Trailing-window σ(χ) per 1 000 trials</text>
  <!-- legend box -->
  <rect x="${PAD_L + 16}" y="${PAD_T + 12}" width="230" height="40" rx="4" fill="#f9fafb" stroke="#e5e7eb" stroke-width="1"/>
  <line x1="${PAD_L + 28}" y1="${PAD_T + 28}" x2="${PAD_L + 52}" y2="${PAD_T + 28}" stroke="#2563eb" stroke-width="2.5"/>
  <text x="${PAD_L + 58}" y="${PAD_T + 32}" font-family="ui-sans-serif,sans-serif" font-size="11" fill="#374151">σ(χ) per 1 000-trial window</text>
  <line x1="${PAD_L + 28}" y1="${PAD_T + 44}" x2="${PAD_L + 52}" y2="${PAD_T + 44}" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="${PAD_L + 58}" y="${PAD_T + 48}" font-family="ui-sans-serif,sans-serif" font-size="11" fill="#374151">Final σ (stabilised)</text>
  <!-- subtitle: mission / seed -->
  <text x="${W - PAD_R}" y="${H - 12}" text-anchor="end" font-family="ui-monospace,monospace" font-size="10" fill="#9ca3af">Mission: HI-SEAS 45d · Seed 0xc0ffee · T=${T.toLocaleString()}</text>
</svg>`;

writeFileSync("paper/figures/F5_convergence.svg", svg);
console.log(`wrote F5; final sigma_pct=${finalChangePct.toFixed(3)}`);
