import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import pino from 'pino'
import { z } from 'zod'
import { supabase, type InterToolsMessage } from './supabase'
import { config } from './config'

const logger = pino({
  level: 'info',
  transport: config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname',
    },
  } : undefined,
})

const messageSchema = z.object({
  message: z.string(),
  pageUrl: z.string().optional(),
  pageTitle: z.string().optional(),
  userAgent: z.string().optional(),
  htmlContent: z.string().optional(),
  elementInfo: z.record(z.any()).optional(),
  sessionId: z.string().optional(),
  agentId: z.string().optional(),
  context: z.record(z.any()).optional(),
})

export const createInterToolsServer = () => {
  const app = express()

  // Middleware
  app.use(cors({
    origin: true, // Allow all origins in development
    credentials: true,
  }))
  app.use(bodyParser.json({ limit: '10mb' }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // Main endpoint for receiving messages
  app.post('/api/messages', async (req, res) => {
    try {
      const body = messageSchema.parse(req.body)
      const { runId } = req.query

      logger.info('Received InterTools message', {
        messageLength: body.message.length,
        pageUrl: body.pageUrl,
        sessionId: body.sessionId,
        runId: runId || 'auto-detect'
      })

      // Determine which run to associate this message with
      let targetRunId = runId as string

      if (!targetRunId) {
        // Find the most recent running run
        const { data: runs, error } = await supabase
          .from('runs')
          .select('id')
          .eq('status', 'running')
          .order('started_at', { ascending: false })
          .limit(1)

        if (error) {
          logger.error('Failed to find running run:', error)
        } else if (runs && runs.length > 0) {
          targetRunId = runs[0].id
          logger.info('Auto-detected target run', { runId: targetRunId })
        }
      }

      if (!targetRunId) {
        logger.warn('No target run found for InterTools message')
        return res.status(400).json({
          error: 'No active run found. Please specify runId in query params or ensure a run is currently active.'
        })
      }

      // Insert log entry
      const { error: logError } = await supabase.from('logs').insert([{
        run_id: targetRunId,
        level: 'info',
        source: 'intertools',
        message: body.message,
        data: {
          pageUrl: body.pageUrl,
          pageTitle: body.pageTitle,
          userAgent: body.userAgent,
          htmlContent: body.htmlContent ? body.htmlContent.substring(0, 1000) + '...' : undefined, // Truncate HTML
          elementInfo: body.elementInfo,
          sessionId: body.sessionId,
          agentId: body.agentId,
          context: body.context,
          timestamp: new Date().toISOString()
        }
      }])

      if (logError) {
        logger.error('Failed to insert log:', logError)
        return res.status(500).json({
          error: 'Failed to record message'
        })
      }

      logger.info('InterTools message recorded successfully', { runId: targetRunId })

      res.json({ 
        ok: true, 
        runId: targetRunId,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logger.error('Error processing InterTools message:', error)

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: error.errors
        })
      }

      res.status(500).json({
        error: 'Internal server error'
      })
    }
  })

  // List recent messages for debugging
  app.get('/api/messages', async (req, res) => {
    try {
      const { runId, limit = '50' } = req.query

      let query = supabase
        .from('logs')
        .select('*')
        .eq('source', 'intertools')
        .order('ts', { ascending: false })
        .limit(parseInt(limit as string))

      if (runId) {
        query = query.eq('run_id', runId)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      res.json({
        messages: data || [],
        count: data?.length || 0
      })

    } catch (error) {
      logger.error('Error fetching messages:', error)
      res.status(500).json({
        error: 'Failed to fetch messages'
      })
    }
  })

  return app
}

export default createInterToolsServer
