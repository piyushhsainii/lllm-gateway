import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'llm-gateway — LLM Proxy Built in Rust',
  description: 'One proxy. Every LLM. Your keys, your billing, zero risk.',
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
