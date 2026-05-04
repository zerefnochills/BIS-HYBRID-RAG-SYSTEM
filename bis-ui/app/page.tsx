'use client'

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import SearchBar from '../components/SearchBar'
import ResultCard, { ResultCardSkeleton } from '../components/ResultCard'
import ExampleChips from '../components/ExampleChips'
import Sidebar from '../components/Sidebar'
import FloatingParticles from '../components/FloatingParticles'
import StatsBanner from '../components/StatsBanner'
import FeatureCards from '../components/FeatureCards'
import type { SearchResponse } from '../types'

export default function Home() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim() || query.length < 3) return

    setLoading(true)
    setResponse(null)
    setError(null)

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleExampleSelect = (text: string) => {
    setQuery(text)
    setTimeout(() => {
      setLoading(true)
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
        })
        .catch(err => {
          setError(err.message)
        })
        .finally(() => {
          setLoading(false)
        })
    }, 200)
  }

  const hasResults = response && response.results.length > 0

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Layer 1: Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/backgroundimage.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          filter: 'blur(4px) saturate(0.9) brightness(0.8)',
          transform: 'scale(1.05)',
        }}
      />
      
      {/* Layer 2: Dark Overlay Gradient */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(20, 12, 8, 0.6), rgba(20, 12, 8, 0.75))',
        }}
      />

      {/* Floating Particles */}
      <FloatingParticles />

      {/* Layer 3: Glass UI Content */}
      <div className="relative z-10">
        <Navbar />

        <main className="max-w-7xl mx-auto px-6">
          {/* Hero Section - Shows when no results */}
          <AnimatePresence mode="wait">
            {!hasResults && !loading && !error && (
              <motion.div 
                className="min-h-[calc(100vh-80px)] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-full max-w-3xl">
                  <motion.div 
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                  >
                    <motion.h1 
                      className="text-5xl font-bold text-[#F8F5F2] mb-4 text-glow cursor-default overflow-hidden" 
                      style={{ letterSpacing: '0.02em' }}
                    >
                      {/* Animated text reveal */}
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        {'What BIS standard are you looking for?'.split(' ').map((word, wordIndex) => (
                          <motion.span
                            key={wordIndex}
                            className="inline-block mr-3"
                            initial={{ opacity: 0, y: 20, rotateX: -90 }}
                            animate={{ opacity: 1, y: 0, rotateX: 0 }}
                            transition={{
                              duration: 0.6,
                              delay: 0.4 + wordIndex * 0.1,
                              ease: [0.25, 0.4, 0.25, 1],
                            }}
                            whileHover={{ 
                              scale: 1.1,
                              color: '#D97706',
                              transition: { duration: 0.2 }
                            }}
                          >
                            {word.split('').map((char, charIndex) => (
                              <motion.span
                                key={charIndex}
                                className="inline-block"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{
                                  duration: 0.1,
                                  delay: 0.4 + wordIndex * 0.1 + charIndex * 0.02,
                                }}
                              >
                                {char}
                              </motion.span>
                            ))}
                          </motion.span>
                        ))}
                      </motion.span>
                    </motion.h1>
                    <motion.p
                      className="text-lg text-[#D6CCC2]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.5, duration: 0.6 }}
                    >
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ delay: 1.5, duration: 1, ease: 'easeOut' }}
                        className="inline-block overflow-hidden whitespace-nowrap"
                      >
                        AI-powered search across 15,000+ Indian standards
                      </motion.span>
                    </motion.p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.8 }}
                  >
                    <SearchBar
                      value={query}
                      onChange={setQuery}
                      onSubmit={handleSearch}
                      isLoading={loading}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 2.0 }}
                  >
                    <ExampleChips onSelect={handleExampleSelect} />
                  </motion.div>

                  {/* Stats Banner */}
                  <StatsBanner />

                  {/* Feature Cards */}
                  <FeatureCards />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact Search - Shows when results exist */}
          <AnimatePresence>
            {(hasResults || loading || error) && (
              <motion.div 
                className="pt-12 pb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-3xl mx-auto">
                  <SearchBar
                    value={query}
                    onChange={setQuery}
                    onSubmit={handleSearch}
                    isLoading={loading}
                    compact
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div 
                className="max-w-3xl mx-auto mb-8"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="glass rounded-2xl p-6 border-red-500/20">
                  <div className="flex items-start gap-3">
                    <motion.svg 
                      className="w-5 h-5 text-red-400 mt-0.5" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </motion.svg>
                    <div>
                      <p className="font-semibold text-red-300 mb-1">Could not reach the engine</p>
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          {(hasResults || loading) && (
            <div className="pb-16">
              <div className="flex gap-8">
                {/* Left - Results List (70%) */}
                <div className="flex-1">
                  {loading && (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <ResultCardSkeleton key={i} rank={i} />
                      ))}
                    </div>
                  )}

                  {hasResults && !loading && (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {response.results.map((result, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: idx * 0.1 }}
                        >
                          <ResultCard
                            result={result}
                            rank={idx + 1}
                            rationale={response.rationale}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {response && response.results.length === 0 && !loading && (
                    <motion.div 
                      className="glass rounded-2xl p-12 text-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <motion.svg 
                        className="w-12 h-12 text-[#D6CCC2] mx-auto mb-4 opacity-50" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </motion.svg>
                      <p className="text-lg font-semibold text-[#F8F5F2] mb-2">No standards found</p>
                      <p className="text-sm text-[#D6CCC2]">
                        Try rephrasing your query or using specific material terms
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Right - Sidebar (30%) */}
                {(hasResults || loading) && (
                  <div className="w-80 hidden lg:block">
                    <div className="sticky top-24">
                      <Sidebar
                        pipeline={response?.pipeline}
                        latency={response?.latency_seconds}
                        loading={loading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
