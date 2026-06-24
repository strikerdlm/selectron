const MESSAGE = `Retired paper figure generator.

scripts/generate_f5_convergence.ts used to generate
paper/figures/F5_convergence.svg for the retired private manuscript package.
That artwork framed trailing-window sigma as convergence evidence, which the
2026-06-24 scientific audit rejected as insufficient for estimator precision.

Do not regenerate legacy paper figures. Build any future figures from an
audit-synchronized specification that reports MCSE, rare-event precision,
independent-seed replication, and conditional simulation language.`;

console.error(MESSAGE);
process.exitCode = 1;
