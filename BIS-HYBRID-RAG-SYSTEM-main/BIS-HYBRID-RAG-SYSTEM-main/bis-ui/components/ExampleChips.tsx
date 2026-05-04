'use client'

import React, { useEffect, useState } from 'react'

interface ExampleChipsProps {
  onSelect: (text: string) => void
}

const FALLBACK_EXAMPLES = [
  'Ordinary Portland Cement for residential building construction',
  'TMT steel bars for RCC beam construction in 5-storey building',
  'AAC blocks for lightweight partition walls',
  'Crushed stone aggregates for concrete mixing',
  'Fly ash bricks for boundary wall construction',
  'What is IS 383 used for?',
  'White cement for architectural finishes',
  'Portland Slag Cement for marine structures',
]

export default function ExampleChips({ onSelect }: ExampleChipsProps) {
  const [examples, setExamples] = useState<string[]>(FALLBACK_EXAMPLES.slice(0, 6))

  useEffect(() => {
    fetch('/api/examples')
      .then(r => r.json())
      .then((data: { examples: string[] }) => {
        if (data.examples?.length) setExamples(data.examples.slice(0, 8))
      })
      .catch(() => {/* use fallback */})
  }, [])

  return (
    <div>
      <p
        className="mb-2"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 500,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Try an example
      </p>
      <div className="flex flex-wrap gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            className="example-chip"
            onClick={() => onSelect(ex)}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
