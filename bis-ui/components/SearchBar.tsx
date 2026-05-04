'use client'

import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
  compact?: boolean
}

export default function SearchBar({ value, onChange, onSubmit, isLoading, compact = false }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!compact) {
      inputRef.current?.focus()
    }
  }, [compact])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onSubmit()
    }
  }

  return (
    <motion.div 
      className={`glass rounded-xl p-2 transition-all duration-300 ${!isLoading && 'hover:glow-saffron focus-within:glow-saffron'}`}
      whileFocus={{ scale: 1.01 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        boxShadow: !compact && !isLoading ? [
          '0 0 0 0 rgba(217, 119, 6, 0)',
          '0 0 0 8px rgba(217, 119, 6, 0.1)',
          '0 0 0 0 rgba(217, 119, 6, 0)',
        ] : undefined
      }}
      transition={{ 
        duration: 0.4,
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          repeatDelay: 1,
        }
      }}
    >
      <div className="relative flex items-center">
        {/* Search Icon */}
        <motion.div 
          className="pl-4 pr-3 flex items-center pointer-events-none"
          animate={{ 
            scale: value.length > 0 ? 1.1 : 1,
            color: value.length > 0 ? '#D97706' : '#D6CCC2'
          }}
          transition={{ duration: 0.2 }}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </motion.div>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          className={`flex-1 ${compact ? 'py-3 text-base' : 'py-4 text-lg'} bg-transparent border-none text-[#F8F5F2] placeholder-[#6B5B4F] focus:outline-none`}
          placeholder="Describe your product (e.g., OPC cement for residential building)"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          autoComplete="off"
        />

        {/* Search Button */}
        <motion.button
          type="button"
          className="ml-2 px-8 py-3 bg-[#D97706] text-white font-semibold rounded-lg hover:bg-[#B45309] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
          onClick={onSubmit}
          disabled={isLoading || value.trim().length < 3}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Searching
            </span>
          ) : (
            'Search'
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}
