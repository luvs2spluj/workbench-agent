import { supabase, type Run, type Project } from './supabase'
import { createRunLogger } from './logger'
import { repoOutlineTool } from './tools/repo-outline'
import { vercelDeploysTool } from './tools/vercel-deploys'
import { llmImproveHTMLTool } from './tools/llm-improve-html'

export interface GraphNode {
  id: string
  type: string
  label: string
  execute: (runId: string, project: Project) => Promise<any>
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  label?: string
}

// Define the execution graph
const createExecutionGraph = (): { nodes: GraphNode[], edges: GraphEdge[] } => {
  const nodes: GraphNode[] = [
    {
      id: 'repo-outline',
      type: 'analysis',
      label: 'Repository Analysis',
      execute: async (runId: string, project: Project) => {
        return await repoOutlineTool(runId, project.repo_url)
      }
    },
    {
      id: 'vercel-deploys',
      type: 'analysis', 
      label: 'Vercel Deployments',
      execute: async (runId: string, project: Project) => {
        return await vercelDeploysTool(runId, project.name)
      }
    },
    {
      id: 'llm-improve-html',
      type: 'generation',
      label: 'LLM HTML Improvement',
      execute: async (runId: string, project: Project) => {
        // Use a simple HTML template for improvement
        const sampleHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>${project.name}</title>
</head>
<body>
    <h1>${project.name}</h1>
    <p>Project repository: ${project.repo_url || 'Not specified'}</p>
    <div>
        <button onclick="alert('Hello from ${project.name}!')">Test Button</button>
    </div>
</body>
</html>
        `.trim()
        
        return await llmImproveHTMLTool(runId, sampleHtml)
      }
    }
  ]

  const edges: GraphEdge[] = [
    {
      id: 'repo-to-vercel',
      from: 'repo-outline',
      to: 'vercel-deploys',
      label: 'analyze'
    },
    {
      id: 'vercel-to-llm',
      from: 'vercel-deploys', 
      to: 'llm-improve-html',
      label: 'enhance'
    }
  ]

  return { nodes, edges }
}

export const executeGraph = async (run: Run, project: Project) => {
  const logger = createRunLogger(run.id)
  const { nodes, edges } = createExecutionGraph()

  try {
    await logger.info('Starting graph execution', { 
      runId: run.id, 
      projectName: project.name,
      nodeCount: nodes.length,
      edgeCount: edges.length
    })

    // Insert graph structure into database
    const nodeInserts = nodes.map(node => ({
      id: `${run.id}-${node.id}`,
      run_id: run.id,
      type: node.type,
      label: node.label,
      state: { status: 'pending' },
      pos: { x: 0, y: 0 }
    }))

    const { error: nodeError } = await supabase
      .from('graph_nodes')
      .insert(nodeInserts)

    if (nodeError) {
      throw new Error(`Failed to insert graph nodes: ${nodeError.message}`)
    }

    const edgeInserts = edges.map(edge => ({
      id: `${run.id}-${edge.id}`,
      run_id: run.id,
      from_id: `${run.id}-${edge.from}`,
      to_id: `${run.id}-${edge.to}`,
      label: edge.label,
      state: {}
    }))

    const { error: edgeError } = await supabase
      .from('graph_edges')
      .insert(edgeInserts)

    if (edgeError) {
      throw new Error(`Failed to insert graph edges: ${edgeError.message}`)
    }

    // Execute nodes in order
    const results: Record<string, any> = {}
    
    for (const node of nodes) {
      const nodeId = `${run.id}-${node.id}`
      
      try {
        await logger.info(`Executing node: ${node.label}`, { nodeId: node.id })
        
        // Update node status to running
        await supabase
          .from('graph_nodes')
          .update({ state: { status: 'running' } })
          .eq('id', nodeId)

        // Execute the node
        const result = await node.execute(run.id, project)
        results[node.id] = result

        // Update node status to completed
        await supabase
          .from('graph_nodes')
          .update({ 
            state: { 
              status: 'completed',
              result: result
            } 
          })
          .eq('id', nodeId)

        await logger.info(`Completed node: ${node.label}`, { 
          nodeId: node.id,
          resultKeys: Object.keys(result || {})
        })

      } catch (nodeError) {
        await logger.error(`Failed to execute node: ${node.label}`, { 
          nodeId: node.id,
          error: nodeError.message 
        })

        // Update node status to error
        await supabase
          .from('graph_nodes')
          .update({ 
            state: { 
              status: 'error',
              error: nodeError.message
            } 
          })
          .eq('id', nodeId)

        // Continue with other nodes rather than failing the entire run
        results[node.id] = { error: nodeError.message }
      }
    }

    await logger.info('Graph execution completed successfully', { 
      resultsCount: Object.keys(results).length 
    })

    return results

  } catch (error) {
    await logger.error('Graph execution failed', { error: error.message })
    throw error
  }
}
