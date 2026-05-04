// Shared TypeScript types for the BIS Standards Recommendation Engine UI

export type SearchState = 'idle' | 'loading' | 'done' | 'error'

export interface StandardResult {
  standard_id: string     // e.g. "IS 269: 2015"
  title: string           // e.g. "Ordinary Portland Cement — Specification"
  rrf_score?: number
  category?: string       // e.g. "Cement", "Steel", "Aggregates"
}

export interface PipelineTrace {
  query_expanded: boolean
  hyde_used: boolean
  dense_hits: number
  sparse_hits: number
  reranker_used: boolean
  track: 'fast' | 'rerank'
  confidence_margin?: number
}

export interface SearchResponse {
  results: StandardResult[]
  latency_seconds: number
  pipeline: PipelineTrace
  rationale?: string
}
