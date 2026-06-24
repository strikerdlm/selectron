const MESSAGE = `Retired paper supplement generator.

scripts/generate_s1_ess_table.ts used to generate
paper/figures/S1_ess_table.svg for the retired private manuscript package.
That table reported legacy ESS, HSRB LxC, and verdict-color fields that no
longer match the current Selectron claim boundary.

Do not regenerate legacy paper artifacts. Build any future supplement from an
audit-synchronized specification that uses current simulation-precision and
non-operational review-language boundaries.`;

console.error(MESSAGE);
process.exitCode = 1;
