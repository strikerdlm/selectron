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
    "eye-penetration-foreign-body": "eye-penetration-foreign-body",
    "retinal-detachment": "retinal-detachment",
    "acute-glaucoma": "acute-glaucoma",
    "dental-exposed-pulp": "dental-exposed-pulp",
    "dental-filling-loss": "dental-filling-loss",
    "dental-crown-loss": "dental-crown-loss",
    "dental-avulsion-tooth-loss": "dental-avulsion-tooth-loss",
    "shoulder-sprain-strain": "shoulder-sprain-strain",
    "knee-sprain-strain": "knee-sprain-strain",
    "elbow-sprain-strain": "elbow-sprain-strain",
    "hip-sprain-strain": "hip-sprain-strain",
    "wrist-sprain-strain": "wrist-sprain-strain",
    "cardiogenic-shock-secondary-to-myocardial-infarction": "cardiogenic-shock-secondary-to-myocardial-infarction",
    "barotrauma-ear-sinus-block": "barotrauma-ear-sinus-block",
    "hearing-loss": "hearing-loss",
    "hemorrhoids": "hemorrhoids",
    "vaginal-yeast-infection": "vaginal-yeast-infection",
    "abnormal-uterine-bleeding": "abnormal-uterine-bleeding",
    "back-pain-space-adaptation": "back-pain-space-adaptation",
    "constipation-space-adaptation": "constipation-space-adaptation",
    "fingernail-delamination": "fingernail-delamination",
    "headache-space-adaptation": "headache-space-adaptation",
    "insomnia-space-adaptation": "insomnia-space-adaptation",
    "nasal-congestion-space-adaptation": "nasal-congestion-space-adaptation",
    "nose-bleed-space-adaptation": "nose-bleed-space-adaptation",
    "paresthesias": "paresthesias",
    "space-motion-sickness-space-adaptation": "space-motion-sickness-space-adaptation",
    "urinary-incontinence-space-adaptation": "urinary-incontinence-space-adaptation",
    "urinary-retention-space-adaptation": "urinary-retention-space-adaptation",
    "abdominal-injury": "abdominal-injury",
    "abdominal-wall-hernia": "abdominal-wall-hernia",
    "acute-arthritis": "acute-arthritis",
    "acute-compartment-syndrome": "acute-compartment-syndrome",
    "acute-pancreatitis": "acute-pancreatitis",
    "acute-prostatitis": "acute-prostatitis",
    "acute-radiation-syndrome": "acute-radiation-syndrome",
    "altitude-sickness": "altitude-sickness",
    "anaphylaxis": "anaphylaxis",
    "choking-obstructed-airway": "choking-obstructed-airway",
    "elbow-dislocation": "elbow-dislocation",
    "finger-dislocation": "finger-dislocation",
    "hip-proximal-femur-fracture": "hip-proximal-femur-fracture",
    "lower-extremity-le-stress-fracture": "lower-extremity-le-stress-fracture",
    "lumbar-spine-fracture": "lumbar-spine-fracture",
    "neurogenic-shock": "neurogenic-shock",
    "shoulder-dislocation": "shoulder-dislocation",
    "smoke-inhalation": "smoke-inhalation",
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
