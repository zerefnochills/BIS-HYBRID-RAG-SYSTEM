'use client'

import React, { useEffect, useState } from 'react'
import clsx from 'clsx'
import type { PipelineTrace, SearchState } from '../types'

interface PipelineTracerProps {
  pipeline?: PipelineTrace
  state: SearchState
}

const STEPS = [
  {
    id: 'expand',
    label: 'Query Expansion',
    emoji: '🔤',
    desc: 'Abbreviation map + HyDE',
    color: '#7C6EAF',
  },
  {
    id: 'dense',
    label: 'Dense Retrieval',
    emoji: '🧠',
    desc: 'FAISS + all-mpnet-base-v2',
    color: '#2B7CB5',
  },
  {
    id: 'sparse',
    label: 'Sparse Retrieval',
    emoji: '🔑',
    desc: 'BM25 domain-aware tokenizer',
    color: '#2B99A0',
  },
  {
    id: 'fusion',
    label: 'RRF Fusion',
    emoji: '⚡',
    desc: 'Reciprocal Rank Fusion + IS boost',
    color: '#E07B00',
  },
  {
    id: 'router',
    label: 'Dual-Track Router',
    emoji: '🔀',
    desc: 'Fast path or rerank path',
    color: '#C0392B',
  },
  {
    id: 'rerank',
    label: 'Cross-Encoder',
    emoji: '🎯',
    desc: 'TinyBERT-L-2 reranker',
    color: '#1A6B4A',
  },
]

export default function PipelineTracer({ pipeline, state }: PipelineTracerProps) {
  const [activeStep, setActiveStep] = useState(-1)

  // Animate steps sequentially during loading
  useEffect(() => {
    if (state === 'loading') {
      setActiveStep(-1)
      const timers: ReturnType<typeof setTimeout>[] = []
      STEPS.forEach((_, i) => {
        timers.push(setTimeout(() => setActiveStep(i), i * 220))
      })
      return () => timers.forEach(clearTimeout)
    }
    if (state === 'done' || state === 'idle') {
      setActiveStep(-1)
    }
  }, [state])

  const isVisible = state === 'loading' || state === 'done'
  if (!isVisible) return null

  // For 'done', determine which steps were active based on pipeline
  const stepActive = (i: number): boolean => {
    if (state === 'loading') return i <= activeStep
    if (!pipeline) return true
    const id = STEPS[i].id
    if (id === 'expand') return pipeline.query_expanded
    if (id === 'dense') return true
    if (id === 'sparse') return true
    if (id === 'fusion') return true
    if (id === 'router') return true
    if (id === 'rerank') return pipeline.reranker_used
    return false
  }

  return (
    <div className="animate-fade-in card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse-soft" />
          <h3
            className="text-sm font-semibold tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-body)', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}
          >
            {state === 'loading' ? 'Pipeline Running…' : 'Pipeline Trace'}
          </h3>
        </div>
        {pipeline && state === 'done' && (
          <div className="flex items-center gap-2">
            <span className={clsx('badge', pipeline.track === 'fast' ? 'badge-fast' : 'badge-rerank')}>
              {pipeline.track === 'fast' ? '⚡ Fast path' : '🔍 Rerank path'}
            </span>
          </div>
        )}
      </div>

      {/* Steps row — desktop horizontal */}
      <div className="hidden md:flex items-center gap-0">
        {STEPS.map((step, i) => {
          const active = stepActive(i)
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                <div
                  className={clsx('pipeline-step-dot', active ? 'active' : 'inactive')}
                  style={active ? { background: step.color + '18', borderColor: step.color } : {}}
                  title={step.desc}
                >
                  <span className="text-base leading-none">{step.emoji}</span>
                </div>
                <span
                  className="text-center leading-tight"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    fontWeight: 500,
                    color: active ? 'var(--text-secondary)' : 'var(--text-muted)',
                    opacity: active ? 1 : 0.5,
                  }}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 relative" style={{ minWidth: 20 }}>
                  <div
                    className="h-[2px] rounded-full mx-1"
                    style={{
                      background: stepActive(i + 1)
                        ? `linear-gradient(90deg, ${step.color}, ${STEPS[i + 1].color})`
                        : '#E0DAD4',
                      opacity: stepActive(i + 1) ? 1 : 0.3,
                      transition: 'all 0.4s ease',
                    }}
                  />
                  {state === 'loading' && activeStep === i && (
                    <div
                      className="absolute inset-0 mx-1 h-[2px] rounded-full overflow-hidden"
                      style={{ background: 'transparent' }}
                    >
                      <div
                        className="h-full w-8 absolute"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                          animation: 'slideAcross 0.8s infinite',
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Mobile vertical steps */}
      <div className="md:hidden space-y-2">
        {STEPS.map((step, i) => {
          const active = stepActive(i)
          return (
            <div
              key={step.id}
              className="flex items-center gap-3 transition-all duration-300"
              style={{ opacity: active ? 1 : 0.35 }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm border-2"
                style={{
                  background: active ? step.color + '18' : '#F0EDEA',
                  borderColor: active ? step.color : '#DDD9D4',
                }}
              >
                {step.emoji}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{step.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{step.desc}</div>
              </div>
              {active && state === 'loading' && activeStep === i && (
                <div className="ml-auto">
                  <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {active && state === 'done' && (
                <div className="ml-auto text-[var(--accent)]">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes slideAcross {
          0% { left: -32px; }
          100% { left: calc(100% + 32px); }
        }
      `}</style>
    </div>
  )
}
