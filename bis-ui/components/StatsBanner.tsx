'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface Stat {
  label: string
  value: number
  suffix: string
  icon: React.ReactNode
}

export default function StatsBanner() {
  const [counts, setCounts] = useState({ standards: 0, searches: 0, accuracy: 0 })

  const stats: Stat[] = [
    {
      label: 'BIS Standards',
      value: counts.standards,
      suffix: '+',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
        </svg>
      ),
    },
    {
      label: 'Searches Today',
      value: counts.searches,
      suffix: '+',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
      ),
    },
    {
      label: 'Accuracy',
      value: counts.accuracy,
      suffix: '%',
      icon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
  ]

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps

      setCounts({
        standards: Math.floor(15000 * progress),
        searches: Math.floor(2500 * progress),
        accuracy: Math.floor(94 * progress),
      })

      if (step >= steps) clearInterval(timer)
    }, interval)

    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      className="glass rounded-2xl p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
    >
      <div className="grid grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="text-center group cursor-pointer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#D97706]/20 text-[#D97706] mb-3 group-hover:bg-[#D97706] group-hover:text-white transition-colors"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              {stat.icon}
            </motion.div>
            <div className="text-3xl font-bold text-[#F8F5F2] mb-1">
              {stat.value.toLocaleString()}
              {stat.suffix}
            </div>
            <div className="text-sm text-[#D6CCC2]">{stat.label}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
