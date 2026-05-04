'use client'

import React from 'react'

export default function Header() {
  return (
    <header className="relative z-10">
      {/* Top bar */}
      <div
        style={{
          background: '#0D0D0D',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Indian flag colors stripe */}
            <div className="flex gap-0.5 items-center">
              <div className="w-1 h-5 rounded-sm" style={{ background: '#FF9933' }} />
              <div className="w-1 h-5 rounded-sm" style={{ background: '#FFFFFF' }} />
              <div className="w-1 h-5 rounded-sm" style={{ background: '#138808' }} />
            </div>
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.55)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Bureau of Indian Standards
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.06em',
              }}
            >
              IIT Tirupati × SS BIS Hackathon 2026
            </span>
          </div>
        </div>
      </div>

      {/* Main hero header */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0D0D0D 0%, #1A1208 50%, #0D0A06 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Background decorative elements */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, #E07B00 0%, transparent 60%), radial-gradient(circle at 80% 20%, #E07B00 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute top-0 right-0 w-96 h-96 opacity-[0.04]"
          style={{
            background: 'conic-gradient(from 180deg, #E07B00, transparent 60%)',
            borderRadius: '50%',
            transform: 'translate(30%, -30%)',
          }}
        />

        {/* Ashoka Chakra-inspired decorative ring */}
        <div
          className="absolute right-12 top-1/2 -translate-y-1/2 opacity-[0.05] hidden lg:block"
          style={{ width: 180, height: 180 }}
        >
          <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="90" cy="90" r="85" stroke="#E07B00" strokeWidth="2" />
            <circle cx="90" cy="90" r="65" stroke="#E07B00" strokeWidth="1" />
            <circle cx="90" cy="90" r="10" stroke="#E07B00" strokeWidth="2" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 360) / 24
              const rad = (angle * Math.PI) / 180
              const x1 = 90 + 68 * Math.cos(rad)
              const y1 = 90 + 68 * Math.sin(rad)
              const x2 = 90 + 82 * Math.cos(rad)
              const y2 = 90 + 82 * Math.sin(rad)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E07B00" strokeWidth="1.5" />
            })}
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 relative z-10">
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <div
              className="inline-flex items-center gap-2 mb-5 px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(224,123,0,0.12)',
                border: '1px solid rgba(224,123,0,0.25)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ background: '#E07B00' }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#F59E2F',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                6-Layer Hybrid RAG Pipeline
              </span>
            </div>

            {/* Title */}
            <h1
              className="mb-3 leading-none"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(32px, 5vw, 48px)',
                fontWeight: 700,
                color: '#FEFCF8',
                letterSpacing: '-0.02em',
              }}
            >
              BIS Standards{' '}
              <span style={{ color: '#E07B00', fontStyle: 'italic' }}>
                Recommendation
              </span>{' '}
              Engine
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.65,
                maxWidth: 480,
              }}
            >
              AI-powered compliance assistant for Indian MSEs. Maps product descriptions
              to relevant Bureau of Indian Standards regulations — in seconds, not weeks.
            </p>

            {/* Stat pills */}
            <div className="flex flex-wrap gap-3 mt-6">
              {[
                { label: 'Building materials domain', icon: '🏗️' },
                { label: 'FAISS + BM25 + RRF fusion', icon: '⚡' },
                { label: 'Sub-5s latency', icon: '🎯' },
                { label: 'Hallucination guard', icon: '🛡️' },
              ].map((pill) => (
                <div
                  key={pill.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span style={{ fontSize: 13 }}>{pill.icon}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {pill.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
