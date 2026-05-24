"""Mapping from evidence-proposal condition IDs to imm-priors.json condition IDs."""

from __future__ import annotations

PROPOSAL_TO_PRIOR_ID: dict[str, str] = {
    "depression-anxiety": "depression",
    "depression": "depression",
    "respiratory-infection": "respiratory-infection",
    "mouth-ulcer": "mouth-ulcer",
    "skin-rash": "skin-rash",
    "headache-late": "headache-late",
    "gastroenteritis": "gastroenteritis",
    "pharyngitis": "pharyngitis",
    "otitis-externa": "otitis-externa",
    "otitis-media": "otitis-media",
    "hypertension": "hypertension",
    "eye-infection": "eye-infection",
    "eye-corneal-ulcer": "eye-corneal-ulcer",
}

UNMAPPED_PROPOSAL_IDS: set[str] = {
    "insomnia",
    "circadian-disruption",
    "conflict-event",
    "performance-drop-pvt",
    "early-termination-request",
}


def map_proposal_id(proposal_id: str) -> str | None:
    """Map a proposal condition_id to its imm-priors.json conditionId.

    Returns None if the proposal ID has no matching tier-B condition.
    """
    return PROPOSAL_TO_PRIOR_ID.get(proposal_id)
