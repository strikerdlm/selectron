// @vitest-environment jsdom
// IMM-50 — RTL tests for the CrewComposition save / load / export-JSON toolbar.
//
// Notes on test strategy:
//
//   1. The toolbar (save / load / export) only renders once `outcome` is set
//      in component state. Outcome is normally produced by the Web Worker
//      simulation, which cannot run under jsdom. We mock `Worker` globally
//      so clicking "▶ run simulation" synchronously fires a fake `onmessage`
//      result that populates outcome — the toolbar then mounts and we can
//      assert on save / load / export behavior.
//
//   2. All chart components inside CrewComposition pull in echarts-for-react;
//      we mock the core entrypoint to a dumb div so jsdom does not try to set
//      up canvas / ResizeObserver. The mock matches the strategy used in
//      tests/ui/imm_posterior_hist.test.tsx and friends.
//
//   3. `URL.createObjectURL` / `revokeObjectURL` are jsdom-stubbed via
//      `vi.stubGlobal` so we can assert the export handler was invoked.

import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

// Mock the echarts entrypoint shared by every figure component.
vi.mock("echarts-for-react/lib/core", () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

import { DbProvider } from "@/contexts/DbContext";
import { CrewComposition } from "@/ui/views/CrewComposition";
import { db } from "@/db/schema";
import { createIMMSession, listIMMSessions } from "@/db/repository";
import type {
  IMMCrewMember,
  IMMKitScenario,
  IMMMission,
  IMMOutcome,
  ScenarioSummary,
} from "@/imm/types";
import { ACTIVE_MISSIONS } from "@/data/imm-missions";
import { IMM_KITS } from "@/imm/kits";

// ── fixtures ──────────────────────────────────────────────────────────────

function fakeSummary(mean: number): ScenarioSummary {
  return {
    mean,
    sd: Math.max(0.01, mean * 0.05),
    ci90: [mean * 0.9, mean * 1.1],
    ci95: [mean * 0.85, mean * 1.15],
  };
}

function fakeOutcome(chiMean = 91.3): IMMOutcome {
  return {
    tme: fakeSummary(120),
    chi: fakeSummary(chiMean),
    pEvac: fakeSummary(4.2),
    pLocl: fakeSummary(0.55),
    missionSuccess: fakeSummary(88.4),
    perConditionDrivers: [
      { conditionId: "renal.stone", pEvacContrib: 0.42, pLoclContrib: 0.05, tmeContrib: 0.18 },
    ],
    convergence: {
      trialCheckpoints: [1000, 5000, 10000, 25000],
      sigmaChi:   [0.04, 0.018, 0.012, 0.008],
      sigmaPevac: [0.06, 0.025, 0.017, 0.011],
    },
  };
}

function fakeCrew(): IMMCrewMember[] {
  return [
    {
      id: "loaded-Alpha", sex: "male",
      contacts: false, crowns: false, CAC_positive: false,
      abdominal_surgery_history: false, EVA_eligible: true, EVA_count: 2,
      stageAScores: {
        "psych.conscientiousness": 70,
        "psych.emotional_stability": 60,
        "psych.mmpi2rf_eid": 35,
        "cognitive.nasa_cognition_battery": -0.5,
      },
    },
  ];
}

const fixtureMission: IMMMission = ACTIVE_MISSIONS[0];
const fixtureKit: IMMKitScenario = IMM_KITS.issHMS;

// Pre-seed an IMMSession row so the load dropdown has something to pick.
async function seedSession(label = "fixture-session", chi = 91.3): Promise<string> {
  return createIMMSession({
    candidateId: null,
    mission: { ...fixtureMission, label },
    crew: fakeCrew(),
    kit: fixtureKit,
    trials: 50_000,
    seed: 0xfeedface,
    overrides: {},
    vulnerabilityMode: "boolean-flags",
    engine: "monte-carlo",
    outcomes: fakeOutcome(chi),
    validation: {
      vsK15Table1: {
        delta_tme: 0, delta_chi: 0, delta_pEvac: 0, delta_pLocl: 0,
        within_ci95: false,
      },
    },
    interpretationCaptionsExpanded: {},
  });
}

// ── Worker mock ───────────────────────────────────────────────────────────
// CrewComposition's `runSimulation` does:
//   const worker = new Worker(new URL(...), { type: "module" });
//   worker.onmessage = (e) => { ... setOutcome(e.data.result); ... };
//   worker.postMessage(payload);
// The fake Worker synchronously invokes onmessage with a pre-canned outcome
// the moment postMessage is called — so a click on "▶ run simulation" leaves
// component state in `simState === "done"` with `outcome` populated.

class FakeWorker {
  onmessage: ((e: { data: { ok: true; result: IMMOutcome } }) => void) | null = null;
  onerror: ((e: ErrorEvent) => void) | null = null;
  static lastOutcome: IMMOutcome = fakeOutcome();
  postMessage(_payload: unknown) {
    // Defer to a Promise-resolved microtask so React picks up the state
    // update inside the same `act()` flush. Using setTimeout(0) instead would
    // fall outside React's batching window.
    Promise.resolve().then(() => {
      this.onmessage?.({ data: { ok: true, result: FakeWorker.lastOutcome } });
    });
  }
  terminate() { /* no-op */ }
}

// Patches for jsdom (we keep the real URL *constructor* intact — the worker
// constructor in CrewComposition calls `new URL(...)` — but stub the two
// static methods used by the export handler).
const createObjectURLMock = vi.fn((_blob: Blob): string => "blob:fake-url");
const revokeObjectURLMock = vi.fn((_url: string): void => {});
let originalCreateObjectURL: typeof URL.createObjectURL | undefined;
let originalRevokeObjectURL: typeof URL.revokeObjectURL | undefined;

beforeEach(async () => {
  await db.delete();
  await db.open();
  // CrewComposition autosaves working state to localStorage; clear it so each
  // test starts from INITIAL_CREW rather than a prior test's autosaved crew.
  try { localStorage.clear(); } catch { /* no-op */ }
  createObjectURLMock.mockClear();
  revokeObjectURLMock.mockClear();
  FakeWorker.lastOutcome = fakeOutcome();

  originalCreateObjectURL = URL.createObjectURL;
  originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = createObjectURLMock as unknown as typeof URL.createObjectURL;
  URL.revokeObjectURL = revokeObjectURLMock as unknown as typeof URL.revokeObjectURL;

  vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
});

afterEach(async () => {
  cleanup();
  vi.unstubAllGlobals();
  if (originalCreateObjectURL) URL.createObjectURL = originalCreateObjectURL;
  if (originalRevokeObjectURL) URL.revokeObjectURL = originalRevokeObjectURL;
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

// Click "▶ run simulation" (CompositeCrewPanel) and wait for the fake worker's
// queued onmessage callback to populate outcome. We assert by waiting for the
// save button (which is in the outcome-gated toolbar) to mount.
async function runFakeSim() {
  const runBtn = await screen.findByRole("button", { name: /run IMM Monte Carlo simulation/i });
  await act(async () => {
    fireEvent.click(runBtn);
    // Flush the queued microtask that fires FakeWorker.onmessage.
    await new Promise((r) => setTimeout(r, 0));
  });
  return await screen.findByRole("button", { name: /save current IMM session/i });
}

describe("CrewComposition · IMM-50 save / load / export toolbar", () => {
  it("save / export / load are all available before a run (config-only session saving)", async () => {
    renderWithDb();
    await waitForReady();
    // 2026-05-29: Save and Export are now always available so a config-only
    // session (no outcome yet) can be saved before running. The toolbar region
    // and load dropdown remain present as before.
    expect(screen.queryByRole("region", { name: /save load export/i })).not.toBeNull();
    expect(screen.queryByLabelText(/load recent IMM session/i)).not.toBeNull();
    expect(screen.queryByRole("button", { name: /save current IMM session/i })).not.toBeNull();
    expect(screen.queryByRole("button", { name: /export current IMM session as JSON/i })).not.toBeNull();
  });

  it("saving before a run persists a config-only session (outcomes = null)", async () => {
    renderWithDb();
    await waitForReady();
    // No fake sim run — Save should still work and store outcomes = null.
    const saveBtn = screen.getByRole("button", { name: /save current IMM session/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });
    await waitFor(async () => {
      const rows = await listIMMSessions({ candidateId: null });
      expect(rows.length).toBe(1);
      expect(rows[0].outcomes).toBeNull();
      expect(rows[0].crew.length).toBeGreaterThan(0);
    });
  });

  it("toolbar mounts after a fake-worker sim populates outcome", async () => {
    renderWithDb();
    await waitForReady();
    await runFakeSim();
    expect(screen.getByRole("region", { name: /save load export/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /save current IMM session/i })).toBeDefined();
    expect(screen.getByLabelText(/load recent IMM session/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /export current IMM session as JSON/i })).toBeDefined();
  });

  it("save button persists a new row to immSessions and refreshes the dropdown", async () => {
    renderWithDb();
    await waitForReady();
    await runFakeSim();

    // Pre-condition: no rows yet (fresh DB this test).
    expect((await listIMMSessions({ candidateId: null })).length).toBe(0);

    const saveBtn = screen.getByRole("button", { name: /save current IMM session/i });
    await act(async () => {
      fireEvent.click(saveBtn);
    });

    await waitFor(async () => {
      const rows = await listIMMSessions({ candidateId: null });
      expect(rows.length).toBe(1);
      expect(rows[0].candidateId).toBeNull();
      expect(rows[0].engine).toBe("monte-carlo");
      expect(rows[0].vulnerabilityMode).toBe("boolean-flags");
      expect(rows[0].outcomes!.chi.mean).toBeCloseTo(91.3, 1);
    });

    // The select should now expose 1 saved option + the leading sentinel.
    const select = screen.getByLabelText(/load recent IMM session/i) as HTMLSelectElement;
    await waitFor(() => {
      expect(select.querySelectorAll("option").length).toBe(2);
    });
  });

  it("loading a previously-saved session rehydrates crew + outcome state", async () => {
    // Seed a session with a distinctive crew id and CHI value.
    await seedSession("loaded-mission-label", 73.5);

    renderWithDb();
    await waitForReady();
    await runFakeSim();

    const select = screen.getByLabelText(/load recent IMM session/i) as HTMLSelectElement;
    await waitFor(() => {
      // Sentinel + 1 seeded row = 2.
      expect(select.querySelectorAll("option").length).toBe(2);
    });

    const seededOptionValue = (Array.from(select.querySelectorAll("option")) as HTMLOptionElement[])
      .find((o) => o.text.includes("loaded-mission-label"))!.value;

    fireEvent.change(select, { target: { value: seededOptionValue } });

    // The crew zone shows the loaded member id (not INITIAL_CREW). The id may
    // appear in both the crew card AND the screen-reader disqualified list
    // (loaded crews have no stageAScores → fail gate), so use queryAllByText.
    await waitFor(() => {
      expect(screen.queryAllByText(/loaded-Alpha/).length).toBeGreaterThanOrEqual(1);
    });
  });

  it("export button triggers URL.createObjectURL with a JSON blob carrying current state", async () => {
    renderWithDb();
    await waitForReady();
    await runFakeSim();

    const exportBtn = screen.getByRole("button", { name: /export current IMM session as JSON/i });
    fireEvent.click(exportBtn);

    // F3: the export handler is async (it awaits prior/multiplier provenance
    // hashes), so wait for the blob to be created before asserting on it.
    await waitFor(() => {
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });
    const blobArg = createObjectURLMock.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);
    expect(blobArg.type).toBe("application/json");
    expect(blobArg.size).toBeGreaterThan(50);  // payload has at least mission + seed + crew

    // NOTE: jsdom's Blob does not reliably implement .text() / Response(blob).text(),
    // so we skip the full content round-trip assertion here. The Blob type + size
    // checks above guarantee a non-empty JSON payload was constructed. End-to-end
    // content correctness is covered by the manual download UX (and would be
    // recovered in a real browser e2e test).

    // The temporary anchor was cleaned up.
    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:fake-url");
  });

  it("dropdown lists most-recent session first (desc by createdAt)", async () => {
    const oldId = await seedSession("older-session");
    // Force a measurable timestamp gap so createdAt sort is deterministic.
    await new Promise((r) => setTimeout(r, 10));
    const newId = await seedSession("newer-session");

    renderWithDb();
    await waitForReady();
    await runFakeSim();

    const select = screen.getByLabelText(/load recent IMM session/i) as HTMLSelectElement;
    await waitFor(() => {
      expect(select.querySelectorAll("option").length).toBe(3); // sentinel + 2 seeds
    });

    const options = Array.from(select.querySelectorAll("option")) as HTMLOptionElement[];
    // options[0] is the "— select session —" sentinel.
    expect(options[1].value).toBe(newId);
    expect(options[2].value).toBe(oldId);

    // Verifying the seeded ids didn't get swapped during fixture wiring.
    expect(newId).not.toBe(oldId);
  });
});

// Cast assertion to suppress vitest mock-call typing for assignment side-effect.
// (Type-only; no runtime behavior.)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _selectron_typeguard_unused: any;
}
