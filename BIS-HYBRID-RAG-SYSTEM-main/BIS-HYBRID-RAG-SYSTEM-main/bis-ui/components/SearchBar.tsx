'use client'

import React, { useRef, useEffect } from 'react'

interface SearchBarProps {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  isLoading: boolean
}

export default function SearchBar({ value, onChange, onSubmit, isLoading }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) onSubmit()
  }

  return (
    <div className="relative">
      {/* Search icon */}
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-muted)', zIndex: 1 }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>

      <input
        ref={inputRef}
        id="search-input"
        type="text"
        className="search-input"
        placeholder="e.g. Ordinary Portland Cement for residential building…"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        autoComplete="off"
        spellCheck={false}
      />

      {/* Submit button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        <button
          id="search-submit"
          className="btn-primary flex items-center gap-2"
          onClick={onSubmit}
          disabled={isLoading || value.trim().length < 3}
        >
          {isLoading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Searching</span>
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 7L7 13M1 7H13" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Search</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
