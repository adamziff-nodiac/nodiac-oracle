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
      const margin = 20
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
      const writeMarkdown = (content: string, baseColor: [number, number, number] = [30, 30, 30]) => {
        const lines = content.split('\n')
        const lineHeight = 5

        for (const line of lines) {
          checkPage(lineHeight + 2)

          // Headers
          if (line.startsWith('## ')) {
            y += 2
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 102, 204)
            doc.text(line.slice(3), margin, y)
            y += lineHeight + 1
            continue
          }

          if (line.startsWith('# ')) {
            y += 3
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(0, 102, 204)
            doc.text(line.slice(2), margin, y)
            y += lineHeight + 2
            continue
          }

          // List items (unordered)
          if (line.match(/^[-*]\s+/)) {
            const listText = line.replace(/^[-*]\s+/, '')
            const wrappedLines = doc.splitTextToSize(listText, contentWidth - 8)
            for (let i = 0; i < wrappedLines.length; i++) {
              checkPage(lineHeight)
              if (i === 0) {
                doc.setFont('helvetica', 'normal')
                doc.setFontSize(10)
                doc.setTextColor(...baseColor)
                doc.text('•', margin + 2, y)
              }
              writeFormattedLine(wrappedLines[i], margin + 6, 10, baseColor)
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
              const wrappedLines = doc.splitTextToSize(listText, contentWidth - 10)
              for (let i = 0; i < wrappedLines.length; i++) {
                checkPage(lineHeight)
                if (i === 0) {
                  doc.setFont('helvetica', 'normal')
                  doc.setFontSize(10)
                  doc.setTextColor(...baseColor)
                  doc.text(`${num}.`, margin + 2, y)
                }
                writeFormattedLine(wrappedLines[i], margin + 8, 10, baseColor)
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
          // Remove inline code backticks for cleaner output
          const cleanLine = line.replace(/`([^`]+)`/g, '$1')
          const wrappedLines = doc.splitTextToSize(cleanLine, contentWidth)
          doc.setFontSize(10)

          for (const wrappedLine of wrappedLines) {
            checkPage(lineHeight)
            writeFormattedLine(wrappedLine, margin, 10, baseColor)
            y += lineHeight
          }
        }
      }

      // Header
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 102, 204)
      doc.text('Nodiac Oracle', margin, y)
      y += 7

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      doc.text('Multi-perspective AI Advisor', margin, y)
      y += 8

      // Summary
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 102, 204)
      doc.text('Summary', margin, y)
      y += 5

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(50, 50, 50)
      const summaryLines = doc.splitTextToSize(summary, contentWidth)
      for (const line of summaryLines) {
        checkPage(5)
        doc.text(line, margin, y)
        y += 5
      }
      y += 4

      // Meta info
      doc.setFontSize(9)
      doc.setTextColor(120, 120, 120)
      doc.text(`Model: ${selectedModel.name} | Exported: ${new Date().toLocaleDateString()}`, margin, y)
      y += 8

      // Separator
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageWidth - margin, y)
      y += 8

      // Conversation
      for (const message of messages) {
        checkPage(15)

        const isUser = message.role === 'user'
        const perspective = message.perspective
          ? PERSPECTIVES.find((p) => p.id === message.perspective)
          : null

        const speaker = isUser ? 'You' : perspective?.name || 'Assistant'

        // Speaker label
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(isUser ? 0 : 80, isUser ? 102 : 80, isUser ? 204 : 80)
        doc.text(`${speaker}:`, margin, y)
        y += 5

        // Message content with markdown
        writeMarkdown(message.content, [30, 30, 30])
        y += 4
      }

      // Footer
      checkPage(20)
      y = pageHeight - 15
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y - 5, pageWidth - margin, y - 5)
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
