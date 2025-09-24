import dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables
dotenv.config({ path: '../../.env' })
dotenv.config({ path: '../../.env.local' })

const configSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GITHUB_TOKEN: z.string().optional(),
  VERCEL_TOKEN: z.string().optional(),
  NODE_ENV: z.string().default('development'),
  POLL_INTERVAL_MS: z.string().transform(Number).default('5000'),
})

export const config = configSchema.parse({
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  VERCEL_TOKEN: process.env.VERCEL_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
  POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS,
})
