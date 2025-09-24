import { supabase, type Run, type Project } from './supabase'
import { config } from './config'
import logger, { createRunLogger } from './logger'
import { executeGraph } from './graph-executor'

class WorkerService {
  private isRunning = false
  private currentRunId: string | null = null

  async start() {
    logger.info('🚀 Worker service starting...', { 
      pollInterval: config.POLL_INTERVAL_MS,
      nodeEnv: config.NODE_ENV
    })

    this.isRunning = true

    // Graceful shutdown handling
    process.on('SIGINT', () => this.shutdown('SIGINT'))
    process.on('SIGTERM', () => this.shutdown('SIGTERM'))

    // Start polling loop
    this.pollLoop()
  }

  private async pollLoop() {
    while (this.isRunning) {
      try {
        await this.processQueuedRuns()
      } catch (error) {
        logger.error('Error in poll loop:', error)
      }

      // Wait before next poll
      await this.sleep(config.POLL_INTERVAL_MS)
    }
  }

  private async processQueuedRuns() {
    // Find queued runs
    const { data: runs, error } = await supabase
      .from('runs')
      .select(`
        *,
        projects (*)
      `)
      .eq('status', 'queued')
      .order('started_at', { ascending: true })
      .limit(1)

    if (error) {
      logger.error('Failed to fetch queued runs:', error)
      return
    }

    if (!runs || runs.length === 0) {
      return // No queued runs
    }

    const run = runs[0] as Run & { projects: Project }
    await this.processRun(run, run.projects)
  }

  private async processRun(run: Run, project: Project) {
    const runLogger = createRunLogger(run.id)
    this.currentRunId = run.id

    try {
      await runLogger.info('Processing run', { 
        runId: run.id,
        projectName: project.name,
        label: run.label
      })

      // Update run status to running
      const { error: updateError } = await supabase
        .from('runs')
        .update({ status: 'running' })
        .eq('id', run.id)

      if (updateError) {
        throw new Error(`Failed to update run status: ${updateError.message}`)
      }

      // Execute the graph
      await executeGraph(run, project)

      // Mark run as successful
      const { error: successError } = await supabase
        .from('runs')
        .update({ 
          status: 'success',
          finished_at: new Date().toISOString()
        })
        .eq('id', run.id)

      if (successError) {
        logger.error('Failed to mark run as successful:', successError)
      }

      await runLogger.info('Run completed successfully')

    } catch (error) {
      await runLogger.error('Run failed', { error: error.message })

      // Mark run as failed
      const { error: failError } = await supabase
        .from('runs')
        .update({ 
          status: 'error',
          finished_at: new Date().toISOString(),
          meta: { 
            ...run.meta,
            error: error.message 
          }
        })
        .eq('id', run.id)

      if (failError) {
        logger.error('Failed to mark run as failed:', failError)
      }
    } finally {
      this.currentRunId = null
    }
  }

  private async shutdown(signal: string) {
    logger.info(`📴 Received ${signal}, shutting down gracefully...`)
    this.isRunning = false

    if (this.currentRunId) {
      logger.info(`⏳ Waiting for current run ${this.currentRunId} to complete...`)
      // In a production system, you might want to implement a timeout here
      while (this.currentRunId) {
        await this.sleep(1000)
      }
    }

    logger.info('✅ Worker service shutdown complete')
    process.exit(0)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Start the worker service
const worker = new WorkerService()
worker.start().catch((error) => {
  logger.error('Failed to start worker service:', error)
  process.exit(1)
})
