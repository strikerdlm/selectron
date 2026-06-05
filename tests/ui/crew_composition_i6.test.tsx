// @vitest-environment jsdom
// I6 (2026-06-04) — RTL tests for the analog Bayesian MCMC posterior panel wired
// into the CrewComposition view.
//
// Test strategy (mirrors tests/ui/imm_session_save_load.test.tsx, the blessed
// CrewComposition-rendering harness):
//
//   1. The I6 panel lives inside the `{outcome && (...)}` figures region, so we
//      must drive a main Monte Carlo run to populate `outcome`. We click
//      "▶ run IMM Monte Carlo simulation" with a stubbed global Worker — same as
//      the save/load suite. The stubbed worker also handles the posterior-predictive
//      message (mode "posterior-predictive").
//
//   2. The global Worker is shared by THREE call sites in the view: the debounced
//      preview, the main run, and the I6 posterior-predictive sweep. The fake
//      branches on `payload.mode`: it replies with a canned PosteriorPredictiveOutcome
//      for "posterior-predictive" payloads (and captures the payload so we can assert
//      the snake_case → engine posterior map), and with a canned IMMOutcome for the
//      legacy preview/main payloads.
//
//   3. The I6 effect is debounced 400 ms, so we use REAL timers and `findBy*`
//      (which yields the event loop) to let the timer fire, the mocked fetch
//      resolve, and the worker reply — rather than fake timers (which fight
//      RTL's microtask-based worker replies).
//
//   4. @/api/calibration is mocked with importActual so SelectronApiError and the
//      other API exports stay intact; only getPosteriorDraws is stubbed to a small
//      canned response (2 conditions × 8 λ, kind "antarctic-station", n_draws 8).
//
//   5. localStorage is seeded under the view's PERSIST_KEY ("selectron:crew-state:v1")
//      with an antarctic-station mission + 2 members so the POSTERIOR_KINDS gate passes.

import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

// Mock the echarts entrypoint shared by every figure component (jsdom has no canvas).
vi.mock("echarts-for-react/lib/core", () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

// Mock only getPosteriorDraws; keep the rest of the API client intact.
// `vi.hoisted` makes the mock fn available inside the hoisted vi.mock factory.
const { getPosteriorDrawsMock } = vi.hoisted(() => ({ getPosteriorDrawsMock: vi.fn() }));
vi.mock("@/api/calibration", async (importActual) => {
  const actual = await importActual<typeof import("@/api/calibration")>();
  return { ...actual, getPosteriorDraws: getPosteriorDrawsMock };
});

import { DbProvider } from "@/contexts/DbContext";
import { CrewComposition } from "@/ui/views/CrewComposition";
import { db } from "@/db/schema";
import { IMM_MISSIONS } from "@/data/imm-missions";
import type {
  IMMCrewMember,
  IMMOutcome,
  PosteriorPredictiveOutcome,
  PosteriorSummary,
} from "@/imm/types";
import type { PosteriorDrawsResponse } from "@/api/calibration";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";

const PERSIST_KEY = "selectron:crew-state:v1";

// ── fixtures ────────────────────────────────────────────────────────────────

function summary(mean: number): PosteriorSummary {
  return {
    mean,
    sd: Math.max(0.01, mean * 0.05),
    ci90: [mean * 0.9, mean * 1.1],
    ci95: [mean * 0.85, mean * 1.15],
  };
}

function fakeOutcome(): IMMOutcome {
  return {
    tme: summary(120),
    chi: summary(91.3),
    pEvac: summary(4.2),
    pLocl: summary(0.55),
    missionSuccess: summary(88.4),
    perConditionDrivers: [
      { conditionId: "altitude-sickness", pEvacContrib: 0.4, pLoclContrib: 0.05, tmeContrib: 0.18 },
    ],
    convergence: {
      trialCheckpoints: [1000, 5000, 10000, 25000],
      sigmaChi: [0.04, 0.018, 0.012, 0.008],
      sigmaPevac: [0.06, 0.025, 0.017, 0.011],
    },
  };
}

// Canned posterior-predictive outcome the fake pp worker returns.
const PP_OUTCOME: PosteriorPredictiveOutcome = {
  pEvacPost: summary(5.1),
  pLoclPost: summary(0.6),
  chiPost: summary(89.7),
  perConditionTmeContribPost: {
    "altitude-sickness": summary(0.42),
    "respiratory-infection": summary(0.13),
  },
  nDraws: 8,
  trialsPerDraw: 200,
};

// Canned /posterior/draws response — 2 conditions × 8 λ each, n_draws 8 so
// nDraws = min(64, 8) = 8 and each lambdas[] (length 8) satisfies length >= 8.
function cannedDrawsResponse(): PosteriorDrawsResponse {
  return {
    draws: [
      { condition_id: "altitude-sickness", lambdas: [0.01, 0.012, 0.011, 0.013, 0.009, 0.014, 0.01, 0.012] },
      { condition_id: "respiratory-infection", lambdas: [0.02, 0.022, 0.019, 0.021, 0.023, 0.018, 0.02, 0.021] },
    ],
    n_draws: 8,
    seed: 0xc0ffee,
    kind: "antarctic-station",
  };
}

// Gate-passing crew member with the placeholder Stage A scores.
function makeMember(id: string, fraction: number): IMMCrewMember {
  const scores: Record<string, number> = {};
  for (const c of PLACEHOLDER_CRITERIA) {
    if (c.id === "psych.mmpi2rf_eid") scores[c.id] = 35;
    else if (c.id === "cognitive.nasa_cognition_battery")
      scores[c.id] = Math.max(-1.5, c.scale.min + fraction * (c.scale.max - c.scale.min));
    else scores[c.id] = c.scale.min + fraction * (c.scale.max - c.scale.min);
  }
  return {
    id, sex: "male",
    contacts: false, crowns: false, CAC_positive: false,
    abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2,
    stageAScores: scores,
  };
}

// Seed the persisted crew state with the given mission so the view boots into it.
function seedPersistedState(missionId: string): void {
  const mission = IMM_MISSIONS.find((m) => m.id === missionId)!;
  localStorage.setItem(
    PERSIST_KEY,
    JSON.stringify({
      members: [makeMember("Alpha", 0.8), makeMember("Bravo", 0.7)],
      mission,
      kitScenarioId: "issHMS",
      trials: 50_000,
      seed: 0xc0ffee,
      aggregator: "worst-link",
      chiStar: 0.7,
    }),
  );
}

// ── Worker mock (branches on mode) ──────────────────────────────────────────
// CrewComposition constructs a worker for the preview, the main run, and the I6
// posterior-predictive sweep — all via the same global `Worker`. We branch on
// `payload.mode`: posterior-predictive replies with PP_OUTCOME (and captures the
// payload); everything else (preview/main legacy payloads) replies with an IMMOutcome.

interface PpPayload {
  mode: "posterior-predictive";
  opts: { posterior: Record<string, number[]>; nDraws: number; trialsPerDraw: number; seed: number };
}

class FakeWorker {
  onmessage: ((e: { data: { ok: true; result: unknown } }) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  static lastPpPayload: PpPayload | null = null;
  postMessage(payload: unknown) {
    const p = payload as { mode?: string };
    if (p && p.mode === "posterior-predictive") {
      FakeWorker.lastPpPayload = payload as PpPayload;
      Promise.resolve().then(() => {
        this.onmessage?.({ data: { ok: true, result: PP_OUTCOME } });
      });
      return;
    }
    // Legacy preview / main run payload → IMMOutcome.
    Promise.resolve().then(() => {
      this.onmessage?.({ data: { ok: true, result: fakeOutcome() } });
    });
  }
  terminate() { /* no-op */ }
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  try { localStorage.clear(); } catch { /* no-op */ }
  getPosteriorDrawsMock.mockReset();
  getPosteriorDrawsMock.mockResolvedValue(cannedDrawsResponse());
  FakeWorker.lastPpPayload = null;
  vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
});

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  await db.delete();
});

function renderWithDb() {
  return render(
    <DbProvider>
      <CrewComposition />
    </DbProvider>,
  );
}

async function waitForReady() {
  return await screen.findByRole("heading", { name: /crew composition/i });
}

// Drive the main run so `outcome` is populated and the figures region mounts.
async function runMainSim() {
  const runBtn = await screen.findByRole("button", { name: /run IMM Monte Carlo simulation/i });
  await act(async () => {
    fireEvent.click(runBtn);
    await new Promise((r) => setTimeout(r, 0)); // flush the microtask worker reply
  });
}

describe("CrewComposition · I6 analog Bayesian MCMC posterior", () => {
  it("antarctic mission: fetches posterior draws, threads the snake_case map into the worker, and renders the I6 panel", async () => {
    seedPersistedState("antarctic-winter"); // kind antarctic-station
    renderWithDb();
    await waitForReady();
    await runMainSim();

    // (1) getPosteriorDraws is called with the antarctic kind.
    await vi.waitFor(() => {
      expect(getPosteriorDrawsMock).toHaveBeenCalled();
    });
    const callArg = getPosteriorDrawsMock.mock.calls[0][0];
    expect(callArg.kind).toBe("antarctic-station");

    // (3) The I6 panel mounts and the figure's pp-pEvac card renders. findBy
    // yields the event loop so the 400 ms debounce fires, the mocked fetch
    // resolves, and the pp worker replies — all under the 2 s timeout.
    const panel = await screen.findByTestId("imm-i6-posterior", undefined, { timeout: 3000 });
    expect(panel).toBeDefined();
    expect(await screen.findByTestId("pp-pEvac", undefined, { timeout: 3000 })).toBeDefined();

    // (2) THE regression that matters: the pp worker payload carries the posterior
    // map with BOTH condition ids mapped from snake_case (draws reach the wrapper).
    const pp = FakeWorker.lastPpPayload!;
    expect(pp).not.toBeNull();
    expect(pp.mode).toBe("posterior-predictive");
    expect(Object.keys(pp.opts.posterior).sort()).toEqual([
      "altitude-sickness",
      "respiratory-infection",
    ]);
    expect(pp.opts.posterior["altitude-sickness"]).toHaveLength(8);
    expect(pp.opts.posterior["respiratory-infection"]).toHaveLength(8);
    expect(pp.opts.nDraws).toBe(8); // min(64, n_draws=8)
  });

  it("leo-iss mission: never fetches posterior draws and renders no I6 panel", async () => {
    seedPersistedState("iss-6mo"); // kind leo-iss — not in POSTERIOR_KINDS
    renderWithDb();
    await waitForReady();
    await runMainSim();

    // Wait past the 400 ms debounce window to prove the fetch was never scheduled
    // (the gate's early-return happens before the timer is set, so a 0 ms wait
    // would pass even on a regression).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 500));
    });

    expect(getPosteriorDrawsMock).not.toHaveBeenCalled();
    expect(screen.queryByTestId("imm-i6-posterior")).toBeNull();
  });
});
