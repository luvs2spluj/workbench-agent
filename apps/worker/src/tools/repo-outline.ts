import { config } from '../config'
import { createRunLogger } from '../logger'

export interface RepoOutlineResult {
  files: string[]
  structure: Record<string, any>
  readme?: string
}

export const repoOutlineTool = async (runId: string, repoUrl?: string): Promise<RepoOutlineResult> => {
  const logger = createRunLogger(runId)
  
  await logger.info('Starting repo outline analysis', { repoUrl })

  if (!repoUrl) {
    await logger.info('No repo URL provided, using placeholder data')
    return {
      files: [
        'package.json',
        'src/index.ts',
        'src/components/Button.tsx',
        'README.md'
      ],
      structure: {
        src: {
          'index.ts': 'entry point',
          components: {
            'Button.tsx': 'React component'
          }
        },
        'package.json': 'dependencies',
        'README.md': 'documentation'
      },
      readme: 'This is a placeholder README for the repository analysis.'
    }
  }

  if (!config.GITHUB_TOKEN) {
    await logger.warn('GitHub token not provided, using mock data')
    return {
      files: ['package.json', 'src/index.js', 'README.md'],
      structure: { src: ['index.js'], 'package.json': true, 'README.md': true },
      readme: 'Mock repository structure - GitHub token not configured'
    }
  }

  try {
    // Extract owner and repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
    if (!match) {
      throw new Error('Invalid GitHub URL format')
    }

    const [, owner, repo] = match
    const cleanRepo = repo.replace(/\.git$/, '')

    await logger.info('Fetching repository contents from GitHub API', { owner, repo: cleanRepo })

    // Fetch repository contents
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}/contents`,
      {
        headers: {
          'Authorization': `token ${config.GITHUB_TOKEN}`,
          'User-Agent': 'Agent-WorkBench',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    const contents = await response.json()
    const files = contents.map((item: any) => item.name)
    
    // Try to fetch README
    let readme = undefined
    try {
      const readmeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${cleanRepo}/readme`,
        {
          headers: {
            'Authorization': `token ${config.GITHUB_TOKEN}`,
            'User-Agent': 'Agent-WorkBench',
            'Accept': 'application/vnd.github.v3.raw',
          },
        }
      )
      if (readmeResponse.ok) {
        readme = await readmeResponse.text()
      }
    } catch (error) {
      await logger.warn('Could not fetch README', { error: error.message })
    }

    const result = {
      files,
      structure: contents.reduce((acc: any, item: any) => {
        acc[item.name] = item.type
        return acc
      }, {}),
      readme
    }

    await logger.info('Repository outline completed', { fileCount: files.length })
    return result

  } catch (error) {
    await logger.error('Failed to analyze repository', { error: error.message })
    
    // Return fallback data
    return {
      files: ['Error fetching repository'],
      structure: { error: error.message },
      readme: `Error: ${error.message}`
    }
  }
}
