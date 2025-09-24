import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

export interface InterToolsMessage {
  message: string
  pageUrl?: string
  pageTitle?: string
  userAgent?: string
  htmlContent?: string
  elementInfo?: Record<string, any>
  sessionId?: string
  agentId?: string
  context?: Record<string, any>
}
