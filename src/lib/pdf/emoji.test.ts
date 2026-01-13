import { describe, it, expect } from 'vitest'
import { hasEmoji, splitTextByEmoji, stripEmoji } from './emoji'

describe('emoji utilities', () => {
  describe('hasEmoji', () => {
    it('should return true for strings containing emoji', () => {
      expect(hasEmoji('Hello 👋')).toBe(true)
      expect(hasEmoji('🏢 Building')).toBe(true)
      expect(hasEmoji('Data 📊 Center')).toBe(true)
      expect(hasEmoji('🔋⚡🌞')).toBe(true)
    })

    it('should return false for strings without emoji', () => {
      expect(hasEmoji('Hello World')).toBe(false)
      expect(hasEmoji('Data Center Infrastructure')).toBe(false)
      expect(hasEmoji('123 numbers and symbols !@#')).toBe(false)
      expect(hasEmoji('')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(hasEmoji('   ')).toBe(false)
      expect(hasEmoji('\n\t')).toBe(false)
    })
  })

  describe('splitTextByEmoji', () => {
    it('should return empty array for empty string', () => {
      expect(splitTextByEmoji('')).toEqual([])
    })

    it('should return single non-emoji segment for text without emoji', () => {
      const result = splitTextByEmoji('Hello World')
      expect(result).toEqual([
        { text: 'Hello World', isEmoji: false }
      ])
    })

    it('should return single emoji segment for emoji-only text', () => {
      const result = splitTextByEmoji('👋')
      expect(result).toEqual([
        { text: '👋', isEmoji: true }
      ])
    })

    it('should split text with emoji at the start', () => {
      const result = splitTextByEmoji('🏢 Building')
      expect(result).toEqual([
        { text: '🏢', isEmoji: true },
        { text: ' Building', isEmoji: false }
      ])
    })

    it('should split text with emoji at the end', () => {
      const result = splitTextByEmoji('Hello 👋')
      expect(result).toEqual([
        { text: 'Hello ', isEmoji: false },
        { text: '👋', isEmoji: true }
      ])
    })

    it('should split text with emoji in the middle', () => {
      const result = splitTextByEmoji('Data 📊 Center')
      expect(result).toEqual([
        { text: 'Data ', isEmoji: false },
        { text: '📊', isEmoji: true },
        { text: ' Center', isEmoji: false }
      ])
    })

    it('should handle multiple consecutive emoji', () => {
      const result = splitTextByEmoji('Power 🔋⚡ Grid')
      expect(result).toEqual([
        { text: 'Power ', isEmoji: false },
        { text: '🔋⚡', isEmoji: true },
        { text: ' Grid', isEmoji: false }
      ])
    })

    it('should handle multiple separate emoji', () => {
      const result = splitTextByEmoji('🌞 Solar 🔋 Battery')
      expect(result).toEqual([
        { text: '🌞', isEmoji: true },
        { text: ' Solar ', isEmoji: false },
        { text: '🔋', isEmoji: true },
        { text: ' Battery', isEmoji: false }
      ])
    })
  })

  describe('stripEmoji', () => {
    it('should remove all emoji from text', () => {
      expect(stripEmoji('Hello 👋 World')).toBe('Hello  World')
      expect(stripEmoji('🏢 Building 🔋')).toBe(' Building ')
      expect(stripEmoji('🌞⚡🔋')).toBe('')
    })

    it('should return unchanged text without emoji', () => {
      expect(stripEmoji('Hello World')).toBe('Hello World')
      expect(stripEmoji('')).toBe('')
    })
  })
})
