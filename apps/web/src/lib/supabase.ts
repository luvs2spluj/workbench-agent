import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key (for API routes only)
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey)
}

// Database types
export interface Project {
  id: string
  name: string
  repo_url?: string
  created_at: string
}

export interface Run {
  id: string
  project_id: string
  label?: string
  status: 'queued' | 'running' | 'success' | 'error'
  started_at: string
  finished_at?: string
  meta: Record<string, any>
}

export interface Log {
  id: number
  run_id: string
  level: string
  ts: string
  source?: string
  message?: string
  data?: Record<string, any>
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

export interface Cost {
  id: number
  run_id: string
  provider?: string
  input_tokens: number
  output_tokens: number
  usd: number
  ts: string
}

export interface Artifact {
  id: string
  run_id: string
  node_id?: string
  kind?: string
  url?: string
  blob?: ArrayBuffer
  meta?: Record<string, any>
  created_at: string
}
