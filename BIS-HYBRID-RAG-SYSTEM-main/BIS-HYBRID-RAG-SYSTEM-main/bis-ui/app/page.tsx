'use client'

import React, { useState, useCallback, useRef } from 'react'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import PipelineTracer from '../components/PipelineTracer'
import ResultCard, { ResultCardSkeleton } from '../components/ResultCard'
import ExampleChips from '../components/ExampleChips'
import StatsBanner from '../components/StatsBanner'
import ArchitectureSidebar from '../components/ArchitectureSidebar'
import type { SearchResponse, SearchState } from '../types'

// Parse per-standard rationale lines from Gemini markdown
function parseRationales(rationale?: string): Record<string, string> {
  if (!rationale) return {}
  const map: Record<string, string> = {}
  const lines = rationale.split('\n')
  for (const line of lines) {
    const match = line.match(/\*\*IS\s*([\d()Part\s:]+\d{4})\*\*\s*[—–-]\s*(.+)/)
    if (match) {
      const id = `IS ${match[1].trim()}`
      map[id] = match[2].trim()
    }
  }
  return map
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [state, setState] = useState<SearchState>('idle')
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length < 3) return

    setState('loading')
    setResponse(null)
    setError(null)

    // Scroll to results area
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), top_k: 5 }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || `Server error: ${res.status}`)
      }

      const data: SearchResponse = await res.json()
      setResponse(data)
      setState('done')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
      setState('error')
    }
  }, [query])

  const handleExampleSelect = (text: string) => {
    setQuery(text)
    // Small delay so user sees the text appear before auto-submit
    setTimeout(() => {
      setState('loading')
      setResponse(null)
      setError(null)

      fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, top_k: 5 }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`Server error: ${res.status}`)
          return res.json()
        })
        .then((data: SearchResponse) => {
          setResponse(data)
          setState('done')
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 200)
        })
        .catch(err => {
          setError(err.message)
          setState('error')
        })
    }, 350)
  }

  const rationales = parseRationales(response?.rationale)

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-8">

          {/* ── Left: Search + Results ── */}
          <div className="space-y-6">

            {/* Search box */}
            <div className="animate-fade-up">
              <SearchBar
                value={query}
                onChange={setQuery}
                onSubmit={handleSearch}
                isLoading={state === 'loading'}
              />
            </div>

            {/* Example chips (visible when idle or done) */}
            {state !== 'loading' && (
              <div className="animate-fade-up delay-100">
                <ExampleChips onSelect={handleExampleSelect} />
              </div>
            )}

            {/* Results area anchor */}
            <div ref={resultsRef} />

            {/* Pipeline trace (loading + done) */}
            <PipelineTracer pipeline={response?.pipeline} state={state} />

            {/* Stats banner (done) */}
            {state === 'done' && response && (
              <StatsBanner
                latency={response.latency_seconds}
                pipeline={response.pipeline}
                resultCount={response.results.length}
              />
            )}

            {/* Loading skeletons */}
            {state === 'loading' && (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <ResultCardSkeleton key={i} rank={i} />
                ))}
              </div>
            )}

            {/* Results */}
            {state === 'done' && response && (
              <div className="space-y-4">
                {response.results.length === 0 ? (
                  <div
                    className="card p-10 text-center animate-fade-in"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>
                      No standards found
                    </p>
                    <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                      Try rephrasing your query or using specific material terms
                      like &quot;cement&quot;, &quot;steel bars&quot;, &quot;aggregates&quot;, or an IS number.
                    </p>
                  </div>
                ) : (
                  <>
                    {response.results.map((result, i) => (
                      <ResultCard
                        key={result.standard_id}
                        result={result}
                        rank={i + 1}
                        rationale={rationales[result.standard_id]}
                        animationDelay={i * 80}
                      />
                    ))}

                    {/* Full rationale block if available */}
                    {response.rationale && Object.keys(rationales).length === 0 && (
                      <div
                        className="card p-5 animate-fade-up"
                        style={{ animationDelay: '400ms' }}
                      >
                        <div
                          className="flex items-center gap-2 mb-3"
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          <span>✦</span> AI Compliance Rationale
                          <span
                            className="badge ml-2"
                            style={{ background: '#F4F1FF', color: '#7C6EAF', border: '1px solid #D8D0F8' }}
                          >
                            Gemini
                          </span>
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-body)',
                            fontSize: '14px',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {response.rationale}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Error state */}
            {state === 'error' && (
              <div
                className="card p-6 animate-fade-in"
                style={{ border: '1px solid #F8C8B8', background: '#FFF6F4' }}
              >
                <div className="flex items-start gap-3">
                  <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 16,
                        fontWeight: 600,
                        color: '#C0392B',
                        marginBottom: 6,
                      }}
                    >
                      Could not reach the engine
                    </p>
                    <p style={{ fontSize: 13.5, color: '#8A2C1A', lineHeight: 1.6, marginBottom: 12 }}>
                      {error}
                    </p>
                    <div
                      className="rounded-lg p-3"
                      style={{ background: 'rgba(192,57,43,0.07)', border: '1px solid rgba(192,57,43,0.15)' }}
                    >
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8A2C1A' }}>
                        Make sure the FastAPI server is running:
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: 12,
                          color: '#C0392B',
                          marginTop: 4,
                          fontWeight: 600,
                        }}
                      >
                        uvicorn api.main:app --host 0.0.0.0 --port 8000
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Idle empty state */}
            {state === 'idle' && (
              <div className="animate-fade-up delay-200">
                <div
                  className="rounded-2xl p-8 text-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(224,123,0,0.04) 0%, transparent 100%)',
                    border: '1px dashed rgba(224,123,0,0.2)',
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 8,
                    }}
                  >
                    Describe your building material product
                  </p>
                  <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.65, maxWidth: 400, margin: '0 auto' }}>
                    Enter a natural language description or question. The 6-layer Hybrid RAG pipeline
                    will find the most relevant BIS IS standards from SP 21.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Architecture sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <ArchitectureSidebar />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10"
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-card)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Built for <strong style={{ color: 'var(--text-secondary)' }}>IIT Tirupati × SS BIS Hackathon 2026</strong>
            {' · '}
            Dataset: BIS SP 21 (Building Materials)
          </p>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              FAISS + BM25 + RRF + TinyBERT
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
