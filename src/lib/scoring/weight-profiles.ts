import type { WeightProfile, CriterionKey } from '@/types/regional-hubs'

export const WEIGHT_PROFILES: WeightProfile[] = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Equal weight across all seven criteria',
    weights: {
      coop_density: 1,
      grid_reliability: 1,
      clipped_curtailed: 1,
      permitting: 1,
      labor: 1,
      fiber: 1,
      queue_pressure: 1,
    },
  },
  {
    id: 'coop-priority',
    name: 'Co-op Priority',
    description: 'Emphasizes cooperative utility presence and permitting',
    weights: {
      coop_density: 3,
      grid_reliability: 1,
      clipped_curtailed: 1,
      permitting: 2,
      labor: 0.5,
      fiber: 1,
      queue_pressure: 0.5,
    },
  },
  {
    id: 'speed-to-deploy',
    name: 'Speed to Deploy',
    description: 'Prioritizes permitting, fiber, and grid readiness',
    weights: {
      coop_density: 0.5,
      grid_reliability: 2,
      clipped_curtailed: 0.5,
      permitting: 3,
      labor: 1,
      fiber: 2,
      queue_pressure: 2,
    },
  },
  {
    id: 'curtailment-capture',
    name: 'Curtailment Capture',
    description: 'Targets areas with excess renewable energy and grid capacity',
    weights: {
      coop_density: 1,
      grid_reliability: 1.5,
      clipped_curtailed: 3,
      permitting: 1,
      labor: 0.5,
      fiber: 1,
      queue_pressure: 2,
    },
  },
]

export const DEFAULT_WEIGHTS: Record<CriterionKey, number> = WEIGHT_PROFILES[0].weights

export function getProfileById(id: string): WeightProfile | undefined {
  return WEIGHT_PROFILES.find(p => p.id === id)
}
