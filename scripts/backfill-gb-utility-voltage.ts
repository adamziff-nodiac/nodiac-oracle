#!/usr/bin/env bun
/**
 * Backfill utility_id and interconnection_voltage_kv for Greenbacker sites
 * using the 135-site Fleet CIR validated CSV data (greenbacker.json).
 *
 * Matches by exact site name. For utilities, tries to match to existing
 * tracker_power_partners first, then creates new IOU partners for unmatched.
 *
 * Usage:
 *   DRY_RUN=true bun run scripts/backfill-gb-utility-voltage.ts   # preview
 *   bun run scripts/backfill-gb-utility-voltage.ts                 # apply
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY!
const DRY_RUN = process.env.DRY_RUN === 'true'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Known mapping from CSV utility names → existing partner names/IDs
// Built from comparing CSV "Interconnecting Utility" to tracker_power_partners
const UTILITY_ALIASES: Record<string, string> = {
  'Xcel Energy': 'Xcel Energy',
  'Northern States Power': 'Xcel Energy', // NSP is Xcel subsidiary
  'Dunn Energy Cooperative': 'Dunn Electric Co-op',
  'Chippewa Valley Electric Cooperative': 'Chippewa Valley',
  'Black Hills Electric Cooperative, Inc.': 'Black Hills Electric Cooperative',
  'United Power, Inc.': 'United Power (Colorado)',
  'Oakdale Electric Cooperative': 'Oakdale Electric Cooperative', // new
  'Vernon Electric Cooperative': 'Vernon Electric Cooperative', // new
  'Price Electric Cooperative': 'Price Electric Cooperative', // new
  'Clark Electric Cooperative': 'Clark Electric Cooperative', // new
  'Pierce Pepin Cooperative Services': 'Pierce Pepin Cooperative Services', // new
  'Polk Burnett Electric Cooperative': 'Polk Burnett Electric Cooperative', // new
  'Prairie Power, Inc.': 'Prairie Power', // new
  'Agricultural Community Solar': 'Agricultural Community Solar', // new
}

function inferUtilityType(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('cooperative') || lower.includes('co-op')) return 'Distribution Co-op'
  if (lower.includes('municipal') || lower.includes('city of') || lower.includes('village of')
    || lower.includes('department') || lower.includes('dept') || lower.includes('light dept')
    || lower.includes('gas & electric')) return 'Municipal Utility'
  if (lower.includes('authority') || lower.includes('power authority')) return 'Municipal Utility'
  // Everything else is IOU (investor-owned utility)
  return 'IOU'
}

interface CsvSite {
  site_name: string
  utility: string
  voltage: string
  elec_owner: string
}

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN ===' : '=== APPLYING CHANGES ===')

  // 1. Load 135-site JSON
  const jsonPath = path.join(process.cwd(), 'public/data/portfolios/greenbacker.json')
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const csvSites: CsvSite[] = data.sites.map((s: any) => ({
    site_name: s.site_name,
    utility: s.raw_data['Interconnecting Utility'] || '',
    voltage: s.raw_data['Interconnection Voltage (kV)'] || '',
    elec_owner: s.raw_data['Electric Infrastructure Owner & Operator'] || '',
  }))
  console.log(`Loaded ${csvSites.length} sites from greenbacker.json`)

  // 2. Load all GB tracker sites
  const gbPartnerId = 'c4873d2b-e9a5-45bf-b250-c943e91e14c6' // Greenbacker
  const { data: trackerSites, error: tsErr } = await supabase
    .from('tracker_sites')
    .select('id, name, utility_id, interconnection_voltage_kv')
    .eq('asset_owner_id', gbPartnerId)
    .is('archived_at', null)
  if (tsErr) { console.error(tsErr); process.exit(1) }
  console.log(`Found ${trackerSites!.length} GB sites in tracker`)

  // Build name→id map for tracker sites
  const trackerByName = new Map<string, { id: string; utility_id: string | null; interconnection_voltage_kv: string | null }>()
  for (const ts of trackerSites!) {
    trackerByName.set(ts.name.toLowerCase(), ts)
  }

  // 3. Load existing partners
  const { data: partners } = await supabase
    .from('tracker_power_partners')
    .select('id, name, type')
  const partnerByName = new Map<string, { id: string; name: string; type: string | null }>()
  for (const p of partners!) {
    partnerByName.set(p.name.toLowerCase(), p)
  }

  // 4. Match CSV sites to tracker sites
  const updates: { id: string; name: string; utility_id: string | null; voltage: string; utilityName: string }[] = []
  const unmatched: string[] = []
  const newPartners = new Map<string, string>() // name → will need to be created

  // Collect unique utility names we need to create
  const utilitiesToCreate = new Set<string>()

  for (const csv of csvSites) {
    const tracker = trackerByName.get(csv.site_name.toLowerCase())
    if (!tracker) {
      unmatched.push(csv.site_name)
      continue
    }

    // Resolve utility name
    let utilityName = UTILITY_ALIASES[csv.utility] || csv.utility
    if (!utilityName && csv.elec_owner) utilityName = csv.elec_owner

    let utilityId: string | null = null
    if (utilityName) {
      const existing = partnerByName.get(utilityName.toLowerCase())
      if (existing) {
        utilityId = existing.id
      } else {
        utilitiesToCreate.add(utilityName)
      }
    }

    // Only update if there's new data
    const hasNewUtility = utilityId && !tracker.utility_id
    const hasNewVoltage = csv.voltage && !tracker.interconnection_voltage_kv
    if (hasNewUtility || hasNewVoltage) {
      updates.push({
        id: tracker.id,
        name: csv.site_name,
        utility_id: hasNewUtility ? utilityId : null,
        voltage: hasNewVoltage ? csv.voltage : '',
        utilityName: utilityName || '(none)',
      })
    }
  }

  // 5. Create missing partners first
  if (utilitiesToCreate.size > 0) {
    console.log(`\n--- Need to create ${utilitiesToCreate.size} new utility partners ---`)
    for (const name of utilitiesToCreate) {
      const type = inferUtilityType(name)
      console.log(`  CREATE: ${name} (type: ${type})`)
      if (!DRY_RUN) {
        const { data: newP, error: createErr } = await supabase
          .from('tracker_power_partners')
          .insert({ name, type, relationship_stage: 'Identified' })
          .select('id')
          .single()
        if (createErr) {
          console.error(`  Failed to create ${name}:`, createErr.message)
        } else {
          partnerByName.set(name.toLowerCase(), { id: newP.id, name, type: 'IOU' })
          newPartners.set(name, newP.id)
          console.log(`  Created: ${newP.id}`)
        }
      }
    }

    // Re-resolve utility IDs for updates that need new partners
    for (const u of updates) {
      if (!u.utility_id && u.utilityName !== '(none)') {
        const p = partnerByName.get(u.utilityName.toLowerCase())
        if (p) u.utility_id = p.id
      }
    }
  }

  // 6. Apply updates
  console.log(`\n--- ${updates.length} sites to update ---`)
  let updatedCount = 0
  for (const u of updates) {
    const fields: Record<string, any> = {}
    if (u.utility_id) fields.utility_id = u.utility_id
    if (u.voltage) fields.interconnection_voltage_kv = u.voltage

    if (Object.keys(fields).length === 0) continue

    console.log(`  ${u.name}: utility=${u.utilityName}${u.utility_id ? ` (${u.utility_id.slice(0,8)})` : ' (skip)'}, voltage=${u.voltage || '(skip)'}`)
    if (!DRY_RUN) {
      const { error } = await supabase
        .from('tracker_sites')
        .update(fields)
        .eq('id', u.id)
      if (error) {
        console.error(`  Failed: ${error.message}`)
      } else {
        updatedCount++
      }
    }
  }

  console.log(`\n--- Summary ---`)
  console.log(`CSV sites: ${csvSites.length}`)
  console.log(`Matched to tracker: ${csvSites.length - unmatched.length}`)
  console.log(`Unmatched: ${unmatched.length}`)
  if (unmatched.length > 0) {
    console.log(`  ${unmatched.slice(0, 20).join(', ')}${unmatched.length > 20 ? '...' : ''}`)
  }
  console.log(`Sites updated: ${DRY_RUN ? `${updates.length} (dry run)` : updatedCount}`)
  console.log(`New partners created: ${newPartners.size}`)
}

main().catch(console.error)
