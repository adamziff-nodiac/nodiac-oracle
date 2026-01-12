'use client'

import { Message, PERSPECTIVES } from '@/types'
import { cn, formatTimestamp } from '@/lib/utils'

type ChatMessageProps = {
  message: Message
}

const perspectiveIcons: Record<string, string> = {
  hyperscaler: '🏢',
  techvc: '💰',
  utility: '⚡',
  renewables: '🌱',
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const perspective = message.perspective
    ? PERSPECTIVES.find(p => p.id === message.perspective)
    : null

  return (
    <div
      data-testid={`message-${message.id}`}
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-nodiac-primary text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        )}
      >
        {!isUser && perspective && (
          <div className="flex items-center gap-1.5 mb-1.5 text-xs text-gray-500">
            <span>{perspectiveIcons[perspective.id]}</span>
            <span className="font-medium">{perspective.name}</span>
          </div>
        )}
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        <div
          className={cn(
            'text-xs mt-1.5',
            isUser ? 'text-white/70' : 'text-gray-400'
          )}
        >
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
    </div>
  )
}
