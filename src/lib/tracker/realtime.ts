'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useActionItemsRealtime(onUpdate: () => void, siteId?: string) {
  useEffect(() => {
    const supabase = createClient()
    const filter = siteId ? `site_id=eq.${siteId}` : undefined
    const channel = supabase
      .channel(`action-items-${siteId ?? 'all'}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tracker_action_items',
        ...(filter ? { filter } : {})
      }, onUpdate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate, siteId])
}

export function useTrackerRealtime(onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('tracker-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracker_sites' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracker_activity_log' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracker_power_partners' }, onUpdate)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tracker_regional_hubs' }, onUpdate)
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onUpdate])
}
