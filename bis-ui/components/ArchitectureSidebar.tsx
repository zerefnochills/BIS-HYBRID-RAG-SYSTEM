'use client'

import React from 'react'

const LAYERS = [
  {
    step: '01',
    label: 'Query Expansion',
    desc: 'Abbreviation map + HyDE (Gemini)',
    color: '#7C6EAF',
    emoji: '🔤',
  },
  {
    step: '02',
    label: 'Dense Retrieval',
    desc: 'FAISS · all-mpnet-base-v2',
    color: '#2B7CB5',
    emoji: '🧠',
  },
  {
    step: '03',
    label: 'Sparse Retrieval',
    desc: 'BM25 domain-aware tokenizer',
    color: '#2B99A0',
    emoji: '🔑',
  },
  {
    step: '04',
    label: 'RRF Fusion',
    desc: 'Reciprocal Rank Fusion + IS boost',
    color: '#E07B00',
    emoji: '⚡',
  },
  {
    step: '05',
    label: 'Dual-Track Router',
    desc: 'Fast path / Rerank path',
    color: '#C0392B',
    emoji: '🔀',
  },
  {
    step: '06',
    label: 'Cross-Encoder Reranker',
    desc: 'TinyBERT-L-2 precision boost',
    color: '#1A6B4A',
    emoji: '🎯',
  },
]

const TECH = ['FAISS', 'BM25', 'TinyBERT', 'Gemini', 'all-mpnet', 'FastAPI', 'Next.js']

export default function ArchitectureSidebar() {
  return (
    <div className="space-y-4">
      {/* Architecture card */}
      <div className="card p-5">
        <div
          className="flex items-center gap-2 mb-4"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          <span>⚙️</span> 6-Layer Architecture
        </div>

        <div className="space-y-3">
          {LAYERS.map((layer, i) => (
            <div key={layer.step} className="flex items-start gap-3">
              {/* Step number + connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ background: layer.color }}
                >
                  {layer.step}
                </div>
                {i < LAYERS.length - 1 && (
                  <div className="w-px h-4 mt-1" style={{ background: layer.color + '40' }} />
                )}
              </div>

              <div className="pb-1">
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.3,
                  }}
                >
                  {layer.emoji} {layer.label}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    lineHeight: 1.4,
                    marginTop: 2,
                  }}
                >
                  {layer.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="card p-5">
        <div
          className="mb-3"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          🛠️ Tech Stack
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TECH.map(t => (
            <span
              key={t}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--accent)',
                background: 'var(--accent-pale)',
                border: '1px solid rgba(224,123,0,0.2)',
                padding: '2px 8px',
                borderRadius: 5,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Dataset note */}
      <div
        className="rounded-xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(224,123,0,0.05) 0%, transparent 100%)',
          border: '1px dashed rgba(224,123,0,0.25)',
        }}
      >
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Dataset:</strong> BIS SP 21<br />
          Building Materials domain<br />
          Parsed + chunked from official PDF
        </p>
      </div>
    </div>
  )
}
