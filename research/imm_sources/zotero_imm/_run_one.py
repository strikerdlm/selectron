#!/usr/bin/env python3
"""
Task 29 helper: fetch one Zotero PDF, OCR via Mistral, write task-spec frontmatter.

Reads _query_results.json, processes one item_key, updates JSON with status.

Usage:
    _run_one.py <item_key> [--output-path PATH] [--strip-frontmatter]

If --output-path is set, writes to that exact path (used for S20 backfill +
NASA-STD-7009 full standard). Otherwise writes to zotero_imm/<slug>.md.
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

REPO = Path("/root/repos/Selectron")
IMM = REPO / "research" / "imm_sources"
ZOTERO_IMM = IMM / "zotero_imm"
PDFS_TMP = IMM / "_pdfs_tmp"
PDFS_TMP.mkdir(exist_ok=True)
QR_JSON = ZOTERO_IMM / "_query_results.json"

SKILL_ROOT = Path("/root/.claude/skills/zotero-pdf-ocr")
FETCH_PDF = SKILL_ROOT / "scripts" / "fetch_pdf.py"
OCR_PIPELINE = Path("/root/.claude/skills/ocr-pipeline/ocr_pipeline.py")


def load_env_into_os(env_path: Path):
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ[k.strip()] = v.strip().strip('"').strip("'")


def slugify(text: str, max_words: int = 6) -> str:
    text = re.sub(r"[^\w\s-]", "", text.lower())
    words = text.split()[:max_words]
    return "-".join(w for w in words if w)


def first_author_slug(authors):
    if not authors:
        return "unknown"
    a = authors[0]
    # "Walton, Marlei E" -> "walton"
    surname = a.split(",")[0].strip().split()[0]
    surname = re.sub(r"[^\w]", "", surname).lower()
    return surname


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("item_key")
    ap.add_argument("--output-path", default=None,
                    help="Override output path (used for validation backfills)")
    ap.add_argument("--preserve-frontmatter-from", default=None,
                    help="Preserve frontmatter from existing file (for S20 backfill)")
    args = ap.parse_args()

    load_env_into_os(SKILL_ROOT / ".env")
    if not os.environ.get("MISTRAL_API_KEY"):
        sys.exit("ERROR: MISTRAL_API_KEY missing in skill .env")

    # Load query results
    qr = json.loads(QR_JSON.read_text())
    entry = next((c for c in qr["curated_for_ocr"] if c["item_key"] == args.item_key), None)
    if not entry:
        sys.exit(f"item_key {args.item_key} not in curated_for_ocr")
    if entry.get("ocr_status") == "done":
        print(f"SKIP: {args.item_key} already done — {entry.get('output_md')}")
        return

    att = entry["attachment_key"]
    if not att:
        entry["ocr_status"] = "no_pdf"
        QR_JSON.write_text(json.dumps(qr, indent=2))
        sys.exit(f"{args.item_key} has no attachment")

    # Fetch PDF
    print(f"\n[FETCH] {args.item_key} attachment {att}")
    res = subprocess.run(
        ["python3", str(FETCH_PDF), att, "--out-dir", str(PDFS_TMP)],
        capture_output=True, text=True,
    )
    if res.returncode != 0:
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        entry["ocr_status"] = "fetch_failed"
        entry["error"] = res.stderr[:500]
        QR_JSON.write_text(json.dumps(qr, indent=2))
        sys.exit(1)
    pdf_path = Path(res.stdout.strip().splitlines()[-1])
    if not pdf_path.exists():
        sys.exit(f"PDF not at {pdf_path}")
    print(f"  PDF: {pdf_path} ({pdf_path.stat().st_size / 1024:.1f} KB)")

    # Determine output path
    if args.output_path:
        out_md = Path(args.output_path)
    else:
        year = entry.get("year") or "nd"
        # Year may be "10/2" or "" — normalize
        year_match = re.search(r"\b(19|20)\d{2}\b", str(year))
        year_norm = year_match.group(0) if year_match else "nd"
        author = first_author_slug(entry.get("authors", []))
        title_slug = slugify(entry.get("title", "untitled"), max_words=5)
        out_md = ZOTERO_IMM / f"{author}-{year_norm}-{title_slug}.md"

    out_md.parent.mkdir(parents=True, exist_ok=True)

    # Run OCR pipeline
    print(f"[OCR] {pdf_path.name} -> {out_md.name}")
    ocr_out_dir = IMM / "_ocr_raw"
    ocr_out_dir.mkdir(exist_ok=True)
    os.environ["OCR_EXPORTS_DIR"] = str(ocr_out_dir)
    ocr_output_name = f"ocr_{args.item_key}"
    res = subprocess.run(
        ["python3", str(OCR_PIPELINE), str(pdf_path), "--output", ocr_output_name],
        capture_output=True, text=True, timeout=600,
    )
    if res.returncode != 0:
        print("STDOUT:", res.stdout[-2000:])
        print("STDERR:", res.stderr[-2000:])
        entry["ocr_status"] = "ocr_failed"
        entry["error"] = (res.stderr or res.stdout)[-500:]
        QR_JSON.write_text(json.dumps(qr, indent=2))
        sys.exit(1)

    # Find the OCR markdown output
    md_candidates = sorted(ocr_out_dir.glob(f"*{ocr_output_name}*.md"))
    if not md_candidates:
        # Maybe the script names it differently — get latest md
        md_candidates = sorted(ocr_out_dir.glob("*.md"), key=lambda p: p.stat().st_mtime)
    if not md_candidates:
        sys.exit("No OCR markdown produced")
    raw_md_path = md_candidates[-1]
    # Find sidecar meta
    meta_path = raw_md_path.with_name(raw_md_path.stem + "_meta.json")
    if not meta_path.exists():
        meta_path = next(iter(sorted(ocr_out_dir.glob("*_meta.json"), key=lambda p: p.stat().st_mtime)), None)
    pages = 0
    ocr_model = "mistral-ocr-latest"
    if meta_path and meta_path.exists():
        meta = json.loads(meta_path.read_text())
        pages = meta.get("total_pages") or meta.get("pages_processed") or 0
        ocr_model = meta.get("model", ocr_model)

    # Read OCR body, strip any existing frontmatter block at start
    raw = raw_md_path.read_text()
    body = re.sub(r"^---\n.*?\n---\n", "", raw, count=1, flags=re.DOTALL).strip()

    # Build task-spec frontmatter
    fetched = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    title = entry.get("title", "").replace('"', "'")
    doi = entry.get("doi") or None
    url = ""
    if doi:
        url = f"https://doi.org/{doi}"
    elif entry.get("publication"):
        url = ""

    if args.preserve_frontmatter_from:
        # S20 backfill: preserve existing frontmatter, only override verified_full_text + body
        src = Path(args.preserve_frontmatter_from).read_text()
        m = re.match(r"^---\n(.*?)\n---\n(.*)$", src, flags=re.DOTALL)
        if not m:
            sys.exit("Could not parse existing frontmatter for preservation")
        existing_fm_block = m.group(1)
        # Toggle verified_full_text and update mcp_tool_used + fetched_utc + pages
        fm = existing_fm_block
        fm = re.sub(r"verified_full_text:\s*false", "verified_full_text: true", fm)
        fm = re.sub(r"mcp_tool_used:.*", f"mcp_tool_used: zotero-pdf-ocr (Mistral {ocr_model})", fm)
        fm = re.sub(r"fetched_utc:.*", f"fetched_utc: {fetched}", fm)
        if "pages:" in fm:
            fm = re.sub(r"pages:.*", f"pages: {pages}", fm)
        else:
            fm += f"\npages: {pages}"
        # Add zotero_key
        if "zotero_key" not in fm:
            fm += f"\nzotero_key: {args.item_key}"
        # Remove the paywall caveat now that we have full text
        fm = re.sub(r"caveat: \|\n(?:  .*\n)+", "", fm)
        final_md = f"---\n{fm}\n---\n\n## Full Text (OCRed from Diego's Zotero library via Mistral OCR)\n\n{body}\n"
    else:
        # Build new frontmatter per task contract
        authors = entry.get("authors", [])
        first_author = authors[0].split(",")[0].strip() if authors else ""
        year_match = re.search(r"\b(19|20)\d{2}\b", str(entry.get("year") or ""))
        year_norm = year_match.group(0) if year_match else "nd"
        fm_lines = [
            f"ref_id: zotero_{args.item_key}",
            "classification: zotero_imm",
            f"first_author: {first_author}",
            f"year: {year_norm}",
            f'title: "{title}"',
            f"doi: {doi if doi else 'null'}",
            f"url: {url}",
            f"zotero_key: {args.item_key}",
            "mcp_tool_used: zotero-pdf-ocr",
            f"fetched_utc: {fetched}",
            "verified: true",
            f"pages: {pages}",
            "spec_sections_supported: []",
            "notes: |",
            "  Auto-OCRed from Diego's Zotero library (Task 29). See math_anchors",
            "  for any verbatim quotes anchoring Selectron Iter-3 claims.",
            "math_anchors: []",
        ]
        final_md = "---\n" + "\n".join(fm_lines) + "\n---\n\n" + body + "\n"

    out_md.write_text(final_md)
    print(f"  WROTE: {out_md} ({len(final_md):,} chars, {pages} pages)")

    # Update entry status
    entry["ocr_status"] = "done"
    out_md_abs = out_md.resolve()
    try:
        entry["output_md"] = str(out_md_abs.relative_to(REPO))
    except ValueError:
        entry["output_md"] = str(out_md_abs)
    entry["pages"] = pages
    entry["ocr_completed_utc"] = fetched
    QR_JSON.write_text(json.dumps(qr, indent=2))


if __name__ == "__main__":
    main()
