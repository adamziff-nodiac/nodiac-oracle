/**
 * One-time backfill script: matches tracker partners to Attio company records
 * by searching Attio's company API by name.
 *
 * Usage:
 *   ATTIO_API_KEY=<key> SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> bun run scripts/backfill-attio-records.ts
 *
 * Or with .env.local loaded:
 *   bun run scripts/backfill-attio-records.ts
 */

import { createClient } from '@supabase/supabase-js'

const ATTIO_API_KEY = process.env.ATTIO_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!ATTIO_API_KEY) {
  console.error('Missing ATTIO_API_KEY env var')
  process.exit(1)
}
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env var')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface AttioRecord {
  id: { record_id: string }
  values: {
    name?: Array<{ value: string }>
  }
}

async function searchAttioCompanies(name: string): Promise<AttioRecord[]> {
  const res = await fetch('https://api.attio.com/v2/objects/companies/records/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ATTIO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: {
        name: {
          $contains: name,
        },
      },
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`Attio API error for "${name}": ${res.status} ${text}`)
    return []
  }

  const data = await res.json()
  return data.data ?? []
}

async function main() {
  // Fetch all partners without an attio_record_id
  const { data: partners, error } = await supabase
    .from('tracker_power_partners')
    .select('id, name, attio_record_id')
    .is('attio_record_id', null)

  if (error) {
    console.error('Failed to fetch partners:', error.message)
    process.exit(1)
  }

  if (!partners || partners.length === 0) {
    console.log('No partners without attio_record_id found. Nothing to backfill.')
    return
  }

  console.log(`Found ${partners.length} partners to backfill.\n`)

  let matched = 0
  let skipped = 0
  const manualReview: Array<{ name: string; matchCount: number }> = []

  for (const partner of partners) {
    console.log(`Searching Attio for: "${partner.name}"`)

    const results = await searchAttioCompanies(partner.name)

    if (results.length === 1) {
      const recordId = results[0].id.record_id
      const { error: updateError } = await supabase
        .from('tracker_power_partners')
        .update({ attio_record_id: recordId })
        .eq('id', partner.id)

      if (updateError) {
        console.error(`  Failed to update partner ${partner.id}: ${updateError.message}`)
      } else {
        console.log(`  Matched -> ${recordId}`)
        matched++
      }
    } else if (results.length === 0) {
      console.log('  No match found (skipping)')
      skipped++
    } else {
      console.log(`  Multiple matches (${results.length}) - flagged for manual review`)
      manualReview.push({ name: partner.name, matchCount: results.length })
    }

    // Rate limit: 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('\n--- Summary ---')
  console.log(`Matched: ${matched}`)
  console.log(`No match: ${skipped}`)
  console.log(`Manual review: ${manualReview.length}`)

  if (manualReview.length > 0) {
    console.log('\nPartners needing manual review:')
    for (const item of manualReview) {
      console.log(`  - "${item.name}" (${item.matchCount} matches)`)
    }
  }
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
