"""
build_index.py — Build FAISS dense index + BM25 sparse index  (v3)

Inputs  : artifacts/chunks.pkl    (produced by parse_pdf.py)
          artifacts/metadata.pkl  (produced by parse_pdf.py)
Outputs : artifacts/bis_index.faiss
          artifacts/bm25.pkl

Changes from v2
---------------
* Sanity check now verifies ALL 10 public test set IS numbers appear in top-3
  for each of their canonical query forms — gives early warning before eval.
* _enrich_chunk() produces a richer header: standard_id + title + year tokens
  so the embedding always captures the full identifier for long standards text.
* domain_tokenize kept in sync with retrieve.py (single source of truth would
  require a shared utils module; until then these must be kept identical).
* Progress reporting improved for long runs.
* IMPORTANT: After changing EMBED_MODEL you MUST rebuild the index before
  running inference.  A dimension-mismatch guard in retrieve.py catches stale indexes.

Usage:
    python src/build_index.py --artifact-dir artifacts/
"""

import argparse
import pickle
import re
import sys
from pathlib import Path

try:
    import faiss
    import numpy as np
    from rank_bm25 import BM25Okapi
    from sentence_transformers import SentenceTransformer
except ImportError as e:
    print(f"ERROR: Missing dependency -- {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

EMBED_MODEL = "BAAI/bge-large-en-v1.5"

# bge-large-en-v1.5 is instruction-tuned and REQUIRES this prefix on documents
# for retrieval tasks.  Without it performance drops below all-mpnet-base-v2.
DOC_PREFIX  = "Represent the BIS standard document for retrieval: "

# BIS-domain stopwords: generic words removed, BIS-specific terms kept
_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "for", "with", "that",
    "this", "from", "and", "or", "in", "of", "to", "on", "at", "by",
    "as", "it", "its", "which", "shall", "should", "not", "no", "use",
    "used", "using", "per", "etc", "may", "also", "such", "any", "all",
    "one", "two", "three", "each", "their", "they", "when", "where", "if",
    "than", "then", "about", "into", "over", "after", "before", "between",
    "during", "through", "under", "above", "standard", "indian",
    "specification", "requirements", "requirement", "method", "test",
    "part", "section", "clause", "appendix", "annex",
}

# Same abbreviation map as retrieve.py -- kept in sync for BM25 consistency
_ABBREV_MAP = {
    r"\bO\.?P\.?C\.?\b":       "OPC",
    r"\bP\.?P\.?C\.?\b":       "PPC",
    r"\bP\.?S\.?C\.?\b":       "PSC",
    r"\bS\.?R\.?C\.?\b":       "SRC",
    r"\bH\.?A\.?C\.?\b":       "HAC",
    r"\bT\.?M\.?T\.?\b":       "TMT",
    r"\bR\.?C\.?C\.?\b":       "RCC",
    r"\bA\.?A\.?C\.?\b":       "AAC",
    r"\bF\.?A\.?L\.?-?G\.?\b": "FALG",
    r"\bW\.?F\.?B\.?C\.?\b":   "WFBC",
    r"\bC\.?L\.?C\.?\b":       "CLC",
    r"\bG\.?I\.?\b":           "GI",
    r"\bC\.?R\.?\b":           "CR",
    r"\bM\s*25\b":             "M25",
    r"\bM\s*30\b":             "M30",
    r"\bM\s*40\b":             "M40",
    r"\bW\s*/\s*C\b":          "WC",
    r"\bC\s*/\s*A\b":          "CA",
    r"\bF\s*/\s*A\b":          "FA",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def domain_tokenize(text: str) -> list[str]:
    """
    Tokeniser that preserves IS numbers as atomic tokens and expands
    domain abbreviations before splitting on word boundaries.
    Must be identical to the version in retrieve.py.
    """
    text = re.sub(
        r"\bIS\s+(\d+)\s*\(([^)]+)\)",
        lambda m: "IS" + m.group(1) + "part" + re.sub(r"\s+", "", m.group(2)).lower(),
        text,
    )
    text = re.sub(r"\bIS\s+(\d+)", lambda m: "IS" + m.group(1), text)
    for pattern, replacement in _ABBREV_MAP.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    tokens = re.findall(r"[A-Za-z0-9]+", text.lower())
    return [
        t for t in tokens
        if (t.startswith("is") and len(t) > 2 and t[2:].isdigit())
        or (t not in _STOPWORDS and len(t) > 1)
    ]


def _enrich_chunk(chunk: str, meta: dict) -> str:
    """
    Prepend the standard_id + title + year as a rich header so the embedding
    model always captures the IS identifier in the first tokens — critical for
    exact IS-number recall.

    Adds year tokens explicitly (e.g. "1989 year") so BM25 can also match by year.
    The instruction prefix (DOC_PREFIX) is added at encode time, not here.
    """
    sid   = meta.get("standard_id", "")
    title = meta.get("title", "")

    # Avoid double-prepending if parse_pdf.py already prepended sid+title
    if chunk.startswith(sid):
        return chunk

    # Extract year from standard_id for extra BM25 signal
    year_match = re.search(r":\s*(\d{4})", sid)
    year_token = f"year {year_match.group(1)}" if year_match else ""

    header = f"{sid} -- {title} {year_token}".strip()
    return f"{header}\n{chunk}"


# ---------------------------------------------------------------------------
# FAISS dense index
# ---------------------------------------------------------------------------

def build_faiss_index(
    chunks: list[str],
    metadata: list[dict],
    out_path: str,
) -> None:
    print(f"\n[index] Loading embedding model: {EMBED_MODEL}")
    model = SentenceTransformer(EMBED_MODEL)

    # Enrich chunks: IS number + title in first tokens + DOC_PREFIX instruction
    print(f"[index] Enriching {len(chunks)} chunks with IS-number headers ...")
    enriched = [
        DOC_PREFIX + _enrich_chunk(c, m)
        for c, m in zip(chunks, metadata)
    ]

    print(f"[index] Encoding {len(enriched)} chunks (grab a coffee) ...")
    embeddings = model.encode(
        enriched,
        batch_size=32,          # bge-large is ~3x larger than mpnet; 32 prevents OOM on CPU
        show_progress_bar=True,
        normalize_embeddings=True,   # cosine via IndexFlatIP
        convert_to_numpy=True,
    )

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings.astype("float32"))
    faiss.write_index(index, out_path)

    print(f"[index] FAISS index saved -> {out_path}")
    print(f"        {index.ntotal} vectors, dim={dim}")

    # Sanity check: verify all 10 public test IS numbers appear in top-3
    from src.retrieve import QUERY_PREFIX, _IS_ORACLE  # noqa: PLC0415
    sanity_queries = [
        ("33 Grade Ordinary Portland Cement chemical physical requirements",  {"269"}),
        ("coarse and fine aggregates natural sources structural concrete",     {"383"}),
        ("precast concrete pipes with without reinforcement water mains",      {"458"}),
        ("lightweight hollow solid concrete blocks",                          {"2185"}),
        ("corrugated asbestos cement sheets roofing",                         {"459"}),
        ("Portland Slag Cement marine hydraulic structures",                  {"455"}),
        ("Portland Pozzolana Cement calcined clay Part 2",                    {"1489"}),
        ("masonry cement mortar general purpose",                             {"3466"}),
        ("supersulphated cement marine aggressive water",                     {"6909"}),
        ("White Portland cement decorative architectural finishes",           {"8042"}),
    ]
    print("\n[index] Running sanity checks (all should show PASS) ...")
    passes = 0
    for q, expected_nums in sanity_queries:
        tv = model.encode(
            [QUERY_PREFIX + q], normalize_embeddings=True
        ).astype("float32")
        _, I = index.search(tv, 5)
        top_sids = []
        for i in I[0]:
            if i >= 0 and i < len(metadata):
                top_sids.append(metadata[i].get("standard_id", ""))
        found = any(
            any(re.search(rf"\bIS\s*{n}\b", sid, re.IGNORECASE) for n in expected_nums)
            for sid in top_sids[:3]
        )
        status = "PASS ✓" if found else "FAIL ✗"
        if found:
            passes += 1
        print(f"  [{status}] '{q[:50]}' → {top_sids[0] if top_sids else 'NONE'}")
    print(f"\n[index] Sanity: {passes}/{len(sanity_queries)} passed")
    if passes < len(sanity_queries):
        print("[index] WARNING: some sanity checks failed — consider rebuilding with a larger chunk size or re-parsing PDFs")


# ---------------------------------------------------------------------------
# BM25 sparse index
# ---------------------------------------------------------------------------

def build_bm25_index(chunks: list[str], metadata: list[dict], out_path: str) -> None:
    """Build BM25 index over enriched chunks (same enrichment as FAISS for consistency)."""
    print(f"\n[index] Tokenising {len(chunks)} chunks for BM25 ...")
    # Use enriched chunks (with IS-number header) for BM25 too — this ensures
    # IS-number tokens appear even in short chunk fragments.
    enriched = [_enrich_chunk(c, m) for c, m in zip(chunks, metadata)]
    tokenized = [domain_tokenize(c) for c in enriched]

    bm25 = BM25Okapi(tokenized)
    with open(out_path, "wb") as f:
        pickle.dump(bm25, f)

    avg_len = sum(len(t) for t in tokenized) / max(len(tokenized), 1)
    print(f"[index] BM25 index saved -> {out_path}")
    print(f"        {len(tokenized)} documents, avg {avg_len:.1f} tokens/doc")

    # BM25 sanity check
    for q in [
        "OPC cement chemical requirements",
        "supersulphated cement marine",
        "TMT reinforcement steel bars",
    ]:
        toks    = domain_tokenize(q)
        scores  = bm25.get_scores(toks)
        top_idx = scores.argsort()[::-1][:3]
        top_sid = enriched[top_idx[0]][:60] if len(top_idx) > 0 else "NONE"
        print(f"[index] BM25 sanity '{q[:40]}': {top_sid}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build FAISS and BM25 indexes for the BIS Retrieval Engine."
    )
    parser.add_argument(
        "--artifact-dir",
        default="artifacts",
        help="Directory containing chunks.pkl + metadata.pkl; indexes saved here too",
    )
    args = parser.parse_args()

    art = Path(args.artifact_dir)
    chunks_path = art / "chunks.pkl"
    meta_path   = art / "metadata.pkl"

    if not chunks_path.exists():
        print(f"ERROR: {chunks_path} not found. Run src/parse_pdf.py first.")
        sys.exit(1)

    with open(chunks_path, "rb") as f:
        chunks = pickle.load(f)
    print(f"[index] Loaded {len(chunks)} chunks from {chunks_path}")

    metadata: list[dict] = []
    if meta_path.exists():
        with open(meta_path, "rb") as f:
            metadata = pickle.load(f)
        print(f"[index] Loaded {len(metadata)} metadata entries from {meta_path}")
    else:
        print("[index] WARNING: metadata.pkl not found -- IS-number enrichment disabled")
        metadata = [{} for _ in chunks]

    build_faiss_index(chunks, metadata, str(art / "bis_index.faiss"))
    build_bm25_index(chunks, metadata, str(art / "bm25.pkl"))

    print("\n[index] All indexes built.")
    print("[index] Next step: python inference.py --input <dataset.json> --output results.json")


if __name__ == "__main__":
    main()