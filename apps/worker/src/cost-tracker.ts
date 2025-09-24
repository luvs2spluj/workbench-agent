import { supabase } from './supabase'
import logger from './logger'

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  provider: string
}

// Rough pricing estimates (as of late 2024)
const PRICING = {
  'openai-gpt-4': {
    input: 0.03 / 1000,   // $0.03 per 1K tokens
    output: 0.06 / 1000,  // $0.06 per 1K tokens
  },
  'openai-gpt-3.5-turbo': {
    input: 0.001 / 1000,  // $0.001 per 1K tokens
    output: 0.002 / 1000, // $0.002 per 1K tokens
  },
  'anthropic-claude-3': {
    input: 0.015 / 1000,  // $0.015 per 1K tokens
    output: 0.075 / 1000, // $0.075 per 1K tokens
  },
} as const

export const recordCost = async (runId: string, usage: TokenUsage) => {
  try {
    const pricing = PRICING[usage.provider as keyof typeof PRICING]
    if (!pricing) {
      logger.warn(`Unknown provider pricing: ${usage.provider}`)
      return
    }

    const cost = (usage.inputTokens * pricing.input) + (usage.outputTokens * pricing.output)

    const { error } = await supabase.from('costs').insert([{
      run_id: runId,
      provider: usage.provider,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      usd: cost,
    }])

    if (error) {
      logger.error('Failed to record cost:', error)
    } else {
      logger.info(`Recorded cost: $${cost.toFixed(4)} for ${usage.inputTokens + usage.outputTokens} tokens`)
    }
  } catch (error) {
    logger.error('Error recording cost:', error)
  }
}

export const createCostTracker = (runId: string) => ({
  recordUsage: (usage: TokenUsage) => recordCost(runId, usage)
})
