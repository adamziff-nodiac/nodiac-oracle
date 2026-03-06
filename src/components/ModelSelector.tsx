'use client'

import { AIModel, AI_MODELS } from '@/types'
import { StyledSelect } from '@/components/ui/StyledSelect'

type ModelSelectorProps = {
  selectedModel: AIModel
  onModelChange: (model: AIModel) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        AI Model
      </label>
      <StyledSelect
        value={selectedModel.id}
        onChange={(val) => {
          const model = AI_MODELS.find(m => m.id === val)
          if (model) onModelChange(model)
        }}
        options={AI_MODELS.map(m => ({ value: m.id, label: m.name }))}
        size="md"
        className={disabled ? 'opacity-50 pointer-events-none' : ''}
      />
    </div>
  )
}
