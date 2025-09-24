import pino from 'pino'
import { supabase } from './supabase'

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    },
  },
})

export const createRunLogger = (runId: string) => {
  return {
    info: async (message: string, data?: any) => {
      logger.info({ runId, message, data })
      await logToDatabase(runId, 'info', 'worker', message, data)
    },
    error: async (message: string, data?: any) => {
      logger.error({ runId, message, data })
      await logToDatabase(runId, 'error', 'worker', message, data)
    },
    warn: async (message: string, data?: any) => {
      logger.warn({ runId, message, data })
      await logToDatabase(runId, 'warn', 'worker', message, data)
    },
    debug: async (message: string, data?: any) => {
      logger.debug({ runId, message, data })
      await logToDatabase(runId, 'debug', 'worker', message, data)
    },
  }
}

const logToDatabase = async (
  runId: string,
  level: string,
  source: string,
  message: string,
  data?: any
) => {
  try {
    await supabase.from('logs').insert([{
      run_id: runId,
      level,
      source,
      message,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    }])
  } catch (error) {
    logger.error('Failed to log to database:', error)
  }
}

export default logger
