/**
 * Detect utility type from raw CSV data and return a classification.
 * Used by both the scoring API (for coop_density blending) and the client (for display).
 */
export function classifyUtilityType(rawData: Record<string, unknown>): {
  utilityType: string | null
  coopOverride: number | null
} {
  const keys = [
    'Electric Infrastructure Owner & Operator',
    'electric infrastructure owner & operator',
    'utility type',
    'Utility Type',
    'utility_type',
  ]

  let value: string | null = null
  for (const key of keys) {
    if (rawData[key] && typeof rawData[key] === 'string') {
      value = (rawData[key] as string).trim()
      break
    }
  }

  if (!value) return { utilityType: null, coopOverride: null }

  const lower = value.toLowerCase()

  // Co-op detection
  if (
    lower.includes('coop') ||
    lower.includes('cooperative') ||
    lower.includes('co-op')
  ) {
    return { utilityType: 'Co-op', coopOverride: 1.0 }
  }

  // IOU detection
  if (
    lower.includes('investor') ||
    lower === 'iou' ||
    lower.includes('investor-owned')
  ) {
    return { utilityType: 'IOU', coopOverride: 0.2 }
  }

  // Municipal detection
  if (
    lower.includes('municipal') ||
    lower.includes('muni') ||
    lower.includes('city of') ||
    lower.includes('public power')
  ) {
    return { utilityType: 'Municipal', coopOverride: 0.6 }
  }

  return { utilityType: value, coopOverride: null }
}
