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

const perspectiveIcons: Record<string, string> = {
  hyperscaler: '🏢',
  techvc: '💰',
  utility: '⚡',
  renewables: '🌱',
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

      // Parse markdown bold syntax into segments
      const parseBold = (text: string): TextSegment[] => {
        const segments: TextSegment[] = []
        const regex = /\*\*(.+?)\*\*/g
        let lastIndex = 0
        let match

        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            segments.push({ text: text.slice(lastIndex, match.index), bold: false })
          }
          segments.push({ text: match[1], bold: true })
          lastIndex = regex.lastIndex
        }

        if (lastIndex < text.length) {
          segments.push({ text: text.slice(lastIndex), bold: false })
        }

        return segments.length > 0 ? segments : [{ text, bold: false }]
      }

      // Write a line with mixed bold/normal text
      const writeFormattedLine = (text: string, x: number, fontSize: number, baseColor: [number, number, number]) => {
        const segments = parseBold(text)
        doc.setFontSize(fontSize)
        doc.setTextColor(...baseColor)

        let currentX = x
        for (const segment of segments) {
          doc.setFont('helvetica', segment.bold ? 'bold' : 'normal')
          doc.text(segment.text, currentX, y)
          currentX += doc.getTextWidth(segment.text)
        }
      }

      // Write markdown content with proper formatting
      const writeMarkdown = (content: string, xOffset: number, baseColor: [number, number, number] = [30, 30, 30]) => {
        const lines = content.split('\n')
        const lineHeight = 4.5
        const textWidth = contentWidth - xOffset

        for (const line of lines) {
          checkPage(lineHeight + 2)

          // Headers
          if (line.startsWith('## ')) {
            y += 2
            doc.setFontSize(11)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 102, 204)
            doc.text(line.slice(3), margin + xOffset, y)
            y += lineHeight + 1
            continue
          }

          if (line.startsWith('# ')) {
            y += 2
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 102, 204)
            doc.text(line.slice(2), margin + xOffset, y)
            y += lineHeight + 2
            continue
          }

          // List items (unordered)
          if (line.match(/^[-*]\s+/)) {
            const listText = line.replace(/^[-*]\s+/, '')
            const wrappedLines = doc.splitTextToSize(listText, textWidth - 6)
            for (let i = 0; i < wrappedLines.length; i++) {
              checkPage(lineHeight)
              if (i === 0) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(9)
                doc.setTextColor(...baseColor)
                doc.text('•', margin + xOffset, y)
              }
              writeFormattedLine(wrappedLines[i], margin + xOffset + 4, 9, baseColor)
              y += lineHeight
            }
            continue
          }

          // Numbered list items
          if (line.match(/^\d+\.\s+/)) {
            const match = line.match(/^(\d+)\.\s+(.*)/)
            if (match) {
              const num = match[1]
              const listText = match[2]
              const wrappedLines = doc.splitTextToSize(listText, textWidth - 8)
              for (let i = 0; i < wrappedLines.length; i++) {
                checkPage(lineHeight)
                if (i === 0) {
                  doc.setFont('helvetica', 'normal')
                  doc.setFontSize(9)
                  doc.setTextColor(...baseColor)
                  doc.text(`${num}.`, margin + xOffset, y)
                }
                writeFormattedLine(wrappedLines[i], margin + xOffset + 6, 9, baseColor)
                y += lineHeight
              }
              continue
            }
          }

          // Empty line
          if (line.trim() === '') {
            y += 2
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
              const icon = perspectiveIcons[perspective.id] || ''

              // Perspective label bar
              doc.setFillColor(color[0], color[1], color[2])
              doc.roundedRect(margin, y, contentWidth, 7, 1, 1, 'F')

              doc.setFontSize(9)
              doc.setFont('helvetica', 'bold')
              doc.setTextColor(255, 255, 255)
              doc.text(`${icon} ${perspective.name}`, margin + 4, y + 5)
              y += 10

              // Response content with left border
              const startY = y
              writeMarkdown(response.content, 3, [40, 40, 40])

              // Draw colored left border for this response
              doc.setDrawColor(...color)
              doc.setLineWidth(1)
              doc.line(margin, startY - 2, margin, y)

              y += 6
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
