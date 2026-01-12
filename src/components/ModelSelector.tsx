'use client'

import { AIModel, AI_MODELS } from '@/types'
import { cn } from '@/lib/utils'

type ModelSelectorProps = {
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  const groupedModels = AI_MODELS.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, AIModel[]>)

  const providerLabels: Record<string, string> = {
    anthropic: 'Anthropic',
    openai: 'OpenAI',
    google: 'Google',
  }

  return (
    <div className="relative">
      <label htmlFor="model-selector" className="block text-sm font-medium text-gray-700 mb-1">
        AI Model
      </label>
      <select
        id="model-selector"
        data-testid="model-selector"
        value={selectedModel.id}
        onChange={(e) => {
          const model = AI_MODELS.find(m => m.id === e.target.value)
          if (model) onModelChange(model)
        }}
        disabled={disabled}
        className={cn(
          'block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5',
          'text-sm text-gray-900 focus:border-nodiac-primary focus:ring-nodiac-primary',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          'cursor-pointer appearance-none'
        )}
      >
        {Object.entries(groupedModels).map(([provider, models]) => (
          <optgroup key={provider} label={providerLabels[provider]}>
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-3">
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
