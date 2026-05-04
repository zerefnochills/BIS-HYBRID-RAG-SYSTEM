'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface Feature {
  title: string
  description: string
  icon: React.ReactNode
  color: string
}

export default function FeatureCards() {
  const features: Feature[] = [
    {
      title: 'Hybrid Search',
      description: 'Combines dense & sparse retrieval for optimal results',
      color: 'from-blue-500 to-cyan-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      title: 'AI Reranking',
      description: 'Advanced ML models ensure highest relevance',
      color: 'from-purple-500 to-pink-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: 'Lightning Fast',
      description: 'Sub-second response times with FAISS indexing',
      color: 'from-orange-500 to-red-500',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          className="glass rounded-xl p-5 cursor-pointer group relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
          whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(217, 119, 6, 0.2)' }}
        >
          {/* Gradient overlay on hover */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
          />

          <div className="relative z-10">
            <motion.div
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[#D97706]/20 text-[#D97706] mb-4 group-hover:bg-[#D97706] group-hover:text-white transition-colors"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              {feature.icon}
            </motion.div>
            <h3 className="text-lg font-bold text-[#F8F5F2] mb-2">{feature.title}</h3>
            <p className="text-sm text-[#D6CCC2] leading-relaxed">{feature.description}</p>
          </div>

          {/* Animated border */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-[#D97706] opacity-0 group-hover:opacity-100"
            initial={{ scale: 0.8, opacity: 0 }}
            whileHover={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
