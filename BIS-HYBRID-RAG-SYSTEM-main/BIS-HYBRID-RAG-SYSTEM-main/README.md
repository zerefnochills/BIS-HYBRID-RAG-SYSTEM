# BIS Hybrid RAG System

An AI-powered compliance assistant that maps natural-language product descriptions to relevant Bureau of Indian Standards (BIS) regulations. Built for the **IIT Tirupati × SS BIS Hackathon 2026**.

---

## What It Does

Indian Micro and Small Enterprises (MSEs) spend weeks manually finding which BIS standards apply to their products. This system automates that using a 6-layer Hybrid RAG pipeline — accepting a plain-English product description and returning the top 3–5 relevant IS standards with rationale, in under 5 seconds.

**Scope:** Building Materials — Cement, Steel, Concrete, Aggregates, Bricks, Blocks.  
**Dataset:** BIS SP 21 (Summaries of Indian Standards for Building Materials).

---

## Architecture

```
User Query
    │
    ▼
Layer 1 — Query Expansion
    Abbreviation map (OPC → Ordinary Portland Cement, TMT, RCC, AAC, etc.)
    + HyDE via Gemini 1.5 Flash (optional, if GEMINI_API_KEY is set)
    │
    ├──► Layer 2 — FAISS Dense Retrieval (top-8)
    │        Model: all-mpnet-base-v2 (sentence-transformers)
    │        Index: IndexFlatIP with L2-normalised embeddings (cosine similarity)
    │
    └──► Layer 3 — BM25 Sparse Retrieval (top-8)
             Tokeniser: domain-aware (IS numbers preserved as atomic tokens,
             abbreviations expanded, BIS-specific stopwords removed)
    │
    ▼
Layer 4 — RRF Fusion + IS-number Boost
    Reciprocal Rank Fusion (k=60), dense weight 0.55, sparse weight 0.45
    +2.5 boost when a candidate matches an IS number found in the query
    │
    ▼
Layer 5 — Dual-Track Router
    Fast path  → IS number detected in query, or RRF confidence margin > 0.015
    Rerank path → full cross-encoder scoring
    │
    ▼
Layer 6 — Cross-Encoder Reranker  (rerank path only)
    Model: ms-marco-TinyBERT-L-2-v2
    Hallucination guard: rejects any result that doesn't match IS \d+: \d{4}
    │
    ▼
Top 3–5 BIS Standards + (optional) Gemini rationale
```

---

## Repository Structure

```
BIS-HYBRID-RAG-SYSTEM/
│
├── inference.py              # Judge entry-point: --input / --output
├── requirements.txt          # Python dependencies
├── README.md
├── LICENSE                   # MIT
│
├── src/
│   ├── parse_pdf.py          # PDF → standard-aligned chunks + metadata pickles
│   ├── build_index.py        # Builds FAISS dense index + BM25 sparse index
│   ├── retrieve.py           # 6-layer hybrid retrieval engine (core logic)
│   └── gradio_app.py         # Gradio demo UI
│
├── api/
│   ├── __init__.py
│   └── main.py               # FastAPI REST backend wrapping the retrieval engine
│
├── artifacts/                # Pre-built indexes (regenerate with build_index.py)
│   ├── bis_index.faiss       # FAISS flat inner-product index
│   ├── bm25.pkl              # Serialised BM25Okapi model
│   ├── chunks.pkl            # List of standard-aligned text chunks
│   ├── metadata.pkl          # List of {standard_id, title, raw_chunk} dicts
│   ├── dataset (1).pdf       # Source BIS SP 21 PDF
│   ├── eval_script (1).py    # Organiser-provided evaluation script
│   └── public_test_set (1).json
│
├── data/
│   └── public_results.json   # Results on the public test set (10 queries)
│
├── bis-engine/               # Standalone copy of the retrieval engine
│   ├── inference.py
│   ├── requirements.txt
│   ├── src/                  # Same structure as root src/
│   ├── artifacts/            # Same structure as root artifacts/
│   └── data/
│
└── bis-ui/                   # Next.js 14 frontend
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx
    │   └── globals.css
    ├── components/
    │   ├── Header.tsx
    │   ├── SearchBar.tsx
    │   ├── ResultCard.tsx
    │   ├── PipelineTracer.tsx
    │   ├── ArchitectureSidebar.tsx
    │   ├── ExampleChips.tsx
    │   └── StatsBanner.tsx
    ├── types/
    ├── next.config.mjs
    ├── tailwind.config.ts
    └── package.json
```

---

## Models & Libraries

| Component | Model / Library | Purpose |
|-----------|----------------|---------|
| Dense embeddings | `all-mpnet-base-v2` (sentence-transformers) | Semantic similarity via cosine |
| Dense index | FAISS `IndexFlatIP` | Fast inner-product search |
| Sparse retrieval | `BM25Okapi` (rank-bm25) | Keyword / IS-number matching |
| Cross-encoder reranker | `ms-marco-TinyBERT-L-2-v2` (sentence-transformers) | Precise relevance scoring |
| HyDE expansion (optional) | Gemini 1.5 Flash (google-generativeai) | Hypothetical document generation |
| PDF parsing | PyMuPDF (`fitz`) | Text extraction from BIS SP 21 |
| REST API | FastAPI + Uvicorn | Wraps retrieval engine as HTTP endpoints |
| Demo UI | Gradio | Interactive in-browser querying |
| Frontend | Next.js 14, Tailwind CSS, TypeScript | Production web UI |

---

## Source Files

### `src/parse_pdf.py`
Parses the BIS SP 21 PDF into standard-aligned chunks using PyMuPDF.

- **`extract_text(pdf_path)`** — Reads all pages and concatenates raw text.
- **`split_into_raw_chunks(text)`** — Splits on `SUMMARY OF IS \d+` (primary) or `IS \d+:` (fallback).
- **`parse_bis_pdf(pdf_path)`** — Combines the above; prepends `IS XXXX: YYYY <title>` to every chunk so the embedding always captures the identifier. Returns `(chunks, metadata)`.
- **`save_artifacts(chunks, metadata, out_dir)`** — Pickles `chunks.pkl` and `metadata.pkl` to the artifact directory.

### `src/build_index.py`
Builds the retrieval indexes from the parsed chunks.

- **`domain_tokenize(text)`** — IS-aware tokeniser: fuses IS numbers and part suffixes into atomic tokens (`IS1489part1`), expands abbreviations (OPC, PPC, TMT, etc.), strips BIS stopwords.
- **`build_faiss_index(chunks, out_path)`** — Encodes chunks with `all-mpnet-base-v2` (batch 64, L2-normalised), creates `IndexFlatIP`, saves to `bis_index.faiss`.
- **`build_bm25_index(chunks, out_path)`** — Tokenises with `domain_tokenize`, fits `BM25Okapi`, pickles to `bm25.pkl`.

### `src/retrieve.py`
The core 6-layer retrieval engine.

**Key constants:**

| Parameter | Value |
|-----------|-------|
| `EMBED_MODEL` | `all-mpnet-base-v2` |
| `RERANKER_MODEL` | `cross-encoder/ms-marco-TinyBERT-L-2-v2` |
| `FETCH_K` | 8 (candidates per retriever) |
| `TOP_K` | 5 (final results) |
| `RRF_K` | 60 |
| `DENSE_W` / `SPARSE_W` | 0.55 / 0.45 |
| `IS_BOOST` | +2.5 |
| `CONF_MARGIN` | 0.015 |

**Key functions:**

- **`domain_tokenize(text)`** — Same tokeniser as `build_index.py`; used at query time for BM25 scoring.
- **`expand_query(query)`** — Applies regex-based abbreviation → full-form + IS-number hints (e.g. `OPC` → `Ordinary Portland Cement OPC IS 269`).
- **`hyde_expand(query, gemini_client)`** — Prompts Gemini 1.5 Flash to generate a hypothetical BIS standard summary; falls back to raw query on error.
- **`load_engine(artifact_dir)`** — Loads all pickles, FAISS index, embedding model, and reranker. Returns a `RetrievalEngine` instance.
- **`hybrid_retrieve(query, engine, top_k)`** — Runs the full pipeline and returns `(standards_list, latency_seconds)`. Results are cached in-memory by query string.

**`RetrievalEngine` class** — Data container holding `chunks`, `metadata`, FAISS `index`, `bm25`, embedding `model`, `reranker`, optional `gemini` client, and an in-memory `_cache`.

### `api/main.py`
FastAPI REST backend.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Engine status, chunk count, artifact dir |
| `POST` | `/api/search` | Accepts `{query, top_k}`, returns standards + pipeline trace + optional rationale |
| `GET` | `/api/examples` | Returns 10 curated example queries |

The engine is loaded once at startup via `@app.on_event("startup")`. CORS is configured for `localhost:3000` and `*.vercel.app`.

**Response shape (`/api/search`):**
```json
{
  "results": [{"standard_id": "IS 269: 2015", "title": "...", "category": "Cement"}],
  "latency_seconds": 0.42,
  "pipeline": {
    "query_expanded": true,
    "hyde_used": false,
    "dense_hits": 8,
    "sparse_hits": 8,
    "reranker_used": true,
    "track": "rerank"
  },
  "rationale": "**IS 269: 2015** — ..."
}
```

### `inference.py`
CLI entry-point for judge evaluation.

- **`load_queries(input_path)`** — Validates and loads `[{id, query}]` JSON.
- **`run_inference(queries, engine, top_k)`** — Calls `hybrid_retrieve` per query, logs the routing track (fast/rerank) and top result.
- **`main()`** — Wires args, loads engine, runs inference, writes output JSON.

**Output schema:**
```json
[{"id": "q1", "retrieved_standards": ["IS 269: 2015", "IS 455: 1989"], "latency_seconds": 0.42}]
```

### `src/gradio_app.py`
Gradio demo UI — launches a public shareable link for interactive querying.

### `bis-ui/`
Next.js 14 frontend (TypeScript + Tailwind CSS). Components:
- `SearchBar` — query input
- `ResultCard` — displays each returned IS standard
- `PipelineTracer` — shows which retrieval track was taken
- `ArchitectureSidebar` — explains the 6-layer pipeline
- `ExampleChips` — clickable example queries
- `StatsBanner` — latency and hit-rate stats

---

## Setup & Installation

**Prerequisites:** Python 3.9+, Node.js 18+ (for the UI only). CPU is sufficient; GPU speeds up embedding ~5×.

### Python backend

```bash
git clone https://github.com/zerefnochills/BIS-HYBRID-RAG-SYSTEM.git
cd BIS-HYBRID-RAG-SYSTEM
pip install -r requirements.txt
```

### Build indexes (one-time)

Pre-built artifacts are included in `artifacts/`. To rebuild from a fresh PDF:

```bash
python src/parse_pdf.py --pdf "artifacts/dataset (1).pdf" --out-dir artifacts/
python src/build_index.py --artifact-dir artifacts/
```

### Next.js frontend

```bash
cd bis-ui
npm install
npm run dev        # http://localhost:3000
```

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

## License

MIT — see [LICENSE](LICENSE).
