'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export type ContextPrompt = {
  id: string
  name: string
  content: string
  is_global: boolean
  user_id: string | null
  is_enabled: boolean
  position: number
  created_at: string | null
  updated_at: string | null
}

export function useContextPrompts() {
  const { user, isGuest } = useAuth()
  const [globalPrompts, setGlobalPrompts] = useState<ContextPrompt[]>([])
  const [personalPrompts, setPersonalPrompts] = useState<ContextPrompt[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch prompts
  const fetchPrompts = useCallback(async () => {
    if (isGuest || !user) {
      setGlobalPrompts([])
      setPersonalPrompts([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()

      // Fetch global prompts
      const { data: globalData, error: globalError } = await supabase
        .from('context_prompts')
        .select('*')
        .eq('is_global', true)
        .order('position', { ascending: true })

      if (globalError) throw globalError
      setGlobalPrompts(globalData || [])

      // Fetch personal prompts
      const { data: personalData, error: personalError } = await supabase
        .from('context_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true })

      if (personalError) throw personalError
      setPersonalPrompts(personalData || [])
    } catch (error) {
      console.error('Error fetching context prompts:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, isGuest])

  // Initial fetch and realtime subscription
  useEffect(() => {
    if (isGuest || !user) {
      setIsLoading(false)
      return
    }

    fetchPrompts()

    // Subscribe to changes
    const supabase = createClient()
    const channel = supabase
      .channel('context_prompts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'context_prompts',
        },
        () => {
          fetchPrompts()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, isGuest, fetchPrompts])

  // Update a prompt
  const updatePrompt = useCallback(async (
    promptId: string,
    updates: Partial<Pick<ContextPrompt, 'name' | 'content' | 'is_enabled' | 'position'>>
  ) => {
    // Optimistic update
    const updateList = (list: ContextPrompt[]) =>
      list.map(p => p.id === promptId ? { ...p, ...updates, updated_at: new Date().toISOString() } : p)
    setGlobalPrompts(updateList)
    setPersonalPrompts(updateList)

    const supabase = createClient()
    const { error } = await supabase
      .from('context_prompts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', promptId)

    if (error) {
      console.error('Error updating prompt:', error)
      // Revert on error
      fetchPrompts()
      throw error
    }
  }, [fetchPrompts])

  // Toggle prompt enabled state
  const togglePrompt = useCallback(async (promptId: string, enabled: boolean) => {
    await updatePrompt(promptId, { is_enabled: enabled })
  }, [updatePrompt])

  // Add a personal prompt
  const addPersonalPrompt = useCallback(async (name: string, content: string) => {
    if (!user) return null

    // Optimistic update with temp ID
    const tempId = `temp-${Date.now()}`
    const tempPrompt: ContextPrompt = {
      id: tempId,
      name,
      content,
      is_global: false,
      user_id: user.id,
      is_enabled: true,
      position: personalPrompts.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setPersonalPrompts(prev => [...prev, tempPrompt])

    const supabase = createClient()
    const { data, error } = await supabase
      .from('context_prompts')
      .insert({
        name,
        content,
        is_global: false,
        user_id: user.id,
        is_enabled: true,
        position: personalPrompts.length,
      })
      .select()
      .single()

    if (error) {
      console.error('Error adding personal prompt:', error)
      // Revert on error
      setPersonalPrompts(prev => prev.filter(p => p.id !== tempId))
      throw error
    }

    // Replace temp with real data
    setPersonalPrompts(prev => prev.map(p => p.id === tempId ? data : p))

    return data
  }, [user, personalPrompts.length])

  // Delete a prompt (only personal prompts can be deleted by users)
  const deletePrompt = useCallback(async (promptId: string) => {
    // Store for potential revert
    const deletedPrompt = personalPrompts.find(p => p.id === promptId)

    // Optimistic delete
    setPersonalPrompts(prev => prev.filter(p => p.id !== promptId))

    const supabase = createClient()
    const { error } = await supabase
      .from('context_prompts')
      .delete()
      .eq('id', promptId)

    if (error) {
      console.error('Error deleting prompt:', error)
      // Revert on error
      if (deletedPrompt) {
        setPersonalPrompts(prev => [...prev, deletedPrompt])
      }
      throw error
    }
  }, [personalPrompts])

  // Get combined enabled context for system prompt
  const getEnabledContext = useCallback(() => {
    const enabledGlobal = globalPrompts.filter(p => p.is_enabled)
    const enabledPersonal = personalPrompts.filter(p => p.is_enabled)
    const allEnabled = [...enabledGlobal, ...enabledPersonal]

    if (allEnabled.length === 0) return ''

    return allEnabled
      .map(p => `## ${p.name}\n\n${p.content}`)
      .join('\n\n---\n\n')
  }, [globalPrompts, personalPrompts])

  return {
    globalPrompts,
    personalPrompts,
    isLoading,
    updatePrompt,
    togglePrompt,
    addPersonalPrompt,
    deletePrompt,
    getEnabledContext,
    refetch: fetchPrompts,
  }
}
