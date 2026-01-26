'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Perspective, FALLBACK_PERSPECTIVES } from '@/types'

// Database row type
type DbPerspective = {
  id: string
  slug: string
  name: string
  description: string
  system_prompt: string
  icon: string | null
  is_global: boolean
  user_id: string | null
  is_enabled: boolean
  position: number
  created_at: string | null
  updated_at: string | null
}

// Convert database row to app type
function dbToAppPerspective(db: DbPerspective): Perspective {
  return {
    id: db.id,
    slug: db.slug,
    name: db.name,
    description: db.description,
    systemPrompt: db.system_prompt,
    icon: db.icon,
    isGlobal: db.is_global,
    userId: db.user_id,
    isEnabled: db.is_enabled,
    position: db.position,
  }
}

type PerspectivesContextType = {
  globalPerspectives: Perspective[]
  personalPerspectives: Perspective[]
  isLoading: boolean
  updatePerspective: (perspectiveId: string, updates: Partial<Pick<Perspective, 'name' | 'description' | 'systemPrompt' | 'icon' | 'isEnabled' | 'position'>>) => Promise<void>
  togglePerspective: (perspectiveId: string, enabled: boolean) => Promise<void>
  addGlobalPerspective: (data: Pick<Perspective, 'slug' | 'name' | 'description' | 'systemPrompt' | 'icon'>) => Promise<Perspective | null>
  addPersonalPerspective: (data: Pick<Perspective, 'slug' | 'name' | 'description' | 'systemPrompt' | 'icon'>) => Promise<Perspective | null>
  deleteGlobalPerspective: (perspectiveId: string) => Promise<void>
  deletePersonalPerspective: (perspectiveId: string) => Promise<void>
  getEnabledPerspectives: () => Perspective[]
  getPerspectiveBySlug: (slug: string) => Perspective | undefined
  getPerspectiveById: (id: string) => Perspective | undefined
  refetch: () => Promise<void>
}

const PerspectivesContext = createContext<PerspectivesContextType | null>(null)

export function PerspectivesProvider({ children }: { children: ReactNode }) {
  const { user, isGuest } = useAuth()
  const [globalPerspectives, setGlobalPerspectives] = useState<Perspective[]>([])
  const [personalPerspectives, setPersonalPerspectives] = useState<Perspective[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch perspectives from database
  const fetchPerspectives = useCallback(async () => {
    // For guests, use fallback perspectives
    if (isGuest || !user) {
      setGlobalPerspectives(FALLBACK_PERSPECTIVES)
      setPersonalPerspectives([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Fetch global perspectives
      const { data: globalData, error: globalError } = await supabase
        .from('perspectives')
        .select('*')
        .eq('is_global', true)
        .order('position', { ascending: true })

      if (globalError) throw globalError
      setGlobalPerspectives((globalData || []).map(dbToAppPerspective))

      // Fetch personal perspectives
      const { data: personalData, error: personalError } = await supabase
        .from('perspectives')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })

      if (personalError) throw personalError
      setPersonalPerspectives((personalData || []).map(dbToAppPerspective))
    } catch (error) {
      console.error('Error fetching perspectives:', error)
      // Fallback to hardcoded on error
      setGlobalPerspectives(FALLBACK_PERSPECTIVES)
      setPersonalPerspectives([])
    } finally {
      setIsLoading(false)
    }
  }, [user, isGuest])

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (isGuest || !user) {
      setGlobalPerspectives(FALLBACK_PERSPECTIVES)
      setPersonalPerspectives([])
      setIsLoading(false)
      return
    }

    fetchPerspectives()

    // Subscribe to changes
    const supabase = createClient()
    const channel = supabase
      .channel('perspectives_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perspectives',
        },
        () => {
          fetchPerspectives()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, isGuest, fetchPerspectives])

  // Update a perspective
  const updatePerspective = useCallback(async (
    perspectiveId: string,
    updates: Partial<Pick<Perspective, 'name' | 'description' | 'systemPrompt' | 'icon' | 'isEnabled' | 'position'>>
  ) => {
    // Convert app field names to db field names
    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.systemPrompt !== undefined) dbUpdates.system_prompt = updates.systemPrompt
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon
    if (updates.isEnabled !== undefined) dbUpdates.is_enabled = updates.isEnabled
    if (updates.position !== undefined) dbUpdates.position = updates.position

    // Optimistic update
    const updateList = (list: Perspective[]) =>
      list.map(p => p.id === perspectiveId ? { ...p, ...updates } : p)
    setGlobalPerspectives(updateList)
    setPersonalPerspectives(updateList)

    const supabase = createClient()
    const { error } = await supabase
      .from('perspectives')
      .update({ ...dbUpdates, updated_at: new Date().toISOString() })
      .eq('id', perspectiveId)

    if (error) {
      console.error('Error updating perspective:', error)
      fetchPerspectives()
      throw error
    }
  }, [fetchPerspectives])

  // Toggle perspective enabled state
  const togglePerspective = useCallback(async (perspectiveId: string, enabled: boolean) => {
    await updatePerspective(perspectiveId, { isEnabled: enabled })
  }, [updatePerspective])

  // Add a global perspective
  const addGlobalPerspective = useCallback(async (
    data: Pick<Perspective, 'slug' | 'name' | 'description' | 'systemPrompt' | 'icon'>
  ) => {
    if (!user) return null

    // Optimistic update with temp ID
    const tempId = `temp-${Date.now()}`
    const tempPerspective: Perspective = {
      id: tempId,
      slug: data.slug,
      name: data.name,
      description: data.description,
      systemPrompt: data.systemPrompt,
      icon: data.icon,
      isGlobal: true,
      userId: null,
      isEnabled: true,
      position: globalPerspectives.length,
    }
    setGlobalPerspectives(prev => [...prev, tempPerspective])

    const supabase = createClient()
    const { data: newData, error } = await supabase
      .from('perspectives')
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description,
        system_prompt: data.systemPrompt,
        icon: data.icon,
        is_global: true,
        user_id: null,
        is_enabled: true,
        position: globalPerspectives.length,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding global perspective:', error)
      setGlobalPerspectives(prev => prev.filter(p => p.id !== tempId))
      throw error
    }

    // Replace temp with real data
    setGlobalPerspectives(prev => prev.map(p =>
      p.id === tempId ? dbToAppPerspective(newData) : p
    ))

    return dbToAppPerspective(newData)
  }, [user, globalPerspectives.length])

  // Add a personal perspective
  const addPersonalPerspective = useCallback(async (
    data: Pick<Perspective, 'slug' | 'name' | 'description' | 'systemPrompt' | 'icon'>
  ) => {
    if (!user) return null

    // Optimistic update with temp ID
    const tempId = `temp-${Date.now()}`
    const tempPerspective: Perspective = {
      id: tempId,
      slug: data.slug,
      name: data.name,
      description: data.description,
      systemPrompt: data.systemPrompt,
      icon: data.icon,
      isGlobal: false,
      userId: user.id,
      isEnabled: true,
      position: personalPerspectives.length,
    }
    setPersonalPerspectives(prev => [...prev, tempPerspective])

    const supabase = createClient()
    const { data: newData, error } = await supabase
      .from('perspectives')
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description,
        system_prompt: data.systemPrompt,
        icon: data.icon,
        is_global: false,
        user_id: user.id,
        is_enabled: true,
        position: personalPerspectives.length,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding personal perspective:', error)
      setPersonalPerspectives(prev => prev.filter(p => p.id !== tempId))
      throw error
    }

    // Replace temp with real data
    setPersonalPerspectives(prev => prev.map(p =>
      p.id === tempId ? dbToAppPerspective(newData) : p
    ))

    return dbToAppPerspective(newData)
  }, [user, personalPerspectives.length])

  // Delete a global perspective
  const deleteGlobalPerspective = useCallback(async (perspectiveId: string) => {
    const deletedPerspective = globalPerspectives.find(p => p.id === perspectiveId)

    setGlobalPerspectives(prev => prev.filter(p => p.id !== perspectiveId))

    const supabase = createClient()
    const { error } = await supabase
      .from('perspectives')
      .delete()
      .eq('id', perspectiveId)

    if (error) {
      console.error('Error deleting global perspective:', error)
      if (deletedPerspective) {
        setGlobalPerspectives(prev => [...prev, deletedPerspective])
      }
      throw error
    }
  }, [globalPerspectives])

  // Delete a personal perspective
  const deletePersonalPerspective = useCallback(async (perspectiveId: string) => {
    const deletedPerspective = personalPerspectives.find(p => p.id === perspectiveId)

    setPersonalPerspectives(prev => prev.filter(p => p.id !== perspectiveId))

    const supabase = createClient()
    const { error } = await supabase
      .from('perspectives')
      .delete()
      .eq('id', perspectiveId)

    if (error) {
      console.error('Error deleting personal perspective:', error)
      if (deletedPerspective) {
        setPersonalPerspectives(prev => [...prev, deletedPerspective])
      }
      throw error
    }
  }, [personalPerspectives])

  // Get all enabled perspectives (for selection)
  const getEnabledPerspectives = useCallback(() => {
    return [
      ...globalPerspectives.filter(p => p.isEnabled),
      ...personalPerspectives.filter(p => p.isEnabled),
    ].sort((a, b) => a.position - b.position)
  }, [globalPerspectives, personalPerspectives])

  // Get perspective by slug (for backwards compatibility)
  const getPerspectiveBySlug = useCallback((slug: string): Perspective | undefined => {
    return [...globalPerspectives, ...personalPerspectives].find(p => p.slug === slug)
  }, [globalPerspectives, personalPerspectives])

  // Get perspective by ID
  const getPerspectiveById = useCallback((id: string): Perspective | undefined => {
    return [...globalPerspectives, ...personalPerspectives].find(p => p.id === id)
  }, [globalPerspectives, personalPerspectives])

  return (
    <PerspectivesContext.Provider value={{
      globalPerspectives,
      personalPerspectives,
      isLoading,
      updatePerspective,
      togglePerspective,
      addGlobalPerspective,
      addPersonalPerspective,
      deleteGlobalPerspective,
      deletePersonalPerspective,
      getEnabledPerspectives,
      getPerspectiveBySlug,
      getPerspectiveById,
      refetch: fetchPerspectives,
    }}>
      {children}
    </PerspectivesContext.Provider>
  )
}

export function usePerspectives() {
  const context = useContext(PerspectivesContext)
  if (!context) {
    throw new Error('usePerspectives must be used within a PerspectivesProvider')
  }
  return context
}
