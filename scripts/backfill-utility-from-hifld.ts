#!/usr/bin/env bun
/**
 * Backfill utility_id for all tracker_sites using HIFLD point-in-polygon lookup.
 *
 * For sites WITHOUT a utility: looks up the territory, finds or creates the
 * partner record, and assigns utility_id.
 *
 * For sites WITH a utility: compares the existing partner name to the HIFLD
 * result and reports conflicts.
 *
 * Usage:
 *   DRY_RUN=true bun run scripts/backfill-utility-from-hifld.ts   # preview
 *   bun run scripts/backfill-utility-from-hifld.ts                 # apply
 */

import { createClient } from '@supabase/supabase-js'
import { lookupUtilityByPoint, type UtilityTerritory } from '../src/lib/geo/utility-territories'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!
const DRY_RUN = process.env.DRY_RUN === 'true'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

interface Site {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  utility_id: string | null
}

interface Partner {
  id: string
  name: string
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== LIVE RUN ===')
  console.log()

  // 1. Fetch all sites
  const { data: sites, error: sitesErr } = await supabase
    .from('tracker_sites')
    .select('id, name, latitude, longitude, utility_id')
    .order('name')

  if (sitesErr) {
    console.error('Failed to fetch sites:', sitesErr.message)
    process.exit(1)
  }

  // 2. Fetch all existing partners (for matching)
  const { data: partners, error: partnersErr } = await supabase
    .from('tracker_power_partners')
    .select('id, name')

  if (partnersErr) {
    console.error('Failed to fetch partners:', partnersErr.message)
    process.exit(1)
  }

  const partnerById = new Map<string, Partner>(partners!.map(p => [p.id, p]))
  const partnerByName = new Map<string, Partner>(partners!.map(p => [p.name.toLowerCase(), p]))

  const sitesWithCoords = (sites as Site[]).filter(s => s.latitude != null && s.longitude != null)
  const sitesNoCoords = (sites as Site[]).filter(s => s.latitude == null || s.longitude == null)

  console.log(`Total sites: ${sites!.length}`)
  console.log(`Sites with coordinates: ${sitesWithCoords.length}`)
  console.log(`Sites without coordinates (skipped): ${sitesNoCoords.length}`)
  if (sitesNoCoords.length > 0) {
    for (const s of sitesNoCoords) {
      console.log(`  - ${s.name} (no coordinates)`)
    }
  }
  console.log()

  // 3. Look up utilities for all sites with coordinates
  const assigned: Array<{ site: string; utility: string }> = []
  const conflicts: Array<{ site: string; current: string; hifld: string; recommendation: string }> = []
  const noTerritory: string[] = []
  const alreadyCorrect: Array<{ site: string; utility: string }> = []
  const newPartners = new Map<string, string>() // HIFLD name → partner ID (created during run)

  console.log('Looking up utility territories...')
  console.log()

  for (const site of sitesWithCoords) {
    const result = await lookupUtilityByPoint(site.latitude!, site.longitude!)

    if (!result) {
      noTerritory.push(site.name)
      continue
    }

    const hifldName = result.name

    if (!site.utility_id) {
      // No utility assigned — assign it
      const partnerId = await findOrCreatePartner(hifldName, result, partnerByName, newPartners)
      assigned.push({ site: site.name, utility: hifldName })

      if (!DRY_RUN) {
        const { error } = await supabase
          .from('tracker_sites')
          .update({ utility_id: partnerId })
          .eq('id', site.id)
        if (error) {
          console.error(`  ERROR updating ${site.name}: ${error.message}`)
        }
      }
    } else {
      // Already has a utility — compare
      const currentPartner = partnerById.get(site.utility_id)
      const currentName = currentPartner?.name ?? '(unknown partner)'

      if (namesMatch(currentName, hifldName)) {
        alreadyCorrect.push({ site: site.name, utility: currentName })
      } else {
        conflicts.push({
          site: site.name,
          current: currentName,
          hifld: hifldName,
          recommendation: recommendResolution(currentName, hifldName),
        })
      }
    }
  }

  // 4. Print results
  console.log()
  console.log('═══════════════════════════════════════════════')
  console.log('  RESULTS')
  console.log('═══════════════════════════════════════════════')
  console.log()

  if (assigned.length > 0) {
    console.log(`✅ ASSIGNED (${assigned.length} sites)${DRY_RUN ? ' [DRY RUN — not saved]' : ''}:`)
    for (const a of assigned) {
      console.log(`  ${a.site.padEnd(40)} → ${a.utility}`)
    }
    console.log()
  }

  if (alreadyCorrect.length > 0) {
    console.log(`✓ ALREADY CORRECT (${alreadyCorrect.length} sites):`)
    for (const a of alreadyCorrect) {
      console.log(`  ${a.site.padEnd(40)}   ${a.utility}`)
    }
    console.log()
  }

  if (conflicts.length > 0) {
    console.log(`⚠️  CONFLICTS (${conflicts.length} sites) — REVIEW NEEDED:`)
    console.log('─'.repeat(100))
    console.log(`${'Site'.padEnd(30)} ${'Current'.padEnd(35)} ${'HIFLD'.padEnd(35)} Recommendation`)
    console.log('─'.repeat(100))
    for (const c of conflicts) {
      console.log(`${c.site.padEnd(30)} ${c.current.padEnd(35)} ${c.hifld.padEnd(35)} ${c.recommendation}`)
    }
    console.log('─'.repeat(100))
    console.log()
  }

  if (noTerritory.length > 0) {
    console.log(`? NO TERRITORY FOUND (${noTerritory.length} sites):`)
    for (const name of noTerritory) {
      console.log(`  ${name}`)
    }
    console.log()
  }

  if (newPartners.size > 0) {
    console.log(`+ NEW PARTNERS CREATED (${newPartners.size})${DRY_RUN ? ' [DRY RUN — not created]' : ''}:`)
    for (const [name] of newPartners) {
      console.log(`  ${name}`)
    }
    console.log()
  }

  console.log('Summary:')
  console.log(`  Assigned:    ${assigned.length}`)
  console.log(`  Correct:     ${alreadyCorrect.length}`)
  console.log(`  Conflicts:   ${conflicts.length}`)
  console.log(`  No territory: ${noTerritory.length}`)
  console.log(`  New partners: ${newPartners.size}`)
}

/** Check if two utility names refer to the same entity */
function namesMatch(a: string, b: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/\b(inc|llc|co|corp|corporation|company|cooperative|coop|electric|energy|power|of|the)\b/g, '')
      .replace(/[^a-z0-9]/g, '')
      .trim()

  return normalize(a) === normalize(b)
}

/** Suggest which name to keep */
function recommendResolution(current: string, hifld: string): string {
  // If current looks like a cleaner/shorter name, keep it
  if (current.length < hifld.length && hifld.toUpperCase() === hifld) {
    return `Keep "${current}"`
  }
  // If HIFLD is all-caps (official), and current is mixed case, current is likely better
  if (hifld.toUpperCase() === hifld) {
    return `Keep "${current}" (HIFLD is official name)`
  }
  return 'Review manually'
}

/** Find existing partner or create new one */
async function findOrCreatePartner(
  hifldName: string,
  territory: UtilityTerritory,
  partnerByName: Map<string, Partner>,
  newPartners: Map<string, string>
): Promise<string> {
  // Check if we already created this partner in this run
  const existing = newPartners.get(hifldName)
  if (existing) return existing

  // Try exact match (case-insensitive)
  const exactMatch = partnerByName.get(hifldName.toLowerCase())
  if (exactMatch) return exactMatch.id

  // Try fuzzy match
  for (const [, partner] of partnerByName) {
    if (namesMatch(partner.name, hifldName)) {
      newPartners.set(hifldName, partner.id) // cache for future lookups
      return partner.id
    }
  }

  // Create new partner
  if (DRY_RUN) {
    const fakeId = `dry-run-${hifldName}`
    newPartners.set(hifldName, fakeId)
    return fakeId
  }

  // Title-case the HIFLD name (they're ALL CAPS)
  const displayName = titleCase(hifldName)

  const { data, error } = await supabase
    .from('tracker_power_partners')
    .insert({
      name: displayName,
      type: mapPartnerType(territory.type),
    })
    .select('id')
    .single()

  if (error) {
    console.error(`  ERROR creating partner "${displayName}": ${error.message}`)
    return ''
  }

  newPartners.set(hifldName, data.id)
  partnerByName.set(hifldName.toLowerCase(), { id: data.id, name: displayName })
  return data.id
}

function titleCase(s: string): string {
  const lowercase = ['of', 'the', 'and', 'for', 'in', 'at', 'by', 'to', 'or', 'an', 'a', 'co', 'inc', 'llc']
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i > 0 && lowercase.includes(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

function mapPartnerType(hifldType: string): string | null {
  switch (hifldType) {
    case 'INVESTOR OWNED': return 'IOU'
    case 'COOPERATIVE': return 'Distribution Co-op'
    case 'MUNICIPAL': return 'Municipal Utility'
    default: return null
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
