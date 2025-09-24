'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type Run, type Log, type GraphNode, type GraphEdge, type Cost } from '@/lib/supabase'
import MermaidGraph from '@/components/MermaidGraph'

export default function RunPage() {
  const params = useParams()
  const runId = params.id as string

  const [run, setRun] = useState<Run | null>(null)
  const [logs, setLogs] = useState<Log[]>([])
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])
  const [costs, setCosts] = useState<Cost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!runId) return
    
    fetchData()
    
    // Poll for updates every 3 seconds
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [runId])

  const fetchData = async () => {
    try {
      const [runResult, logsResult, nodesResult, edgesResult, costsResult] = await Promise.all([
        supabase.from('runs').select('*').eq('id', runId).single(),
        supabase.from('logs').select('*').eq('run_id', runId).order('ts', { ascending: false }).limit(50),
        supabase.from('graph_nodes').select('*').eq('run_id', runId),
        supabase.from('graph_edges').select('*').eq('run_id', runId),
        supabase.from('costs').select('*').eq('run_id', runId).order('ts', { ascending: false })
      ])

      if (runResult.data) setRun(runResult.data)
      if (logsResult.data) setLogs(logsResult.data)
      if (nodesResult.data) setNodes(nodesResult.data)
      if (edgesResult.data) setEdges(edgesResult.data)
      if (costsResult.data) setCosts(costsResult.data)
    } catch (error) {
      console.error('Error fetching run data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued': return 'text-yellow-600 bg-yellow-100'
      case 'running': return 'text-blue-600 bg-blue-100'
      case 'success': return 'text-green-600 bg-green-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const totalCost = costs.reduce((sum, cost) => sum + parseFloat(cost.usd.toString()), 0)
  const totalTokens = costs.reduce((sum, cost) => sum + cost.input_tokens + cost.output_tokens, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading run details...</div>
      </div>
    )
  }

  if (!run) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-red-600">Run not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{run.label || 'Unnamed Run'}</h1>
          <p className="text-muted-foreground">Run ID: {run.id}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(run.status)}`}>
          {run.status.toUpperCase()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Total Cost</h3>
          <p className="text-2xl font-bold">${totalCost.toFixed(4)}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Total Tokens</h3>
          <p className="text-2xl font-bold">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
          <p className="text-2xl font-bold">
            {run.finished_at 
              ? `${Math.round((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000)}s`
              : 'Running...'
            }
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph Visualization */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Execution Graph</h2>
          <MermaidGraph nodes={nodes} edges={edges} />
        </div>

        {/* Logs */}
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Logs ({logs.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="text-sm border-l-2 border-muted pl-3 py-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{new Date(log.ts).toLocaleTimeString()}</span>
                    <span className="bg-muted px-1 rounded">{log.level}</span>
                    {log.source && <span className="bg-muted px-1 rounded">{log.source}</span>}
                  </div>
                  {log.message && <div className="mt-1">{log.message}</div>}
                  {log.data && (
                    <div className="mt-1 text-xs bg-muted p-2 rounded font-mono">
                      {JSON.stringify(log.data, null, 2)}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {costs.length > 0 && (
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Cost Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Provider</th>
                  <th className="text-left py-2">Input Tokens</th>
                  <th className="text-left py-2">Output Tokens</th>
                  <th className="text-left py-2">Cost (USD)</th>
                  <th className="text-left py-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <tr key={cost.id} className="border-b">
                    <td className="py-2">{cost.provider || 'Unknown'}</td>
                    <td className="py-2">{cost.input_tokens.toLocaleString()}</td>
                    <td className="py-2">{cost.output_tokens.toLocaleString()}</td>
                    <td className="py-2">${parseFloat(cost.usd.toString()).toFixed(4)}</td>
                    <td className="py-2">{new Date(cost.ts).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
