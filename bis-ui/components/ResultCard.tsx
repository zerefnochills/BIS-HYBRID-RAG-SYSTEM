'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { StandardResult } from '../types'

interface ResultCardProps {
  result: StandardResult
  rank: number
  rationale?: string
}

function getConfidence(result: StandardResult): 'High' | 'Medium' | 'Low' {
  if (result.rrf_score) {
    if (result.rrf_score > 0.7) return 'High'
    if (result.rrf_score > 0.4) return 'Medium'
    return 'Low'
  }
  return 'Medium'
}

function parseRationale(rationale: string | undefined, standardId: string): string | null {
  if (!rationale) return null
  const lines = rationale.split('\n')
  for (const line of lines) {
    if (line.includes(standardId)) {
      const match = line.match(/[—–-]\s*(.+)/)
      if (match) return match[1].trim()
    }
  }
  return null
}

export default function ResultCard({ result, rank, rationale }: ResultCardProps) {
  const confidence = getConfidence(result)
  const specificRationale = parseRationale(rationale, result.standard_id)
  const confidencePercent = confidence === 'High' ? 90 : confidence === 'Medium' ? 60 : 30

  return (
    <motion.div 
      className="glass rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(217, 119, 6, 0.2)' }}
      transition={{ duration: 0.3 }}
    >
      {/* Rank Badge - Top Left Corner */}
      <div className="absolute top-0 left-0">
        <motion.div 
          className="w-12 h-12 bg-gradient-to-br from-[#D97706] to-[#B45309] flex items-center justify-center relative"
          style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
          whileHover={{ scale: 1.05 }}
        >
          <span className="absolute top-2 left-2 text-sm font-bold text-white">{rank}</span>
        </motion.div>
      </div>

      <div className="p-6 pt-8">
        {/* IS Code Badge */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <motion.span 
            className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-[#D97706] to-[#F59E0B] text-white text-base font-bold rounded-lg shadow-lg"
            whileHover={{ scale: 1.05, boxShadow: '0 8px 20px rgba(217, 119, 6, 0.4)' }}
            transition={{ duration: 0.2 }}
          >
            {result.standard_id}
          </motion.span>
          {result.category && (
            <span className="px-4 py-1.5 glass-light text-[#D6CCC2] text-sm font-medium rounded-lg border border-white/10">
              {result.category}
            </span>
          )}
        </div>

        {/* Title */}
        {result.title && (
          <h3 className="text-lg font-bold text-[#F8F5F2] mb-4 leading-snug uppercase tracking-wide">
            {result.title}
          </h3>
        )}

        {/* Explanation */}
        <div className="mb-5 p-4 rounded-xl bg-white/5 border border-white/5">
          {specificRationale ? (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-[#D97706]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-[#D6CCC2] leading-relaxed">{specificRationale}</p>
            </div>
          ) : (
            <p className="text-sm text-[#D6CCC2] leading-relaxed">
              Relevant specification for your product requirements
            </p>
          )}
        </div>

        {/* Confidence Bar */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#6B5B4F] uppercase tracking-wider">Confidence</span>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
              confidence === 'High' ? 'bg-green-500/20 text-green-400' :
              confidence === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 
              'bg-gray-500/20 text-gray-400'
            }`}>
              {confidence}
            </span>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden shadow-inner">
            <motion.div
              className={`h-full rounded-full shadow-lg ${
                confidence === 'High' ? 'bg-gradient-to-r from-green-500 to-green-400' :
                confidence === 'Medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' : 
                'bg-gradient-to-r from-gray-500 to-gray-400'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${confidencePercent}%` }}
              transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ResultCardSkeleton({ rank }: { rank: number }) {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-7 bg-white/10 rounded-full w-32" />
            <div className="h-7 bg-white/10 rounded-full w-20" />
          </div>
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-1/3" />
        </div>
      </div>
    </div>
  )
}
