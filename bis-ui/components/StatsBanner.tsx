'use client'

import React from 'react'
import type { PipelineTrace } from '../types'

interface StatsBannerProps {
  latency: number
  pipeline: PipelineTrace
  resultCount: number
}

export default function StatsBanner({ latency, pipeline, resultCount }: StatsBannerProps) {
  const stats = [
    {
      label: 'Latency',
      value: latency < 1 ? `${Math.round(latency * 1000)}ms` : `${latency.toFixed(2)}s`,
      icon: '⚡',
      good: latency < 5,
    },
    {
      label: 'Results',
      value: String(resultCount),
      icon: '📋',
      good: resultCount > 0,
    },
    {
      label: 'Track',
      value: pipeline.track === 'fast' ? 'Fast path' : 'Rerank path',
      icon: pipeline.track === 'fast' ? '🚀' : '🔍',
      good: true,
    },
    {
      label: 'Dense hits',
      value: String(pipeline.dense_hits),
      icon: '🧠',
      good: pipeline.dense_hits > 0,
    },
    {
      label: 'Sparse hits',
      value: String(pipeline.sparse_hits),
      icon: '🔑',
      good: pipeline.sparse_hits > 0,
    },
    {
      label: 'Reranker',
      value: pipeline.reranker_used ? 'Active' : 'Bypassed',
      icon: '🎯',
      good: true,
    },
  ]

  return (
    <div
      className="rounded-xl p-4 animate-fade-in"
      style={{
        background: 'linear-gradient(135deg, rgba(224,123,0,0.06) 0%, rgba(224,123,0,0.02) 100%)',
        border: '1px solid rgba(224,123,0,0.18)',
      }}
    >
      <div className="flex flex-wrap gap-4 justify-between">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-2 min-w-[80px]">
            <span style={{ fontSize: 14 }}>{s.icon}</span>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: s.good ? 'var(--accent)' : '#C0392B',
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
