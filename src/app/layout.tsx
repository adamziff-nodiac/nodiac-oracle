import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nodiac Oracle - Multi-Perspective AI Advisor',
  description: 'Get insights from different industry perspectives on data centers and clean energy',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
