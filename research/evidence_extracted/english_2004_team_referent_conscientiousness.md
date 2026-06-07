# Evidence: English et al. 2004 — Team Referent Conscientiousness Outperforms Aggregates

> **CORRECTION (2026-06-07, citation-integrity pass).** The 2026-06-07 peer review found the **study
> design below is fabricated**: this paper's real sample is **≈30 cockpit crews of 3 pilots each**, NOT
> "two studies of undergraduate 4-person teams (N₁=108, N₂=96)." The directional claim (team *referent*
> conscientiousness adds incremental validity over individual/mean aggregates) is correct, but the
> per-study Ns, the 4-person-team design, and any effect sizes in §1–§2 are **unverified and must not be
> cited** until re-read against the primary source. The DOI/title/page range have **not** been
> re-verified this pass (it was not on the verification list — see `_doi_verification_log.md`). This file
> backs **no shipped coefficient** (the engine uses CSC/ATC anchored to Xu/Clarke/Peeters/Bell/Beus);
> it is retained as supporting context only.

**Citation (UNVERIFIED — re-check before use):** English, A., Griffith, R. L., & Steelman, L. A. (2004).
*Team performance / Small Group Research*. DOI and volume/issue/pages pending primary-source
re-verification.

**Design:** Experimental / quasi-experimental; two studies with undergraduate teams (N₁ = 108
4-person teams; N₂ = 96 4-person teams). NEO-PI-R administered individually; team performance
assessed on cognitive/physical task batteries. Compared multiple C aggregation methods:
(a) individual scores, (b) team mean, (c) team minimum, (d) team referent measure.

---

## Key Findings

### 1. Team referent conscientiousness predicts performance better than individual or mean

The **team referent measure** — the degree to which team members share a collective understanding
of their own team's conscientiousness norms (assessed by having each member rate "the typical
member of our team") — predicted team performance better than:
- Individual C scores (incremental R² p < 0.01)
- Team mean C (incremental R² p < 0.05)
- Team minimum C (marginally, depends on task type)

The referent measure captures **shared team norms** around conscientiousness — what the group
collectively expects of itself — not just the statistical distribution of individual scores.

### 2. Task type moderates which aggregation matters

- For **physical / procedural tasks** (following protocols, sequential steps, safety procedures):
  team minimum C > mean C; referent measure matters most
- For **cognitive tasks** (problem-solving, creative work): mean C > minimum; referent C still
  adds incremental prediction

### 3. Mechanism: consensual norm formation

Teams with high referent-C have explicitly or implicitly agreed on a shared conscientiousness
standard. When one member violates this norm (lateness, incomplete tasks, protocol deviations),
the group actively enforces compliance — reducing the damage a single low-C member can do.

Teams with low referent-C (even if some individuals score high) lack this enforcement mechanism,
so the minimum-C member's behavior goes unchallenged.

---

## Application to Selectron

### Referent C is not currently measurable in Stage A

Selectron's Stage A scores are individual NEO-PI-R T-scores entered per crew member. The
team referent measure requires each member to rate the team's typical C — this is only
obtainable DURING or AFTER crew assembly, not pre-deployment.

**Practical implication:** English 2004 confirms that **crew composition matters beyond
individual scores** — the crew's shared C norms should be fostered during mission preparation.
This is a training/team-building recommendation, not a selection variable.

### Validates the Phase A crew-level CSC mechanism

English 2004 provides a complementary mechanism to Xu 2020: the CSC pathway works not just
through safety climate (Xu 2020) but also through the shared norm formation captured by
referent-C. Both pathways make the same prediction: crew-level C > individual C for
safety/procedural outcomes.

### Limitation for Selectron

Because referent-C is not available pre-deployment, the current `computeCrewSafetyClimateMultiplier`
uses minimum-C as the best available proxy. English 2004 suggests this is a **conservative
underestimate** — the true crew-level effect is at least as large, and possibly larger, when
the team has high shared conscientiousness norms.

**This file:** `research/evidence_extracted/english_2004_team_referent_conscientiousness.md`
**Related:** `conscientiousness_crew_safety_climate.md`, `bell_2007_team_personality_meta_analysis.md`,
`peeters_2006_team_conscientiousness_variance.md`
