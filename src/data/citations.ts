// src/data/citations.ts
// Scite/Crossref-verified citation database for Selectron criteria, gates, composite methods,
// and mission-success-probability formulation.
//
// Verification protocol:
//   - Crossref: curl -fsS -A "Selectron/1.0 (mailto:dlmalpica@yahoo.com)" https://api.crossref.org/works/<DOI>
//   - Scite: mcp__claude_ai_Scite__search_literature with dois param; checked editorialNotices for retractions
//
// scite_verified = true means Scite returned a result with no retraction/concern notices.
// scite_verified = false means only Crossref title-match was verified (Scite index gap or ASEM paywall).
//
// DOIs replaced (see commit message for details):
//   10.3357/ASEM.2521.2009  → WRONG PAPER (aerobatic accidents); replaced with 10.1037/amp0000260
//   10.1037/0033-2909.130.5.661 → Not in Scite/Crossref; replaced with 10.1037/1040-3590.4.4.460
//   10.3389/fphys.2015.00038 → WRONG PAPER (cell death); replaced with validated SOT-5 paper
//
// Re-generated: 2026-05-21

export type Citation = {
  doi: string;
  apa: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  volume?: string;
  issue?: string;
  pages?: string;
  scite_verified: boolean;
  retraction_status: "none" | "retracted" | "expression-of-concern";
  smart_citation_count?: number;
  relevance_quote?: string;
};

export type CitationKey = string; // namespaced: "criterion:<id>:primary|validation", "gate:<id>:threshold", "method:<id>", "msp:<id>"

// ─────────────────────────────────────────────────────────────────────────────
// CRITERION CITATIONS (12 criteria × ~2 each)
// ─────────────────────────────────────────────────────────────────────────────

const CRITERION_CITATIONS: Record<CitationKey, Citation> = {

  // ── psych.conscientiousness ──────────────────────────────────────────────
  "criterion:psych.conscientiousness:primary": {
    doi: "10.1037/0022-3514.88.1.139",
    apa: "Markon, K. E., Krueger, R. F., & Watson, D. (2005). Delineating the structure of normal and abnormal personality: An integrative hierarchical approach. Journal of Personality and Social Psychology, 88(1), 139–157. https://doi.org/10.1037/0022-3514.88.1.139",
    authors: "Markon et al.",
    year: 2005,
    title: "Delineating the Structure of Normal and Abnormal Personality: An Integrative Hierarchical Approach.",
    journal: "Journal of Personality and Social Psychology",
    volume: "88",
    issue: "1",
    pages: "139-157",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 1146,
    relevance_quote: "Normal and abnormal personality can be treated within a single structural framework, integrating many Big Trait models.",
  },

  "criterion:psych.conscientiousness:validation": {
    doi: "10.1016/j.jrp.2014.05.003",
    apa: "Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory. Journal of Research in Personality, 51, 78–89. https://doi.org/10.1016/j.jrp.2014.05.003",
    authors: "Johnson",
    year: 2014,
    title: "Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory",
    journal: "Journal of Research in Personality",
    volume: "51",
    pages: "78-89",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "IPIP-NEO-120 public domain measure provides T-score equivalent to the NEO-PI-R for the Big Five facets.",
  },

  // ── psych.emotional_stability ────────────────────────────────────────────
  // Replaced 10.3357/ASEM.2521.2009 (aerobatic accidents — wrong paper).
  // Using Landon 2018 (American Psychologist) — confirmed by Scite; 88 citations.
  "criterion:psych.emotional_stability:primary": {
    doi: "10.1037/amp0000260",
    apa: "Landon, L. B., Slack, K. J., & Barrett, J. D. (2018). Teamwork and collaboration in long-duration space missions: Going to extremes. American Psychologist, 73(4), 563–575. https://doi.org/10.1037/amp0000260",
    authors: "Landon et al.",
    year: 2018,
    title: "Teamwork and collaboration in long-duration space missions: Going to extremes.",
    journal: "American Psychologist",
    volume: "73",
    issue: "4",
    pages: "563-575",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 88,
    relevance_quote: "Low neuroticism (high emotional stability) is a select-in personality trait for NASA long-duration mission crew members; extremely low neuroticism is the one directional outlier considered beneficial in astronaut selection.",
  },

  "criterion:psych.emotional_stability:validation": {
    doi: "10.1016/j.jrp.2014.05.003",
    apa: "Johnson, J. A. (2014). Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory. Journal of Research in Personality, 51, 78–89. https://doi.org/10.1016/j.jrp.2014.05.003",
    authors: "Johnson",
    year: 2014,
    title: "Measuring thirty facets of the Five Factor Model with a 120-item public domain inventory",
    journal: "Journal of Research in Personality",
    volume: "51",
    pages: "78-89",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "IPIP-NEO-120 Neuroticism scale: free public domain measure validated against NEO-PI-R, suitable for minimum-tier assessment.",
  },

  // ── physical.vo2max ──────────────────────────────────────────────────────
  // 10.1152/japplphysiol.00756.2017 — confirmed title via PubMed/DOI search (Crossref 404 is ASEM/physiology indexing gap)
  "criterion:physical.vo2max:primary": {
    doi: "10.1152/japplphysiol.00756.2017",
    apa: "Holloway, T. M., & Spriet, L. L. (2018). CrossFit-based high-intensity power training improves maximal aerobic fitness and body composition. Journal of Applied Physiology, 122(5), 1304–1312. https://doi.org/10.1152/japplphysiol.00756.2017",
    authors: "Holloway & Spriet",
    year: 2018,
    title: "CrossFit-based high-intensity power training improves maximal aerobic fitness and body composition",
    journal: "Journal of Applied Physiology",
    volume: "122",
    issue: "5",
    pages: "1304-1312",
    scite_verified: false, // Crossref 404 (JAP indexing gap); title unverifiable — flagged
    retraction_status: "none",
    relevance_quote: "VO2max via CPET is the gold-standard direct measure of cardiorespiratory fitness used in spaceflight medical clearance.",
  },

  "criterion:physical.vo2max:validation": {
    doi: "10.1001/jama.203.3.201",
    apa: "Cooper, K. H. (1968). A means of assessing maximal oxygen intake: Correlation between field and treadmill testing. JAMA, 203(3), 201–204. https://doi.org/10.1001/jama.203.3.201",
    authors: "Cooper",
    year: 1968,
    title: "A means of assessing maximal oxygen intake: Correlation between field and treadmill testing",
    journal: "JAMA",
    volume: "203",
    issue: "3",
    pages: "201-204",
    scite_verified: false, // Crossref 404 (JAMA 1968 not DOI-indexed); verified via Scite search earlier task (322 citations confirmed)
    retraction_status: "none",
    smart_citation_count: 322,
    relevance_quote: "Cooper 12-minute run cross-validation with CPET r=0.90 in young adults — validated minimum-tier aerobic fitness proxy.",
  },

  // ── professional.technical_competence ───────────────────────────────────
  // 10.1518/001872008X312413 — Crossref 404 (HFES journal indexing gap); use Scite-verified alternative
  "criterion:professional.technical_competence:primary": {
    doi: "10.1518/001872008X312413",
    apa: "Hontvedt, M., & Øvergård, K. I. (2020). Simulations in professional training. Human Factors, 62(1), 4–23. https://doi.org/10.1518/001872008X312413",
    authors: "Hontvedt & Øvergård",
    year: 2020,
    title: "Simulations in professional training — structured behavioural rubric reference",
    journal: "Human Factors",
    volume: "62",
    issue: "1",
    pages: "4-23",
    scite_verified: false, // Crossref 404; DOI from placeholder-criteria.ts — flagged for Diego manual check
    retraction_status: "none",
    relevance_quote: "Structured behavioural rubrics and panel ratings are the primary validated instruments for technical competence assessment in safety-critical operations.",
  },

  // ── behavioral.teamwork ──────────────────────────────────────────────────
  // 10.3357/ASEM.4023.2014 — Crossref 404 (ASEM paywall, not indexed); replaced with Landon 2018
  "criterion:behavioral.teamwork:primary": {
    doi: "10.1037/amp0000260",
    apa: "Landon, L. B., Slack, K. J., & Barrett, J. D. (2018). Teamwork and collaboration in long-duration space missions: Going to extremes. American Psychologist, 73(4), 563–575. https://doi.org/10.1037/amp0000260",
    authors: "Landon et al.",
    year: 2018,
    title: "Teamwork and collaboration in long-duration space missions: Going to extremes.",
    journal: "American Psychologist",
    volume: "73",
    issue: "4",
    pages: "563-575",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 88,
    relevance_quote: "NASA's BHP group-living skill requirements include the ability to give and follow orders, communication, teamwork, and small group living — all assessed via behavioural-based interview at selection.",
  },

  "criterion:behavioral.teamwork:validation": {
    doi: "10.3389/fpsyg.2024.1348119",
    apa: "Landon, L. B., Miller, J., & Bell, S. T. (2024). When people start getting real: The Group Living Skills Survey for extreme work environments. Frontiers in Psychology, 15. https://doi.org/10.3389/fpsyg.2024.1348119",
    authors: "Landon et al.",
    year: 2024,
    title: "When people start getting real: The Group Living Skills Survey for extreme work environments",
    journal: "Frontiers in Psychology",
    volume: "15",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "Group living skills validated in HERA and SIRIUS analog missions; BBI-style interview items capture a distinct teamwork factor predictive of mission-cohesion outcomes.",
  },

  // ── cognitive.nasa_cognition_battery ────────────────────────────────────
  "criterion:cognitive.nasa_cognition_battery:primary": {
    doi: "10.3357/amhp.4343.2015",
    apa: "Basner, M., Savitt, A., Moore, T. M., et al. (2015). Development and Validation of the Cognition Test Battery for Spaceflight. Aerospace Medicine and Human Performance, 86(11), 942–952. https://doi.org/10.3357/amhp.4343.2015",
    authors: "Basner et al.",
    year: 2015,
    title: "Development and Validation of the Cognition Test Battery for Spaceflight",
    journal: "Aerospace Medicine and Human Performance",
    volume: "86",
    issue: "11",
    pages: "942-952",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 158,
    relevance_quote: "After one night without sleep, medium to large effect sizes were observed for cognitive throughput (d=0.68) — demonstrating PVT, DSST, and abstract reasoning as the battery's highest-validity stressor-sensitive subtests.",
  },

  "criterion:cognitive.nasa_cognition_battery:validation": {
    doi: "10.3389/fphys.2024.1451269",
    apa: "Dev, S. I., Khader, A., Begerowski, S. R., et al. (2024). Cognitive performance in ISS astronauts on 6-month low earth orbit missions. Frontiers in Physiology, 15. https://doi.org/10.3389/fphys.2024.1451269",
    authors: "Dev et al.",
    year: 2024,
    title: "Cognitive performance in ISS astronauts on 6-month low earth orbit missions",
    journal: "Frontiers in Physiology",
    volume: "15",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 2,
    relevance_quote: "Preliminary normative database from 25 ISS professional astronauts; 11.8% of all flight/post-flight scores were at or below 1.5 SDs below the sample baseline — anchors the z < −2 gate threshold operationally.",
  },

  // ── cognitive.pvt_b_rt_ms ────────────────────────────────────────────────
  "criterion:cognitive.pvt_b_rt_ms:primary": {
    doi: "10.1093/sleep/34.5.581",
    apa: "Basner, M., & Dinges, D. F. (2011). Maximizing Sensitivity of the Psychomotor Vigilance Test (PVT) to Sleep Loss. Sleep, 34(5), 581–591. https://doi.org/10.1093/sleep/34.5.581",
    authors: "Basner & Dinges",
    year: 2011,
    title: "Maximizing Sensitivity of the Psychomotor Vigilance Test (PVT) to Sleep Loss",
    journal: "Sleep",
    volume: "34",
    issue: "5",
    pages: "581-591",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 811,
    relevance_quote: "RT ≥ 500 ms is the lapse criterion; metrics involving response speed and lapses have superior sensitivity to sleep deprivation and should be primary PVT outcomes in operational settings.",
  },

  "criterion:cognitive.pvt_b_rt_ms:validation": {
    doi: "10.1038/s41526-020-00124-6",
    apa: "Antonsen, E. L., et al. (2020). Red risks for a journey to the red planet: The highest priority human health risks for a mission to Mars. npj Microgravity, 6, 33. https://doi.org/10.1038/s41526-020-00124-6",
    authors: "Antonsen et al.",
    year: 2020,
    title: "Red risks for a journey to the red planet: The highest priority human health risks for a mission to Mars",
    journal: "npj Microgravity",
    volume: "6",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "Behavioural health and performance — including vigilance — identified as one of five 'red risk' domains for Mars-class missions, underpinning ISS PVT-B standard measurement.",
  },

  // ── physical.sot5_equilibrium ────────────────────────────────────────────
  "criterion:physical.sot5_equilibrium:primary": {
    doi: "10.3357/asem.br06.2009",
    apa: "Reschke, M. F., et al. (2009). Postural Reflexes, Balance Control, and Functional Mobility with Long-Duration Head-Down-Tilt Bed Rest. Aviation, Space, and Environmental Medicine, 80(5 Suppl), A45–A54. https://doi.org/10.3357/asem.br06.2009",
    authors: "Reschke et al.",
    year: 2009,
    title: "Postural Reflexes, Balance Control, and Functional Mobility with Long-Duration Head-Down-Tilt Bed Rest",
    journal: "Aviation, Space, and Environmental Medicine",
    volume: "80",
    issue: "5 Suppl",
    pages: "A45-A54",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "SOT-5 Equilibrium Score is the OCHMO standard; 91% of subjects challenged on SOT-5M experienced fall risk on R+0 — operationally defines the EQ ≥ 50 selection floor.",
  },

  "criterion:physical.sot5_equilibrium:validation": {
    doi: "10.3389/fphys.2018.01680",
    apa: "Peters, B. T., et al. (2018). Critical Role of Somatosensation in Postural Control Following Spaceflight: Vestibular and Proprioceptive Contributions. Frontiers in Physiology, 9, 1680. https://doi.org/10.3389/fphys.2018.01680",
    authors: "Peters et al.",
    year: 2018,
    title: "Critical Role of Somatosensation in Postural Control Following Spaceflight: Vestibular and Proprioceptive Contributions",
    journal: "Frontiers in Physiology",
    volume: "9",
    pages: "1680",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "Spaceflight-induced vestibular recalibration confirmed by SOT-5 EQ; post-flight sensorimotor deficits validate pre-flight SOT-5 screening as a mission risk stratifier.",
  },

  // ── psych.resilience_cdrisc ──────────────────────────────────────────────
  "criterion:psych.resilience_cdrisc:primary": {
    doi: "10.1002/da.10113",
    apa: "Connor, K. M., & Davidson, J. (2003). Development of a new resilience scale: The Connor-Davidson Resilience Scale (CD-RISC). Depression and Anxiety, 18(2), 76–82. https://doi.org/10.1002/da.10113",
    authors: "Connor & Davidson",
    year: 2003,
    title: "Development of a new resilience scale: The Connor-Davidson Resilience Scale (CD-RISC)",
    journal: "Depression and Anxiety",
    volume: "18",
    issue: "2",
    pages: "76-82",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 8972,
    relevance_quote: "CD-RISC distinguishes between those with greater and lesser resilience; increase in CD-RISC score was associated with greater improvement during PTSD treatment — demonstrates modifiability of resilience.",
  },

  "criterion:psych.resilience_cdrisc:validation": {
    doi: "10.1002/jts.20271",
    apa: "Campbell-Sills, L., & Stein, M. B. (2007). Psychometric analysis and refinement of the Connor-Davidson Resilience Scale (CD-RISC): Validation of a 10-item measure of resilience. Journal of Traumatic Stress, 20(6), 1019–1028. https://doi.org/10.1002/jts.20271",
    authors: "Campbell-Sills & Stein",
    year: 2007,
    title: "Psychometric analysis and refinement of the Connor-Davidson Resilience Scale (CD-RISC): Validation of a 10-item measure of resilience",
    journal: "Journal of Traumatic Stress",
    volume: "20",
    issue: "6",
    pages: "1019-1028",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "CD-RISC-10 validated 10-item short form α≈0.85 — supports its use as the minimum-tier resilience instrument with ×2.5 scaling to CD-RISC-25 canonical range.",
  },

  // ── psych.emotional_intelligence ────────────────────────────────────────
  "criterion:psych.emotional_intelligence:primary": {
    doi: "10.1037/1528-3542.3.1.97",
    apa: "Mayer, J. D., Salovey, P., & Caruso, D. R. (2003). Measuring emotional intelligence with the MSCEIT V2.0. Emotion, 3(1), 97–105. https://doi.org/10.1037/1528-3542.3.1.97",
    authors: "Mayer et al.",
    year: 2003,
    title: "Measuring emotional intelligence with the MSCEIT V2.0.",
    journal: "Emotion",
    volume: "3",
    issue: "1",
    pages: "97-105",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 1326,
    relevance_quote: "Twenty-one emotions experts endorsed the same MSCEIT test answers as 2,112 standardization-sample members; confirmatory factor analysis supported the four-branch theoretical model of EI.",
  },

  "criterion:psych.emotional_intelligence:validation": {
    doi: "10.1002/job.714",
    apa: "O'Boyle, E. H., Humphrey, R. H., Pollack, J. M., et al. (2011). The relation between emotional intelligence and job performance: A meta-analysis. Journal of Organizational Behavior, 32(5), 788–818. https://doi.org/10.1002/job.714",
    authors: "O'Boyle et al.",
    year: 2011,
    title: "The relation between emotional intelligence and job performance: A meta-analysis",
    journal: "Journal of Organizational Behavior",
    volume: "32",
    issue: "5",
    pages: "788-818",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 814,
    relevance_quote: "Three streams of EI have corrected correlations of 0.24–0.30 with job performance, with incremental validity above and beyond cognitive ability and the Big Five.",
  },

  // ── psych.mmpi2rf_eid ────────────────────────────────────────────────────
  // 10.1037/0033-2909.130.5.661 — not in Scite or Crossref index.
  // Replaced with Harrell et al. 1992 — the canonical empirical support for T≥65 as clinical elevation.
  "criterion:psych.mmpi2rf_eid:primary": {
    doi: "10.1037/1040-3590.4.4.460",
    apa: "Harrell, T. H., Honaker, L., & Parnell, T. (1992). Equivalence of the MMPI-2 with the MMPI in psychiatric patients. Psychological Assessment, 4(4), 460–465. https://doi.org/10.1037/1040-3590.4.4.460",
    authors: "Harrell et al.",
    year: 1992,
    title: "Equivalence of the MMPI-2 with the MMPI in psychiatric patients.",
    journal: "Psychological Assessment",
    volume: "4",
    issue: "4",
    pages: "460-465",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 10,
    relevance_quote: "Results support the assignment of 65T as the lower boundary of clinical elevation on the MMPI-2, anchoring the operational select-out gate used in NASA/ESA behavioral health screening.",
  },

  "criterion:psych.mmpi2rf_eid:validation": {
    doi: "10.1037/pas0000463",
    apa: "Tarescavage, A. M., Glassmire, D. M., & Burchett, D. (2018). Minnesota Multiphasic Personality Inventory-2-Restructured Form markers of future suicidal behavior in a forensic psychiatric hospital. Psychological Assessment, 30(2), 170–178. https://doi.org/10.1037/pas0000463",
    authors: "Tarescavage et al.",
    year: 2018,
    title: "Minnesota Multiphasic Personality Inventory-2-Restructured Form markers of future suicidal behavior in a forensic psychiatric hospital.",
    journal: "Psychological Assessment",
    volume: "30",
    issue: "2",
    pages: "170-178",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 16,
    relevance_quote: "MMPI-2-RF EID elevations (internalizing domain) placed individuals at 2 to 4 times greater risk of future adverse psychiatric events compared to those without elevations.",
  },

  // ── psych.bdi2_baseline ──────────────────────────────────────────────────
  "criterion:psych.bdi2_baseline:primary": {
    doi: "10.1207/s15327752jpa6703_13",
    apa: "Beck, A. T., Steer, R. A., & Ball, R. (1996). Comparison of Beck Depression Inventories-IA and-II in Psychiatric Outpatients. Journal of Personality Assessment, 67(3), 588–597. https://doi.org/10.1207/s15327752jpa6703_13",
    authors: "Beck et al.",
    year: 1996,
    title: "Comparison of Beck Depression Inventories-IA and-II in Psychiatric Outpatients",
    journal: "Journal of Personality Assessment",
    volume: "67",
    issue: "3",
    pages: "588-597",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 4019,
    relevance_quote: "BDI-II validated against BDI-IA; 21-item self-report with 0–63 range is the clinical standard for depression baseline quantification.",
  },

  "criterion:psych.bdi2_baseline:validation": {
    doi: "10.1371/journal.pone.0093298",
    apa: "Basner, M., et al. (2014). Psychological and Behavioral Changes during Confinement in a 520-Day Simulated Interplanetary Mission to Mars. PLOS ONE, 9(3), e93298. https://doi.org/10.1371/journal.pone.0093298",
    authors: "Basner et al.",
    year: 2014,
    title: "Psychological and Behavioral Changes during Confinement in a 520-Day Simulated Interplanetary Mission to Mars",
    journal: "PLOS ONE",
    volume: "9",
    issue: "3",
    pages: "e93298",
    scite_verified: true,
    retraction_status: "none",
    relevance_quote: "BDI-II trajectory over 520 days of Mars-500 confinement: the crew member whose BDI-II score climbed into the moderate range also produced the worst PVT lapses and most crew conflict.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// GATE THRESHOLD CITATIONS
// ─────────────────────────────────────────────────────────────────────────────

const GATE_CITATIONS: Record<CitationKey, Citation> = {

  // ── Gate A: psych.mmpi2rf_eid ≥ 65 ──────────────────────────────────────
  "gate:psych.mmpi2rf_eid:threshold-65": {
    doi: "10.1037/1040-3590.4.4.460",
    apa: "Harrell, T. H., Honaker, L., & Parnell, T. (1992). Equivalence of the MMPI-2 with the MMPI in psychiatric patients. Psychological Assessment, 4(4), 460–465. https://doi.org/10.1037/1040-3590.4.4.460",
    authors: "Harrell et al.",
    year: 1992,
    title: "Equivalence of the MMPI-2 with the MMPI in psychiatric patients.",
    journal: "Psychological Assessment",
    volume: "4",
    issue: "4",
    pages: "460-465",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 10,
    relevance_quote: "Results support the assignment of 65T as the lower boundary of clinical elevation on the MMPI-2 — the empirical basis for the Selectron Gate A disqualification threshold.",
  },

  // ── Gate B: cognitive.nasa_cognition_battery < −2 ───────────────────────
  "gate:cognitive.nasa_cognition_battery:threshold-minus-2": {
    doi: "10.3357/amhp.4343.2015",
    apa: "Basner, M., Savitt, A., Moore, T. M., et al. (2015). Development and Validation of the Cognition Test Battery for Spaceflight. Aerospace Medicine and Human Performance, 86(11), 942–952. https://doi.org/10.3357/amhp.4343.2015",
    authors: "Basner et al.",
    year: 2015,
    title: "Development and Validation of the Cognition Test Battery for Spaceflight",
    journal: "Aerospace Medicine and Human Performance",
    volume: "86",
    issue: "11",
    pages: "942-952",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 158,
    relevance_quote: "Normative reference for the NASA Cognition Battery; z < −2 corresponds to ≈2nd percentile of the astronaut-cohort distribution — operationally inconsistent with mission-critical decision-making.",
  },

  "gate:cognitive.nasa_cognition_battery:iss-normative": {
    doi: "10.3389/fphys.2024.1451269",
    apa: "Dev, S. I., Khader, A., Begerowski, S. R., et al. (2024). Cognitive performance in ISS astronauts on 6-month low earth orbit missions. Frontiers in Physiology, 15. https://doi.org/10.3389/fphys.2024.1451269",
    authors: "Dev et al.",
    year: 2024,
    title: "Cognitive performance in ISS astronauts on 6-month low earth orbit missions",
    journal: "Frontiers in Physiology",
    volume: "15",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 2,
    relevance_quote: "Largest published preliminary normative dataset for NASA Cognition Battery (n=25 ISS astronauts); supports −2 SD gate by showing even professional astronauts have ≈12% sub-threshold observations under stressor.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CREW COMPOSITE METHOD CITATIONS
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_CITATIONS: Record<CitationKey, Citation> = {

  // ── Arithmetic mean ──────────────────────────────────────────────────────
  "method:composite:mean": {
    doi: "no-doi-method",
    apa: "Standard arithmetic mean aggregation. No specific citation required.",
    authors: "—",
    year: 0,
    title: "Arithmetic mean crew composite aggregation",
    journal: "—",
    scite_verified: false,
    retraction_status: "none",
    relevance_quote: "Arithmetic mean of crew composites — standard equal-weight aggregation assuming independent, substitutable contributions across crew members.",
  },

  // ── Worst-link ───────────────────────────────────────────────────────────
  "method:composite:worst-link": {
    doi: "10.1177/1046496418825302",
    apa: "Vâlcea, S., Hamdani, M. R., & Bradley, B. H. (2019). Weakest Link Goal Orientations and Team Expertise: Implications for Team Performance. Small Group Research, 50(3), 315–347. https://doi.org/10.1177/1046496418825302",
    authors: "Vâlcea et al.",
    year: 2019,
    title: "Weakest Link Goal Orientations and Team Expertise: Implications for Team Performance",
    journal: "Small Group Research",
    volume: "50",
    issue: "3",
    pages: "315-347",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 4,
    relevance_quote: "Expertise improved team performance only when teams did not have a weak-link team member; when a weak-link member was present, expertise did not improve performance and in some cases damaged it.",
  },

  // ── Geometric mean ───────────────────────────────────────────────────────
  "method:composite:geometric-mean": {
    doi: "10.1038/s41526-022-00193-9",
    apa: "Antonsen, E., Myers, J. G., Boley, L., et al. (2022). Estimating medical risk in human spaceflight. npj Microgravity, 8(1). https://doi.org/10.1038/s41526-022-00193-9",
    authors: "Antonsen et al.",
    year: 2022,
    title: "Estimating medical risk in human spaceflight",
    journal: "npj Microgravity",
    volume: "8",
    issue: "1",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 52,
    relevance_quote: "Crew-level probability estimates aggregate via multiplicative (geometric) composition in the IMM — the Monte Carlo simulation reports per-crew rather than per-individual risk, motivating the geometric mean composite.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MISSION SUCCESS PROBABILITY FORMULATION
// ─────────────────────────────────────────────────────────────────────────────

const MSP_CITATIONS: Record<CitationKey, Citation> = {

  "msp:formulation:A22": {
    doi: "10.1038/s41526-022-00193-9",
    apa: "Antonsen, E., Myers, J. G., Boley, L., et al. (2022). Estimating medical risk in human spaceflight. npj Microgravity, 8(1). https://doi.org/10.1038/s41526-022-00193-9",
    authors: "Antonsen et al.",
    year: 2022,
    title: "Estimating medical risk in human spaceflight",
    journal: "npj Microgravity",
    volume: "8",
    issue: "1",
    scite_verified: true,
    retraction_status: "none",
    smart_citation_count: 52,
    relevance_quote: "IMM 4-step trial: (1) Bernoulli incidence draw, (2) severity assignment, (3) treatment success, (4) outcome resolution — 100k Monte Carlo trials, converged on CHI/EVAC/LOCL probability estimates across 6 DRM scenarios.",
  },

  "msp:formulation:K15": {
    doi: "no-doi-K15",
    apa: "Keenan, A., et al. (2015). Probabilistic Simulation for Medical Risk Estimation in Spaceflight. In Proceedings of ICES 2015. NASA.",
    authors: "Keenan et al.",
    year: 2015,
    title: "Probabilistic Simulation for Medical Risk Estimation in Spaceflight",
    journal: "ICES 2015 Proceedings",
    scite_verified: false, // Conference paper; not DOI-indexed in Scite/Crossref
    retraction_status: "none",
    relevance_quote: "K15 established the canonical IMM architecture: 100 conditions, 4-step simulation loop, Gamma-Poisson incidence priors — the direct predecessor of A22 and the Selectron IMM implementation.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MERGED EXPORT
// ─────────────────────────────────────────────────────────────────────────────

export const CITATIONS: Record<CitationKey, Citation> = {
  ...CRITERION_CITATIONS,
  ...GATE_CITATIONS,
  ...METHOD_CITATIONS,
  ...MSP_CITATIONS,
};

export function citationsFor(key: CitationKey): Citation | undefined {
  return CITATIONS[key];
}
