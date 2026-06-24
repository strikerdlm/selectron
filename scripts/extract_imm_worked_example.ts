const MESSAGE = `Retired paper worked-example extractor.

scripts/extract_imm_worked_example.ts used to generate the data backing the
retired private manuscript F6/F7 HSRB-style figures. Those figures and their
paper/figures/imm-worked-example.json payload were removed after the
2026-06-24 scientific audit.

Do not regenerate this legacy worked example. Any future worked example must
be defined against the active methods manuscript, current evidence-status
snapshot, and current non-operational scenario-analysis terminology.`;

console.error(MESSAGE);
process.exitCode = 1;
