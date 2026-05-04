'use client'

import React, { useState } from 'react'
import type { SearchResponse } from '../types'

interface ExplanationPanelProps {
  pipeline?: SearchResponse['pipeline']
  latency?: number
  loading: boolean
}

export default function ExplanationPanel({ pipeline, latency, loading }: ExplanationPanelProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-6 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!pipeline) return null

  return (
    <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-[#F8FAFC] transition-colors"
      >
        <h3 className="text-base font-bold text-[#0F172A]">Why these results?</h3>
        <svg
          className={`w-5 h-5 text-[#64748B] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#F8FAFC]">
          {/* Query Expansion */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#475569]">Query expansion</span>
              <span className={`text-xs font-semibold ${pipeline.query_expanded ? 'text-green-600' : 'text-gray-400'}`}>
                {pipeline.query_expanded ? 'Yes' : 'No'}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">Abbreviations and synonyms expanded</p>
          </div>

          {/* Retrieval Type */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-[#475569]">Retrieval type</span>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                pipeline.track === 'fast'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-purple-50 text-purple-700'
              }`}>
                {pipeline.track === 'fast' ? 'Fast path' : 'Rerank'}
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              {pipeline.track === 'fast' 
                ? 'Direct IS code match detected'
                : 'Semantic reranking applied'}
            </p>
          </div>

          {/* Latency */}
          {latency && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#475569]">Latency</span>
                <span className="text-sm font-bold text-[#0F172A]">{latency.toFixed(2)}s</span>
              </div>
              <div className="w-full bg-[#F8FAFC] rounded-full h-2">
                <div
                  className="bg-[#F59E0B] h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((latency / 5) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Technical Details */}
          <div className="pt-3 border-t border-[#F8FAFC]">
            <p className="text-xs font-medium text-[#64748B] mb-2">Technical details</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Dense hits</span>
                <span className="font-medium text-[#0F172A]">{pipeline.dense_hits}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Sparse hits</span>
                <span className="font-medium text-[#0F172A]">{pipeline.sparse_hits}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#64748B]">Reranker used</span>
                <span className={`w-2 h-2 rounded-full ${pipeline.reranker_used ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
