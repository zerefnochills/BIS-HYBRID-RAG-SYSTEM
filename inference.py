import argparse, json, time, pickle, re
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME  = 'all-mpnet-base-v2'
INDEX_PATH  = 'bis_index.faiss'
CHUNKS_PATH = 'chunks.pkl'
META_PATH   = 'metadata.pkl'
TOP_K       = 5

parser = argparse.ArgumentParser()
parser.add_argument('--input', required=True)
parser.add_argument('--output', required=True)
args = parser.parse_args()

print('Loading model and index...')
model = SentenceTransformer(MODEL_NAME)
index = faiss.read_index(INDEX_PATH)
with open(CHUNKS_PATH, 'rb') as f: chunks = pickle.load(f)
try:
  with open(META_PATH, 'rb') as f: metadata = pickle.load(f)
except FileNotFoundError:
  metadata = []

IS_PAT = re.compile(r'IS\s+(\d+(?:\s*\([^)]+\))?)\s*:\s*(\d{4})', re.IGNORECASE)
def normalize_std(s): return str(s).replace(' ','').lower()
def extract_id(chunk, idx):
  if idx < len(metadata): return metadata[idx]['standard_id']
  m = IS_PAT.search(chunk)
  if m:
    num = re.sub(r'\s+',' ',m.group(1).strip())
    return f'IS {num}: {m.group(2)}'

  return chunk[:30]
def is_valid(s): return bool(IS_PAT.search(s))


with open(args.input) as f: queries = json.load(f)
print(f'Processing {len(queries)} queries...')
results = []
for item in queries:
  t0 = time.time()
  qvec = model.encode([item['query']], normalize_embeddings=True)
  scores, idxs = index.search(qvec.astype('float32'), TOP_K*2)
  seen, standards = set(), []
  for idx in idxs[0]:
    if idx < 0 or idx >= len(chunks): continue
    sid = extract_id(chunks[idx], idx)
    if not is_valid(sid): continue
    norm = normalize_std(sid)
    if norm not in seen: seen.add(norm); standards.append(sid)
    if len(standards) == TOP_K: break
  latency = round(time.time()-t0, 3)
  results.append({
    'id': item['id'],
    'retrieved_standards': standards,
    'latency_seconds': latency,
    'expected_standards': item.get('expected_standards', [])
  })
  print(f"  {item['id']} -> {standards[0] if standards else 'NONE'} ({latency}s)")

with open(args.output, 'w') as f: json.dump(results, f, indent=2)
print(f'Done. {len(results)} results saved to {args.output}')
