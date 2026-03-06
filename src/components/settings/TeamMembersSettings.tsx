'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Link as LinkIcon, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TeamMember } from '@/lib/tracker/types'

interface TeamMembersSettingsProps {
  initialMembers: TeamMember[]
  currentUserId: string | null
}

export function TeamMembersSettings({ initialMembers, currentUserId }: TeamMembersSettingsProps) {
  const [members, setMembers] = useState(initialMembers)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function fetchMembers() {
    const res = await fetch('/api/team-members')
    if (res.ok) setMembers(await res.json())
  }

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)

    const res = await fetch('/api/team-members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: newName.trim(), email: newEmail.trim() || null }),
    })

    if (res.ok) {
      setNewName('')
      setNewEmail('')
      fetchMembers()
    }
    setAdding(false)
  }

  async function handleLinkAccount(memberId: string) {
    if (!currentUserId) return
    setLinkingId(memberId)

    const res = await fetch(`/api/team-members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: currentUserId }),
    })

    if (res.ok) fetchMembers()
    setLinkingId(null)
  }

  async function handleDelete(memberId: string) {
    setDeletingId(memberId)
    const res = await fetch(`/api/team-members/${memberId}`, { method: 'DELETE' })
    if (res.ok) fetchMembers()
    setDeletingId(null)
  }

  const isCurrentUserLinked = members.some(m => m.user_id === currentUserId)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Team Members</h2>
        <p className="text-[13px] text-zinc-400 mt-1">
          Manage who can be assigned action items. Link your account to claim your profile.
        </p>
      </div>

      {/* Members list */}
      <div className="space-y-2">
        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-[#16162a] border border-zinc-200 dark:border-[#2a2a40] rounded-lg"
          >
            <div className="flex items-center gap-3">
              {member.avatar_url ? (
                <img src={member.avatar_url} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-nodiac-primary flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {member.display_name[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <div className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                  {member.display_name}
                </div>
                {member.email && (
                  <div className="text-[11px] text-zinc-400">{member.email}</div>
                )}
              </div>
              {member.user_id && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                  Linked
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Link account button — show if this member isn't linked and current user isn't linked elsewhere */}
              {!member.user_id && currentUserId && !isCurrentUserLinked && (
                <button
                  type="button"
                  onClick={() => handleLinkAccount(member.id)}
                  disabled={linkingId === member.id}
                  className="flex items-center gap-1 text-[11px] text-nodiac-secondary hover:text-nodiac-secondary/80 transition-colors cursor-pointer"
                >
                  {linkingId === member.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <LinkIcon className="w-3 h-3" />
                  )}
                  Link my account
                </button>
              )}

              <button
                type="button"
                onClick={() => handleDelete(member.id)}
                disabled={deletingId === member.id}
                className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                {deletingId === member.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new member */}
      <div className="p-4 bg-white dark:bg-[#16162a] border border-dashed border-zinc-300 dark:border-[#2a2a40] rounded-lg">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400 mb-3">
          Add Team Member
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-[11px] text-zinc-500">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              placeholder="e.g. Eric"
              className="w-full text-[13px] bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-nodiac-secondary"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[11px] text-zinc-500">Email (optional)</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              placeholder="eric@nodiac.com"
              className="w-full text-[13px] bg-transparent text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-nodiac-secondary"
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
            className={cn(
              'flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded transition-colors cursor-pointer',
              newName.trim()
                ? 'bg-nodiac-secondary/20 text-nodiac-secondary hover:bg-nodiac-secondary/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
            )}
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
