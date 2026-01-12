'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message, PERSPECTIVES } from '@/types'
import { cn, formatTimestamp } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

type ChatMessageProps = {
  message: Message
  defaultCollapsed?: boolean
  isStreaming?: boolean
}

const perspectiveIcons: Record<string, string> = {
  hyperscaler: '🏢',
  techvc: '💰',
  utility: '⚡',
  renewables: '🌱',
  gridoperator: '🔌',
  aiinfrastructure: '🤖',
  dcdeveloper: '🏗️',
  energypolicy: '📜',
  siteselection: '📍',
  equipmentsupplier: '⚙️',
}

export function ChatMessage({ message, defaultCollapsed = false, isStreaming = false }: ChatMessageProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const isUser = message.role === 'user'
  const perspective = message.perspective
    ? PERSPECTIVES.find(p => p.id === message.perspective)
    : null

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  // Don't allow collapsing while streaming
  const canCollapse = !isStreaming

  // Get preview text (first line or first 100 chars)
  const getPreview = () => {
    const firstLine = message.content.split('\n')[0]
    const preview = firstLine.length > 100 ? firstLine.substring(0, 100) + '...' : firstLine
    return preview.replace(/^#+\s*/, '').replace(/\*\*/g, '')
  }

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
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md'
        )}
      >
        {!isUser && perspective && (
          <button
            onClick={canCollapse ? toggleCollapse : undefined}
            className={cn(
              "flex items-center gap-1.5 mb-1.5 text-xs text-gray-500 dark:text-gray-400 transition-colors w-full",
              canCollapse && "hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer",
              !canCollapse && "cursor-default"
            )}
          >
            {canCollapse && (isCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            ))}
            {isStreaming && (
              <span className="w-2 h-2 bg-nodiac-primary rounded-full animate-pulse" />
            )}
            <span>{perspectiveIcons[perspective.id]}</span>
            <span className="font-medium">{perspective.name}</span>
            {isStreaming && <span className="text-nodiac-primary ml-1">streaming...</span>}
          </button>
        )}

        {isCollapsed ? (
          <div
            className="text-sm text-gray-500 dark:text-gray-400 italic cursor-pointer"
            onClick={toggleCollapse}
          >
            {getPreview()}
          </div>
        ) : (
          <div className={cn(
            'text-sm prose prose-sm max-w-none',
            isUser ? 'prose-invert' : 'prose-gray dark:prose-invert',
            '[&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5',
            '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-3 [&_h1]:mb-2',
            '[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-2',
            '[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1',
            '[&_code]:bg-gray-200 [&_code]:dark:bg-gray-600 [&_code]:px-1 [&_code]:rounded [&_code]:text-xs',
            '[&_pre]:bg-gray-800 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto',
            '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:dark:border-gray-500 [&_blockquote]:pl-4 [&_blockquote]:italic',
            '[&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:dark:border-gray-500 [&_th]:px-2 [&_th]:py-1 [&_th]:bg-gray-200 [&_th]:dark:bg-gray-600',
            '[&_td]:border [&_td]:border-gray-300 [&_td]:dark:border-gray-500 [&_td]:px-2 [&_td]:py-1'
          )}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        <div
          className={cn(
            'text-xs mt-1.5 flex items-center justify-between',
            isUser ? 'text-white/70' : 'text-gray-400'
          )}
        >
          <span>{formatTimestamp(message.timestamp)}</span>
          {!isUser && !isCollapsed && message.content.length > 200 && (
            <button
              onClick={toggleCollapse}
              className="text-xs hover:underline"
            >
              Collapse
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
