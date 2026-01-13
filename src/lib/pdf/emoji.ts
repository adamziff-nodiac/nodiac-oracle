'use client'

/**
 * Utilities for handling emoji in PDF generation
 */

/**
 * Check if a string contains any emoji characters
 */
export function hasEmoji(text: string): boolean {
  // Create new regex each time to avoid stateful lastIndex issues
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/u
  return emojiRegex.test(text)
}

/**
 * Split text into segments of emoji and non-emoji text
 * This allows rendering each segment with the appropriate font
 */
export type TextSegment = {
  text: string
  isEmoji: boolean
}

export function splitTextByEmoji(text: string): TextSegment[] {
  if (!text) return []

  const segments: TextSegment[] = []
  const regex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})+/gu
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add non-emoji text before this match
    if (match.index > lastIndex) {
      segments.push({
        text: text.slice(lastIndex, match.index),
        isEmoji: false
      })
    }

    // Add emoji segment
    segments.push({
      text: match[0],
      isEmoji: true
    })

    lastIndex = regex.lastIndex
  }

  // Add remaining non-emoji text
  if (lastIndex < text.length) {
    segments.push({
      text: text.slice(lastIndex),
      isEmoji: false
    })
  }

  return segments
}

/**
 * Strip emoji from text (fallback if emoji font fails)
 */
export function stripEmoji(text: string): string {
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu
  return text.replace(emojiRegex, '')
}
