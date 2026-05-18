"""
Reproducibility script for Phase 3.0 source acquisition.

This script is NOT the orchestrator. It is the idempotent re-fetcher: given a
target ref_id (e.g. "G12"), it (a) checks whether the markdown + PDF exist
under the right classification folder, (b) verifies the SHA-256 of the PDF
against a recorded value when available, (c) prints SKIP if present and
verified, FETCH if not.

The MCP fetch itself is performed by the calling agent (firecrawl-mcp or
zotero-pdf-ocr). This script just keeps track of what is present on disk and
exits with the right action so a resumed agent knows where to pick up.

Usage:
    python _fetch_imm_sources.py --ref G12          # check one
    python _fetch_imm_sources.py --ref all          # check all Tier 1
    python _fetch_imm_sources.py --ref all --json   # machine-readable
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path

HERE = Path(__file__).resolve().parent


@dataclass(frozen=True)
class Source:
    ref_id: str
    classification: str  # methods | architecture | validation
    slug: str
    canonical_url: str
    fallback_url: str | None = None
    expected_pdf_sha256: str | None = None


CATALOG: dict[str, Source] = {
    "G12": Source(
        "G12", "methods", "G12_gilkey_2012_bayesian_imm",
        canonical_url="https://core.ac.uk/download/pdf/10569519.pdf",
        fallback_url="https://ntrs.nasa.gov/citations/20120013096",
    ),
    "M18": Source(
        "M18", "methods", "M18_myers_2018_imm_validation",
        canonical_url="https://www.iapsam.org/psam14/proceedings/paper/paper_174_1.pdf",
    ),
    "A22": Source(
        "A22", "methods", "A22_antonsen_2022_medical_risk_human_spaceflight",
        canonical_url="https://doi.org/10.1038/s41526-022-00193-9",
        fallback_url="https://www.nature.com/articles/s41526-022-00193-9",
    ),
    "K15": Source(
        "K15", "architecture", "K15_keenan_2015_imm_probabilistic_simulation",
        canonical_url="https://ntrs.nasa.gov/citations/20150018879",
    ),
    "W14": Source(
        "W14", "validation", "W14_walton_2014_nasa_std_7009",
        canonical_url="https://ntrs.nasa.gov/citations/20140017301",
    ),
    "S20": Source(
        "S20", "validation", "S20_walton_kerstman_2020_iss_quantification",
        canonical_url="https://doi.org/10.3357/AMHP.5432.2020",
    ),
}


def target_paths(s: Source) -> tuple[Path, Path]:
    base = HERE / s.classification / s.slug
    return Path(str(base) + ".md"), Path(str(base) + ".pdf")


def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()


def status(s: Source) -> dict[str, object]:
    md, pdf = target_paths(s)
    md_present = md.exists() and md.stat().st_size > 0
    pdf_present = pdf.exists() and pdf.stat().st_size > 0
    pdf_hash = sha256(pdf) if pdf_present else None
    hash_ok = (s.expected_pdf_sha256 is None) or (pdf_hash == s.expected_pdf_sha256)
    action = "SKIP" if (md_present and (pdf_present or s.canonical_url.endswith("/abs")) and hash_ok) else "FETCH"
    return {
        "ref_id": s.ref_id,
        "classification": s.classification,
        "slug": s.slug,
        "canonical_url": s.canonical_url,
        "fallback_url": s.fallback_url,
        "md_path": str(md.relative_to(HERE)),
        "pdf_path": str(pdf.relative_to(HERE)),
        "md_present": md_present,
        "pdf_present": pdf_present,
        "pdf_sha256": pdf_hash,
        "action": action,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--ref", required=True, help="ref_id from CATALOG, or 'all'")
    ap.add_argument("--json", action="store_true", help="emit JSON")
    args = ap.parse_args()

    refs = list(CATALOG.keys()) if args.ref == "all" else [args.ref]
    rows = []
    for r in refs:
        if r not in CATALOG:
            print(f"unknown ref: {r}", file=sys.stderr)
            return 2
        rows.append(status(CATALOG[r]))

    if args.json:
        print(json.dumps(rows, indent=2))
    else:
        for row in rows:
            print(f"{row['action']:>5}  {row['ref_id']}  {row['slug']:<60}  -> {row['md_path']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
