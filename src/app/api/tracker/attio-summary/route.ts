import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { AttioSummary, AttioContact, AttioDeal } from '@/lib/tracker/types'

const ATTIO_BASE = 'https://api.attio.com/v2'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Simple in-memory cache
const cache = new Map<string, { data: AttioSummary; timestamp: number }>()

async function attioFetch(path: string, options?: RequestInit): Promise<unknown | null> {
  const apiKey = process.env.ATTIO_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch(`${ATTIO_BASE}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

function extractAttributeValue(values: Record<string, unknown[]>, key: string): string | null {
  const arr = values?.[key] as Array<{ value?: string; first_name?: string; last_name?: string }> | undefined
  if (!arr || arr.length === 0) return null
  const first = arr[0]
  if (first.first_name || first.last_name) {
    return [first.first_name, first.last_name].filter(Boolean).join(' ')
  }
  return first.value ?? null
}

function extractInteractionDate(values: Record<string, unknown[]>, key: string): string | null {
  const arr = values?.[key] as Array<{ interaction_at?: string }> | undefined
  if (!arr || arr.length === 0) return null
  return arr[0].interaction_at ?? null
}

function extractConnectionStrength(values: Record<string, unknown[]>): string | null {
  const arr = values?.['strongest_connection_strength'] as Array<{ status?: string }> | undefined
  if (!arr || arr.length === 0) return null
  return arr[0].status ?? null
}

function extractStrongestConnectionUser(values: Record<string, unknown[]>): string | null {
  const arr = values?.['strongest_connection_user'] as Array<{
    referenced_actor_id?: string
    referenced_actor_type?: string
    first_name?: string
    last_name?: string
  }> | undefined
  if (!arr || arr.length === 0) return null
  const first = arr[0]
  if (first.first_name || first.last_name) {
    return [first.first_name, first.last_name].filter(Boolean).join(' ')
  }
  return null
}

function extractTeamRecordIds(values: Record<string, unknown[]>): string[] {
  const arr = values?.['team'] as Array<{ record_id?: string; target_record_id?: string }> | undefined
  if (!arr) return []
  return arr.map(t => t.target_record_id ?? t.record_id ?? '').filter(Boolean)
}

async function fetchAttioSummary(attioRecordId: string): Promise<AttioSummary> {
  const unavailable: AttioSummary = {
    available: false,
    company_name: null,
    domain: null,
    industry: null,
    connection_strength: null,
    strongest_connection_user: null,
    last_interaction: null,
    next_interaction: null,
    contacts: [],
    deal: null,
    next_steps: null,
  }

  // 1. Get company record
  const companyRes = await attioFetch('/objects/companies/records/query', {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        record_id: { $eq: attioRecordId },
      },
    }),
  }) as { data?: Array<{ id: { record_id: string }; values: Record<string, unknown[]> }> } | null

  if (!companyRes?.data?.[0]) return unavailable

  const company = companyRes.data[0]
  const values = company.values

  const companyName = extractAttributeValue(values, 'name')
  const domain = extractAttributeValue(values, 'primary_domain')
  const industry = extractAttributeValue(values, 'categories')
  const connectionStrength = extractConnectionStrength(values)
  const strongestUser = extractStrongestConnectionUser(values)
  const lastInteraction = extractInteractionDate(values, 'last_interaction')
  const nextInteraction = extractInteractionDate(values, 'next_interaction')

  // 2. Get team contacts (people linked to this company)
  const teamIds = extractTeamRecordIds(values)
  const contacts: AttioContact[] = []

  if (teamIds.length > 0) {
    // Fetch up to 5 contacts for the summary card
    const contactIds = teamIds.slice(0, 5)
    const peopleRes = await attioFetch('/objects/people/records/query', {
      method: 'POST',
      body: JSON.stringify({
        filter: {
          record_id: { $in: contactIds },
        },
      }),
    }) as { data?: Array<{ id: { record_id: string }; values: Record<string, unknown[]> }> } | null

    if (peopleRes?.data) {
      for (const person of peopleRes.data) {
        const pv = person.values
        const name = [
          extractAttributeValue(pv, 'first_name'),
          extractAttributeValue(pv, 'last_name'),
        ].filter(Boolean).join(' ')

        const emailArr = pv?.['email_addresses'] as Array<{ email_address?: string }> | undefined
        const email = emailArr?.[0]?.email_address ?? null

        const title = extractAttributeValue(pv, 'job_title')
        const personConnection = extractConnectionStrength(pv)
        const personLastInteraction = extractInteractionDate(pv, 'last_interaction')

        contacts.push({
          name: name || 'Unknown',
          title,
          email,
          connection_strength: personConnection,
          last_interaction: personLastInteraction,
        })
      }
    }
  }

  // 3. Get deal data
  let deal: AttioDeal | null = null
  const dealsRes = await attioFetch('/objects/deals/records/query', {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        'associated_company': {
          $eq: attioRecordId,
        },
      },
    }),
  }) as { data?: Array<{ values: Record<string, unknown[]> }> } | null

  if (dealsRes?.data?.[0]) {
    const dealValues = dealsRes.data[0].values
    const stageArr = dealValues?.['stage'] as Array<{ status?: { title?: string } }> | undefined
    const stage = stageArr?.[0]?.status?.title ?? extractAttributeValue(dealValues, 'stage')
    const dealType = extractAttributeValue(dealValues, 'type')
    const ownerArr = dealValues?.['owner'] as Array<{ first_name?: string; last_name?: string; referenced_actor_id?: string }> | undefined
    const owner = ownerArr?.[0]
      ? [ownerArr[0].first_name, ownerArr[0].last_name].filter(Boolean).join(' ') || null
      : null

    deal = { stage, type: dealType, owner }
  }

  // 4. Get utility list entry for "next steps"
  let nextSteps: string | null = null
  const utilityRes = await attioFetch('/lists/utilities/entries/query', {
    method: 'POST',
    body: JSON.stringify({
      filter: {
        'parent_record': {
          $eq: {
            object_id: '14d9453f-4ee0-446a-9a93-1d35dc02cc85',
            record_id: attioRecordId,
          },
        },
      },
    }),
  }) as { data?: Array<{ values: Record<string, unknown[]> }> } | null

  if (utilityRes?.data?.[0]) {
    const entryValues = utilityRes.data[0].values
    nextSteps = extractAttributeValue(entryValues, 'next_steps')
  }

  return {
    available: true,
    company_name: companyName,
    domain,
    industry,
    connection_strength: connectionStrength,
    strongest_connection_user: strongestUser,
    last_interaction: lastInteraction,
    next_interaction: nextInteraction,
    contacts,
    deal,
    next_steps: nextSteps,
  }
}

export async function GET(request: NextRequest) {
  const partnerId = request.nextUrl.searchParams.get('partner_id')
  if (!partnerId) {
    return NextResponse.json({ error: 'partner_id is required' }, { status: 400 })
  }

  // Look up attio_record_id from the partner
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ available: false } as AttioSummary, { status: 200 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: partner } = await supabase
    .from('tracker_power_partners')
    .select('attio_record_id')
    .eq('id', partnerId)
    .single()

  const attioRecordId = partner?.attio_record_id
  if (!attioRecordId) {
    return NextResponse.json({
      available: false,
      company_name: null,
      domain: null,
      industry: null,
      connection_strength: null,
      strongest_connection_user: null,
      last_interaction: null,
      next_interaction: null,
      contacts: [],
      deal: null,
      next_steps: null,
    } as AttioSummary, { status: 200 })
  }

  // Check cache
  const cached = cache.get(attioRecordId)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data)
  }

  try {
    const summary = await fetchAttioSummary(attioRecordId)

    // Update cache
    cache.set(attioRecordId, { data: summary, timestamp: Date.now() })

    return NextResponse.json(summary)
  } catch {
    return NextResponse.json({ available: false } as AttioSummary, { status: 200 })
  }
}
