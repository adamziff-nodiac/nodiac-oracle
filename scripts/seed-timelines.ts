import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

// Helper to convert quarter to date
function quarterToDate(year: number, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): string {
  const monthMap = { Q1: '01', Q2: '04', Q3: '07', Q4: '10' }
  return `${year}-${monthMap[quarter]}-01`
}

// Row colors matching the original image
const COLORS = {
  Solar: '#EAB308',    // Yellow
  BESS: '#14B8A6',     // Teal
  Gas: '#F97316',      // Orange
  Diesel: '#EF4444',   // Red
  Grid: '#3B82F6',     // Blue
}

type RowData = {
  label: string
  color: string
  startQuarter: [number, 'Q1' | 'Q2' | 'Q3' | 'Q4']
  endQuarter: [number, 'Q1' | 'Q2' | 'Q3' | 'Q4']
  milestones: { label: string; quarter: [number, 'Q1' | 'Q2' | 'Q3' | 'Q4'] }[]
  annotations?: { label: string; quarter: [number, 'Q1' | 'Q2' | 'Q3' | 'Q4'] }[]
}

type TimelineData = {
  title: string
  startYear: number
  endYear: number
  rows: RowData[]
  phases: { label: string; quarter: [number, 'Q1' | 'Q2' | 'Q3' | 'Q4'] }[]
}

const timelines: TimelineData[] = [
  {
    title: 'Lincoln Energy Project Timeline',
    startYear: 2026,
    endYear: 2031,
    rows: [
      {
        label: 'Solar',
        color: COLORS.Solar,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2030, 'Q1'],
        milestones: [
          { label: '120 MW', quarter: [2027, 'Q4'] },
          { label: '320 MW', quarter: [2028, 'Q3'] },
          { label: '481 MW', quarter: [2030, 'Q1'] },
        ],
      },
      {
        label: 'BESS',
        color: COLORS.BESS,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2029, 'Q4'],
        milestones: [
          { label: '480 MWh', quarter: [2028, 'Q2'] },
          { label: '721 MWh', quarter: [2029, 'Q4'] },
        ],
      },
      {
        label: 'Gas',
        color: COLORS.Gas,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2031, 'Q1'],
        milestones: [
          { label: '500 MW', quarter: [2029, 'Q1'] },
          { label: '1000 MW', quarter: [2031, 'Q1'] },
        ],
      },
      {
        label: 'Diesel',
        color: COLORS.Diesel,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2030, 'Q1'],
        milestones: [
          { label: '120 MW', quarter: [2027, 'Q4'] },
          { label: '240 MW', quarter: [2028, 'Q3'] },
          { label: '300 MW', quarter: [2030, 'Q1'] },
        ],
      },
      {
        label: 'Grid',
        color: COLORS.Grid,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2028, 'Q1'],
        milestones: [
          { label: '400 MW', quarter: [2028, 'Q1'] },
        ],
        annotations: [
          { label: 'IX Request Filed', quarter: [2026, 'Q1'] },
        ],
      },
    ],
    phases: [
      { label: 'Phase 1', quarter: [2027, 'Q4'] },
      { label: 'Phase 2', quarter: [2029, 'Q1'] },
      { label: 'Phase 3', quarter: [2031, 'Q1'] },
    ],
  },
  {
    title: 'Appaloosa II Project Timeline',
    startYear: 2026,
    endYear: 2031,
    rows: [
      {
        label: 'Solar',
        color: COLORS.Solar,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2029, 'Q4'],
        milestones: [
          { label: '150 MW', quarter: [2027, 'Q3'] },
          { label: '400 MW', quarter: [2028, 'Q2'] },
          { label: '921 MW', quarter: [2029, 'Q4'] },
        ],
      },
      {
        label: 'BESS',
        color: COLORS.BESS,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2029, 'Q3'],
        milestones: [
          { label: '600 MWh', quarter: [2028, 'Q2'] },
          { label: '1382 MWh', quarter: [2029, 'Q3'] },
        ],
      },
      {
        label: 'Gas',
        color: COLORS.Gas,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2031, 'Q4'],
        milestones: [
          { label: '500 MW', quarter: [2029, 'Q4'] },
          { label: '1000 MW', quarter: [2031, 'Q4'] },
        ],
      },
      {
        label: 'Diesel',
        color: COLORS.Diesel,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2031, 'Q1'],
        milestones: [
          { label: '120 MW', quarter: [2027, 'Q3'] },
          { label: '240 MW', quarter: [2029, 'Q4'] },
          { label: '960 MW', quarter: [2031, 'Q1'] },
        ],
      },
      {
        label: 'Grid',
        color: COLORS.Grid,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2028, 'Q1'],
        milestones: [
          { label: '400 MW', quarter: [2028, 'Q1'] },
        ],
        annotations: [
          { label: 'IX Request Filed', quarter: [2026, 'Q1'] },
        ],
      },
    ],
    phases: [
      { label: 'Phase 1', quarter: [2027, 'Q3'] },
      { label: 'Phase 2', quarter: [2029, 'Q4'] },
      { label: 'Phase 3', quarter: [2031, 'Q4'] },
    ],
  },
  {
    title: 'Cider Project Timeline',
    startYear: 2026,
    endYear: 2030,
    rows: [
      {
        label: 'Solar',
        color: COLORS.Solar,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2029, 'Q3'],
        milestones: [
          { label: '120 MW', quarter: [2027, 'Q2'] },
          { label: '300 MW', quarter: [2028, 'Q1'] },
          { label: '470 MW', quarter: [2029, 'Q3'] },
        ],
      },
      {
        label: 'BESS',
        color: COLORS.BESS,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2029, 'Q2'],
        milestones: [
          { label: '450 MWh', quarter: [2028, 'Q1'] },
          { label: '705 MWh', quarter: [2029, 'Q2'] },
        ],
      },
      {
        label: 'Gas',
        color: COLORS.Gas,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2030, 'Q3'],
        milestones: [
          { label: '500 MW', quarter: [2028, 'Q3'] },
          { label: '1000 MW', quarter: [2030, 'Q3'] },
        ],
      },
      {
        label: 'Diesel',
        color: COLORS.Diesel,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2030, 'Q3'],
        milestones: [
          { label: '120 MW', quarter: [2027, 'Q2'] },
          { label: '240 MW', quarter: [2029, 'Q3'] },
          { label: '480 MW', quarter: [2030, 'Q3'] },
        ],
      },
      {
        label: 'Grid',
        color: COLORS.Grid,
        startQuarter: [2026, 'Q1'],
        endQuarter: [2028, 'Q1'],
        milestones: [
          { label: '400 MW', quarter: [2028, 'Q1'] },
        ],
        annotations: [
          { label: 'IX Request Filed', quarter: [2026, 'Q1'] },
        ],
      },
    ],
    phases: [
      { label: 'Phase 1', quarter: [2027, 'Q2'] },
      { label: 'Phase 2', quarter: [2029, 'Q3'] },
      { label: 'Phase 3', quarter: [2030, 'Q3'] },
    ],
  },
]

async function seed() {
  console.log('Finding user adam.ziff@nodiac.ai...')

  // Find user by email
  const { data: users, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', 'adam.ziff@nodiac.ai')
    .single()

  // If that doesn't work, try the auth admin API
  let userId: string | null = null

  if (userError || !users) {
    // Use admin API to list users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('Error listing users:', authError)
      process.exit(1)
    }

    const user = authData.users.find((u) => u.email === 'adam.ziff@nodiac.ai')
    if (!user) {
      console.error('User adam.ziff@nodiac.ai not found')
      process.exit(1)
    }
    userId = user.id
  } else {
    userId = users.id
  }

  console.log(`Found user ID: ${userId}`)

  // Delete existing timelines for this user (clean slate)
  console.log('Deleting existing timelines...')
  await supabase.from('timelines').delete().eq('user_id', userId)

  // Create each timeline
  for (const timeline of timelines) {
    console.log(`Creating timeline: ${timeline.title}`)

    // Create timeline
    const { data: timelineData, error: timelineError } = await supabase
      .from('timelines')
      .insert({
        user_id: userId,
        title: timeline.title,
        start_year: timeline.startYear,
        end_year: timeline.endYear,
      })
      .select()
      .single()

    if (timelineError || !timelineData) {
      console.error('Error creating timeline:', timelineError)
      continue
    }

    const timelineId = timelineData.id

    // Create rows
    for (let i = 0; i < timeline.rows.length; i++) {
      const row = timeline.rows[i]
      console.log(`  Creating row: ${row.label}`)

      const { data: rowData, error: rowError } = await supabase
        .from('timeline_rows')
        .insert({
          timeline_id: timelineId,
          label: row.label,
          color: row.color,
          start_date: quarterToDate(row.startQuarter[0], row.startQuarter[1]),
          end_date: quarterToDate(row.endQuarter[0], row.endQuarter[1]),
          position: i,
        })
        .select()
        .single()

      if (rowError || !rowData) {
        console.error('Error creating row:', rowError)
        continue
      }

      const rowId = rowData.id

      // Create milestones
      for (let j = 0; j < row.milestones.length; j++) {
        const milestone = row.milestones[j]
        const { error: milestoneError } = await supabase
          .from('timeline_milestones')
          .insert({
            row_id: rowId,
            label: milestone.label,
            date: quarterToDate(milestone.quarter[0], milestone.quarter[1]),
            position: j,
          })

        if (milestoneError) {
          console.error('Error creating milestone:', milestoneError)
        }
      }

      // Create annotations
      if (row.annotations) {
        for (const annotation of row.annotations) {
          const { error: annotationError } = await supabase
            .from('timeline_annotations')
            .insert({
              row_id: rowId,
              label: annotation.label,
              date: quarterToDate(annotation.quarter[0], annotation.quarter[1]),
            })

          if (annotationError) {
            console.error('Error creating annotation:', annotationError)
          }
        }
      }
    }

    // Create phases
    for (let i = 0; i < timeline.phases.length; i++) {
      const phase = timeline.phases[i]
      console.log(`  Creating phase: ${phase.label}`)

      const { error: phaseError } = await supabase
        .from('timeline_phases')
        .insert({
          timeline_id: timelineId,
          label: phase.label,
          date: quarterToDate(phase.quarter[0], phase.quarter[1]),
          position: i,
        })

      if (phaseError) {
        console.error('Error creating phase:', phaseError)
      }
    }
  }

  console.log('Done!')
}

seed().catch(console.error)
