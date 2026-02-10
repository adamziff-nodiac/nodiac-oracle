/**
 * Min-max normalization: maps a value from [min, max] to [0, 1].
 * Values outside the range are clamped.
 */
export function minMaxNormalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  const normalized = (value - min) / (max - min)
  return Math.max(0, Math.min(1, normalized))
}

/**
 * Inverse normalization: higher raw values map to lower scores.
 * Useful for metrics where lower is better (e.g., outage duration).
 */
export function inverseNormalize(value: number, min: number, max: number): number {
  return 1 - minMaxNormalize(value, min, max)
}

/**
 * Normalize an array of numbers in-place, returning a new array of [0, 1] values.
 */
export function normalizeArray(values: number[]): number[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  return values.map(v => minMaxNormalize(v, min, max))
}
