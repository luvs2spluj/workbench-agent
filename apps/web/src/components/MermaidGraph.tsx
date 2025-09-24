'use client'

import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'
import { type GraphNode, type GraphEdge } from '@/lib/supabase'

interface MermaidGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export default function MermaidGraph({ nodes, edges }: MermaidGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
    })
  }, [])

  useEffect(() => {
    if (!containerRef.current || nodes.length === 0) return

    // Generate Mermaid diagram syntax
    let diagram = 'graph TD\n'
    
    // Add nodes
    nodes.forEach((node) => {
      const nodeId = node.id.replace(/-/g, '_')
      const label = node.label || node.type || 'Node'
      const stateColor = node.state?.status === 'completed' ? 'fill:#90EE90' : 
                        node.state?.status === 'running' ? 'fill:#FFE4B5' :
                        node.state?.status === 'error' ? 'fill:#FFB6C1' : 'fill:#E6E6FA'
      
      diagram += `    ${nodeId}["${label}"]\n`
      diagram += `    class ${nodeId} ${node.state?.status || 'pending'}\n`
    })

    // Add edges
    edges.forEach((edge) => {
      const fromId = edge.from_id.replace(/-/g, '_')
      const toId = edge.to_id.replace(/-/g, '_')
      const label = edge.label ? `|${edge.label}|` : ''
      diagram += `    ${fromId} -->${label} ${toId}\n`
    })

    // Add class definitions for styling
    diagram += `
    classDef completed fill:#90EE90,stroke:#333,stroke-width:2px
    classDef running fill:#FFE4B5,stroke:#333,stroke-width:2px
    classDef error fill:#FFB6C1,stroke:#333,stroke-width:2px
    classDef pending fill:#E6E6FA,stroke:#333,stroke-width:2px
    `

    // Clear previous content
    containerRef.current.innerHTML = ''

    // Render the diagram
    mermaid.render('mermaid-graph', diagram).then(({ svg }) => {
      if (containerRef.current) {
        containerRef.current.innerHTML = svg
      }
    }).catch((error) => {
      console.error('Mermaid render error:', error)
      if (containerRef.current) {
        containerRef.current.innerHTML = `<div class="text-red-500 text-sm">Error rendering graph: ${error.message}</div>`
      }
    })
  }, [nodes, edges])

  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No graph data available yet...
      </div>
    )
  }

  return (
    <div className="w-full">
      <div ref={containerRef} className="mermaid-container" />
    </div>
  )
}
