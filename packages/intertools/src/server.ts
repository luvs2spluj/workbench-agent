#!/usr/bin/env node

import createInterToolsServer from './index'
import { config } from './config'
import pino from 'pino'

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

const startServer = async () => {
  try {
    const app = createInterToolsServer()
    
    const server = app.listen(config.PORT, () => {
      logger.info(`🔧 InterTools server running on port ${config.PORT}`)
      logger.info(`📡 POST /api/messages - receive click-to-chat messages`)
      logger.info(`📋 GET /api/messages - list recent messages`)
      logger.info(`❤️ GET /health - health check`)
    })

    // Graceful shutdown
    const shutdown = (signal: string) => {
      logger.info(`📴 Received ${signal}, shutting down gracefully...`)
      server.close(() => {
        logger.info('✅ InterTools server shutdown complete')
        process.exit(0)
      })
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))

  } catch (error) {
    logger.error('Failed to start InterTools server:', error)
    process.exit(1)
  }
}

startServer()
