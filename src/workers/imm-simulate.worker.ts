// src/workers/imm-simulate.worker.ts
// T33: Web Worker wrapper for simulateIMM — protects the UI thread from long Monte Carlo runs.
//
// Usage (from the React app):
//   const worker = new Worker(new URL('./imm-simulate.worker.ts', import.meta.url), { type: 'module' });
//   worker.postMessage({ crew, mission, kit, trials, seed });
//   worker.onmessage = (e) => {
//     if (e.data.ok) console.log(e.data.result);
//     else console.error(e.data.error);
//   };
//
// Vite bundles this file automatically when imported via the `new Worker(new URL(...))` pattern.
// No Comlink dependency — keeps deps minimal.

import { simulateIMM } from "../imm/simulate";

self.addEventListener("message", (e: MessageEvent) => {
  try {
    const result = simulateIMM(e.data);
    self.postMessage({ ok: true, result });
  } catch (err) {
    self.postMessage({ ok: false, error: (err as Error).message });
  }
});
