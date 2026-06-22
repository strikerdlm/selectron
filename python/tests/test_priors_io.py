"""Tests for priors I/O and condition mapping."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pytest

from selectron.condition_mapping import (
    PROPOSAL_TO_PRIOR_ID,
    map_proposal_id,
    UNMAPPED_PROPOSAL_IDS,
)
from selectron.priors_io import (
    load_priors,
    save_priors,
    get_tier_b_conditions,
    load_accepted_evidence,
    load_evidence_proposals,
)


class TestConditionMapping:
    def test_depression_anxiety_maps_to_depression(self) -> None:
        assert map_proposal_id("depression-anxiety") == "depression"

    def test_unmapped_id_returns_none(self) -> None:
        assert map_proposal_id("circadian-disruption") is None

    def test_unmapped_ids_documented(self) -> None:
        expected_unmapped = {
            "insomnia",
            "circadian-disruption",
            "conflict-event",
            "performance-drop-pvt",
            "early-termination-request",
        }
        assert expected_unmapped == UNMAPPED_PROPOSAL_IDS

    def test_unknown_id_returns_none(self) -> None:
        assert map_proposal_id("totally-made-up") is None


class TestLoadPriors:
    def test_load_from_real_file(self) -> None:
        data = load_priors()
        assert data["schema_version"] == 1
        assert "conditions" in data
        assert len(data["conditions"]) == 101
        assert "interpersonal-conflict" in data["conditions"]

    def test_load_from_custom_path(self, tmp_priors: Path) -> None:
        data = load_priors(tmp_priors)
        assert data["schema_version"] == 1

    def test_invalid_schema_version_raises(self, tmp_path: Path) -> None:
        bad = {"schema_version": 999, "conditions": {}}
        p = tmp_path / "bad.json"
        with open(p, "w") as f:
            json.dump(bad, f)
        with pytest.raises(ValueError, match="schema_version"):
            load_priors(p)


class TestSavePriors:
    def test_round_trip(self, tmp_priors: Path) -> None:
        original = load_priors(tmp_priors)
        original["conditions"]["depression"]["incidence"]["alpha"] = 99.9
        save_priors(original, tmp_priors)
        reloaded = load_priors(tmp_priors)
        assert reloaded["conditions"]["depression"]["incidence"]["alpha"] == 99.9

    def test_atomic_write_no_partial(self, tmp_priors: Path) -> None:
        original = load_priors(tmp_priors)
        bad_data = {"schema_version": 999, "conditions": {}}
        with pytest.raises(ValueError):
            save_priors(bad_data, tmp_priors)
        reloaded = load_priors(tmp_priors)
        assert reloaded == original


class TestGetTierBConditions:
    def test_returns_fittable_tier_b_gamma_poisson_conditions(self) -> None:
        data = load_priors()
        tier_b = get_tier_b_conditions(data)
        assert len(tier_b) == 66
        assert "interpersonal-conflict" in tier_b

    def test_all_have_fittable_tier_b_provenance(self) -> None:
        data = load_priors()
        tier_b = get_tier_b_conditions(data)
        for cid, prior in tier_b.items():
            assert prior["provenance"] in {"tierB-lit", "tierB-pymc"}, (
                f"{cid} is not fittable tier-B"
            )

    def test_distribution_counts(self) -> None:
        data = load_priors()
        tier_b = get_tier_b_conditions(data)
        gamma_count = sum(
            1 for v in tier_b.values()
            if v["incidence"]["distribution"] == "Gamma-Poisson"
        )
        beta_count = sum(
            1 for v in tier_b.values()
            if v["incidence"]["distribution"] == "Beta-Bernoulli"
        )
        assert gamma_count == len(tier_b)
        assert beta_count == 0


class TestLoadEvidenceProposals:
    def test_loads_and_deduplicates(self) -> None:
        rows = load_evidence_proposals()
        assert len(rows) >= 20  # 13 from p-a/p-b + 9 from p-d

    def test_maps_condition_ids(self) -> None:
        rows = load_evidence_proposals()
        mapped = [r for r in rows if r["mapped_prior_id"] is not None]
        assert len(mapped) >= 10
        mapped_ids = {r["mapped_prior_id"] for r in mapped}
        assert "depression" in mapped_ids
        assert "respiratory-infection" in mapped_ids
        assert "skin-rash" in mapped_ids

    def test_all_rows_have_required_columns(self) -> None:
        rows = load_evidence_proposals()
        required = {"condition_id", "person_days", "events", "study_slug", "mapped_prior_id"}
        for r in rows:
            assert required.issubset(r.keys()), f"Missing columns in {r}"
            assert isinstance(r["person_days"], int)
            assert isinstance(r["events"], int)


class TestLoadAcceptedEvidence:
    def test_filters_to_accepted_independently_verified_rows(self, tmp_path: Path) -> None:
        ledger = tmp_path / "evidence_ledger.csv"
        ledger.write_text(
            "status,condition_id,mapped_prior_id,mission_type,study_doi,study_slug,"
            "endpoint_definition,numerator,denominator,person_days,events,exposure_time,"
            "repeated_measure_structure,extraction_quote,extractor,verifier,risk_of_bias,"
            "transportability,transformation,uncertainty_distribution,model_version,notes\n"
            "accepted,depression,,analog-controlled,10.1/demo,demo-study,events,2,10,1000,2,1000,"
            "participant-level,table 1,alice,bob,moderate,partial,none,gamma,v0.6,\n"
            "subagent-proposal,skin-rash,,analog-controlled,,proposal-study,events,1,5,500,1,500,"
            "unclear,estimate,alice,bob,high,low,none,gamma,v0.6,\n"
            "accepted,respiratory-infection,,analog-controlled,,unverified,events,1,5,500,1,500,"
            "participant-level,table 2,alice,,moderate,partial,none,gamma,v0.6,\n"
        )

        rows = load_accepted_evidence(ledger)

        assert len(rows) == 1
        assert rows[0]["condition_id"] == "depression"
        assert rows[0]["mapped_prior_id"] == "depression"
        assert rows[0]["person_days"] == 1000
        assert rows[0]["events"] == 2

    def test_missing_ledger_returns_empty_list(self, tmp_path: Path) -> None:
        assert load_accepted_evidence(tmp_path / "missing.csv") == []
