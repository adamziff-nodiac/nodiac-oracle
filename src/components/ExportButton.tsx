'use client'

import { useState, useRef } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Message, AIModel, PERSPECTIVES } from '@/types'
import { cn } from '@/lib/utils'

type ExportButtonProps = {
  messages: Message[]
  selectedModel: AIModel
  disabled?: boolean
}

// Group messages into rounds: each user message + following assistant responses
function groupMessagesIntoRounds(messages: Message[]): Message[][] {
  const rounds: Message[][] = []
  let currentRound: Message[] = []

  for (const message of messages) {
    if (message.role === 'user') {
      if (currentRound.length > 0) {
        rounds.push(currentRound)
      }
      currentRound = [message]
    } else {
      currentRound.push(message)
    }
  }

  if (currentRound.length > 0) {
    rounds.push(currentRound)
  }

  return rounds
}

// Perspective colors for visual distinction
const perspectiveColors: Record<string, string> = {
  hyperscaler: '#0066cc',
  techvc: '#7c3aed',
  utility: '#ea580c',
  renewables: '#16a34a',
}

// Check if a line is a markdown table separator (|---|---|)
function isTableSeparator(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false
  // Remove all pipes and check if only dashes, colons, and spaces remain
  const inner = trimmed.slice(1, -1)
  return /^[\s\-:|]+$/.test(inner) && inner.includes('-')
}

// Parse a markdown table into HTML
function parseMarkdownTable(tableText: string, perspectiveColor: string): string {
  const lines = tableText.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return tableText

  const rows: string[][] = []
  let hasHeader = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line.startsWith('|') || !line.endsWith('|')) continue

    // Skip separator rows but mark that we have a header
    if (isTableSeparator(line)) {
      hasHeader = true
      continue
    }

    // Parse cells - split by | and remove empty first/last
    const cells = line.split('|').slice(1, -1).map(c => c.trim())
    if (cells.length > 0) {
      rows.push(cells)
    }
  }

  if (rows.length === 0) return ''

  // Build HTML table with proper styling
  let html = '<table style="border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 11px; table-layout: auto;">'

  rows.forEach((row, idx) => {
    const isHeader = hasHeader && idx === 0
    html += '<tr>'
    row.forEach(cell => {
      const tag = isHeader ? 'th' : 'td'
      const style = isHeader
        ? `background: ${perspectiveColor}; color: white; font-weight: bold; padding: 6px 8px; border: 1px solid ${perspectiveColor}; text-align: left; white-space: nowrap;`
        : 'padding: 6px 8px; border: 1px solid #d1d5db; vertical-align: top;'
      html += `<${tag} style="${style}">${cell}</${tag}>`
    })
    html += '</tr>'
  })

  html += '</table>'
  return html
}

// Convert markdown to HTML for rendering
function markdownToHtml(content: string, perspectiveColor: string = '#1f2937'): string {
  // First, handle code blocks (``` ... ```) - convert to styled callout boxes
  let html = content.replace(/```[\s\S]*?```/g, (match) => {
    const inner = match.slice(3, -3).trim()
    return `<div style="background: linear-gradient(135deg, ${perspectiveColor}15, ${perspectiveColor}08); border-left: 4px solid ${perspectiveColor}; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">${inner}</div>`
  })

  // Handle tables BEFORE other transformations (they need newlines intact)
  // Match table blocks: lines starting and ending with |
  html = html.replace(/(\|.+\|[\r\n]+)+/g, (match) => {
    return parseMarkdownTable(match, perspectiveColor)
  })

  // Handle horizontal rules BEFORE other transformations (need clean lines)
  html = html.replace(/^-{3,}$/gm, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">')
  html = html.replace(/^\*{3,}$/gm, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;">')

  html = html
    // Headers - color coded by perspective (allow leading whitespace, match any content including emoji)
    .replace(/^\s*###\s+(.+)$/gm, `<h3 style="font-size: 14px; font-weight: bold; margin: 12px 0 6px 0; color: ${perspectiveColor};">$1</h3>`)
    .replace(/^\s*##\s+(.+)$/gm, `<h2 style="font-size: 16px; font-weight: bold; margin: 14px 0 8px 0; color: ${perspectiveColor};">$1</h2>`)
    .replace(/^\s*#\s+(.+)$/gm, `<h1 style="font-size: 18px; font-weight: bold; margin: 16px 0 10px 0; color: ${perspectiveColor};">$1</h1>`)
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic (but not if it's part of a list item marker)
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Code inline
    .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-family: monospace; font-size: 11px;">$1</code>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote style="border-left: 3px solid #e5e7eb; padding-left: 12px; margin: 8px 0; color: #6b7280; font-style: italic;">$1</blockquote>')
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, '<div style="margin-left: 16px; margin-bottom: 4px;">• $1</div>')
    // Ordered list items
    .replace(/^(\d+)\. (.+)$/gm, '<div style="margin-left: 16px; margin-bottom: 4px;">$1. $2</div>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p style="margin: 8px 0;">')
    // Single newlines to <br>
    .replace(/\n/g, '<br>')

  return `<div style="margin: 8px 0;">${html}</div>`
}

export function ExportButton({ messages, selectedModel, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

      // Group messages into rounds
      const rounds = groupMessagesIntoRounds(messages)

      // Create hidden container for rendering
      const container = document.createElement('div')
      container.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 800px;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: #1f2937;
        padding: 40px;
      `

      // Build HTML content
      let html = `
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #0066cc; margin: 0; letter-spacing: 0.5px;">Nodiac Oracle</h1>
          <p style="color: #6b7280; margin: 8px 0 0 0;">Multi-perspective AI Advisor</p>
        </div>

        <div style="background: #f0f7ff; border: 1px solid #0066cc; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h2 style="font-size: 14px; font-weight: bold; color: #0066cc; margin: 0 0 8px 0;">Summary</h2>
          <p style="margin: 0; color: #374151;">${summary}</p>
        </div>

        <p style="font-size: 10px; color: #9ca3af; margin-bottom: 24px;">
          Model: ${selectedModel.name} | Exported: ${new Date().toLocaleDateString()}
        </p>
      `

      // Render each round
      for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
        const round = rounds[roundIndex]
        const userMessage = round[0]
        const aiResponses = round.slice(1)

        html += `
          <div style="background: #0066cc; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; margin-top: ${roundIndex > 0 ? '24px' : '0'};">
            Question ${roundIndex + 1}
          </div>
          <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            ${userMessage.content}
          </div>
        `

        for (const response of aiResponses) {
          const perspective = response.perspective
            ? PERSPECTIVES.find((p) => p.id === response.perspective)
            : null

          if (perspective) {
            const color = perspectiveColors[perspective.id] || '#6b7280'
            html += `
              <div style="margin-top: 16px;">
                <div style="background: ${color}; color: white; padding: 6px 12px; border-radius: 4px; font-weight: bold; display: inline-block; margin-bottom: 8px;">
                  ${perspective.name}
                </div>
                <div style="padding-left: 4px;">
                  ${markdownToHtml(response.content, color)}
                </div>
              </div>
            `
          }
        }
      }

      // Footer
      html += `
        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 10px; color: #9ca3af; margin: 0;">Generated by Nodiac Oracle</p>
        </div>
      `

      container.innerHTML = html
      document.body.appendChild(container)

      // Import libraries dynamically
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf')
      ])

      // Render to canvas with html2canvas
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      // Remove container
      document.body.removeChild(container)

      // Create PDF from canvas - handle multi-page properly
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      // Page margins
      const pageTopMargin = 10 // mm margin at top of continuation pages
      const pageBottomMargin = 15 // mm margin at bottom to avoid cutting content
      const usablePageHeight = pageHeight - pageBottomMargin

      // Calculate how many pages we need (using reduced page height)
      const totalPages = Math.ceil(imgHeight / usablePageHeight)

      // For each page, create a slice of the canvas
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          doc.addPage()
        }

        // Calculate the portion of the canvas for this page (using usable height)
        const sourceY = (page * usablePageHeight * canvas.width) / imgWidth
        const sourceHeight = Math.min(
          (usablePageHeight * canvas.width) / imgWidth,
          canvas.height - sourceY
        )

        if (sourceHeight <= 0) continue

        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = sourceHeight

        const ctx = pageCanvas.getContext('2d')
        if (ctx) {
          // Fill with white background
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

          // Draw the slice from the original canvas
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          )
        }

        const pageImgData = pageCanvas.toDataURL('image/png')
        const sliceHeight = (sourceHeight * imgWidth) / canvas.width

        // Add top margin for pages after the first
        const yOffset = page > 0 ? pageTopMargin : 0
        doc.addImage(pageImgData, 'PNG', 0, yOffset, imgWidth, sliceHeight)
      }

      doc.save(`nodiac-oracle-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <div ref={containerRef} style={{ display: 'none' }} />
      <button
        onClick={generatePDF}
        disabled={disabled || isExporting || messages.length === 0}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm',
          'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
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
    </>
  )
}
