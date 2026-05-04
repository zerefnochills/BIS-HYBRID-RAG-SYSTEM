'use client'

import React from 'react'
import type { StandardResult } from '../types'

interface ResultCardProps {
  result: StandardResult
  rank: number
  rationale?: string
  animationDelay?: number
}

// Map category → color + icon
const CATEGORY_META: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  Cement:      { color: '#7C6EAF', bg: '#F4F1FF', border: '#D8D0F8', icon: '🏗️' },
  Steel:       { color: '#2C5F8A', bg: '#EEF5FF', border: '#C3D9F8', icon: '⚙️' },
  Concrete:    { color: '#4A6741', bg: '#F0F7EE', border: '#C5DEC2', icon: '🧱' },
  Aggregates:  { color: '#8A6A2C', bg: '#FFF8EE', border: '#F8DCA3', icon: '🪨' },
  Bricks:      { color: '#B84C2A', bg: '#FFF2EE', border: '#F8C8B8', icon: '🧱' },
  Default:     { color: 'var(--accent)', bg: 'var(--accent-pale)', border: '#F5CFA0', icon: '📋' },
}

function getCategoryMeta(category?: string) {
  if (!category) return CATEGORY_META.Default
  return CATEGORY_META[category] || CATEGORY_META.Default
}

// Parse IS number for highlighting
function parseISNumber(standardId: string): { prefix: string; year: string } | null {
  const match = standardId.match(/^(IS\s*[\d\s()Part:]+?):?\s*(\d{4})$/)
  if (!match) return null
  return { prefix: match[1].trim(), year: match[2] }
}

export default function ResultCard({
  result,
  rank,
  rationale,
  animationDelay = 0,
}: ResultCardProps) {
  const meta = getCategoryMeta(result.category)
  const parsed = parseISNumber(result.standard_id)

  return (
    <div
      className="card p-5 animate-fade-up"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start gap-4">
        {/* Rank badge */}
        <div className="badge-rank flex-shrink-0 font-display font-bold"
          style={{ fontFamily: 'var(--font-display)' }}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* IS Number */}
              <span className="is-number">
                {result.standard_id}
              </span>

              {/* Category badge */}
              {result.category && (
                <span
                  className="badge"
                  style={{
                    background: meta.bg,
                    color: meta.color,
                    border: `1px solid ${meta.border}`,
                    fontSize: '11px',
                  }}
                >
                  <span>{meta.icon}</span>
                  {result.category}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3
            className="leading-snug mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontStyle: result.title ? 'normal' : 'italic',
            }}
          >
            {result.title || 'Title not available in index'}
          </h3>

          {/* Rationale (if available from Gemini) */}
          {rationale && (
            <div
              className="rounded-xl p-3 mb-3"
              style={{
                background: 'linear-gradient(135deg, #FDF8F2 0%, #FAFAF8 100%)',
                border: '1px solid #EDE8DC',
              }}
            >
              <div
                className="flex items-center gap-1.5 mb-1"
                style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}
              >
                <span>✦</span> AI Rationale
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {rationale}
              </p>
            </div>
          )}

          {/* Footer: parsed IS info */}
          <div className="flex items-center gap-3 flex-wrap">
            {parsed && (
              <span
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span style={{ opacity: 0.5 }}>📅</span>
                Edition {parsed.year}
              </span>
            )}
            <a
              href={`https://www.bis.gov.in/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{
                fontSize: '11.5px',
                color: 'var(--accent)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 9L9 1M9 1H3M9 1V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              View on BIS
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Skeleton version for loading — rank prop kept in signature for API consistency
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ResultCardSkeleton({ rank }: { rank: number }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <div className="w-7 h-7 skeleton rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="skeleton h-6 w-28 rounded-lg" />
            <div className="skeleton h-6 w-16 rounded-lg" />
          </div>
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/3 rounded" />
        </div>
      </div>
    </div>
  )
}
