import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BIS Standards Recommendation Engine',
  description: 'AI-powered compliance assistant for Indian MSEs. Maps product descriptions to relevant Bureau of Indian Standards regulations using a 6-layer Hybrid RAG pipeline.',
  keywords: ['BIS', 'Bureau of Indian Standards', 'IS standards', 'MSE compliance', 'RAG', 'AI'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
