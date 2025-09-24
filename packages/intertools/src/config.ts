import dotenv from 'dotenv'
import { z } from 'zod'

// Load environment variables
dotenv.config({ path: '../../.env' })
dotenv.config({ path: '../../.env.local' })

const configSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z.string().default('development'),
})

export const config = configSchema.parse({
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
})
