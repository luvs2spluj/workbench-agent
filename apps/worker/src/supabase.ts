import { createClient } from '@supabase/supabase-js'
import { config } from './config'

export const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)

// Database types
export interface Run {
  id: string
  project_id: string
  label?: string
  status: 'queued' | 'running' | 'success' | 'error'
  started_at: string
  finished_at?: string
  meta: Record<string, any>
}

export interface Project {
  id: string
  name: string
  repo_url?: string
  created_at: string
}

export interface GraphNode {
  id: string
  run_id: string
  type?: string
  label?: string
  state?: Record<string, any>
  pos?: Record<string, any>
}

export interface GraphEdge {
  id: string
  run_id: string
  from_id: string
  to_id: string
  label?: string
  state?: Record<string, any>
}

export interface Log {
  run_id: string
  level: string
  source?: string
  message?: string
  data?: Record<string, any>
}

export interface Cost {
  run_id: string
  provider?: string
  input_tokens: number
  output_tokens: number
  usd: number
}
