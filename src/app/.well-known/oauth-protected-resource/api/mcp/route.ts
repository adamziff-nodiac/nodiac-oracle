import { NextResponse } from 'next/server'
import { getOrigin } from '@/lib/mcp/origin'

export async function GET() {
  const origin = getOrigin()
  return NextResponse.json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
  })
}
