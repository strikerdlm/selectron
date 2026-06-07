// src/workers/imm-simulate.worker.ts
// T33: Web Worker wrapper for simulateIMM — protects the UI thread from long Monte Carlo runs.
//
// Two backward-compatible modes, distinguished by the message payload:
//
//   1. Default (point-estimate Monte Carlo) — the original contract. Post the
//      simulateIMM options directly; the worker runs `simulateIMM(e.data)`:
//        const worker = new Worker(new URL('./imm-simulate.worker.ts', import.meta.url), { type: 'module' });
//        worker.postMessage({ crew, mission, kit, trials, seed });
//
//   2. Posterior-predictive (I6, 2026-06-04) — when `e.data.mode === "posterior-predictive"`,
//      the worker runs `posteriorPredictiveSimulateIMM(e.data.opts)`. This offloads the
//      ~thousands of Monte Carlo trials of the posterior-predictive sweep off the main
//      thread, same as the point-estimate run:
//        worker.postMessage({ mode: "posterior-predictive", opts: { crew, mission, kit, posterior, nDraws, trialsPerDraw, seed, kindMultipliers } });
//
// Both modes reply with `{ ok: true, result }` on success or `{ ok: false, error }` on throw.
//
// Vite bundles this file automatically when imported via the `new Worker(new URL(...))` pattern.
// No Comlink dependency — keeps deps minimal.

import { simulateIMM } from "../imm/simulate";
import { posteriorPredictiveSimulateIMM } from "../imm/posterior-predictive";

self.addEventListener("message", (e: MessageEvent) => {
  try {
    if (e.data && e.data.mode === "posterior-predictive") {
      const result = posteriorPredictiveSimulateIMM(e.data.opts);
      self.postMessage({ ok: true, result });
      return;
    }
    const result = simulateIMM(e.data);
    self.postMessage({ ok: true, result });
  } catch (err) {
    self.postMessage({ ok: false, error: (err as Error).message });
  }
});
