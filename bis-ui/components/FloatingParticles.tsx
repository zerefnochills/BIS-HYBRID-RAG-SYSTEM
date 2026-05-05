'use client'

import React from 'react'
import { motion } from 'framer-motion'

const particles = Array.from({ length: 20 }, (_, id) => {
  const seed = (id + 1) * 9301 + 49297
  const value = (offset: number) => ((seed + offset * 233) % 1000) / 1000

  return {
    id,
    size: value(1) * 4 + 2,
    x: value(2) * 100,
    y: value(3) * 100,
    drift: value(4) * 20 - 10,
    duration: value(5) * 10 + 10,
    delay: value(6) * 5,
  }
})

export default function FloatingParticles() {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-[#D97706]/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, particle.drift, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
