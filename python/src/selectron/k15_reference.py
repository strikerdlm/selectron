"""K15 Table 1 reference values and crew profile.

Constants from Keenan 2015 (ICES-2015-123) §III.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import NamedTuple


class K15Metrics(NamedTuple):
    """K15 Table 1 reference values for one scenario."""

    tme_mean: float
    chi_mean: float
    p_evac_mean: float
    p_locl_mean: float


class K15CI95(NamedTuple):
    """K15 Table 1 CI95 brackets for one scenario."""

    tme: tuple[float, float]
    chi: tuple[float, float]
    p_evac: tuple[float, float]
    p_locl: tuple[float, float]


K15_REF: dict[str, K15Metrics] = {
    "none":      K15Metrics(tme_mean=98.3,  chi_mean=59.20, p_evac_mean=66.90, p_locl_mean=2.89),
    "issHMS":    K15Metrics(tme_mean=106.0, chi_mean=94.93, p_evac_mean=5.57,  p_locl_mean=0.44),
    "unlimited": K15Metrics(tme_mean=106.0, chi_mean=94.98, p_evac_mean=4.93,  p_locl_mean=0.45),
}

K15_CI95: dict[str, K15CI95] = {
    "none":      K15CI95(tme=(73, 122),     chi=(43.36, 71.25), p_evac=(66.57, 67.14), p_locl=(2.78, 2.99)),
    "issHMS":    K15CI95(tme=(87, 126),     chi=(84.30, 98.50), p_evac=(5.43, 5.72),   p_locl=(0.40, 0.49)),
    "unlimited": K15CI95(tme=(87, 126),     chi=(84.40, 98.50), p_evac=(4.80, 5.07),   p_locl=(0.41, 0.49)),
}


@dataclass(frozen=True)
class CrewMember:
    """Minimal crew member profile for forward MC."""

    id: str
    sex: str
    contacts: bool
    crowns: bool
    cac_positive: bool
    abdominal_surgery_history: bool
    eva_eligible: bool
    eva_count: int


K15_REFERENCE_CREW: list[CrewMember] = [
    CrewMember("c1", "male",   True,  True,  True,  False, True,  6),
    CrewMember("c2", "male",   True,  True,  False, False, True,  6),
    CrewMember("c3", "male",   True,  False, False, False, False, 0),
    CrewMember("c4", "male",   False, False, False, False, False, 0),
    CrewMember("c5", "female", False, False, False, False, False, 0),
    CrewMember("c6", "female", False, False, False, False, True,  0),
]

K15_MISSION_DURATION_DAYS = 180
K15_CREW_SIZE = 6
K15_TRIALS = 100_000
K15_SEED = 0xC0FFEE
