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

type TextSegment = {
  text: string
  bold: boolean
  italic: boolean
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
const perspectiveColors: Record<string, [number, number, number]> = {
  hyperscaler: [0, 102, 204],    // Blue
  techvc: [124, 58, 237],        // Purple
  utility: [234, 88, 12],        // Orange
  renewables: [22, 163, 74],     // Green
}

// Strip emojis and other unicode symbols that jsPDF can't render
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F700}-\u{1F77F}]/gu, '') // Alchemical Symbols
    .replace(/[\u{1F780}-\u{1F7FF}]/gu, '') // Geometric Shapes Extended
    .replace(/[\u{1F800}-\u{1F8FF}]/gu, '') // Supplemental Arrows-C
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols and Pictographs
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F000}-\u{1F02F}]/gu, '') // Mahjong Tiles
    .replace(/[\u{1F0A0}-\u{1F0FF}]/gu, '') // Playing Cards
    .trim()
}

// Strip bold and italic markdown and return clean text
function stripFormatting(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')  // bold+italic
    .replace(/\*\*(.+?)\*\*/g, '$1')       // bold
    .replace(/\*([^*]+?)\*/g, '$1')        // italic
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

      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf')

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      const contentWidth = pageWidth - margin * 2
      let y = margin

      const addPage = () => {
        doc.addPage()
        y = margin
      }

      const checkPage = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          addPage()
        }
      }

      // Parse markdown bold and italic syntax into segments
      const parseFormatting = (text: string): TextSegment[] => {
        const segments: TextSegment[] = []
        // Match **bold**, *italic*, or ***bold+italic***
        const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*([^*]+?)\*)/g
        let lastIndex = 0
        let match

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            segments.push({ text: text.slice(lastIndex, match.index), bold: false, italic: false })
          }
          if (match[2]) {
            // ***bold+italic***
            segments.push({ text: match[2], bold: true, italic: true })
          } else if (match[3]) {
            // **bold**
            segments.push({ text: match[3], bold: true, italic: false })
          } else if (match[4]) {
            // *italic*
            segments.push({ text: match[4], bold: false, italic: true })
          }
          lastIndex = regex.lastIndex
        }

        if (lastIndex < text.length) {
          segments.push({ text: text.slice(lastIndex), bold: false, italic: false })
        }

        return segments.length > 0 ? segments : [{ text, bold: false, italic: false }]
      }

      // Write a line with mixed bold/italic/normal text
      const writeFormattedLine = (text: string, x: number, fontSize: number, baseColor: [number, number, number]) => {
        const segments = parseFormatting(text)
        doc.setFontSize(fontSize)
        doc.setTextColor(...baseColor)

        let currentX = x
        for (const segment of segments) {
          // Determine font style: bold, italic, bolditalic, or normal
          let fontStyle: string = 'normal'
          if (segment.bold && segment.italic) {
            fontStyle = 'bolditalic'
          } else if (segment.bold) {
            fontStyle = 'bold'
          } else if (segment.italic) {
            fontStyle = 'italic'
          }
          doc.setFont('helvetica', fontStyle)
          const cleanText = stripEmojis(segment.text)
          doc.text(cleanText, currentX, y)
          currentX += doc.getTextWidth(cleanText)
        }
      }

      // Parse a markdown table row into cells
      const parseTableRow = (row: string): string[] => {
        return row
          .split('|')
          .slice(1, -1) // Remove empty first and last from split
          .map(cell => cell.trim())
      }

      // Check if a line is a table separator (|---|---|)
      const isTableSeparator = (line: string): boolean => {
        return /^\|[\s-:|]+\|$/.test(line)
      }

      // Check if a line is a table row
      const isTableRow = (line: string): boolean => {
        return line.startsWith('|') && line.endsWith('|')
      }

      // Render a table
      const renderTable = (tableLines: string[], headerColor: [number, number, number]) => {
        const rows: string[][] = []
        let hasHeader = false

        for (let i = 0; i < tableLines.length; i++) {
          if (isTableSeparator(tableLines[i])) {
            hasHeader = true
            continue
          }
          rows.push(parseTableRow(tableLines[i]))
        }

        if (rows.length === 0) return

        const numCols = rows[0].length
        const colWidth = (contentWidth - 4) / numCols
        const cellPadding = 2
        const rowHeight = 6

        // Check if table fits on page
        checkPage(rows.length * rowHeight + 4)

        const tableX = margin + 2
        let tableY = y

        doc.setFontSize(8)
        doc.setLineWidth(0.3)

        for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
          const row = rows[rowIdx]
          const isHeaderRow = hasHeader && rowIdx === 0

          // Background for header
          if (isHeaderRow) {
            doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
            doc.rect(tableX, tableY, contentWidth - 4, rowHeight, 'F')
          }

          // Draw cells
          for (let colIdx = 0; colIdx < numCols; colIdx++) {
            const cellX = tableX + colIdx * colWidth
            const cellText = row[colIdx] || ''

            // Cell border
            doc.setDrawColor(180, 180, 180)
            doc.rect(cellX, tableY, colWidth, rowHeight, 'S')

            // Cell text
            if (isHeaderRow) {
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(255, 255, 255)
            } else {
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(40, 40, 40)
            }

            // Clean text: strip emojis and formatting markdown
            const cleanText = stripEmojis(stripFormatting(cellText))

            // Truncate text if too long
            const maxWidth = colWidth - cellPadding * 2
            let displayText = cleanText
            while (doc.getTextWidth(displayText) > maxWidth && displayText.length > 0) {
              displayText = displayText.slice(0, -1)
            }
            if (displayText !== cleanText && displayText.length > 2) {
              displayText = displayText.slice(0, -2) + '..'
            }

            doc.text(displayText, cellX + cellPadding, tableY + rowHeight - 2)
          }

          tableY += rowHeight
        }

        y = tableY + 3
      }

      // Write markdown content with proper formatting
      const writeMarkdown = (content: string, xOffset: number, baseColor: [number, number, number] = [30, 30, 30], headerColor: [number, number, number] = [0, 102, 204]) => {
        const lines = content.split('\n')
        const lineHeight = 4.5
        const textWidth = contentWidth - xOffset

        let i = 0
        while (i < lines.length) {
          const line = lines[i]

          // Check for table
          if (isTableRow(line)) {
            const tableLines: string[] = []
            while (i < lines.length && (isTableRow(lines[i]) || isTableSeparator(lines[i]))) {
              tableLines.push(lines[i])
              i++
            }
            renderTable(tableLines, headerColor)
            continue
          }

          checkPage(lineHeight + 2)

          // Horizontal rule (---)
          if (line.trim() === '---' || line.trim() === '***') {
            y += 2
            doc.setDrawColor(200, 200, 200)
            doc.setLineWidth(0.3)
            doc.line(margin + xOffset, y, margin + xOffset + textWidth, y)
            y += 4
            i++
            continue
          }

          // Headers
          if (line.startsWith('## ')) {
            y += 2
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...headerColor)
            doc.text(stripEmojis(line.slice(3)), margin + xOffset, y)
            y += lineHeight + 1
            i++
            continue
          }

          if (line.startsWith('# ')) {
            y += 2
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...headerColor)
            doc.text(stripEmojis(line.slice(2)), margin + xOffset, y)
            y += lineHeight + 2
            i++
            continue
          }

          // List items (unordered)
          if (line.match(/^[-*]\s+/)) {
            const listText = line.replace(/^[-*]\s+/, '')
            const wrappedLines = doc.splitTextToSize(listText, textWidth - 6)
            for (let j = 0; j < wrappedLines.length; j++) {
              checkPage(lineHeight)
              if (j === 0) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(9)
                doc.setTextColor(...baseColor)
                doc.text('•', margin + xOffset, y)
              }
              writeFormattedLine(wrappedLines[j], margin + xOffset + 4, 9, baseColor)
              y += lineHeight
            }
            i++
            continue
          }

          // Numbered list items
          if (line.match(/^\d+\.\s+/)) {
            const match = line.match(/^(\d+)\.\s+(.*)/)
            if (match) {
              const num = match[1]
              const listText = match[2]
              const wrappedLines = doc.splitTextToSize(listText, textWidth - 8)
              for (let j = 0; j < wrappedLines.length; j++) {
                checkPage(lineHeight)
                if (j === 0) {
                  doc.setFont('helvetica', 'normal')
                  doc.setFontSize(9)
                  doc.setTextColor(...baseColor)
                  doc.text(`${num}.`, margin + xOffset, y)
                }
                writeFormattedLine(wrappedLines[j], margin + xOffset + 6, 9, baseColor)
                y += lineHeight
              }
              i++
              continue
            }
          }

          // Empty line
          if (line.trim() === '') {
            y += 2
            i++
            continue
          }

          // Regular paragraph with potential bold text
          const cleanLine = line.replace(/`([^`]+)`/g, '$1')
          const wrappedLines = doc.splitTextToSize(cleanLine, textWidth)
          doc.setFontSize(9)

          for (const wrappedLine of wrappedLines) {
            checkPage(lineHeight)
            writeFormattedLine(wrappedLine, margin + xOffset, 9, baseColor)
            y += lineHeight
          }
          i++
        }
      }

      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 102, 204)
      doc.text('Nodiac Oracle', margin, y)
      y += 6

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Multi-perspective AI Advisor', margin, y)
      y += 6

      // Summary box
      doc.setFillColor(240, 247, 255)
      doc.setDrawColor(0, 102, 204)
      const summaryLines = doc.splitTextToSize(summary, contentWidth - 10)
      const summaryBoxHeight = summaryLines.length * 4.5 + 12
      doc.roundedRect(margin, y, contentWidth, summaryBoxHeight, 2, 2, 'FD')

      y += 6
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 102, 204)
      doc.text('Summary', margin + 5, y)
      y += 5

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
      for (const line of summaryLines) {
        doc.text(line, margin + 5, y)
        y += 4.5
      }
      y += 4

      // Meta info
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.text(`Model: ${selectedModel.name}  |  Exported: ${new Date().toLocaleDateString()}`, margin, y)
      y += 8

      // Group messages into rounds
      const rounds = groupMessagesIntoRounds(messages)

      // Render each round
      for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
        const round = rounds[roundIndex]
        const userMessage = round[0]
        const aiResponses = round.slice(1)

        checkPage(25)

        // Round header with Q number
        doc.setFillColor(0, 102, 204)
        doc.roundedRect(margin, y, contentWidth, 8, 1, 1, 'F')
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(`Question ${roundIndex + 1}`, margin + 4, y + 5.5)
        y += 12

        // User message
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(30, 30, 30)
        const userLines = doc.splitTextToSize(userMessage.content, contentWidth)
        for (const line of userLines) {
          checkPage(5)
          doc.text(line, margin, y)
          y += 4.5
        }
        y += 4

        // AI Responses
        if (aiResponses.length > 0) {
          for (const response of aiResponses) {
            checkPage(20)

            const perspective = response.perspective
              ? PERSPECTIVES.find((p) => p.id === response.perspective)
              : null

            if (perspective) {
              const color = perspectiveColors[perspective.id] || [80, 80, 80]

              // Perspective label bar
              doc.setFillColor(color[0], color[1], color[2])
              doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F')

              doc.setFontSize(9)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(255, 255, 255)
              doc.text(perspective.name, margin + 4, y + 5)
              y += 10

              // Response content - headers use perspective color
              writeMarkdown(response.content, 0, [40, 40, 40], color)

              y += 8
            }
          }
        }

        // Separator between rounds
        if (roundIndex < rounds.length - 1) {
          checkPage(10)
          doc.setDrawColor(220, 220, 220)
          doc.setLineWidth(0.5)
          doc.line(margin + 20, y, pageWidth - margin - 20, y)
          y += 10
        }
      }

      // Footer
      checkPage(20)
      y = pageHeight - 12
      doc.setDrawColor(200, 200, 200)
      doc.setLineWidth(0.3)
      doc.line(margin, y - 3, pageWidth - margin, y - 3)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text('Generated by Nodiac Oracle', pageWidth / 2, y, { align: 'center' })

      doc.save(`nodiac-oracle-${new Date().toISOString().split('T')[0]}.pdf`)
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
