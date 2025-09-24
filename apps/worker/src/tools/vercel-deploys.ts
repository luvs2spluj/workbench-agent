import { config } from '../config'
import { createRunLogger } from '../logger'

export interface VercelDeployment {
  uid: string
  url: string
  state: string
  created: number
  source?: string
}

export interface VercelDeploysResult {
  deployments: VercelDeployment[]
  total: number
}

export const vercelDeploysTool = async (runId: string, projectName?: string): Promise<VercelDeploysResult> => {
  const logger = createRunLogger(runId)
  
  await logger.info('Starting Vercel deployments analysis', { projectName })

  if (!config.VERCEL_TOKEN) {
    await logger.warn('Vercel token not provided, returning empty results')
    return {
      deployments: [],
      total: 0
    }
  }

  try {
    await logger.info('Fetching deployments from Vercel API')

    const response = await fetch('https://api.vercel.com/v6/deployments', {
      headers: {
        'Authorization': `Bearer ${config.VERCEL_TOKEN}`,
        'User-Agent': 'Agent-WorkBench',
      },
    })

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const deployments = data.deployments || []

    // Filter by project name if provided
    const filteredDeployments = projectName 
      ? deployments.filter((d: any) => d.name?.includes(projectName))
      : deployments.slice(0, 10) // Limit to 10 most recent

    const result = {
      deployments: filteredDeployments.map((d: any) => ({
        uid: d.uid,
        url: d.url,
        state: d.state,
        created: d.created,
        source: d.source
      })),
      total: filteredDeployments.length
    }

    await logger.info('Vercel deployments analysis completed', { 
      total: result.total,
      states: result.deployments.reduce((acc: any, d) => {
        acc[d.state] = (acc[d.state] || 0) + 1
        return acc
      }, {})
    })

    return result

  } catch (error) {
    await logger.error('Failed to fetch Vercel deployments', { error: error.message })
    
    return {
      deployments: [],
      total: 0
    }
  }
}
