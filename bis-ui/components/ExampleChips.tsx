'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface ExampleChipsProps {
  onSelect: (text: string) => void
}

const examples = [
  'OPC Cement for buildings',
  'TMT bars for RCC beam',
  'AAC blocks',
  'Fly ash bricks',
]

export default function ExampleChips({ onSelect }: ExampleChipsProps) {
  return (
    <motion.div 
      className="mt-8 flex flex-wrap gap-3 justify-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      {examples.map((example, index) => (
        <motion.button
          key={example}
          onClick={() => onSelect(example)}
          className="glass-light px-5 py-2.5 rounded-full text-sm text-[#D6CCC2] hover:bg-white/10 hover:text-[#F8F5F2] transition-all cursor-pointer"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          {example}
        </motion.button>
      ))}
    </motion.div>
  )
}
