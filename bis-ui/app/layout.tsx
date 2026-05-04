import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BIS Standards Recommendation Engine',
  description: 'AI-powered compliance assistant for Indian MSEs. Maps product descriptions to relevant Bureau of Indian Standards regulations using a 6-layer Hybrid RAG pipeline.',
  keywords: ['BIS', 'Bureau of Indian Standards', 'IS standards', 'MSE compliance', 'RAG', 'AI'],
  icons: {
    icon: '/bis-logo Background Removed.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/bis-logo Background Removed.png" type="image/png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
