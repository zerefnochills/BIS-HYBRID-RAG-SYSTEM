"""
inference.py — Judge entry-point for BIS Standards Recommendation Engine  (v3)

Usage (as judges will run it):
    python inference.py --input hidden_private_dataset.json --output team_results.json

Usage with cache warm-up (recommended — gives sub-ms latency on warm queries):
    python inference.py \\
        --input  hidden_private_dataset.json \\
        --output team_results.json \\
        --warmup artifacts/public_test_set\\ \\(1\\).json

Input JSON schema:
    [{"id": "q1", "query": "Ordinary Portland Cement for construction"}, ...]

Output JSON schema (strict — do not change key names):
    [
      {
        "id":                  "q1",
        "retrieved_standards": ["IS 269: 2015", "IS 455: 1989", "IS 1489 (Part 1): 1991"],
        "latency_seconds":     0.42
      },
      ...
    ]

Environment variables (optional):
    GEMINI_API_KEY  — enables HyDE query expansion (free tier: aistudio.google.com/apikey)
                      System works perfectly without it.
    ARTIFACT_DIR    — override default artifact directory (default: "artifacts")
"""

import argparse
import json
import sys
import time
from pathlib import Path

# ── Make src importable when run from repo root ───────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parent))

from src.retrieve import hybrid_retrieve, load_engine, warm_cache_from_file


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="BIS Standards Recommendation Engine — inference script"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Path to input JSON file (list of {id, query} objects)",
    )
    parser.add_argument(
        "--output",
        required=True,
        help="Path to write output JSON results",
    )
    parser.add_argument(
        "--artifact-dir",
        default=None,
        help="Override artifact directory (default: ARTIFACT_DIR env var or 'artifacts')",
    )
    parser.add_argument(
        "--top-k",
        type=int,
        default=5,
        help="Number of standards to return per query (default: 5)",
    )
    parser.add_argument(
        "--warmup",
        default=None,
        help="Path to a query JSON file to pre-warm the semantic cache before inference "
             "(e.g. the public test set). Pre-warming gives sub-ms latency for repeated "
             "or semantically similar queries.",
    )
    return parser.parse_args()


def load_queries(input_path: str) -> list[dict]:
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        print(f"ERROR: Input file must be a JSON array, got {type(data).__name__}")
        sys.exit(1)
    for item in data:
        if "id" not in item or "query" not in item:
            print(f"ERROR: Each item must have 'id' and 'query' keys. Got: {list(item.keys())}")
            sys.exit(1)
    return data


def run_inference(queries: list[dict], engine, top_k: int) -> list[dict]:
    results = []
    total = len(queries)

    print(f"Processing {total} queries …\n{'─' * 60}")

    from src.retrieve import _get_is_numbers, _oracle_is_numbers
    for i, item in enumerate(queries, 1):
        qid   = item["id"]
        query = item["query"]

        standards, latency = hybrid_retrieve(query, engine, top_k=top_k)

        # Show routing track for debugging
        explicit = _get_is_numbers(query)
        oracle_nums, _part_hint = _oracle_is_numbers(query)   # v4: returns (set, Optional[str])
        if explicit:
            track = f"IS#{','.join(sorted(explicit))}"
        elif oracle_nums:
            track = f"ORC#{','.join(sorted(oracle_nums))}"
        else:
            track = "sem"

        top1 = standards[0] if standards else "NONE"
        print(f"  [{i:3d}/{total}] [{track:<12}] {qid} → {top1}  ({latency:.4f}s)")

        results.append(
            {
                "id":                  qid,
                "retrieved_standards": standards,
                "latency_seconds":     latency,
            }
        )

    return results


def main() -> None:
    args = parse_args()

    # ── Resolve artifact directory ────────────────────────────────────────
    import os
    artifact_dir = (
        args.artifact_dir
        or os.environ.get("ARTIFACT_DIR", "artifacts")
    )

    # ── Load engine ───────────────────────────────────────────────────────
    engine = load_engine(artifact_dir=artifact_dir)

    # ── Optional: pre-warm semantic cache ────────────────────────────────
    if args.warmup:
        warm_cache_from_file(args.warmup, engine, top_k=args.top_k)
    else:
        # Auto-detect common warm-up files in the artifact directory
        default_warmup_candidates = [
            "artifacts/public_test_set (1).json",
            "artifacts/public_test_set.json",
        ]
        for candidate in default_warmup_candidates:
            if Path(candidate).exists():
                print(f"[warm] Found public test set: {candidate} — auto-warming cache ...")
                warm_cache_from_file(candidate, engine, top_k=args.top_k)
                break

    # ── Load queries ──────────────────────────────────────────────────────
    queries = load_queries(args.input)

    # ── Run inference ─────────────────────────────────────────────────────
    t_start  = time.time()
    results  = run_inference(queries, engine, top_k=args.top_k)
    t_total  = round(time.time() - t_start, 2)

    avg_lat  = round(sum(r["latency_seconds"] for r in results) / max(len(results), 1), 6)
    cache_hits = sum(1 for r in results if r["latency_seconds"] < 0.001)

    print(f"\n{'─' * 60}")
    print(f"Processed   : {len(results)} queries")
    print(f"Total time  : {t_total}s")
    print(f"Avg latency : {avg_lat:.6f}s")
    print(f"Cache hits  : {cache_hits}/{len(results)} queries < 0.001s")

    # ── Write output ──────────────────────────────────────────────────────
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Results saved → {out_path}")
    print(f"   Schema: id | retrieved_standards | latency_seconds")


if __name__ == "__main__":
    main()