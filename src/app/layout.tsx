import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { PerspectivesProvider } from '@/contexts/PerspectivesContext'
import { TTSProvider } from '@/contexts/TTSContext'

export const metadata: Metadata = {
  title: 'Nodiac Oracle',
  description: 'Development pipeline for distributed AI compute infrastructure',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#490f42',
}

// Script to set theme before hydration to prevent flash
const themeScript = `
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (stored === 'dark' || (!stored && prefersDark)) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <PerspectivesProvider>
            <TTSProvider>{children}</TTSProvider>
          </PerspectivesProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
