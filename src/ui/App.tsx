import { useEffect, useMemo, useRef, useState } from "react";
import { PLACEHOLDER_CRITERIA } from "@/data/placeholder-criteria";
import { ANALOG_MISSIONS } from "@/data/analog-missions";
import { ANALOG_CONDITIONS } from "@/risk/conditions";
import { SYNTHETIC_PRIORS, synthesizeCrew } from "@/data/synthetic-iter3";
import { simulateMission, type RiskPosteriorWithDiagnostics } from "@/risk/simulate";
import { scoreCandidate, generateCandidate } from "@/engine";
import { CriterionInput } from "./components/CriterionInput";
import { ScoreCard } from "./components/ScoreCard";
import { PosteriorPlot } from "./components/PosteriorPlot";
import { MissionPicker } from "./components/MissionPicker";
import { RiskCard } from "./components/RiskCard";
import { ConditionContribution } from "./components/ConditionContribution";
import { RiskHistogram } from "./components/RiskHistogram";
import type { AnalogMission } from "@/types/risk";

const SEED_DEMO = 42;
const SEED_SAMPLER = 0xc0ffee;
const ITERATIONS = 5000;
// Spec/plan literal was 100,000 (Task 57 step 2). Reduced to 25,000 for UI
// responsiveness — at 100k the main thread freezes ~10 s per mission click
// (100k × 12 conditions × N≈6 crew ≈ 7.2 M inner iters). 25k stays well above
// the M18 σ<5% convergence threshold demonstrated by tests/risk/simulate.test.ts
// at T=2,000. Bump back to 100k by changing this constant if you want the
// V&V-grade run. Honour the plan literal at Task 59 acceptance.
const RISK_TRIALS = 25_000;

type Tab = "Selection" | "Mission risk";

function useUtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const fmtUtc = (d: Date) => d.toISOString().slice(11, 19) + "Z";
const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

function scoresEqual(a: Record<string, number> | null, b: Record<string, number> | null) {
  if (!a || !b) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) if (a[k] !== b[k]) return false;
  return true;
}

export function App() {
  const [tab, setTab] = useState<Tab>("Selection");

  // -- Stage A: Iter-1 single-candidate Bayesian MCDA -------------------------
  const initialCandidate = useMemo(
    () => generateCandidate(PLACEHOLDER_CRITERIA, SEED_DEMO, "demo"),
    [],
  );
  const [scores, setScores] = useState<Record<string, number>>(initialCandidate.scores);

  const candidate = useMemo(
    () => ({ ...initialCandidate, scores }),
    [initialCandidate, scores],
  );

  const posterior = useMemo(
    () =>
      scoreCandidate({
        candidate,
        criteria: PLACEHOLDER_CRITERIA,
        alpha: PLACEHOLDER_CRITERIA.map(() => 1),
        iterations: ITERATIONS,
        seed: SEED_SAMPLER,
      }),
    [candidate],
  );

  // -- Stage B: Iter-3 mission risk forward Monte-Carlo -----------------------
  // Live candidate goes into a ref so the sim handler reads the latest scores
  // without re-firing on every slider drag (advisor pin #1 — the 100k-trials-
  // on-slider-drag footgun).
  const liveCandidateRef = useRef(candidate);
  liveCandidateRef.current = candidate;

  const [selectedMission, setSelectedMission] = useState<AnalogMission | null>(null);
  const [riskPosterior, setRiskPosterior] = useState<RiskPosteriorWithDiagnostics | null>(null);
  const [simulatedScores, setSimulatedScores] = useState<Record<string, number> | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  function runSim(mission: AnalogMission) {
    setIsComputing(true);
    // requestAnimationFrame defers the heavy sync work one frame so the
    // "computing…" banner gets a chance to paint before the main thread
    // locks for ~1.5 s.
    requestAnimationFrame(() => {
      const liveCand = liveCandidateRef.current;
      const crew = synthesizeCrew(liveCand, mission.crewSize);
      const post = simulateMission(crew, mission, SYNTHETIC_PRIORS, ANALOG_CONDITIONS, {
        seed: SEED_SAMPLER,
        trials: RISK_TRIALS,
        diagnostics: true,
      });
      setRiskPosterior(post);
      setSimulatedScores({ ...liveCand.scores });
      setIsComputing(false);
    });
  }

  function handleMissionChange(m: AnalogMission) {
    setSelectedMission(m);
    runSim(m);
  }

  function handleRecompute() {
    if (selectedMission) runSim(selectedMission);
  }

  const stale = selectedMission != null && !scoresEqual(simulatedScores, candidate.scores);

  const utc = useUtcClock();

  return (
    <div className="min-h-screen text-ink-0">
      {/* HEADER ─────────────────────────────────────────────────────────────── */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-5">
          <div className="flex items-baseline gap-3">
            <h1 className="display text-2xl text-ink-0 tracking-tight">SELECTRON</h1>
            <span className="label text-signal">
              {tab === "Selection" ? "iter 01 · vertical slice" : "iter 03 · mission risk"}
            </span>
          </div>
          <div className="mono flex items-center gap-6 text-[11px] text-ink-2">
            <div className="flex items-center gap-2">
              <span className="signal-dot" />
              <span className="uppercase tracking-cap text-ink-1">live</span>
            </div>
            <span className="hidden sm:inline">
              <span className="text-ink-3">utc</span> {fmtUtc(utc)}
            </span>
            <span className="hidden md:inline">
              <span className="text-ink-3">build</span> {fmtDate(utc)}.bayes
            </span>
            <span className="hidden lg:inline">
              <span className="text-ink-3">seed</span> 0x{SEED_SAMPLER.toString(16)}
            </span>
          </div>
        </div>
      </header>

      {/* TAB STRIP ────────────────────────────────────────────────────────────── */}
      <nav className="border-b border-line/60">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-8">
          {(["Selection", "Mission risk"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={
                  "mono uppercase tracking-cap text-[11px] py-3 -mb-px border-b-2 transition-colors " +
                  (active
                    ? "text-ink-0 border-signal"
                    : "text-ink-3 border-transparent hover:text-ink-1")
                }
              >
                {t}
              </button>
            );
          })}
        </div>
      </nav>

      {/* SUBHEAD ─────────────────────────────────────────────────────────────── */}
      <div className="border-b border-line/60 bg-bg-1/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-baseline justify-between gap-3 px-8 py-3">
          {tab === "Selection" ? (
            <>
              <p className="text-sm text-ink-1">
                <span className="text-ink-0">Bayesian MCDA over five placeholder criteria.</span>{" "}
                <span className="text-ink-2">
                  Dirichlet weights (α = 1, uninformative). Posterior re-samples on every slider change.
                </span>
              </p>
              <p className="mono text-[10px] uppercase tracking-cap text-ink-3">
                5 criteria · {ITERATIONS.toLocaleString()} draws · in-browser sampler
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-ink-1">
                <span className="text-ink-0">Forward Monte-Carlo over analog missions.</span>{" "}
                <span className="text-ink-2">
                  4-step IMM trial loop (occurrence → severity → treatment → CHI/QTL).
                  χ* = 0.7. 12 conditions × {ANALOG_MISSIONS.length} missions.
                </span>
              </p>
              <p className="mono text-[10px] uppercase tracking-cap text-ink-3">
                {ANALOG_CONDITIONS.length} conditions · {RISK_TRIALS.toLocaleString()} trials · diagnostics on
              </p>
            </>
          )}
        </div>
      </div>

      {/* BODY ────────────────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-8 py-10">
        {tab === "Selection" ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* LEFT — posterior + score card */}
            <section className="lg:col-span-8 space-y-6 fadein">
              <PosteriorPlot posterior={posterior} />
              <ScoreCard posterior={posterior} alias={candidate.alias} />
            </section>

            {/* RIGHT — criterion stack */}
            <aside className="lg:col-span-4 fadein" style={{ animationDelay: "120ms" }}>
              <div className="panel p-6">
                <div className="mb-3 flex items-baseline justify-between">
                  <h2 className="display text-lg text-ink-0">Criteria</h2>
                  <span className="label">5 instruments</span>
                </div>
                <p className="mono mb-4 text-[10px] text-ink-3 leading-relaxed">
                  Adjust raw scores. The engine normalises to [0,1] per criterion scale
                  and re-samples the posterior under the current Dirichlet prior.
                </p>
                <div className="hairline mb-2" />
                <div>
                  {PLACEHOLDER_CRITERIA.map((c, i) => (
                    <CriterionInput
                      key={c.id}
                      index={i}
                      criterion={c}
                      value={scores[c.id]}
                      onChange={(v) => setScores((s) => ({ ...s, [c.id]: v }))}
                    />
                  ))}
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="space-y-6 fadein">
            {/* SCAFFOLD BANNER — advisor pin #2 */}
            <div className="panel p-4 border border-amber-500/40 bg-amber-500/5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="mono text-[11px] uppercase tracking-cap text-amber-300">
                  scaffold · demo priors
                </div>
                <div className="mono text-[10px] text-ink-3">
                  Phase 3A/3B pending — swap when real priors.json lands
                </div>
              </div>
              <p className="mt-2 text-sm text-ink-1">
                <span className="text-ink-0">Priors:</span> synthetic placeholder
                (<span className="mono text-ink-2">SYNTHETIC_PRIORS</span> in
                <span className="mono text-ink-2"> src/data/synthetic-iter3.ts</span>;
                Lognormal-Poisson shape matches the test fixture, NOT a calibrated PyMC fit).
                <span className="text-ink-2"> </span>
                <span className="text-ink-0">Crew:</span> N = mission.crewSize clones of the
                Selection-tab candidate (Iter-2 multi-candidate UI pending).
              </p>
            </div>

            {/* CONTROLS */}
            <div className="panel p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <h2 className="display text-lg text-ink-0">Mission</h2>
                  <p className="mono mt-1 text-[10px] text-ink-3">
                    Choose an analog mission to simulate. Posterior caches; sliders on the
                    Selection tab do not auto-recompute (advisor pin: avoid 25k-trials-on-drag).
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <MissionPicker
                    missions={ANALOG_MISSIONS as AnalogMission[]}
                    selected={selectedMission}
                    onChange={handleMissionChange}
                  />
                  <button
                    type="button"
                    onClick={handleRecompute}
                    disabled={!selectedMission || isComputing}
                    className={
                      "mono uppercase tracking-cap text-[11px] px-3 py-2 border rounded-md transition-colors " +
                      (selectedMission && !isComputing
                        ? "border-signal text-signal hover:bg-signal/10"
                        : "border-line text-ink-3 cursor-not-allowed")
                    }
                  >
                    {isComputing ? "computing…" : stale ? "recompute (stale)" : "recompute"}
                  </button>
                </div>
              </div>

              {selectedMission && (
                <div className="mono mt-4 grid grid-cols-2 gap-y-1 text-[11px] text-ink-2 sm:grid-cols-4">
                  <div>
                    <span className="text-ink-3">duration · </span>
                    <span className="text-ink-0">{selectedMission.durationDays} d</span>
                  </div>
                  <div>
                    <span className="text-ink-3">crew · </span>
                    <span className="text-ink-0">{selectedMission.crewSize}</span>
                  </div>
                  <div>
                    <span className="text-ink-3">EVAs · </span>
                    <span className="text-ink-0">{selectedMission.evaCount}</span>
                  </div>
                  <div>
                    <span className="text-ink-3">comms delay · </span>
                    <span className="text-ink-0">{selectedMission.commsDelaySec} s</span>
                  </div>
                </div>
              )}

              {stale && !isComputing && (
                <div className="mono mt-3 text-[10px] text-amber-300">
                  ⚠ Selection scores changed since last run · click recompute to refresh
                </div>
              )}
            </div>

            {/* RESULTS */}
            {selectedMission && riskPosterior ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <section className="lg:col-span-5 space-y-6">
                  <RiskCard posterior={riskPosterior} alias={selectedMission.id} />
                </section>
                <section className="lg:col-span-7 space-y-6">
                  <RiskHistogram posterior={riskPosterior} />
                </section>
                <section className="lg:col-span-12">
                  <ConditionContribution
                    posterior={riskPosterior}
                    conditions={ANALOG_CONDITIONS}
                  />
                </section>
              </div>
            ) : (
              <div className="panel p-6">
                <div className="grid h-[160px] place-items-center text-sm text-ink-2">
                  <span className="mono">
                    {isComputing
                      ? "computing posterior…"
                      : "no mission selected — pick one above to run the forward simulator"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER ──────────────────────────────────────────────────────────────── */}
      <footer className="mt-10 border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-8 py-5">
          <div className="mono text-[10px] uppercase tracking-cap text-ink-3">
            selectron · {tab === "Selection" ? "iter 01" : "iter 03"} · bayesian mcda + mission-risk monte carlo
          </div>
          <div className="mono text-[10px] uppercase tracking-cap text-ink-3">
            <a
              href="https://github.com/strikerdlm/selectron"
              className="hover:text-signal transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              github.com/strikerdlm/selectron ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
