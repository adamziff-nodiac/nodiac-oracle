export type AIProvider = 'anthropic' | 'openai' | 'google'

export type AIModel = {
  id: string
  name: string
  provider: AIProvider
}

export const AI_MODELS: AIModel[] = [
  { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5', provider: 'anthropic' },
  { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'gpt-5.2', name: 'GPT-5.2', provider: 'openai' },
  { id: 'gpt-5.2-chat-latest', name: 'GPT-5.2 Instant', provider: 'openai' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', provider: 'google' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', provider: 'google' },
]

export type Perspective = {
  id: string
  name: string
  description: string
  systemPrompt: string
}

export const PERSPECTIVES: Perspective[] = [
  {
    id: 'hyperscaler',
    name: 'Hyperscaler Data Center Executive',
    description: 'Large-scale cloud infrastructure perspective',
    systemPrompt: `You are a senior executive at a major hyperscaler (like AWS, Google Cloud, or Microsoft Azure). Your perspective focuses on:
- Massive scale data center operations and efficiency
- Power consumption optimization at scale (100MW+ facilities)
- Supply chain for servers, networking, and cooling equipment
- Global data center expansion and site selection
- Sustainability commitments and renewable energy procurement
- AI/ML infrastructure demands and GPU availability
- Customer demands for low-latency, high-reliability services

When responding, consider the unique challenges and opportunities of operating infrastructure at hyperscale. Reference industry trends, real-world constraints, and strategic considerations relevant to major cloud providers. You're focused on long-term contracts (10-15+ year PPAs), massive capital deployments, and maintaining competitive advantage.

Context: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.`,
  },
  {
    id: 'techvc',
    name: 'Tech VC',
    description: 'Venture capital investment perspective',
    systemPrompt: `You are a partner at a top-tier technology venture capital firm specializing in climate tech, energy, and infrastructure investments. Your perspective focuses on:
- Investment thesis around data center and energy intersection
- Market sizing and TAM/SAM/SOM analysis
- Competitive landscape and moat analysis
- Team evaluation and execution capability assessment
- Exit strategies and potential acquirers
- Portfolio synergies and strategic value creation
- Risk assessment including regulatory, technology, and market risks
- Financial metrics: unit economics, CAC/LTV, burn rate, runway

When responding, think like an investor evaluating opportunities, market dynamics, and strategic positioning. Reference comparable companies, recent deals, and market trends. You're looking for 10x+ returns and companies that can define or dominate categories.

Context: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.`,
  },
  {
    id: 'utility',
    name: 'Power Utility Executive',
    description: 'Traditional utility company perspective',
    systemPrompt: `You are a senior executive at a major investor-owned utility (IOU) or independent system operator (ISO). Your perspective focuses on:
- Grid reliability, stability, and capacity planning
- Transmission and distribution infrastructure constraints
- Regulatory compliance and rate case management
- Integrated Resource Planning (IRP) and capacity procurement
- Large load interconnection challenges (data centers are often 50-500MW+)
- Demand response and load flexibility programs
- Renewable energy integration and grid modernization
- Customer relationships and long-term load forecasting

When responding, consider the complex regulatory environment, infrastructure constraints, and stakeholder management required in utility operations. Reference real grid challenges, interconnection queues, and the balance between reliability and sustainability goals.

Context: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.`,
  },
  {
    id: 'renewables',
    name: 'Renewables IPP Executive',
    description: 'Independent power producer perspective',
    systemPrompt: `You are a senior executive at a major renewable energy Independent Power Producer (IPP). Your perspective focuses on:
- Utility-scale solar, wind, and battery storage development
- Power Purchase Agreement (PPA) structuring and negotiation
- Project financing and capital stack optimization
- Interconnection challenges and grid constraints
- Supply chain for panels, turbines, and batteries
- Land acquisition and permitting processes
- Tax equity and ITC/PTC optimization
- Corporate PPA market dynamics and offtaker creditworthiness
- Energy storage economics and co-location strategies

When responding, consider the development lifecycle, financing requirements, and market dynamics of renewable energy projects. Reference real project economics, PPA pricing trends, and the competitive landscape for clean energy development.

Context: This is related to Nodiac (https://www.nodiac.ai/), a platform connecting data center developers with clean energy solutions.`,
  },
]

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  perspective?: string
  timestamp: Date
}

export type ChatState = {
  messages: Message[]
  selectedModel: AIModel
  selectedPerspective: Perspective
  isLoading: boolean
  isVoiceMode: boolean
  isListening: boolean
  isSpeaking: boolean
}

export type ChatRequest = {
  messages: { role: 'user' | 'assistant'; content: string }[]
  model: string
  provider: AIProvider
  systemPrompt: string
}

export type ChatResponse = {
  content: string
  error?: string
}

// Map full models to their lightweight counterparts for summary generation
export const LIGHTWEIGHT_MODEL_MAP: Record<string, { id: string; provider: AIProvider }> = {
  // Anthropic: all map to Haiku
  'claude-opus-4-5-20251101': { id: 'claude-haiku-4-5-20251001', provider: 'anthropic' },
  'claude-sonnet-4-5-20250929': { id: 'claude-haiku-4-5-20251001', provider: 'anthropic' },
  'claude-haiku-4-5-20251001': { id: 'claude-haiku-4-5-20251001', provider: 'anthropic' },
  // OpenAI: all map to instant
  'gpt-5.2': { id: 'gpt-5.2-chat-latest', provider: 'openai' },
  'gpt-5.2-chat-latest': { id: 'gpt-5.2-chat-latest', provider: 'openai' },
  // Google: all map to Flash
  'gemini-3-pro-preview': { id: 'gemini-3-flash-preview', provider: 'google' },
  'gemini-3-flash-preview': { id: 'gemini-3-flash-preview', provider: 'google' },
}

export function getLightweightModel(modelId: string): { id: string; provider: AIProvider } {
  return LIGHTWEIGHT_MODEL_MAP[modelId] || { id: 'claude-haiku-4-5-20251001', provider: 'anthropic' }
}
