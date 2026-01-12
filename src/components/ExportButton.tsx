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
      const html2pdfModule = await import('html2pdf.js')
      const html2pdf = html2pdfModule.default

      // Create a temporary container - must be visible for html2canvas to work
      const container = document.createElement('div')
      container.innerHTML = htmlContent
      container.style.position = 'fixed'
      container.style.top = '0'
      container.style.left = '0'
      container.style.width = '210mm' // A4 width
      container.style.padding = '20px'
      container.style.backgroundColor = 'white'
      container.style.zIndex = '-1'
      container.style.opacity = '0'
      container.style.pointerEvents = 'none'
      document.body.appendChild(container)

      // Wait a frame for the DOM to update
      await new Promise(resolve => requestAnimationFrame(resolve))

      // Make visible briefly for html2canvas
      container.style.opacity = '1'

      // Generate PDF
      await html2pdf()
        .set({
          margin: 10,
          filename: `nodiac-oracle-${new Date().toISOString().split('T')[0]}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            windowWidth: 794, // A4 width in px at 96dpi
          },
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
            <div style="display: inline-block; max-width: 80%; background-color: #0066CC; color: white; padding: 12px 16px; border-radius: 16px 16px 4px 16px; text-align: left;">
              <div style="font-size: 13px; line-height: 1.5;">${contentHTML}</div>
              <div style="font-size: 10px; color: rgba(255,255,255,0.7); margin-top: 8px;">
                ${formatDate(m.timestamp)}
              </div>
            </div>
          </div>
        `
      } else {
        return `
          <div style="margin-bottom: 16px;">
            <div style="display: inline-block; max-width: 80%; background-color: #f3f4f6; padding: 12px 16px; border-radius: 16px 16px 16px 4px;">
              ${
                perspective
                  ? `<div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
                      ${perspectiveIcons[perspective.id] || ''} ${perspective.name}
                    </div>`
                  : ''
              }
              <div style="font-size: 13px; color: #111827; line-height: 1.5;">${contentHTML}</div>
              <div style="font-size: 10px; color: #9ca3af; margin-top: 8px;">
                ${formatDate(m.timestamp)}
              </div>
            </div>
          </div>
        `
      }
    })
    .join('')

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; background: white; max-width: 100%;">
      <div style="border-bottom: 3px solid #0066CC; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="font-size: 28px; font-weight: bold; color: #0066CC; margin: 0;">Nodiac Oracle</div>
        <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">Multi-perspective AI Advisor</div>
      </div>

      <div style="background-color: #eff6ff; border: 2px solid #0066CC; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <div style="font-weight: bold; color: #0066CC; font-size: 14px; margin-bottom: 8px;">Summary</div>
        <div style="font-size: 13px; color: #374151; line-height: 1.5;">${summary}</div>
      </div>

      <div style="margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px; color: #6b7280;">
        <span>Model: ${model.name}</span>
        <span style="margin-left: 20px;">Exported: ${new Date().toLocaleDateString()}</span>
      </div>

      <div style="margin-bottom: 20px;">
        ${messagesHTML}
      </div>

      <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
        <div style="font-size: 10px; color: #9ca3af;">
          Generated by Nodiac Oracle • nodiac.ai
        </div>
      </div>
    </div>
  `
}

function convertMarkdownToHTML(markdown: string): string {
  let html = markdown
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Process line by line for better control
  const lines = html.split('\n')
  const processedLines: string[] = []
  let inCodeBlock = false
  let codeBlockContent: string[] = []

  for (const line of lines) {
    // Code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        processedLines.push(`<pre style="background: #1f2937; color: #f3f4f6; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin: 8px 0;"><code>${codeBlockContent.join('\n')}</code></pre>`)
        codeBlockContent = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent.push(line)
      continue
    }

    let processedLine = line

    // Headers
    if (processedLine.startsWith('### ')) {
      processedLine = `<div style="font-size: 14px; font-weight: 600; margin: 12px 0 6px 0;">${processedLine.slice(4)}</div>`
    } else if (processedLine.startsWith('## ')) {
      processedLine = `<div style="font-size: 15px; font-weight: 600; margin: 14px 0 6px 0;">${processedLine.slice(3)}</div>`
    } else if (processedLine.startsWith('# ')) {
      processedLine = `<div style="font-size: 16px; font-weight: 700; margin: 16px 0 8px 0;">${processedLine.slice(2)}</div>`
    }
    // List items
    else if (processedLine.match(/^\s*[-*]\s+/)) {
      processedLine = `<div style="margin: 4px 0; padding-left: 16px;">• ${processedLine.replace(/^\s*[-*]\s+/, '')}</div>`
    }
    else if (processedLine.match(/^\s*\d+\.\s+/)) {
      const num = processedLine.match(/^\s*(\d+)\./)?.[1] || '1'
      processedLine = `<div style="margin: 4px 0; padding-left: 16px;">${num}. ${processedLine.replace(/^\s*\d+\.\s+/, '')}</div>`
    }
    // Blockquotes
    else if (processedLine.startsWith('&gt; ')) {
      processedLine = `<div style="border-left: 3px solid #d1d5db; padding-left: 12px; margin: 8px 0; color: #6b7280; font-style: italic;">${processedLine.slice(5)}</div>`
    }
    // Empty lines become spacing
    else if (processedLine.trim() === '') {
      processedLine = '<div style="height: 8px;"></div>'
    }
    // Regular paragraphs
    else {
      processedLine = `<div style="margin: 4px 0;">${processedLine}</div>`
    }

    // Inline formatting
    processedLine = processedLine
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background: #e5e7eb; padding: 1px 4px; border-radius: 3px; font-size: 12px;">$1</code>')

    processedLines.push(processedLine)
  }

  return processedLines.join('')
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
