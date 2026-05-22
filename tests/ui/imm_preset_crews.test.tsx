// @vitest-environment jsdom
// IMM-49 — RTL tests for the CrewComposition quick-load preset crews dropdown.
//
// Strategy mirrors tests/ui/imm_session_save_load.test.tsx:
//   - Mock echarts entrypoint so jsdom does not try to set up canvas.
//   - Use DbProvider + fake-indexeddb/auto so CrewComposition's useDb() asserts pass.
//   - Never click "Run simulation" — the Web Worker cannot run under jsdom.
//   - For the outcome-cleared assertion we pre-seed an IMMSession row and load
//     it through the IMM-50 toolbar so `outcome` is populated; then we select a
//     preset and confirm the outcome-only region ("IMM simulation figures")
//     disappears from the DOM.

import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("echarts-for-react/lib/core", () => ({
  default: () => <div data-testid="echarts-mock" />,
}));

import { DbProvider } from "@/contexts/DbContext";
import { CrewComposition } from "@/ui/views/CrewComposition";
import { db } from "@/db/schema";
import { createIMMSession } from "@/db/repository";
import { PRESET_CREWS } from "@/data/imm-preset-crews";
import type {
  IMMCrewMember,
  IMMKitScenario,
  IMMMission,
  IMMOutcome,
  PosteriorSummary,
} from "@/imm/types";
import { ACTIVE_MISSIONS } from "@/data/imm-missions";
import { IMM_KITS } from "@/imm/kits";

// ── fixtures ────────────────────────────────────────────────────────────────

function fakeSummary(mean: number): PosteriorSummary {
  return {
    mean,
    sd: Math.max(0.01, mean * 0.05),
    ci90: [mean * 0.9, mean * 1.1],
    ci95: [mean * 0.85, mean * 1.15],
  };
}

function fakeOutcome(): IMMOutcome {
  return {
    tme: fakeSummary(120),
    chi: fakeSummary(91.3),
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
      id: "pre-load-Alpha", sex: "male",
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

async function seedSession(label = "preset-test-seed"): Promise<string> {
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
    outcomes: fakeOutcome(),
    validation: {
      vsK15Table1: {
        delta_tme: 0, delta_chi: 0, delta_pEvac: 0, delta_pLocl: 0,
        within_ci95: false,
      },
    },
    laypersonCaptionsExpanded: {},
  });
}

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(async () => {
  cleanup();
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

// ── tests ───────────────────────────────────────────────────────────────────

describe("CrewComposition · IMM-49 preset crew dropdown", () => {
  it("(a) dropdown renders with the 4 preset options + sentinel", async () => {
    renderWithDb();
    await waitForReady();

    const select = await screen.findByLabelText(/load preset crew configuration/i) as HTMLSelectElement;
    // sentinel + 4 presets = 5 options total
    expect(select.querySelectorAll("option").length).toBe(5);
    expect(select.querySelector("option[value='k15-reference']")).not.toBeNull();
    expect(select.querySelector("option[value='mdrs-rotation']")).not.toBeNull();
    expect(select.querySelector("option[value='hi-seas-6mo']")).not.toBeNull();
    expect(select.querySelector("option[value='antarctic-winter']")).not.toBeNull();
    // sentinel default is the empty string
    expect(select.value).toBe("");
  });

  it("(b) selecting k15-reference loads exactly 6 members", async () => {
    renderWithDb();
    await waitForReady();
    const select = await screen.findByLabelText(/load preset crew configuration/i) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "k15-reference" } });

    // CrewComposition renders one CrewMemberCard per member, each labelled by
    // member.id — preset-k15-1..6 should now be in the DOM. (Note: id may also
    // appear in the screen-reader disqualified-list since preset crews have
    // no stageAScores → all fail gate; use queryAllByText.)
    await waitFor(() => {
      for (let i = 1; i <= 6; i++) {
        expect(screen.queryAllByText(new RegExp(`preset-k15-${i}\\b`)).length).toBeGreaterThanOrEqual(1);
      }
    });
    // Sanity: the default INITIAL_CREW ids (Alpha…Foxtrot) should be gone.
    expect(screen.queryByText(/\bAlpha\b/)).toBeNull();
  });

  it("(c) selecting mdrs-rotation loads 6 members with all-low-risk flags", async () => {
    renderWithDb();
    await waitForReady();
    const select = await screen.findByLabelText(/load preset crew configuration/i) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "mdrs-rotation" } });

    await waitFor(() => {
      for (let i = 1; i <= 6; i++) {
        expect(screen.queryAllByText(new RegExp(`preset-mdrs-${i}\\b`)).length).toBeGreaterThanOrEqual(1);
      }
    });

    // Cross-check the data file: every MDRS member must have all risk flags
    // false (low-risk profile) — this is the contract the IMM-49 spec asks for.
    const mdrs = PRESET_CREWS["mdrs-rotation"].members;
    expect(mdrs.length).toBe(6);
    for (const m of mdrs) {
      expect(m.contacts).toBe(false);
      expect(m.crowns).toBe(false);
      expect(m.CAC_positive).toBe(false);
      expect(m.abdominal_surgery_history).toBe(false);
    }
  });

  it("(d) selecting antarctic-winter loads 12 members", async () => {
    renderWithDb();
    await waitForReady();
    const select = await screen.findByLabelText(/load preset crew configuration/i) as HTMLSelectElement;

    fireEvent.change(select, { target: { value: "antarctic-winter" } });

    await waitFor(() => {
      for (let i = 1; i <= 12; i++) {
        expect(screen.queryAllByText(new RegExp(`preset-antarctic-${i}\\b`)).length).toBeGreaterThanOrEqual(1);
      }
    });

    // Cross-check the data file: 12 members, 8M / 4F per the spec.
    const ant = PRESET_CREWS["antarctic-winter"].members;
    expect(ant.length).toBe(12);
    expect(ant.filter((m) => m.sex === "male").length).toBe(8);
    expect(ant.filter((m) => m.sex === "female").length).toBe(4);
  });

  it("(e) loading a preset clears a previously-loaded outcome", async () => {
    // Pre-seed an outcome via the IMM-50 load path so we don't need to run
    // the Web Worker. Once loaded, the "IMM simulation figures" region exists.
    const sessionId = await seedSession("for-preset-clear");
    renderWithDb();
    await waitForReady();

    const sessionSelect = await screen.findByLabelText(/load recent IMM session/i) as HTMLSelectElement;
    await waitFor(() => {
      expect(sessionSelect.querySelectorAll("option").length).toBeGreaterThan(1);
    });
    fireEvent.change(sessionSelect, { target: { value: sessionId } });

    // Outcome-only region present at this point.
    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /IMM simulation figures/i })).not.toBeNull();
    });

    // Now select a preset — outcome should be cleared and the figures region
    // should disappear from the DOM.
    const presetSelect = await screen.findByLabelText(/load preset crew configuration/i) as HTMLSelectElement;
    fireEvent.change(presetSelect, { target: { value: "hi-seas-6mo" } });

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /IMM simulation figures/i })).toBeNull();
    });
    // And the new preset is loaded. Member id may appear in both crew card and
    // screen-reader disqualified list (preset members lack stageAScores).
    expect(screen.queryAllByText(/preset-hi-seas-1\b/).length).toBeGreaterThanOrEqual(1);
  });
});
