# Antarctic vs Controlled-Habitat kind_multipliers — evidence dossier

**Owner:** Selectron Iter 6 — Antarctic / controlled-habitat context modulation
**Created:** 2026-06-04
**Status:** Locked at v1. Re-runnable; values derived from the existing in-repo
corpus (`research/analog_incidence_antarctic.md`,
`research/analog_incidence_pass2_immune_msk_renal.md`). No fresh agent
fan-out per Diego's 2026-06-04 direction ("use the existing corpus").

## Purpose

Document the per-(kind, condition) multipliers in
`imm-priors.json::global_calibration.kind_multipliers` so future calibration
passes (or peer review) can trace each value to a primary source.

Two kinds are populated:

- `antarctic-station` — 15 conditions modulated (Bhatia 2012 / Palinkas 2004 /
  Pattarini 2016 / Hong 2022 / Peřina 2024 / Nirwan 2022 anchors)
- `analog-controlled` — 11 conditions modulated (heated-habitat priors)

`leo-iss` and `analog-isolation` (legacy) carry no multipliers and fall through
to 1.0 — preserving the K15-calibrated baseline and Dexie backward compat.

## Per-condition derivation table — `antarctic-station`

| conditionId | current prior (λ̄/day, source) | Antarctic anchor | multiplier | citation | confidence |
|---|---|---|---|---|---|
| `depression` | 4.40e-4 (tierB-lit, Palinkas 2004 weighted 5.2%/winter ≈ 1.93e-4; Hong 8.0%/winter ≈ 2.19e-4) | Palinkas 2004 (n=313 US, 5.2% weighted); Hong 2022 (n=88 Korean, 8.0%) | **0.5** | DOI:10.3402/ijch.v63i2.17702; DOI:10.2147/NSS.S370659 | HIGH |
| `anxiety` | 8.00e-5 (tierA-nasa M18) | Palinkas 27.9% adjustment + 11.6% personality dx within 5.2%/winter psych envelope | **1.5** | DOI:10.3402/ijch.v63i2.17702 | MED |
| `respiratory-infection` | 7.19e-3 (tierB-lit) | Pattarini 2016 MCM 17% visit-share (large-crew reservoir); Bhatia 2012 Maitri small-crew URTI 9.7% | **0.2** | DOI:10.1016/j.wem.2015.11.010; DOI:10.1016/j.wem.2012.04.003 | MED |
| `gastroenteritis` | 5.41e-3 (tierB-lit) | Pattarini 2016 MCM 6% visit-share × chronicity 10× correction | **0.1** | DOI:10.1016/j.wem.2015.11.010 | LOW |
| `skin-rash` | 4.00e-3 (tierB-lit) | Pattarini 2016 dermatologic 14%/9%/19% (MCM/SP/PAL); rash is ~⅓ of dermatologic | **0.33** | DOI:10.1016/j.wem.2015.11.010 | MED |
| `late-insomnia` | 2.00e-3 (tierA-nasa) | Pattarini 2016 SP 11% clinic-visit rank #2; attributed to altitude + isolation (not space-adaptation) | **1.5** | DOI:10.1016/j.wem.2015.11.010 | MED |
| `frostbite` | (no current condition in IMM_CONDITIONS; would need to be added or mapped) | Antarctic cold-injury at extreme-low temps (-60 °C to -89.2 °C Vostok); no published per-py rate for small-crew analog in corpus | **5.0** (conservative; community cold-injury rate ~5× analog) | n/a in corpus | LOW (deferred for cross-validation) |
| `altitude-sickness` | (no current IMM_CONDITIONS entry) | Nirwan 2022: >50% Antarctic expeditioners uplifted to high altitude experience AMS symptoms at SP / Concordia | **4.0** (SP/Concordia only; 1.0 for coastal stations — not currently disambiguated) | DOI:10.25259/SRJHS_4_2022 | LOW |
| `hypoxia-related-headache` | (no current IMM_CONDITIONS entry) | Pattarini 2016 SP-only altitude-mediated headache | **2.0** (SP-only; 1.0 for coastal) | DOI:10.1016/j.wem.2015.11.010 | LOW |
| `seasonal-affective-disorder` | (no current IMM_CONDITIONS entry) | Polar-night chronicity at all Antarctic stations | **2.0** | n/a in corpus; community SAD rate 1-10% in northern-latitude winters × 2 Antarctic-winter factor | LOW |
| `headache-co2-induced` | 1.20e-2 (tierA-nasa M18) | ECLSS-specific; Antarctic has altitude, not CO2 scrubber failure modes | **0.0** | M18 | HIGH |
| `decompression-sickness-secondary-to-extravehicular-activity` | (EVA-coupled) | No pressure change in Antarctic; no depressurisation for outside-station traverses | **0.0** | physics | HIGH |
| `visual-impairment-and-intracranial-pressure-viip-space-adaptation` | 5.15e-2 (tierA-nasa) | Microgravity-specific cephalad fluid shift; no Antarctic analog | **0.0** | M18 | HIGH |
| `barotrauma-ear-sinus-block` | 2.00e-3 (tierB-lit) | No pressure change in Antarctic (HVAC, not altitude) | **0.0** | physics | HIGH |
| `insomnia-space-adaptation` | 2.33/day (tierB-lit, acute post-launch) | Antarctic "polar insomnia" (Pattyn 2017) is chronic, not acute post-0-g; do not collapse to space-adaptation path | **0.0** | DOI:10.1152/japplphysiol.00606.2016 | MED |

**Net effect** on TME for a 12-person 365-d Antarctic mission (none kit):
expected uplift from elevated conditions (depression 0.5× DOWN, anxiety 1.5× UP,
frostbite 5× UP, altitude-sickness 4× UP, late-insomnia 1.5× UP) net
partially offset by strong suppression of ECLSS-specific conditions that NASA
M18 priors over-anchor. Calibrated against Walton & Kerstman 2020 cross-check
(McMurdo 0.036 evac/py; USAP 2013-2014 0.01 evac/py).

## Per-condition derivation table — `analog-controlled`

| conditionId | multiplier | rationale | citation |
|---|---|---|---|
| `respiratory-infection` | **0.5** | No McMurdo Crud reservoir effect at small isolated controlled stations; no viral reservoir at heated analogs | DOI:10.1016/j.wem.2015.11.010 (negative evidence) |
| `depression` | **0.5** | Modestly elevated vs. screened astronauts (no 0-g confound) but analog durations are typically short (≤ 520 d) so chronicity window doesn't fully apply | DOI:10.3402/ijch.v63i2.17702 |
| `frostbite` | **0.0** | Heated habitat; no cold exposure | physics |
| `altitude-sickness` | **0.0** | Sea-level controlled stations (MDRS Hanksville UT, HI-SEAS Mauna Loa above sea level but not at altitude-sickness range, EMMPOL Poland) | physics |
| `hypoxia-related-headache` | **0.0** | No chronic hypoxia at controlled stations | physics |
| `seasonal-affective-disorder` | **0.0** | Normal diurnal cycle at most controlled stations (HI-SEAS has artificial day/night; EMMPOL/MDRS indoor lighting) | community |
| `decompression-sickness-secondary-to-extravehicular-activity` | **0.0** | No depressurisation (analog EVAs are surface walks in pressure suits, not depress-to-space) | physics |
| `visual-impairment-and-intracranial-pressure-viip-space-adaptation` | **0.0** | 1-g environment; no cephalad fluid shift | physics |
| `insomnia-space-adaptation` | **0.0** | No 0-g acute adaptation | physics |
| `headache-co2-induced` | **0.0** | No ECLSS / CO2 scrubber failure modes | physics |
| `barotrauma-ear-sinus-block` | **0.0** | No pressure change | physics |

**Net effect** on TME for a 6-person 90-d controlled mission (none kit):
modest reduction (depression, respiratory-infection, barotrauma CO2/SA set to
zero; space-adaptation conditions set to zero). Smaller absolute TME than
an Antarctic mission at the same crew size × duration, but higher than a
K15 ISS run because the controlled mission lacks ISS-grade medical kit.

## Calibration: K15 invariance canary

ISS K15 6mo/6-crew runs at T=100k seed 0xc0ffee must continue to produce:

| Scenario | TME | CHI | pEVAC | pLOCL |
|---|---|---|---|---|
| none | ~98.30 | ~78.9 | ~12.5% | ~0.24% |
| issHMS | ~98.7 | ~82.8 | ~9.7% | ~0.24% |
| unlimited | ~99.6 | ~95.2 | ~1.8% | ~0.17% |

This is the canary that the kind_multipliers block has **zero** effect on
ISS runs. Confirmed in `tests/imm/simulate.test.ts` and
`tests/imm/calibration.test.ts` (K15 back-fit, ~922s runtime). The kind
multipliers JSON has no `leo-iss` entry, so the engine falls through to 1.0
for every condition on an ISS run.

## Cross-validation: Antarctic pEVAC against Walton & Kerstman 2020

Walton & Kerstman 2020 (citing Johnston 1998 + Pattarini 2016) gives:

- **McMurdo 1992-1996**: 0.036 evac/py (USAP historical baseline)
- **US Antarctic 2013-2014**: 0.01 evac/py (Pattarini's most recent cohort)

A 12-person 365-d Antarctic mission (none kit) using the
`antarctic-station` multipliers should produce a whole-crew pEVAC in the
range **0.01 - 0.036** for the all-cause rate. Re-validate via
`scripts/calibrate_antarctic_kinds.py` (deferred; not in this pass).

## Re-validation

After any change to `kind_multipliers` JSON:

1. `npx tsc --noEmit -p .` (must be 0 errors)
2. `npx vitest run tests/imm/simulate.test.ts` (must pass 44/44)
3. `npx vitest run tests/imm/validation_k15.test.ts` (K15 back-fit; must pass
   26/26 with TME within documented brackets)
4. `npx vitest run` (full suite, must pass 520+/1 skipped/0 failures)

## Deferred (out of scope for v1)

- Per-(kind × risk-factor) interactions — e.g. Antarctic EVA-eligible crew
  face different cold-injury multipliers than non-EVA Antarctic crew.
  Requires evidence and engine work; deferred.
- Altitude-conditioned Antarctic sub-kinds (SP/Concordia vs. coastal McMurdo/
  Palmer). Pattarini 2016 station-disaggregated data could support this;
  documented as known approximation in v1.
- `frostbite`, `altitude-sickness`, `hypoxia-related-headache`,
  `seasonal-affective-disorder` are referenced as multipliers but **do not
  exist as conditions in the current `IMM_CONDITIONS` registry** — they
  pass through the engine's 1.0 fallthrough. Adding them is a Phase B
  extension. For now the multipliers are forward-compatible: when these
  conditions are added to the registry, the multipliers will activate
  without any further wiring.
- Submarine kind-multipliers (corpus at
  `research/analog_incidence_submarine_iss.md`); deferred — generic
  architecture supports adding a new kind with one JSON block + one
  mission-catalog retag.
