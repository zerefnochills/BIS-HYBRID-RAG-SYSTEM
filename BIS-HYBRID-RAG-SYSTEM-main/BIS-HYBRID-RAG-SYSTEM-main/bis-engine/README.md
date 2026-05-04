# 🏭 BIS Standards Recommendation Engine

> AI-powered compliance assistant that maps product descriptions to relevant Bureau of Indian Standards (BIS) regulations — helping Indian MSEs find the right standards in seconds instead of weeks.

Built for the **IIT Tirupati × SS BIS Hackathon 2026**.

---

## 📌 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [System Architecture](#-system-architecture)
- [Repository Structure](#-repository-structure)
- [Setup & Installation](#-setup--installation)
- [Running Inference (Judge Command)](#-running-inference-judge-command)
- [Running Evaluation](#-running-evaluation)
- [Evaluation Results](#-evaluation-results)
- [Retrieval Strategy](#-retrieval-strategy)
- [Dataset](#-dataset)
- [Environment Variables](#-environment-variables)
- [Team](#-team)

---

## 🎯 Problem Statement

Indian Micro and Small Enterprises (MSEs) often spend weeks manually identifying which BIS regulations apply to their products. This project automates that process using a Retrieval-Augmented Generation (RAG) pipeline focused on the **Building Materials** category (Cement, Steel, Concrete, Aggregates).

---

## 💡 Solution Overview

A 6-layer Hybrid RAG pipeline that accepts a natural-language product description and returns the top 3–5 relevant BIS IS standards with rationale — in under 5 seconds.

| Layer | Technique | Why |
|-------|-----------|-----|
| Chunking | Standard-aligned (1 IS entry = 1 chunk) | Preserves standard boundaries; IS number always in chunk text |
| Dense retrieval | FAISS IndexFlatIP + `all-mpnet-base-v2` | High-quality semantic similarity via cosine |
| Sparse retrieval | BM25Okapi with domain-aware tokenizer | Catches exact IS number and abbreviation matches |
| Fusion | Reciprocal Rank Fusion (RRF) + IS-number boost | Merges dense + sparse signals without score normalization issues |
| Query expansion | HyDE (Hypothetical Document Embeddings via Gemini) | Closes vocabulary gap between user queries and BIS text |
| Reranking | TinyBERT-L-2-v2 cross-encoder | Precise relevance scoring on fused candidates |
| Safety | Hallucination guard (IS-pattern regex) | Rejects any output that isn't a valid IS standard |

A **dual-track router** skips the reranker when an IS number is detected in the query (fast path, ~0.1 s) or when the RRF confidence margin is sufficiently large.

---

## 🏗 System Architecture

```
User Query
    │
    ▼
Query Expansion (abbreviation map + HyDE if API key set)
    │
    ├──► FAISS Dense Retrieval (top-8)   ──┐
    │                                      │
    └──► BM25 Sparse Retrieval (top-8)  ──┤
                                           ▼
                                    RRF Fusion + IS-number boost
                                           │
                                    Dual-Track Router
                                     ┌─────┴─────┐
                                Fast path     Rerank path
                               (IS# in query) (cross-encoder)
                                     └─────┬─────┘
                                           ▼
                                  Hallucination Guard
                                           │
                                           ▼
                              Top 3–5 BIS Standards + Rationale
```

---

## 📁 Repository Structure

```
bis-recommendation-engine/
├── inference.py              ← Judge entry-point (--input / --output)
├── eval_script.py            ← Organizer-provided evaluation script (unchanged)
├── requirements.txt          ← All Python dependencies
├── README.md                 ← This file
├── presentation.pdf          ← 8-slide hackathon deck
├── LICENSE                   ← MIT
├── .gitignore
│
├── src/
│   ├── parse_pdf.py          ← PDF → standard-aligned chunks + metadata
│   ├── build_index.py        ← FAISS dense + BM25 sparse index builder
│   ├── retrieve.py           ← Core 6-layer hybrid retrieval engine
│   └── gradio_app.py         ← Interactive Gradio demo UI
│
├── data/
│   └── public_results.json   ← Results on the public test set (10 queries)
│
└── artifacts/                ← Pre-built indexes (run build_index.py to regenerate)
    ├── bis_index.faiss
    ├── bm25.pkl
    ├── chunks.pkl
    └── metadata.pkl
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.9 or higher
- CPU is sufficient; GPU accelerates embedding by ~5×

### Install dependencies

```bash
git clone https://github.com/<your-username>/bis-recommendation-engine.git
cd bis-recommendation-engine
pip install -r requirements.txt
```

### Build indexes (one-time, requires `dataset.pdf`)

Place the BIS SP 21 PDF as `dataset.pdf` in the repo root, then run:

```bash
python src/parse_pdf.py --pdf dataset.pdf --out-dir artifacts/
python src/build_index.py --artifact-dir artifacts/
```

> Pre-built artifacts are included in `artifacts/`, so this step is only needed if you want to rebuild from scratch.

---

## 🚀 Running Inference (Judge Command)

```bash
python inference.py --input hidden_private_dataset.json --output team_results.json
```

**Output JSON schema (strict — do not change key names):**

```json
[
  {
    "id": "q1",
    "retrieved_standards": ["IS 269: 2015", "IS 455: 1989", "IS 1489 (Part 1): 1991"],
    "latency_seconds": 0.42
  }
]
```

---

## 📊 Running Evaluation

```bash
python eval_script.py --results data/public_results.json
```

---

## 📈 Evaluation Results

Results on the **public test set** (10 queries):

| Metric | Score | Target |
|--------|-------|--------|
| Hit Rate @3 | **TBD** | > 80% |
| MRR @5 | **TBD** | > 0.70 |
| Avg Latency | **TBD** s | < 5.0 s |

> ⚠️ Fill in actual scores after running `eval_script.py` on `data/public_results.json`.

---

## 🔍 Retrieval Strategy

### Standard-Aligned Chunking

Each chunk corresponds to exactly one IS standard entry from the BIS SP 21 PDF. The IS number and year are always prepended to the chunk text, ensuring the dense embedding captures the standard identifier:

```
IS 269: 2015 Ordinary Portland Cement — Specification
SUMMARY OF IS 269: 2015
Specifies requirements for ordinary portland cement ...
```

### Domain-Aware BM25 Tokenizer

- IS numbers preserved as atomic tokens (`IS269`, `IS383`)
- Part numbers fused (`IS1489part1`)
- Abbreviations expanded (OPC, PPC, TMT, RCC, AAC, FAL-G) before tokenization
- BIS-specific stopwords removed; IS-number tokens always kept

### RRF Fusion Weights

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Dense weight | 0.55 | Semantic signal slightly dominant |
| Sparse weight | 0.45 | Keyword matching for IS numbers |
| RRF K | 60 | Standard Cormack et al. value |
| IS-number boost | +2.5 | Direct number match is very high signal |
| Confidence margin | 0.015 | Skip reranker when top result is clearly dominant |

### HyDE (Hypothetical Document Embeddings)

When `GEMINI_API_KEY` is set, the query is first expanded into a hypothetical BIS standard summary. This synthetic document is embedded instead of the raw query, closing the vocabulary gap between user language and BIS document language.

---

## 📄 Dataset

**BIS SP 21** — Summaries of Indian Standards for Building Materials.

Scope: Cement, Steel reinforcement, Concrete, Aggregates, Bricks, Blocks, and related building material standards.

Source: Official BIS publication provided by hackathon organizers.

---

## 🔑 Environment Variables

```bash
# Optional — enables HyDE query expansion
# Free key at https://aistudio.google.com/apikey (no credit card needed)
export GEMINI_API_KEY=your_key_here

# Optional — override artifact directory (default: artifacts/)
export ARTIFACT_DIR=artifacts/
```

> ⚠️ **Never commit API keys.** Use `export` or a `.env` file (`.env` is in `.gitignore`).

---

## 🚀 Demo UI

```bash
python src/gradio_app.py --artifact-dir artifacts/
```

A public Gradio link will be printed to the terminal.

---

## 👥 Team

| Name | Role |
|------|------|
| [Member 1] | RAG pipeline & retrieval engineering |
| [Member 2] | PDF parsing & chunking strategy |
| [Member 3] | Evaluation & UI/UX |
| [Member 4] | Presentation & documentation |

*IIT Tirupati × SS BIS Hackathon 2026*

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.
