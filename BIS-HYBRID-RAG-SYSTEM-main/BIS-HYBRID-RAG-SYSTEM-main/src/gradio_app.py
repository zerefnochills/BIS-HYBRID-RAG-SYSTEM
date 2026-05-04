"""
gradio_app.py — Interactive demo UI for BIS Standards Recommendation Engine

Features
--------
- Hybrid retrieval with track indicator (fast / rerank)
- LLM rationale via Gemini (anti-hallucination: only shown real retrieved chunks)
- Semantic cache for repeated queries
- Rich example queries for demo

Usage:
    python src/gradio_app.py --artifact-dir artifacts/
"""

import argparse
import os
import sys
from pathlib import Path

# Fix OpenMP deadlock on Windows when loading multiple torch models sequentially
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")

try:
    import gradio as gr
except ImportError:
    print("ERROR: gradio not installed. Run: pip install gradio")
    sys.exit(1)

# Allow importing from repo root
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.retrieve import (
    RetrievalEngine,
    _get_is_numbers,
    hybrid_retrieve,
    load_engine,
)


# ── LLM rationale (anti-hallucination) ───────────────────────────────────────

def get_rationale(query: str, top_chunks: list[str], engine: RetrievalEngine) -> str | None:
    """
    Ask Gemini to explain why each retrieved standard is relevant.
    The model is ONLY shown real retrieved chunks — never free-generates standard IDs.
    Falls back to None if API key is absent.
    """
    if engine.gemini is None:
        return None

    context = "\n\n".join(chunk[:400] for chunk in top_chunks[:3])
    prompt = (
        f"You are a BIS compliance expert helping Indian MSEs.\n\n"
        f"A manufacturer described their product: \"{query}\"\n\n"
        f"Based ONLY on these BIS standards (do not mention any standard not listed below):\n"
        f"{context}\n\n"
        f"List the top 3 relevant standards. For each, write ONE sentence explaining why it applies.\n"
        f"Format each as: **IS XXXX: YYYY** — [one sentence reason]"
    )
    try:
        response = engine.gemini.generate_content(prompt)
        return response.text.strip()
    except Exception:
        return None


# ── Search handler ────────────────────────────────────────────────────────────

def make_search_fn(engine: RetrievalEngine):
    def search_standards(query: str) -> str:
        if not query.strip():
            return "⚠️  Please enter a product description or question."

        standards, latency = hybrid_retrieve(query, engine, top_k=5)

        is_nums = _get_is_numbers(query)
        if is_nums:
            track = "⚡ Fast path (IS-number directly detected in query)"
        else:
            track = "🔍 Semantic rerank path (BM25 + FAISS + cross-encoder)"

        # Fetch chunk texts for rationale generation
        top_chunks = []
        for sid in standards[:3]:
            for i, md in enumerate(engine.metadata):
                if md["standard_id"] == sid:
                    top_chunks.append(engine.chunks[i])
                    break

        rationale = get_rationale(query, top_chunks, engine)

        lines = [
            f"**Track:** {track}",
            f"**Latency:** {latency}s",
            "",
            "### Top Recommended BIS Standards",
            "",
        ]

        if rationale:
            lines.append(rationale)
        else:
            for i, s in enumerate(standards, 1):
                # Look up title from metadata
                title = ""
                for md in engine.metadata:
                    if md["standard_id"] == s:
                        title = md["title"]
                        break
                lines.append(f"**{i}. `{s}`** — {title}")

        return "\n".join(lines)

    return search_standards


# ── Gradio UI ─────────────────────────────────────────────────────────────────

def launch(engine: RetrievalEngine, share: bool = True) -> None:
    search_fn = make_search_fn(engine)

    with gr.Blocks(title="BIS Standards Recommendation Engine") as demo:

        gr.Markdown("# 🏭 BIS Standards Recommendation Engine")
        gr.Markdown(
            "AI-powered compliance assistant for Indian MSEs.  \n"
            "**Hybrid RAG:** Dense (FAISS) + Sparse (BM25) + HyDE + Cross-Encoder Reranker"
        )

        with gr.Row():
            with gr.Column(scale=3):
                query_box = gr.Textbox(
                    label="Describe your product or ask a BIS standards question",
                    placeholder="e.g. Ordinary Portland Cement for residential construction",
                    lines=3,
                )
                search_btn = gr.Button(
                    "🔍 Find Relevant BIS Standards", variant="primary", size="lg"
                )

        output_box = gr.Markdown(label="Recommended Standards")

        search_btn.click(fn=search_fn, inputs=query_box, outputs=output_box)
        query_box.submit(fn=search_fn, inputs=query_box, outputs=output_box)

        gr.Markdown("### Example queries")
        gr.Examples(
            examples=[
                ["Ordinary Portland Cement for residential building construction"],
                ["What is IS 383 used for?"],
                ["TMT steel bars for RCC beam construction in 5-storey building"],
                ["AAC blocks for lightweight partition walls"],
                ["Crushed stone aggregates for concrete mixing"],
                ["Fly ash bricks for boundary wall construction"],
                ["Chemical requirements for 53 grade OPC cement"],
                ["Compressive strength test for concrete cubes"],
                ["White cement for architectural finishes"],
                ["Portland Slag Cement for marine structures"],
            ],
            inputs=query_box,
        )

        gr.Markdown(
            "---\n"
            "*Built for IIT Tirupati BIS Hackathon 2026 · "
            "Dataset: BIS SP 21 (Building Materials) · "
            "Pipeline: 6-layer Hybrid RAG*"
        )

    demo.launch(share=share, theme=gr.themes.Soft())


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Launch the BIS Recommendation Engine demo UI.")
    parser.add_argument("--artifact-dir", default="artifacts", help="Path to artifacts folder")
    parser.add_argument("--no-share", action="store_true", help="Disable Gradio public link")
    args = parser.parse_args()

    engine = load_engine(artifact_dir=args.artifact_dir)
    launch(engine, share=not args.no_share)


if __name__ == "__main__":
    main()
