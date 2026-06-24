const MESSAGE = `Retired paper worked-example extractor.

scripts/extract_worked_example.ts supported the retired private manuscript
figures and text. It used Bayesian/posterior suitability wording, tier-filtered
criterion examples, sigma convergence framing, and HSRB-style LxC summaries
that conflict with the 2026-06-24 scientific audit.

Do not regenerate this legacy worked example. Any future worked example must
be rebuilt from an audit-synchronized methods-paper specification.`;

console.error(MESSAGE);
process.exitCode = 1;
