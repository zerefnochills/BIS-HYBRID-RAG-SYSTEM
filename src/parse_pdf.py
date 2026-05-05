"""
parse_pdf.py — BIS SP 21 PDF → Standard-Aligned Chunks

Strategy: One chunk = one complete IS standard entry.
          The IS number is always prepended to the chunk text,
          ensuring the dense embedding captures the identifier.

Usage:
    python src/parse_pdf.py --pdf dataset.pdf --out-dir artifacts/
"""

import argparse
import pickle
import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    import fitz  # PyMuPDF
except ImportError:
    print("ERROR: PyMuPDF not installed. Run: pip install pymupdf")
    sys.exit(1)


# ── Regex patterns ────────────────────────────────────────────────────────────

_PRIMARY_SPLIT = re.compile(r"(?=SUMMARY\s+OF\s*\n+\s*IS\s+\d+)")
_FALLBACK_SPLIT = re.compile(r"(?=\bIS\s+\d{3,5}\s*[:\(])")

_IS_HEADER_PRIMARY = re.compile(
    r"SUMMARY\s+OF\s*\n+\s*(IS\s+\d+(?:\s*\([^)]+\))?\s*:\s*\d{4})\s+(.*?)(?:\n|$)",
    re.DOTALL,
)
_IS_HEADER_FALLBACK = re.compile(
    r"(IS\s+\d+(?:\s*\([^)]+\))?\s*:\s*\d{4})\s+(.*?)(?:\n|$)",
    re.DOTALL,
)
_IS_ID = re.compile(r"IS\s+(\d+(?:\s*\([^)]+\))?)\s*:\s*(\d{4})", re.IGNORECASE)


def extract_text(pdf_path: str) -> str:
    """Extract raw text from every page of the PDF."""
    doc = fitz.open(pdf_path)
    print(f"[parse] Opened '{pdf_path}' — {len(doc)} pages")
    parts = []
    for i, page in enumerate(doc):
        parts.append(page.get_text())
        if (i + 1) % 100 == 0:
            print(f"[parse]   Extracted {i + 1}/{len(doc)} pages …")
    full = "".join(parts)
    print(f"[parse] Total characters extracted: {len(full):,}")
    return full


def split_into_raw_chunks(full_text: str) -> list[str]:
    """Split the full PDF text into per-standard raw segments."""
    raw = _PRIMARY_SPLIT.split(full_text)
    if len(raw) < 10:
        print(f"[parse] ⚠  Primary split found only {len(raw)} segments — trying fallback …")
        raw = _FALLBACK_SPLIT.split(full_text)
        print(f"[parse]    Fallback found {len(raw)} segments")
    return raw


def parse_bis_pdf(pdf_path: str) -> tuple[list[str], list[dict]]:
    """
    Parse the BIS SP 21 PDF into aligned chunks and metadata dicts.

    Returns
    -------
    chunks   : list of str — chunk texts (IS ID prepended)
    metadata : list of dict — {'standard_id', 'title', 'raw_chunk'}
    """
    full_text = extract_text(pdf_path)
    raw_segments = split_into_raw_chunks(full_text)

    chunks: list[str] = []
    metadata: list[dict] = []

    for raw in raw_segments:
        raw = raw.strip()
        if len(raw) < 60:
            continue

        header_match = _IS_HEADER_PRIMARY.search(raw) or _IS_HEADER_FALLBACK.search(raw)
        if not header_match:
            continue

        raw_id = header_match.group(1).strip()
        title = re.sub(r"\s+", " ", header_match.group(2).strip())[:120]

        id_match = _IS_ID.search(raw_id)
        if not id_match:
            continue

        num = re.sub(r"\s+", " ", id_match.group(1).strip())
        year = id_match.group(2)
        standard_id = f"IS {num}: {year}"

        # Prepend standard ID + title so the embedding always sees the identifier
        chunk_text = f"{standard_id} {title}\n{raw}"
        chunks.append(chunk_text)
        metadata.append(
            {
                "standard_id": standard_id,
                "title": title,
                "raw_chunk": raw[:1200],
            }
        )

    print(f"\n[parse] OK Extracted {len(chunks)} standard chunks")

    if len(chunks) < 50:
        print("[parse] WARN: Very few chunks -- verify that dataset.pdf is the correct BIS SP 21 file.")
        print("[parse]    Sample raw text (first 500 chars):")
        print(full_text[:500])
    else:
        print("[parse] Sample chunks:")
        for md in metadata[:5]:
            print(f"  -> {md['standard_id']} | {md['title'][:70]}")

    return chunks, metadata


def save_artifacts(chunks: list, metadata: list, out_dir: str) -> None:
    """Pickle chunks and metadata to out_dir."""
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    chunks_path = out / "chunks.pkl"
    meta_path = out / "metadata.pkl"

    with open(chunks_path, "wb") as f:
        pickle.dump(chunks, f)
    with open(meta_path, "wb") as f:
        pickle.dump(metadata, f)

    print(f"[parse] Saved {chunks_path} ({len(chunks)} entries)")
    print(f"[parse] Saved {meta_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Parse BIS SP 21 PDF into aligned chunks.")
    parser.add_argument("--pdf", default="dataset.pdf", help="Path to BIS SP 21 PDF")
    parser.add_argument("--out-dir", default="artifacts", help="Directory to save pkl files")
    args = parser.parse_args()

    chunks, metadata = parse_bis_pdf(args.pdf)
    save_artifacts(chunks, metadata, args.out_dir)
    print("\n[parse] Done. Run src/build_index.py next.")


if __name__ == "__main__":
    main()
