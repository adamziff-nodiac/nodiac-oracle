import { describe, it, expect } from 'vitest'
import { AI_MODELS, PERSPECTIVES } from './index'

describe('AI_MODELS', () => {
  it('should have at least one model', () => {
    expect(AI_MODELS.length).toBeGreaterThan(0)
  })

  it('should have Claude Opus 4.5 as the first model', () => {
    expect(AI_MODELS[0].name).toContain('Claude')
    expect(AI_MODELS[0].provider).toBe('anthropic')
  })

  it('should have models from all three providers', () => {
    const providers = new Set(AI_MODELS.map(m => m.provider))
    expect(providers.has('anthropic')).toBe(true)
    expect(providers.has('openai')).toBe(true)
    expect(providers.has('google')).toBe(true)
  })

  it('should have unique model ids', () => {
    const ids = AI_MODELS.map(m => m.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have valid model structure', () => {
    AI_MODELS.forEach(model => {
      expect(model).toHaveProperty('id')
      expect(model).toHaveProperty('name')
      expect(model).toHaveProperty('provider')
      expect(typeof model.id).toBe('string')
      expect(typeof model.name).toBe('string')
      expect(['anthropic', 'openai', 'google']).toContain(model.provider)
    })
  })
})

describe('PERSPECTIVES', () => {
  it('should have exactly four perspectives', () => {
    expect(PERSPECTIVES.length).toBe(4)
  })

  it('should have the required perspectives', () => {
    // Use slug field for perspective identification (backwards compat)
    const slugs = PERSPECTIVES.map(p => p.slug)
    expect(slugs).toContain('hyperscaler')
    expect(slugs).toContain('techvc')
    expect(slugs).toContain('utility')
    expect(slugs).toContain('renewables')
  })

  it('should have unique perspective ids', () => {
    const slugs = PERSPECTIVES.map(p => p.slug)
    const uniqueSlugs = new Set(slugs)
    expect(uniqueSlugs.size).toBe(slugs.length)
  })

  it('should have valid perspective structure', () => {
    PERSPECTIVES.forEach(perspective => {
      expect(perspective).toHaveProperty('id')
      expect(perspective).toHaveProperty('slug')
      expect(perspective).toHaveProperty('name')
      expect(perspective).toHaveProperty('description')
      expect(perspective).toHaveProperty('systemPrompt')
      expect(perspective).toHaveProperty('icon')
      expect(perspective).toHaveProperty('isGlobal')
      expect(perspective).toHaveProperty('isEnabled')
      expect(perspective).toHaveProperty('position')
      expect(typeof perspective.id).toBe('string')
      expect(typeof perspective.slug).toBe('string')
      expect(typeof perspective.name).toBe('string')
      expect(typeof perspective.description).toBe('string')
      expect(typeof perspective.systemPrompt).toBe('string')
    })
  })

  it('should have non-empty system prompts', () => {
    PERSPECTIVES.forEach(perspective => {
      expect(perspective.systemPrompt.length).toBeGreaterThan(100)
    })
  })

  it('should mention Nodiac in all system prompts', () => {
    PERSPECTIVES.forEach(perspective => {
      expect(perspective.systemPrompt.toLowerCase()).toContain('nodiac')
    })
  })
})
