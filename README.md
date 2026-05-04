# BIS Hybrid RAG System

---

## Running

### Hackathon inference (judge command)

```bash
python inference.py --input hidden_private_dataset.json --output team_results.json
```

Optional flags: `--artifact-dir <path>`, `--top-k <int>` (default 5).

### FastAPI backend

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Gradio demo

```bash
python src/gradio_app.py --artifact-dir artifacts/
```

### Evaluation

```bash
python "artifacts/eval_script (1).py" --results data/public_results.json
```

---

## Environment Variables

```bash
# Optional — enables HyDE query expansion via Gemini 1.5 Flash
# Free key: https://aistudio.google.com/apikey
export GEMINI_API_KEY=your_key_here

# Optional — override artifact directory (default: artifacts/)
export ARTIFACT_DIR=artifacts/
```

The system works fully without `GEMINI_API_KEY`; HyDE is an additive enhancement.

---

## Dependencies (`requirements.txt`)

| Package | Version | Role |
|---------|---------|------|
| `sentence-transformers` | 2.7.0 | Embeddings + cross-encoder reranker |
| `faiss-cpu` | 1.8.0 | Dense vector index |
| `rank-bm25` | 0.2.2 | BM25 sparse retrieval |
| `numpy` | ≥1.24 | Vector math |
| `gradio` | 4.31.0 | Demo UI |
| `fastapi` | 0.111.0 | REST API framework |
| `uvicorn[standard]` | 0.30.1 | ASGI server |
| `pydantic` | 2.7.1 | Request/response schemas |
| `python-dotenv` | 1.0.1 | `.env` file loading |
| `pymupdf` | 1.24.0 | PDF text extraction (commented out — install manually) |
| `google-generativeai` | ≥0.7.0 | HyDE via Gemini (optional, commented out) |

---
