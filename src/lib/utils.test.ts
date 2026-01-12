import { describe, it, expect } from 'vitest'
import { cn, generateId, formatTimestamp } from './utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should merge tailwind classes correctly', () => {
    expect(cn('px-4', 'px-8')).toBe('px-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle empty inputs', () => {
    expect(cn()).toBe('')
  })
})

describe('generateId', () => {
  it('should generate a string id', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
  })

  it('should generate unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })

  it('should generate ids of consistent length', () => {
    const id = generateId()
    expect(id.length).toBeGreaterThan(5)
  })
})

describe('formatTimestamp', () => {
  it('should format morning time correctly', () => {
    const date = new Date('2024-01-15T09:30:00')
    const formatted = formatTimestamp(date)
    expect(formatted).toMatch(/9:30\s*AM/i)
  })

  it('should format afternoon time correctly', () => {
    const date = new Date('2024-01-15T14:45:00')
    const formatted = formatTimestamp(date)
    expect(formatted).toMatch(/2:45\s*PM/i)
  })

  it('should format midnight correctly', () => {
    const date = new Date('2024-01-15T00:00:00')
    const formatted = formatTimestamp(date)
    expect(formatted).toMatch(/12:00\s*AM/i)
  })

  it('should format noon correctly', () => {
    const date = new Date('2024-01-15T12:00:00')
    const formatted = formatTimestamp(date)
    expect(formatted).toMatch(/12:00\s*PM/i)
  })
})
