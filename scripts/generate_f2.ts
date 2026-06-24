const MESSAGE = `Retired paper figure generator.

scripts/generate_f2.ts used to generate paper/figures/F2_criterion_tiers.svg
for the retired private manuscript package. That artwork encoded
tier-dependent criterion availability, a separate PVT-B item, and green active
status indicators that conflict with the 2026-06-24 scientific audit.

Do not regenerate legacy paper figures. Build any future figures from an
audit-synchronized specification that uses the current verification-first
Selectron claim boundary.`;

console.error(MESSAGE);
process.exitCode = 1;
