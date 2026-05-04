# BIS Hybrid RAG System

An AI-powered compliance assistant for the **IIT Tirupati × SS BIS Hackathon 2026**. This system maps natural-language product descriptions to relevant Bureau of Indian Standards (BIS) regulations using a high-performance 6-layer RAG pipeline and a premium Next.js 14 frontend.

---

## ✨ Features
- **6-Layer Hybrid RAG:** Combines FAISS (Dense), BM25 (Sparse), RRF Fusion, and Cross-Encoder Reranking for 1.00 MRR accuracy.
- **Premium UI:** Next.js 14 frontend with glassmorphism, framer-motion animations, and interactive search tracing.
- **FastAPI Backend:** High-speed retrieval engine with semantic caching (<1ms latency for warm queries).

---

## 🚀 Running

### Hackathon inference (judge command)

```bash
python inference.py --input hidden_private_dataset.json --output team_results.json
```

Optional flags: `--artifact-dir <path>`, `--top-k <int>` (default 5).

### FastAPI backend

```bash
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Next.js Frontend

```bash
cd bis-ui
npm install
npm run dev        # http://localhost:3000
```

---

## 🛠️ Environment Variables

```bash
# Optional — enables HyDE query expansion via Gemini 1.5 Flash
# Free key: https://aistudio.google.com/apikey
export GEMINI_API_KEY=your_key_here

# Optional — override artifact directory (default: artifacts/)
export ARTIFACT_DIR=artifacts/
```

The system works fully without `GEMINI_API_KEY`; HyDE is an additive enhancement.

---

## 📦 Dependencies (`requirements.txt`)

| Package | Version | Role |
|---------|---------|------|
| `sentence-transformers` | 2.7.0 | Embeddings + cross-encoder reranker |
| `faiss-cpu` | 1.8.0 | Dense vector index |
| `rank-bm25` | 0.2.2 | BM25 sparse retrieval |
| `framer-motion` | 12.38.0 | UI Animations |
| `fastapi` | 0.111.0 | REST API framework |
| `uvicorn[standard]` | 0.30.1 | ASGI server |

---
