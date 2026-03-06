/*
  Seed ATTIO record links for tracker partners and dedupe obvious duplicate tracker sites.

  Usage:
    bun run scripts/attio-seed-and-dedupe.ts                # dry run
    APPLY=true bun run scripts/attio-seed-and-dedupe.ts     # apply DB writes
*/

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

type AttioCompany = { id: string; name: string }

type Partner = {
  id: string
  name: string
  attio_record_id: string | null
}

type Site = {
  id: string
  name: string
  utility_id: string | null
  asset_owner_id: string | null
  archived_at: string | null
  archived_reason: string | null
  site_notes: unknown | null
}

const ATTIO_API_KEY = process.env.ATTIO_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
const APPLY = process.env.APPLY === 'true'

if (!ATTIO_API_KEY) throw new Error('Missing ATTIO_API_KEY')
if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Missing Supabase env vars')

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ') // remove parenthetical variants like (Done 2)
    .replace(/&/g, ' and ')
    .replace(/\b(the|co\.?|company|inc\.?|llc|l\.p\.?|lp|corp\.?|corporation|cooperative|co-op|electric)\b/g, ' ')
    .replace(/\b(phase\s*\d+|done\s*\d+|part\s*\d+)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenSet(s: string): Set<string> {
  return new Set(s.split(' ').filter(Boolean))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

function scoreCandidate(partnerName: string, companyName: string): number {
  const pNorm = normalizeName(partnerName)
  const cNorm = normalizeName(companyName)
  if (!pNorm || !cNorm) return 0
  if (pNorm === cNorm) return 1

  const pSet = tokenSet(pNorm)
  const cSet = tokenSet(cNorm)
  const jac = jaccard(pSet, cSet)

  let bonus = 0
  if (cNorm.includes(pNorm) || pNorm.includes(cNorm)) bonus += 0.08
  if (pNorm.split(' ')[0] === cNorm.split(' ')[0]) bonus += 0.04

  return Math.min(0.99, jac + bonus)
}

async function queryAttioCompaniesByContains(term: string): Promise<AttioCompany[]> {
  const res = await fetch('https://api.attio.com/v2/objects/companies/records/query', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ATTIO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { name: { $contains: term } },
      limit: 25,
    }),
  })

  if (!res.ok) return []
  const json = await res.json()
  return (json.data ?? []).map((r: any) => ({
    id: r?.id?.record_id,
    name: r?.values?.name?.[0]?.value,
  })).filter((r: any) => r.id && r.name)
}

async function seedAttioLinks() {
  const { data: partners, error } = await supabase
    .from('tracker_power_partners')
    .select('id,name,attio_record_id')

  if (error) throw error

  const missing = (partners as Partner[]).filter(p => !p.attio_record_id)

  const auto: Array<{ partnerId: string; partnerName: string; attioId: string; attioName: string; score: number }> = []
  const review: Array<{ partnerId: string; partnerName: string; candidates: Array<{ attioId: string; attioName: string; score: number }> }> = []
  const noMatch: Array<{ partnerId: string; partnerName: string }> = []

  for (const p of missing) {
    const terms = Array.from(new Set([
      p.name,
      normalizeName(p.name).split(' ')[0] || p.name,
    ].filter(Boolean)))

    const candidateMap = new Map<string, AttioCompany>()
    for (const t of terms) {
      const rows = await queryAttioCompaniesByContains(t)
      for (const r of rows) candidateMap.set(r.id, r)
    }

    const ranked = [...candidateMap.values()]
      .map(c => ({ ...c, score: scoreCandidate(p.name, c.name) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const best = ranked[0]
    const second = ranked[1]

    if (!best || best.score < 0.7) {
      noMatch.push({ partnerId: p.id, partnerName: p.name })
      continue
    }

    if (best.score >= 0.92 && (!second || best.score - second.score >= 0.08)) {
      auto.push({
        partnerId: p.id,
        partnerName: p.name,
        attioId: best.id,
        attioName: best.name,
        score: Number(best.score.toFixed(3)),
      })
    } else {
      review.push({
        partnerId: p.id,
        partnerName: p.name,
        candidates: ranked.map(r => ({ attioId: r.id, attioName: r.name, score: Number(r.score.toFixed(3)) })),
      })
    }
  }

  if (APPLY && auto.length > 0) {
    for (const m of auto) {
      const { error: upErr } = await supabase
        .from('tracker_power_partners')
        .update({ attio_record_id: m.attioId })
        .eq('id', m.partnerId)
      if (upErr) throw upErr
    }
  }

  return { auto, review, noMatch }
}

async function tryMoveChildren(table: string, fromId: string, toId: string): Promise<number> {
  const { data, error } = await supabase
    .from(table)
    .update({ site_id: toId })
    .eq('site_id', fromId)
    .select('id')

  if (error) return 0
  return data?.length ?? 0
}

async function dedupeSites() {
  const { data, error } = await supabase
    .from('tracker_sites')
    .select('id,name,utility_id,asset_owner_id,archived_at,archived_reason,site_notes')

  if (error) throw error

  const sites = data as Site[]

  const groups = new Map<string, Site[]>()
  for (const s of sites) {
    const k = normalizeName(s.name)
    if (!k) continue
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(s)
  }

  const dupGroups = [...groups.entries()].filter(([, arr]) => arr.length > 1)

  const merged: Array<{ canonical: Site; duplicate: Site; moved: Record<string, number> }> = []
  const skipped: Array<{ reason: string; sites: Site[] }> = []

  for (const [, arr] of dupGroups) {
    const canonical = arr.find(s => !/\((phase|done|dunn|north|south)/i.test(s.name)) ?? arr[0]
    const dups = arr.filter(s => s.id !== canonical.id)

    for (const dup of dups) {
      const looksVariant = /\((phase|done|dunn)\s*\d*\)/i.test(dup.name)
      if (!looksVariant) {
        skipped.push({ reason: 'not a safe variant suffix duplicate', sites: [canonical, dup] })
        continue
      }

      const emptyNotes = !dup.site_notes || JSON.stringify(dup.site_notes) === '{}' || JSON.stringify(dup.site_notes) === 'null'
      const minimalMetadata = !dup.utility_id && !dup.asset_owner_id && emptyNotes
      if (!minimalMetadata) {
        skipped.push({ reason: 'duplicate has meaningful metadata; manual review required', sites: [canonical, dup] })
        continue
      }

      const moved: Record<string, number> = {}
      if (APPLY) {
        const childTables = ['tracker_activity_log', 'tracker_parcels', 'tracker_site_landowners', 'tracker_action_items']
        let existingLinks = 0
        for (const t of childTables) {
          const { count } = await supabase.from(t).select('*', { count: 'exact', head: true }).eq('site_id', dup.id)
          existingLinks += count ?? 0
        }

        if (existingLinks > 0) {
          skipped.push({ reason: 'duplicate has linked child rows; manual merge required', sites: [canonical, dup] })
          continue
        }

        const existingNotes = (dup.site_notes ?? null) as Record<string, unknown> | null
        const dedupeMarker = {
          deduped_at: new Date().toISOString(),
          merged_into_site_id: canonical.id,
          merged_into_site_name: canonical.name,
        }
        const newSiteNotes = {
          ...(existingNotes && typeof existingNotes === 'object' ? existingNotes : {}),
          dedupe: dedupeMarker,
        }

        const { error: archiveErr } = await supabase
          .from('tracker_sites')
          .update({
            archived_at: new Date().toISOString(),
            archived_reason: `duplicate-merged-into-${canonical.id}`,
            site_notes: newSiteNotes,
          })
          .eq('id', dup.id)

        if (archiveErr) throw archiveErr
      }

      merged.push({ canonical, duplicate: dup, moved })
    }
  }

  return { merged, skipped }
}

async function main() {
  const attio = await seedAttioLinks()
  const dedupe = await dedupeSites()

  const report = {
    generatedAt: new Date().toISOString(),
    applyMode: APPLY,
    attio,
    dedupe,
  }

  const outDir = path.join(process.cwd(), 'scripts', 'reports')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `attio-seed-dedupe-${Date.now()}.json`)
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

  console.log(`Report: ${outPath}`)
  console.log(`ATTIO auto-linked: ${attio.auto.length}`)
  console.log(`ATTIO needs review: ${attio.review.length}`)
  console.log(`ATTIO no match: ${attio.noMatch.length}`)
  console.log(`Site merges: ${dedupe.merged.length}`)
  console.log(`Site dedupe skipped groups: ${dedupe.skipped.length}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
