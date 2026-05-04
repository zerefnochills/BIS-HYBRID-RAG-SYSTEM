'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SearchResponse } from '../types'

interface SidebarProps {
  pipeline?: SearchResponse['pipeline']
  latency?: number
  loading: boolean
}

export default function Sidebar({ pipeline, latency, loading }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  if (loading) {
    return (
      <motion.div 
        className="glass-light rounded-2xl p-5 animate-pulse"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="h-5 bg-white/10 rounded w-3/4 mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-white/10 rounded" />
          <div className="h-4 bg-white/10 rounded" />
          <div className="h-4 bg-white/10 rounded" />
        </div>
      </motion.div>
    )
  }

  if (!pipeline) return null

  return (
    <motion.div 
      className="glass-light rounded-2xl overflow-hidden border border-white/10"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Header */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors border-b border-white/5"
        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#D97706]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
          </svg>
          <h3 className="text-sm font-bold text-[#F8F5F2] uppercase tracking-wider">Pipeline</h3>
        </div>
        <motion.svg
          className="w-4 h-4 text-[#D6CCC2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="px-5 pb-5"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pt-5 space-y-4">
              {/* Query Expanded */}
              <motion.div 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="text-sm text-[#D6CCC2] font-medium">Query Expanded</span>
                {pipeline.query_expanded ? (
                  <motion.div
                    className="flex items-center gap-1.5"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  >
                    <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold text-green-400">Yes</span>
                  </motion.div>
                ) : (
                  <span className="text-xs font-semibold text-[#6B5B4F]">No</span>
                )}
              </motion.div>

              {/* Dense Retrieval */}
              <motion.div 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <span className="text-sm text-[#D6CCC2] font-medium">Dense Retrieval</span>
                <motion.span 
                  className="text-base font-bold text-[#D97706] px-2.5 py-1 rounded-md bg-[#D97706]/10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.25 }}
                >
                  {pipeline.dense_hits}
                </motion.span>
              </motion.div>

              {/* Sparse Retrieval */}
              <motion.div 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-sm text-[#D6CCC2] font-medium">Sparse Retrieval</span>
                <motion.span 
                  className="text-base font-bold text-[#D97706] px-2.5 py-1 rounded-md bg-[#D97706]/10"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
                >
                  {pipeline.sparse_hits}
                </motion.span>
              </motion.div>

              {/* Reranker */}
              <motion.div 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <span className="text-sm text-[#D6CCC2] font-medium">Reranker Used</span>
                <span className="text-xs font-semibold text-[#6B5B4F]">
                  {pipeline.reranker_used ? 'Yes' : 'No'}
                </span>
              </motion.div>

              {/* Latency */}
              {latency && (
                <motion.div 
                  className="pt-4 border-t border-white/10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#D6CCC2] uppercase tracking-wider">Latency</span>
                    <span className="text-lg font-bold text-[#F8F5F2]">{latency.toFixed(2)}s</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      className="bg-gradient-to-r from-[#D97706] to-[#F59E0B] h-full rounded-full shadow-lg"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((latency / 5) * 100, 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
