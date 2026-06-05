"""Atomic merge of fitted priors into imm-priors.json."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from selectron.fitter import FitResult
from selectron.priors_io import load_priors, save_priors

logger = logging.getLogger(__name__)


@dataclass
class ConditionDiff:
    """Diff for one condition before/after merge."""

    condition_id: str
    field: str
    old_value: Any
    new_value: Any


@dataclass
class WriterReport:
    """Report from a priors merge operation."""

    n_updated: int = 0
    n_unchanged: int = 0
    updated: dict[str, list[ConditionDiff]] = field(default_factory=dict)
    dry_run: bool = False

    def to_markdown(self) -> str:
        mode = "DRY RUN" if self.dry_run else "APPLIED"
        lines = [
            f"# Priors Merge Report ({mode})",
            "",
            f"**Updated:** {self.n_updated} conditions",
            f"**Unchanged:** {self.n_unchanged} conditions",
            "",
        ]
        if self.updated:
            lines.append("## Changes")
            lines.append("")
            for cid, diffs in self.updated.items():
                lines.append(f"### {cid}")
                lines.append("")
                for d in diffs:
                    lines.append(f"- `{d.field}`: `{d.old_value}` -> `{d.new_value}`")
                lines.append("")
        return "\n".join(lines)


def merge_fitted_priors(
    *,
    fitted: dict[str, FitResult],
    priors_path: Path | None = None,
    dry_run: bool = False,
) -> WriterReport:
    """Merge fitted posteriors into imm-priors.json."""
    data = load_priors(priors_path)
    report = WriterReport(dry_run=dry_run)

    for cid, prior in data["conditions"].items():
        if cid not in fitted:
            report.n_unchanged += 1
            continue

        result = fitted[cid]
        diffs: list[ConditionDiff] = []

        old_alpha = prior["incidence"].get("alpha")
        if old_alpha != result.posterior_alpha:
            diffs.append(ConditionDiff(cid, "incidence.alpha", old_alpha, result.posterior_alpha))
            if not dry_run:
                prior["incidence"]["alpha"] = result.posterior_alpha

        old_beta = prior["incidence"].get("beta")
        if old_beta != result.posterior_beta:
            diffs.append(ConditionDiff(cid, "incidence.beta", old_beta, result.posterior_beta))
            if not dry_run:
                prior["incidence"]["beta"] = result.posterior_beta

        old_prov = prior.get("provenance")
        if old_prov != "tierB-pymc":
            diffs.append(ConditionDiff(cid, "provenance", old_prov, "tierB-pymc"))
            if not dry_run:
                prior["provenance"] = "tierB-pymc"

        new_ref = f"python/outputs/fitted_priors/{cid}/{cid}.json"
        old_ref = prior.get("source_ref")
        if old_ref != new_ref:
            diffs.append(ConditionDiff(cid, "source_ref", old_ref, new_ref))
            if not dry_run:
                prior["source_ref"] = new_ref

        if diffs:
            report.updated[cid] = diffs
            report.n_updated += 1
        else:
            report.n_unchanged += 1

    if not dry_run:
        save_priors(data, priors_path)

    return report
