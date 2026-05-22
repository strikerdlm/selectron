# Peer-Review Report #2 — ML / Biomathematical Methodology + npj Microgravity Fit

**Manuscript:** "Bayesian Multi-Criteria Decision Analysis with NASA Human-System-Risk-Board Likelihood × Consequence Mapping for Analog-Astronaut Selection"
**Author:** Diego L. Malpica, MD
**Target journal:** npj Microgravity (ISSN 2373-8065; IF ~3.7; same journal as Antonsen 2022 [@imm-a22] and 2023 [@antonsen2023])
**Manuscript file:** `paper/manuscript.md` (commit `b70e1eb`)
**Reviewer perspective:** Statistical machine learning, hierarchical Bayesian modelling, Monte Carlo methodology, biomathematical model design
**Companion document:** `paper/peer-review-report.md` (citation-hygiene + internal-consistency pass, 2026-05-22)
**Date:** 2026-05-22

---

## 1. Scope of this review

This review is methodological-depth. The first peer-review pass (`paper/peer-review-report.md`) handled citation hygiene, internal numerical consistency, and reproducibility infrastructure. This second pass takes the perspective of a reviewer with expertise in:

- **Statistical ML and hierarchical Bayesian modelling** — Dirichlet priors, conjugate analysis, sampler quality, effective-sample-size diagnostics, uncertainty quantification, identifiability, sensitivity analysis.
- **Monte Carlo for biomathematical models** — variance accounting, convergence diagnostics, PRNG choice, sample-size justification, Beta-Pert + sequential-phase compositions, mixture-of-experts interpolations.
- **npj Microgravity scope** — methodology papers in the NASA-IMM lineage (Myers 2018 [@imm-m18], Antonsen 2022 [@imm-a22], Antonsen 2023 [@antonsen2023]) that the journal has recently accepted; reproducibility + open-source artifact culture; the flexible IMRaD / "Results-first" format the journal allows; structured-abstract conventions; open-data and code-availability expectations.

I assume the citation corrections in the first review's Tier 1 are applied before submission. The non-citation methodological substance is what I assess below.

---

## 2. Journal-fit assessment (npj Microgravity)

**Fit: strong, but the paper sits at the intersection of two npj Microgravity audiences and needs an explicit positioning decision.**

npj Microgravity has accepted two recent IMM-lineage methodology papers in the past 24 months: Antonsen et al. (2022) "Estimating medical risk in human spaceflight" [@imm-a22] and Antonsen et al. (2023) "Updates to the NASA human system risk management process for space exploration" [@antonsen2023]. Both are technical methodology contributions from the NASA HRP / IMM community — the exact lineage this manuscript engages with. The journal is the right home.

However, the manuscript is **two papers fused into one**, and a reviewer might ask for a separation decision:

1. **Paper A: "Bayesian MCDA + HSRB LxC bridge for analog-astronaut selection"** — Stage A + the HSRB mapping. This is novel for the selection literature (no Bayesian MCDA pipeline exists for astronaut/aircrew/analog selection per the Li 2020 [@li2020] precedent gap), and the JSC-66705 verbatim mapping is operationally useful. Audience: analog-mission programs, aerospace-medicine selection panels.
2. **Paper B: "A K15 §II.A.9 sequential-phase per-event QTL clarification of the NASA IMM, with K15 reproduction at $T = 100{,}000$ as a CI-blocking acceptance gate"** — Stage B. This is novel within the NASA-IMM technical community (the within-event-vs-cross-event concurrent-FI interpretation finding has implications beyond Selectron). Audience: NASA HRP IMM team, Antonsen / Myers / Keenan collaborators, computational-medicine modellers.

The current single-manuscript framing risks under-serving both audiences: selection-panel readers will skim the IMM Calculator methodology details; IMM technical readers will skim the Stage A MCDA. **Recommendation:** if the editor permits, split into a "letter" (Paper A) + a "technical report" or full article (Paper B); if not, restructure the manuscript so §1 explicitly addresses both audiences and signposts which subsections each should focus on.

**npj Microgravity-specific format notes:**

- The journal accepts both IMRaD and Results-first layouts ([Guide to Authors](https://www.nature.com/npjmgrav/for-authors-and-referees/guide-to-authors)). The current IMRaD layout is fine. No word-count enforcement at initial submission (per [Submission guidelines](https://www.nature.com/npjmgrav/for-authors-and-referees/submission-guidelines)), but reviewers will push back on the ~310-word abstract — npj Microgravity recently-published methodology articles use ~200–250-word abstracts. Reduce per the first review's Tier 2 #14.
- Code availability + Zenodo DOI requirement is satisfied by the existing §2.5 statement (placeholder `__ZENODO_DOI__`); npj Microgravity requires a citable Zenodo or equivalent archive at acceptance.
- Reporting checklists: a methodology paper should attach the ARRIVE-equivalent for computational models — there is no NASA-IMM-specific reporting checklist, but the V&V dossier mapped to NASA-STD-7009A factors 1–3 (§2.6) is the closest analog and should be explicitly cited as the model's reporting framework.

---

## 3. Statistical machine learning + Bayesian methodology audit

### 3.1 Stage A — Dirichlet sampler (§2.2)

**What's correct.** The Dirichlet-Gamma decomposition + Marsaglia–Tsang acceptance-rejection [@marsagliatsang2000] is the textbook construction. The $\alpha_0 \to \infty$ / $\alpha_0 \to 0$ asymptotic recovery of deterministic MCDA / SMAA-2 is correctly stated [@sainthilary2017; @lahdelma2001]. The closed-form Dirichlet moments check as a Factor-1 V&V test (mean $\alpha_k/\alpha_0$, variance $\alpha_k(\alpha_0 - \alpha_k)/[\alpha_0^2(\alpha_0+1)]$, off-diagonal covariance $-\alpha_k\alpha_l/[\alpha_0^2(\alpha_0+1)]$) is rigorous.

**Issue 1 — flat-prior justification:** the manuscript defaults to $\alpha_k = 1/K$ which gives a *symmetric* but *concentrated* Dirichlet (low total-concentration $\alpha_0 = 1$, posterior weakly informative). The §4.3 first bullet acknowledges $\alpha_0$ is unsettled and recommends reporting at $\alpha_0 \in \{1, 10, 100\}$ as a robustness panel. **This robustness panel does not actually appear in §3 or in any figure.** A statistical reviewer would push back: either include the panel (it costs ~30 minutes of compute) or remove the §4.3 commitment. As written, the section reads as "we acknowledge the open problem and will address it later" — which is fine for an Iter-1 paper but undermines the methodological rigor claim.

**Issue 2 — ESS diagnostic for IID Dirichlet draws is uninformative.** §2.2 reports ESS computed from lag-1 autocorrelation $\hat\rho_1$, and §3.2 reports ESS = 5,121 against T = 5,000 (ratio 1.02). For IID Dirichlet sampling, $\hat\rho_1 \approx 0$ by construction, so ESS $\approx T$ always — this diagnostic doesn't add information beyond "the sampler isn't pathologically broken". The manuscript states this transparently (§2.2: "a materially lower value signals an implementation error rather than a sampling-efficiency concern") which is honest, but a methods reviewer would prefer a more discriminating sampler diagnostic — e.g., Geweke convergence test on the moment estimates, or a Kolmogorov–Smirnov goodness-of-fit between empirical and closed-form marginal Dirichlet distributions. **Recommendation:** keep the ESS check but add a K-S marginal fit test as a more informative auxiliary diagnostic.

**Issue 3 — degenerate posterior in §3.2 worked example.** The midpoint-scores worked example produces $S_i \equiv 0.5$ exactly (analytic invariant: $\sum_k w_k = 1$ deterministically, all $z_k = 0.5$, so $S_i = 0.5$ regardless of weight draw). The manuscript correctly identifies this as an invariant property, but a methods reviewer will rightly ask: **why is the worked example chosen to produce a degenerate posterior?** A representative figure should show a non-degenerate posterior — e.g., DEMO-01 with heterogeneous criterion scores (z = {0.2, 0.5, 0.9, 0.3, ...}) so the Dirichlet weight uncertainty actually translates into composite-score uncertainty. The degenerate worked example demonstrates the sanity check but misses the demonstration purpose. **Recommendation:** add a second worked example with heterogeneous z-scores (or replace the current one) so the credible-interval semantics of $S_i$ are visible.

### 3.2 PRNG choice (§2.2)

**Issue 4 — Mulberry32 period exhaustion risk.** The manuscript uses Mulberry32 [@mulberry32], a 32-bit non-cryptographic PRNG with period $2^{32} \approx 4.3 \times 10^9$. The Stage B IMM Calculator at $T = 100{,}000$ trials × 100 conditions × 6 crew members × ~10 RNG draws per condition per crew member per trial ≈ $6 \times 10^9$ RNG draws per full simulation. **This approaches and may exceed Mulberry32's period.** Period exhaustion within a single simulation produces correlated draws, breaking the Monte Carlo variance theory the §2.6 V&V dossier relies on. This is a real concern for a paper that emphasizes K15 reproduction at the NASA canonical $T = 100{,}000$.

**Recommendation:** either (a) replace Mulberry32 with xoroshiro128++ (period $2^{128}$) or PCG-XSL-RR-128/64 (period $2^{128}$) — both are public-domain, single-file implementations with the same API surface as Mulberry32 — and re-tag a v0.5.1; or (b) demonstrate empirically that Mulberry32 period exhaustion does not occur in a single IMM Calculator run (instrument the PRNG to count total `rng()` calls per `simulateIMM` invocation; verify the total stays below $2^{32}$). Without one of these, the K15 reproduction result has a non-trivial PRNG-quality footnote that a methods reviewer will flag.

### 3.3 Variance-correct λ-site multipliers (§2.3)

**What's strong.** The rev3-b-followup fix that moved tier multipliers from post-count stochastic rounding to the λ-sampling site is mathematically correct and was the right call. The Poisson variance $\mathrm{Var}[\mathrm{Poisson}(\lambda \cdot m)] = \lambda \cdot m$ is exactly preserved; the post-count $\mathrm{Var}[\mathrm{round}(\mathrm{Poisson}(\lambda) \cdot m)] \approx m^2 \cdot \lambda$ was under-reporting variance by ~45 % at $m = 0.55$ — significant enough to affect CI₉₅ widths in the HSRB matrix verdict.

**Issue 5 — but variance is not measured in the validation gate.** The IMM-86 acceptance gate (`tests/imm/validation_k15.test.ts`) checks **means only** for the 12 metrics. The K15 paper publishes CI₉₅ ranges, but the gate does not compare Selectron's posterior CI₉₅ to K15's CI₉₅ — only the point estimate's inclusion in K15's bracket. **This is a significant omission.** A reviewer would ask: "you fixed a variance bug; how do you know your variance is now correct?" The natural extension to the IMM-86 gate is to add an additional 12 assertions on CI₉₅ *widths* (Selectron's CI₉₅ width should be within some factor — say 0.5×–2× — of K15's published CI₉₅ width on each metric).

**Recommendation:** extend `tests/imm/validation_k15.test.ts` with CI₉₅-width assertions per metric and report the v0.5.0 numbers in §3.3 alongside the mean reproduction table. The variance-correct fix becomes a quantitative claim, not just an architectural one.

### 3.4 The 100-condition prior structure

**Issue 6 — 18 tier-C synthetic conditions undermine the K15 reproduction claim.** §2.3 says 18 of 100 conditions have synthetic-placeholder priors back-fit to K15 Table 1 aggregate output. The blanket `tierB_multiplier = 0.55` similarly calibrates the residual 36 tier-B conditions to keep TME within K15 CI₉₅.

This is **calibration to K15 model output**, not validation against observed data — and a Bayesian methods reviewer would push back hard: **"You can't claim K15 reproduction as a validation result when 54 of 100 condition priors were back-fit to the K15 target."** The K15 reproduction becomes a self-fulfilling test for those 54 conditions.

The honest framing is:
- **5 tier-B + 41 tier-A = 46 conditions** have independently-elicited priors (NASA-attributed or primary-source-cited). Their reproduction of K15 aggregates IS evidence of model fidelity.
- **54 conditions** (36 tier-B-blanket + 18 tier-C-synth) have priors that are calibration knobs to match K15 — their reproduction is tautological.

**Recommendation:** report the K15 reproduction with the 46 evidence-based conditions only (a "leave-the-calibrated-out" sensitivity analysis); this would be a much stronger validation claim. Alternatively, explicitly disclose the calibration→target circularity in §3.3 with a sensitivity analysis showing how the reproduction degrades if the tier multipliers are removed.

### 3.5 Vulnerability coupling (§2.3) — identifiability concern

**Issue 7 — family-β coefficients are unidentified and undocumented.** §2.3 states the Stage A → Stage B coupling as $\lambda_{c, i} = \lambda_c \cdot \exp(\beta_c \cdot z_{c, i})$ with family-specific β coefficients "ranging from −0.4 for psychiatric conditions to −0.15 for renal conditions". An audit of the implementation (`src/imm/simulate.ts:37-50`) confirms these are hardcoded in `FAMILY_BETA: { psychiatric: -0.4, … renal: -0.15 }` with a default of −0.2 for unmapped families. **There is no citation, no elicitation procedure, no calibration target, and no sensitivity analysis for these coefficients.**

These β coefficients are the load-bearing structural assumption coupling Stage A and Stage B. Without source-citation or sensitivity analysis, a methods reviewer would push back: **"the entire dual-novelty contribution — the coupling between Stage A MCDA and Stage B IMM — depends on parameter values that are pulled from nowhere."** The first peer-review report focused on citation hygiene at the prior level; this is a structural-assumption identifiability problem one layer deeper.

**Recommendation:** either (a) cite a source for the FAMILY_BETA values (e.g., NASA HRP evidence reports on per-condition stress-vulnerability coupling, IMM A22 [@imm-a22] sensitivity tables, or analog-mission outcome regressions); or (b) add a sensitivity panel showing how Stage B outputs change as each FAMILY_BETA value varies by ±0.1 around its current value (a Sobol-or-tornado one-at-a-time perturbation); or (c) honestly relabel them as "operator-supplied scenario-analysis tuning parameters" rather than calibrated model parameters, and disclose this in §2.3 + §4.4.

### 3.6 Beta-Pert + RAF interpolation (§2.3)

**Issue 8 — RAF linear interpolation between treated and untreated Beta-Pert parameters is asserted, not derived.** The IMM Calculator interpolates per-condition outcomes via $D = (1 - \mathrm{RAF}) \cdot D_{\text{untreated}} + \mathrm{RAF} \cdot D_{\text{treated}}$ at the Beta-Pert parameter level. This is a **convex combination of Beta-Pert distribution parameters**, which is **not the same** as a convex combination of the corresponding distributions (the resulting Beta-Pert is generally not the mixture of treated and untreated outcomes).

The Bayesian-defensible alternative is a **mixture distribution**: draw $X \sim D_{\text{treated}}$ with probability RAF, $X \sim D_{\text{untreated}}$ with probability $1 - \mathrm{RAF}$. This is what K15 §II.A.7 actually specifies per the verbatim text in `research/imm_sources/architecture/K15_keenan_2015_imm_probabilistic_simulation.md` ("a partial treatment scheme is employed that allows for a continuum between the fully-treated and untreated situations… we use a resource availability factor (RAF), calculated as the proportion of required resources available, to generate statistical distributions that are shifted between the fully treated and completely untreated distributions"). The K15 text says "statistical distributions that are shifted", which is ambiguous between parameter-interpolation and distribution-mixture; the manuscript should clarify which interpretation Selectron adopts and justify it.

**Recommendation:** §2.3 should explicitly state the RAF interpolation rule Selectron uses (parameter-linear vs distribution-mixture vs K15's exact convention), and briefly justify the choice. If parameter-linear, acknowledge the divergence from a true Bayesian mixture and explain why it's an acceptable approximation (e.g., "Beta-Pert is well-approximated by its mode-shifted variant when parameters are interpolated linearly under the regularity assumption that treated and untreated modes are within 2σ of each other").

### 3.7 EVA-coupled Bernoulli — clip rule is implicit

**Issue 9 — Poisson-to-Binomial clip rule is not specified.** §2.3 describes EVA-coupled conditions as drawing per-EVA Bernoulli events with the per-EVA probability derived from the Poisson rate. The exact clip rule — $p = 1 - e^{-\lambda}$ (true Poisson event-occurrence probability) vs $p = \min(\lambda \cdot \Delta t, 1)$ (linear approximation valid for small $\lambda \Delta t$) vs $p = \lambda \Delta t$ (no clip, fails for $\lambda \Delta t \geq 1$) — is not stated in the methods. This matters: the small-$\lambda$ regime where the linear approximation is acceptable depends on per-EVA durations that are not documented.

**Recommendation:** state the exact clip rule and the regime under which it's valid in §2.3.

### 3.8 Mission Success Probability — not defined mathematically

**Issue 10 — MSP introduced in §2.3 but not formally defined.** §2.3 mentions "a Mission Success Probability (MSP) defined as $P(\mathrm{no\ EVAC} \wedge \mathrm{no\ LOCL} \wedge \chi \geq \chi^*)$" but does not specify whether the three events are evaluated independently (joint probability under independence) or per-trial (joint event in each of T trials). The implementation in `src/imm/simulate.ts` is per-trial (the conjunction is evaluated for each trial; MSP is the fraction of trials satisfying it). The mathematical definition should be explicit so readers can verify implementation correctness from the paper alone.

**Recommendation:** add a formal definition: $\mathrm{MSP} = \frac{1}{T} \sum_{t=1}^{T} \mathbb{1}\{\mathrm{EVAC}^{(t)} = 0 \wedge \mathrm{LOCL}^{(t)} = 0 \wedge \chi^{(t)} \geq \chi^*\}$, where $(t)$ indexes Monte Carlo trials.

### 3.9 Sequential-phase QTL formula has an unaddressed boundary case

**Issue 11 — cp2 duration is not clamped for late-mission events.** The K15-correct per-event QTL formula in §2.3 is:
$$\mathrm{QTL}_\mathrm{event} = f_\mathrm{cp1} \cdot \Delta t_\mathrm{cp1} + f_\mathrm{cp2} \cdot \Delta t_\mathrm{cp2} + f_\mathrm{cp3} \cdot \max(0, t_\mathrm{end} - t_\mathrm{event} - \Delta t_\mathrm{cp1} - \Delta t_\mathrm{cp2})$$

The cp3 term correctly clamps to non-negative remaining-mission hours. But what happens if cp1+cp2 *itself* extends past mission end (i.e., $t_\mathrm{event} + \Delta t_\mathrm{cp1} + \Delta t_\mathrm{cp2} > t_\mathrm{end}$)? The current formula still charges $f_\mathrm{cp1} \cdot \Delta t_\mathrm{cp1} + f_\mathrm{cp2} \cdot \Delta t_\mathrm{cp2}$ — which over-counts QTL beyond the mission. For events near mission end this is a measurable error.

**Recommendation:** apply clamping to cp1 and cp2 too, e.g., $\Delta t'_\mathrm{cp1} = \min(\Delta t_\mathrm{cp1}, t_\mathrm{end} - t_\mathrm{event})$ and similarly for cp2; only the post-cp3-start remaining time gets the cp3 charge. Verify the implementation in `src/imm/simulate.ts` and update §2.3 to reflect the clamping (it's a small but principled correction).

---

## 4. Biomathematical model audit

### 4.1 Distributional choices for incidence

The paper uses Lognormal-Poisson, Gamma-Poisson, Beta-Bernoulli, and Fixed distributions per condition. The choice of distribution is encoded in `imm-priors.json` per condition's `incidence.distribution` tag. **The §2.3 description does not explain why a given condition uses one distribution over another.** This is the kind of "modelling choice rationale" a biomath reviewer expects.

The K15 paper provides justification (Lognormal-Poisson for over-dispersed counts with heavy tails like radiation events; Gamma-Poisson for hierarchically uncertain rates; Beta-Bernoulli for binary occurrences). **Recommendation:** §2.3 should include a paragraph mapping the four distributions to their typical condition types with one-line justification each. Otherwise the model looks like a black box with arbitrary distributional choices.

### 4.2 The "documented divergent" bracket curation problem

The IMM-86 acceptance gate uses two bracket kinds — K15 CI₉₅ for the 5 in-band metrics, wider "documented-divergent" brackets for the 7 out-of-band metrics. The first review (Tier 2 #19) flagged that the curation cadence is not documented.

From an ML/biomath methods perspective, the deeper issue is that **the wider brackets are operator-defined with no principled tightness criterion**. The widest documented-divergent bracket is `[10.0, 20.0]` for `none scenario pEVAC` (current value 13.05 %, target 66.90 %). This bracket includes K15 target only if widened further — meaning the test passes today but would never tighten naturally as the model improves. The reviewer would ask: **"under what conditions do you ever tighten the divergent bracket?"** Without an answer, the bracket-design pattern degrades into "wider whenever a regression fails" — exactly the test-rot problem the gate was designed to prevent.

**Recommendation:** specify a bracket-tightening rule in §2.6, e.g., "documented-divergent bracket width is automatically halved (snapped to K15 CI₉₅ if applicable) when the observed value falls within 25 % of the K15 target; bracket widening requires explicit issue-tracked justification in `tests/imm/validation_k15.test.ts::ACCEPTED::tracking`." This makes the gate a one-way ratchet toward K15 reproduction.

### 4.3 Convergence diagnostics — Myers/Antonsen σ < 5 % rule is operationally weak

The σ < 5 % between-window rule used in §2.3 + §2.6 is the NASA canonical convergence criterion from Myers 2018 [@imm-m18] and Antonsen 2022 [@imm-a22]. It is a *necessary* condition for convergence (the running σ has stabilized to within 5 % between 1,000-trial windows) but **not sufficient** — it does not test for failure modes like multimodality, period exhaustion (Issue 4), or sticky chains.

A modern Bayesian MC paper would supplement σ < 5 % with at least one of: (a) Gelman–Rubin $\hat{R}$ between independent runs from different seeds; (b) Heidelberger–Welch stationarity test on each posterior summary; (c) trace plot inspection of the running CHI estimate. None of these appear in §3 or §3.3 of the manuscript. **Recommendation:** report Gelman–Rubin $\hat{R}$ between 4 independent T = 25,000 runs (same total computation as one T = 100,000 run) for the issHMS CHI metric, in addition to the σ < 5 % rule. If $\hat{R} \leq 1.01$ across all four chains, the convergence claim is much stronger.

### 4.4 Validation against external reference — K15 is itself a model

The first review (Tier 1 #12) flagged that several specific numerical claims (5.2 %, 9.7 %, 1/6, 0.036/py) don't trace cleanly to source abstracts and need full-text verification. From a biomath perspective there is a deeper concern: **K15 itself is a model, not observed data.** K15 Table 1 is the output of NASA's iMED database run on the K15 reference crew; it has never been validated against held-out analog or LEO observations because no such mission-level outcome dataset exists.

Therefore Selectron's "K15 reproduction" is **model-vs-model agreement**, not model-vs-data validation. The manuscript acknowledges this at §4.4 ("K15's no-kit values are a model construct"; "the operational anchor for evacuation rate is Pattarini 2016's Antarctic 0.036/py") but the §3.3 Results headline still reads as a validation claim.

**Recommendation:** retitle §3.3 from "Stage B — IMM Calculator K15 Table 1 reproduction" to "Stage B — IMM Calculator agreement with the NASA K15 reference model" and add a one-sentence framing: "K15 reproduction is an inter-model agreement test, not a validation against in-flight observed data; the latter would require LSAH access which is unavailable to the analog-mission community at the present time." This is the honest framing.

### 4.5 Sensitivity analysis is absent

§4.5 promises a future Iter-3 sensitivity layer ("global Sobol indices plus a one-at-a-time tornado-style perturbation panel"). **For a methodology paper claiming 5-of-12-K15-CI₉₅ reproduction across 100 prior conditions, the absence of any sensitivity analysis is a significant gap.** A biomath reviewer would push back: which of the 100 priors most-perturb the K15 CHI? Without this, the K15 reproduction is brittle — a small per-condition prior shift could break a CI₉₅ assertion and the methodology paper would not know which prior to focus the next-revision audit on.

**Recommendation:** add a minimal sensitivity panel: one-at-a-time ±50 % perturbation of each tier-A and rev3-c-cited tier-B prior (46 conditions), reporting the maximum K15 CHI shift on issHMS. This is ~30 min of compute and produces a defensible figure for §3 (call it "Figure 5b: per-condition sensitivity of K15 CHI reproduction"). The Sobol panel can remain future work.

---

## 5. Comparison to ML-native alternatives

The §4.2 positioning section compares Selectron to multi-criteria decision-analysis precedents (SMAA, AHP, BWM, additive Dirichlet aggregation). It does not address **modern ML alternatives** for personnel selection that a reviewer with an ML perspective would expect:

- **Gaussian process regression** over criterion-weight space, with predictive uncertainty replacing the Dirichlet posterior
- **Deep ensembles** for vulnerability multiplier estimation, replacing the FAMILY_BETA hardcoded coefficients (Issue 7)
- **Conformal prediction** as an alternative uncertainty-quantification framework producing finite-sample-valid credible intervals without distributional assumptions
- **Bayesian neural networks** for the Stage A → Stage B coupling

These are not necessary contributions — Selectron's Bayesian-Dirichlet + Poisson-Gamma + Beta-Pert stack is principled and operationally appropriate — but a methods reviewer will expect §4.5 Future Work to acknowledge the ML-native alternatives and explain why the Bayesian-Dirichlet structure is preferred for this problem class (likely answer: interpretability + the NASA-IMM ecosystem expectation of Beta-Pert outputs).

**Recommendation:** add a paragraph to §4.5 acknowledging the ML alternatives and justifying the Bayesian-Dirichlet choice for analog-astronaut selection (interpretability for selection panels, alignment with NASA-IMM Beta-Pert outputs, no large training dataset required, deterministic-replayability under a seed).

---

## 6. Reproducibility — strong, but two ML-specific notes

The reproducibility infrastructure is the strongest aspect of the submission (388 tests, tagged release, CI-blocking acceptance gate, deterministic seed throughout). Two ML-specific concerns to add:

**Issue 12 — seed determinism under the variance-correct multiplier path.** The rev3-b-followup fix changed the order of `rng()` calls (per the variance-correct λ-site routing). The IMM-86 acceptance gate uses `seed = 0xc0ffee` and the K15 reference crew, and produces deterministic outputs at `v0.5.0`. However, **if anyone changes the order of `rng()` calls — for example by adding a new sampler — the seed-determinism contract breaks even when the new sampler is mathematically equivalent.** This is a known fragility of seed-based reproducibility in non-cryptographic Monte Carlo.

**Recommendation:** add a "reproducibility contract" sentence to §2.5 explicitly stating: "Adding new RNG draws to the trial loop changes the seed-determined output; the manuscript figures and IMM-86 gate are anchored to the commit-SHA recorded RNG call sequence." This protects future-Diego from confusion if a v0.6.0 prior addition shifts the seed-determinism.

**Issue 13 — synthetic-data-only claim is technically true but ML-misleading.** §3.5 Cross-mission comparison (kept from Iter-3 — see first review Tier 2 #16) uses "synthetic chi samples" generated from a formula in `TestFigureHost.tsx::usePaperF7Seed`. These are not Monte Carlo outputs from the IMM Calculator — they're plausible-looking placeholder values for visualization. A reviewer might mistake F7 for an IMM Calculator multi-mission result.

**Recommendation:** when F7 is regenerated against the v0.5.0 IMM Calculator (per first review Tier 2 #16), update §3.5 to make clear which numbers come from actual `simulateIMM` calls vs which (if any) remain visualization placeholders.

---

## 7. Specific actionable corrections (this review's Tier 1)

In addition to the first review's Tier 1 (citation corrections), the following methodological items must be addressed before submission to npj Microgravity:

1. **Add $\alpha_0$ robustness panel** (or remove the §4.3 commitment) — Issue 1
2. **Add K-S marginal Dirichlet fit test** as a more informative auxiliary sampler diagnostic — Issue 2
3. **Add a non-degenerate worked example** with heterogeneous criterion scores — Issue 3
4. **Replace Mulberry32 with xoroshiro128++** OR demonstrate empirically that period exhaustion does not occur in a single IMM Calculator T = 100,000 run — Issue 4
5. **Extend IMM-86 acceptance gate with CI₉₅-width assertions** to make the variance-correct fix a quantitative claim — Issue 5
6. **Disclose the 54-condition calibration→target circularity** in §3.3, with a 46-condition "evidence-based-only" sensitivity analysis — Issue 6
7. **Document FAMILY_BETA elicitation source** OR add a ±0.1 sensitivity panel OR relabel as "operator-supplied tuning parameters" — Issue 7
8. **Specify RAF interpolation rule** (parameter-linear vs distribution-mixture vs K15-verbatim) and justify the choice — Issue 8
9. **Specify the EVA-coupled Poisson-to-Binomial clip rule** and its validity regime — Issue 9
10. **Add formal MSP definition** in §2.3 — Issue 10
11. **Apply cp1/cp2 mission-end clamping** in `src/imm/simulate.ts` and update §2.3 — Issue 11
12. **Add distribution-choice rationale paragraph** in §2.3 (Lognormal-Poisson vs Gamma-Poisson vs Beta-Bernoulli vs Fixed) — §4.1 above
13. **Specify documented-divergent bracket curation rule** in §2.6 — §4.2 above
14. **Report Gelman–Rubin $\hat{R}$** between 4 independent T = 25,000 runs alongside σ < 5 % — §4.3 above
15. **Retitle §3.3** as "agreement with the NASA K15 reference model" with the inter-model-agreement framing — §4.4 above
16. **Add one-at-a-time ±50 % sensitivity panel** for the 46 evidence-based conditions on K15 CHI — §4.5 above
17. **Add Future Work paragraph acknowledging ML-native alternatives** — §5 above
18. **Add reproducibility-contract sentence** to §2.5 about seed determinism + RNG-call-order fragility — Issue 12

Items #1–11 are blocking from a methodological-rigor perspective; #12–18 are strongly recommended and would substantially strengthen the paper but a tactful reviewer might let them slip to a revision letter.

---

## 8. Recommendation

**Reject as-is, with strong encouragement to revise and resubmit.** This is a "major revision" outcome in npj Microgravity's editorial language, but the journal's IF-3.7 acceptance criteria and the methodology-paper-friendly culture (Antonsen 2022 and 2023 as precedents) mean the path back to acceptance is clear.

The substance is publishable. The Bayesian MCDA + HSRB LxC bridge is genuinely novel, the K15 §II.A.9 sequential-phase clarification is a real methodological finding, and the reproducibility infrastructure is exemplary. After:

- The first-review Tier 1 citation corrections (8 references with verified ground-truth metadata in `paper/peer-review-report.md` §3),
- This second-review Tier 1 methodological corrections (11 items above),
- The first-review Tier 2 internal-consistency fixes (Δ residuals, abstract word count, supplementary-methods file, figure regeneration), and
- The journal-fit positioning decision (single-paper vs split into Paper A + Paper B for selection-panel vs IMM-technical audiences),

the manuscript would be a strong npj Microgravity submission positioned in the same family as Antonsen 2022 [@imm-a22] and 2023 [@antonsen2023].

The expected revision effort is **6–10 hours of focused work**: 2–3 hours on the citations + internal consistency (first review), 3–5 hours on the methodological items in this review (the sensitivity panel and CI₉₅-width tests are the biggest), 1–2 hours on the journal-fit decision + restructuring.

---

## Sources

- [npj Microgravity — Guide to Authors](https://www.nature.com/npjmgrav/for-authors-and-referees/guide-to-authors)
- [npj Microgravity — Submission guidelines](https://www.nature.com/npjmgrav/for-authors-and-referees/submission-guidelines)
- [npj Microgravity — Content types](https://www.nature.com/npjmgrav/content-types)
- Antonsen EL et al. (2022). Estimating medical risk in human spaceflight. *npj Microgravity*. [DOI: 10.1038/s41526-022-00193-9](https://doi.org/10.1038/s41526-022-00193-9)
- Antonsen EL et al. (2023). Updates to the NASA human system risk management process for space exploration. *npj Microgravity*. [DOI: 10.1038/s41526-023-00305-z](https://doi.org/10.1038/s41526-023-00305-z)
- Marsaglia G & Tsang WW (2000). A simple method for generating Gamma variables. *ACM TOMS* 26(3):363-372.
- O'Neill ME (2014). PCG: A Family of Simple Fast Space-Efficient Statistically Good Algorithms for Random Number Generation. [PDF](https://www.pcg-random.org/paper.html)

— end of review —
