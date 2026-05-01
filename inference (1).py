import argparse, json, time, pickle, re
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer, CrossEncoder

# ── Config ────────────────────────────────────────────────────────────
MODEL_NAME    = "all-mpnet-base-v2"
# ── CHANGE: added reranker config ────────────────────────────────────
RERANKER_NAME = "cross-encoder/ms-marco-TinyBERT-L-2-v2"
INDEX_PATH    = "bis_index.faiss"
CHUNKS_PATH   = "chunks.pkl"
META_PATH     = "metadata.pkl"
BM25_PATH     = "bm25.pkl"
TOP_K         = 5
# ── CHANGE: FETCH_K reduced from 30 → 8 for speed ────────────────────
FETCH_K       = 8
RRF_K         = 60
DENSE_W       = 0.5
SPARSE_W      = 0.5
IS_BOOST      = 2.0

# ── CLI ───────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="BIS Dual-Track Hybrid RAG Inference")
parser.add_argument("--input",  required=True)
parser.add_argument("--output", required=True)
args = parser.parse_args()

# ── Load artefacts ────────────────────────────────────────────────────
print("Loading model and indexes...")
model = SentenceTransformer(MODEL_NAME)
index = faiss.read_index(INDEX_PATH)
with open(CHUNKS_PATH, "rb") as f: chunks   = pickle.load(f)
with open(META_PATH,   "rb") as f: metadata = pickle.load(f)
with open(BM25_PATH,   "rb") as f: bm25     = pickle.load(f)

# ── CHANGE: load cross-encoder reranker + warmup ─────────────────────
reranker = CrossEncoder(RERANKER_NAME, max_length=256)
_ = reranker.predict([("warmup", "warmup")])   # forces JIT before real queries

print(f"  Dense index  : {index.ntotal} vectors")
print(f"  BM25 corpus  : {len(chunks)} documents")
print(f"  Reranker     : {RERANKER_NAME} (warmed up)")

# ── Regex ─────────────────────────────────────────────────────────────
IS_PAT          = re.compile(r"IS\s+(\d+(?:\s*\([^)]+\))?):\s*(\d{4})", re.IGNORECASE)
IS_NUM_IN_QUERY = re.compile(r"\bIS\s*(\d+)", re.IGNORECASE)

# ── Stopwords (must match Cell 5 exactly) ────────────────────────────
STOPWORDS = {
    'a','an','the','is','are','was','were','be','been','being','have','has','had',
    'do','does','did','for','with','that','this','from','and','or','in','of','to',
    'on','at','by','as','it','its','which','shall','should','not','no','use',
    'used','using','per','etc','may','also','such','any','all','one','two',
    'three','each','their','they','when','where','if','than','then','about',
    'into','over','after','before','between','during','through','under','above',
    'standard','indian','specification','requirements','requirement',
    'method','test','part','section','clause','appendix','annex'
}

def domain_tokenize(text):
    text = re.sub(
        r'\bIS\s+(\d+)\s*\(([^)]+)\)',
        lambda m: f"IS{m.group(1)}part{re.sub(r'\\s+', '', m.group(2)).lower()}",
        text
    )
    text = re.sub(r'\bIS\s+(\d+)', lambda m: f"IS{m.group(1)}", text)
    abbrev_map = {
        r'\bO\.?P\.?C\.?\b': 'OPC', r'\bP\.?P\.?C\.?\b': 'PPC',
        r'\bP\.?S\.?C\.?\b': 'PSC', r'\bS\.?R\.?C\.?\b': 'SRC',
        r'\bH\.?A\.?C\.?\b': 'HAC', r'\bT\.?M\.?T\.?\b': 'TMT',
        r'\bR\.?C\.?C\.?\b': 'RCC', r'\bA\.?A\.?C\.?\b': 'AAC',
    }
    for pattern, replacement in abbrev_map.items():
        text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
    tokens = re.findall(r'[A-Za-z0-9]+', text.lower())
    cleaned = []
    for t in tokens:
        if t.startswith('is') and len(t) > 2 and t[2:].isdigit():
            cleaned.append(t)
        elif t not in STOPWORDS and len(t) > 1:
            cleaned.append(t)
    return cleaned

QUERY_EXPANSIONS = {
    r'\bOPC\b': 'Ordinary Portland Cement OPC',
    r'\bPPC\b': 'Portland Pozzolana Cement PPC fly ash',
    r'\bPSC\b': 'Portland Slag Cement PSC',
    r'\bSRC\b': 'Sulphate Resisting Cement SRC',
    r'\bHAC\b': 'High Alumina Cement HAC',
    r'\bTMT\b': 'Thermo-Mechanically Treated steel bars TMT',
    r'\bRCC\b': 'Reinforced Cement Concrete RCC',
    r'\bAAC\b': 'Autoclaved Aerated Concrete AAC blocks',
    r'\bFAL-G\b': 'Fly Ash Lime Gypsum FAL-G bricks',
    r'\bMSE\b': 'Micro Small Enterprise MSE',
}

def expand_query(query):
    expanded = query
    for pattern, replacement in QUERY_EXPANSIONS.items():
        expanded = re.sub(pattern, replacement, expanded, flags=re.IGNORECASE)
    return expanded

def normalize_std(s):
    return str(s).replace(" ", "").lower()

def extract_id(chunk, idx):
    if idx < len(metadata):
        return metadata[idx]["standard_id"]
    m = IS_PAT.search(chunk)
    if m:
        num = re.sub(r'\s+', ' ', m.group(1).strip())
        return f"IS {num}: {m.group(2)}"
    return chunk[:30]

def is_valid(s):
    return bool(IS_PAT.search(s))

def get_is_numbers_from_query(query):
    return set(m.group(1) for m in IS_NUM_IN_QUERY.finditer(query))

def idx_matches_is_number(idx, is_numbers):
    if not is_numbers or idx >= len(chunks): return False
    sid = extract_id(chunks[idx], idx)
    for num in is_numbers:
        if re.search(rf'\bIS\s*{re.escape(num)}\b', sid, re.IGNORECASE):
            return True
    return False

# ── CHANGE: dual-track hybrid_retrieve ───────────────────────────────
def hybrid_retrieve(query, top_k=5):
    t0 = time.time()

    expanded_query = expand_query(query)
    is_numbers     = get_is_numbers_from_query(query)

    # CHANGE: fast path skips reranker for IS-number queries
    use_reranker = (len(is_numbers) == 0)

    qvec = model.encode([expanded_query], normalize_embeddings=True).astype("float32")
    _, dense_idxs = index.search(qvec, FETCH_K)
    dense_idxs = dense_idxs[0].tolist()

    tokenized_query = domain_tokenize(query)
    bm25_scores_arr = bm25.get_scores(tokenized_query)
    bm25_top_idxs   = np.argsort(bm25_scores_arr)[::-1][:FETCH_K].tolist()

    rrf_scores = {}
    for rank, idx in enumerate(dense_idxs):
        if idx < 0 or idx >= len(chunks): continue
        score = DENSE_W / (rank + RRF_K)
        if idx_matches_is_number(idx, is_numbers): score += IS_BOOST
        rrf_scores[idx] = rrf_scores.get(idx, 0.0) + score

    for rank, idx in enumerate(bm25_top_idxs):
        if idx < 0 or idx >= len(chunks): continue
        score = SPARSE_W / (rank + RRF_K)
        if idx_matches_is_number(idx, is_numbers): score += IS_BOOST
        rrf_scores[idx] = rrf_scores.get(idx, 0.0) + score

    sorted_idxs = sorted(rrf_scores.keys(), key=lambda i: rrf_scores[i], reverse=True)
    collect_n   = FETCH_K if use_reranker else top_k
    candidates, seen = [], set()
    for idx in sorted_idxs:
        sid = extract_id(chunks[idx], idx)
        if not is_valid(sid): continue
        norm = normalize_std(sid)
        if norm not in seen:
            seen.add(norm)
            candidates.append((idx, sid))
        if len(candidates) == collect_n:
            break

    # CHANGE: cross-encoder only for semantic queries
    if use_reranker and len(candidates) > 1:
        pairs     = [(query, chunks[idx][:300]) for idx, _ in candidates]  # CHANGE: 300 chars
        ce_scores = reranker.predict(pairs)
        reranked  = sorted(zip(ce_scores, candidates), reverse=True)
        candidates = [c for _, c in reranked]

    standards = [sid for _, sid in candidates[:top_k]]
    return standards, round(time.time() - t0, 3)

# ── Run inference ─────────────────────────────────────────────────────
with open(args.input) as f:
    queries = json.load(f)

results = []
print(f"Processing {len(queries)} queries...")

for item in queries:
    standards, latency = hybrid_retrieve(item["query"])
    # CHANGE: include expected_standards so eval_script.py can score correctly
    results.append({
        "id":                  item["id"],
        "query":               item["query"],
        "expected_standards":  item.get("expected_standards", []),  # ← CRITICAL FIX
        "retrieved_standards": standards,
        "latency_seconds":     latency
    })
    track = "fast" if get_is_numbers_from_query(item["query"]) else "rerank"
    print(f"  {item['id']} [{track}] -> {standards[0] if standards else 'NONE'} ({latency}s)")

with open(args.output, "w") as f:
    json.dump(results, f, indent=2)

print(f"Done. {len(results)} results saved to {args.output}")