'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Message, AIModel, PERSPECTIVES } from '@/types'
import { cn } from '@/lib/utils'

type ExportButtonProps = {
  messages: Message[]
  selectedModel: AIModel
  disabled?: boolean
}

export function ExportButton({ messages, selectedModel, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const generatePDF = async () => {
    if (messages.length === 0) return

    setIsExporting(true)

    try {
      // Build conversation text for summary
      const conversationText = messages
        .map((m) => {
          const perspective = m.perspective
            ? PERSPECTIVES.find((p) => p.id === m.perspective)?.name
            : 'User'
          return `${perspective}: ${m.content}`
        })
        .join('\n\n')

      // Get AI-generated summary
      let summary = ''
      try {
        const summaryResponse = await fetch('/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversation: conversationText,
            modelId: selectedModel.id,
          }),
        })
        const summaryData = await summaryResponse.json()
        summary = summaryData.summary || 'Summary could not be generated.'
      } catch {
        summary = 'Summary could not be generated.'
      }

      // Build HTML content
      const htmlContent = buildHTMLContent(messages, summary, selectedModel)

      // Import html2pdf dynamically (client-side only)
      const html2pdf = (await import('html2pdf.js')).default

      // Create a temporary container
      const container = document.createElement('div')
      container.innerHTML = htmlContent
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      document.body.appendChild(container)

      // Generate PDF
      await html2pdf()
        .set({
          margin: [15, 15, 15, 15],
          filename: `nodiac-oracle-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(container)
        .save()

      // Clean up
      document.body.removeChild(container)
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <button
      onClick={generatePDF}
      disabled={disabled || isExporting || messages.length === 0}
      className={cn(
        'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm',
        'bg-nodiac-primary text-white hover:bg-nodiac-primary/90',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Export PDF
        </>
      )}
    </button>
  )
}

function buildHTMLContent(messages: Message[], summary: string, model: AIModel): string {
  const perspectiveIcons: Record<string, string> = {
    hyperscaler: '🏢',
    techvc: '💰',
    utility: '⚡',
    renewables: '🌱',
  }

  const messagesHTML = messages
    .map((m) => {
      const isUser = m.role === 'user'
      const perspective = m.perspective
        ? PERSPECTIVES.find((p) => p.id === m.perspective)
        : null

      // Convert markdown to HTML (basic conversion)
      const contentHTML = convertMarkdownToHTML(m.content)

      if (isUser) {
        return `
          <div style="margin-bottom: 16px; text-align: right;">
            <div style="display: inline-block; max-width: 80%; background: #0066CC; color: white; padding: 12px 16px; border-radius: 16px 16px 4px 16px; text-align: left;">
              <div style="font-size: 14px;">${contentHTML}</div>
              <div style="font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 8px;">
                ${formatDate(m.timestamp)}
              </div>
            </div>
          </div>
        `
      } else {
        return `
          <div style="margin-bottom: 16px;">
            <div style="display: inline-block; max-width: 80%; background: #f3f4f6; padding: 12px 16px; border-radius: 16px 16px 16px 4px;">
              ${
                perspective
                  ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">
                      ${perspectiveIcons[perspective.id] || ''} ${perspective.name}
                    </div>`
                  : ''
              }
              <div style="font-size: 14px; color: #111827;">${contentHTML}</div>
              <div style="font-size: 11px; color: #9ca3af; margin-top: 8px;">
                ${formatDate(m.timestamp)}
              </div>
            </div>
          </div>
        `
      }
    })
    .join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.5;
          color: #111827;
        }
        h1, h2, h3 { margin-top: 16px; margin-bottom: 8px; }
        h1 { font-size: 20px; }
        h2 { font-size: 16px; }
        h3 { font-size: 14px; }
        p { margin: 8px 0; }
        ul, ol { margin: 8px 0; padding-left: 24px; }
        li { margin: 4px 0; }
        code { background: #e5e7eb; padding: 2px 4px; border-radius: 4px; font-size: 12px; }
        pre { background: #1f2937; color: #f3f4f6; padding: 12px; border-radius: 8px; overflow-x: auto; }
        blockquote { border-left: 4px solid #d1d5db; padding-left: 16px; margin: 8px 0; color: #6b7280; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin: 8px 0; }
        th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
        th { background: #f3f4f6; }
        strong { font-weight: 600; }
        em { font-style: italic; }
      </style>
    </head>
    <body>
      <div style="border-bottom: 2px solid #0066CC; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #0066CC; font-size: 24px;">Nodiac Oracle</h1>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Multi-perspective AI Advisor</p>
      </div>

      <div style="background: #f0f9ff; border: 1px solid #0066CC; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; color: #0066CC; font-size: 14px;">Summary</h2>
        <p style="margin: 0; font-size: 14px; color: #374151;">${summary}</p>
      </div>

      <div style="margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 12px; color: #6b7280;">Model: ${model.name}</span>
        <span style="font-size: 12px; color: #6b7280; margin-left: 16px;">Exported: ${new Date().toLocaleDateString()}</span>
      </div>

      ${messagesHTML}

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="font-size: 11px; color: #9ca3af;">
          Generated by Nodiac Oracle | nodiac.ai
        </p>
      </div>
    </body>
    </html>
  `
}

function convertMarkdownToHTML(markdown: string): string {
  let html = markdown
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Unordered lists
    .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
    // Ordered lists
    .replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>')
    // Blockquotes
    .replace(/^>\s*(.*$)/gim, '<blockquote>$1</blockquote>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')

  // Wrap consecutive li items in ul
  html = html.replace(/(<li>.*?<\/li>)(\s*<li>)/g, '$1$2')
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>')

  return `<p>${html}</p>`
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(date))
}
