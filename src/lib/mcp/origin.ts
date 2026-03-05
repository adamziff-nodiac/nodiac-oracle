/**
 * Get the base origin URL for the MCP server.
 * In production this is the Vercel deployment URL; locally it's localhost.
 */
export function getOrigin(): string {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return `http://localhost:${process.env.PORT || 3000}`
}
