'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function Navbar() {
  return (
    <nav className="glass-light border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo + Brand */}
          <motion.div 
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div 
              className="w-20 h-20 relative flex items-center justify-center rounded-full shadow-lg overflow-hidden"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src="/bis-logo Background Removed.png" 
                alt="BIS Logo" 
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div>
              <div className="text-xl font-bold text-[#F8F5F2] leading-tight">BIS Standards</div>
              <div className="text-sm text-[#D6CCC2] leading-tight">Recommendation Engine</div>
            </div>
          </motion.div>

          {/* Nav Links */}
          <motion.div 
            className="flex items-center gap-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {['API', 'Docs', 'About'].map((item, index) => (
              <motion.a
                key={item}
                href="#"
                className="text-sm text-[#D6CCC2] hover:text-[#D97706] transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}
              >
                {item}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </div>
    </nav>
  )
}
