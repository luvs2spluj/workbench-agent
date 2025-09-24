'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, type Artifact } from '@/lib/supabase'

export default function ArtifactPage() {
  const params = useParams()
  const artifactId = params.id as string

  const [artifact, setArtifact] = useState<Artifact | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!artifactId) return
    fetchArtifact()
  }, [artifactId])

  const fetchArtifact = async () => {
    try {
      const { data, error } = await supabase
        .from('artifacts')
        .select('*')
        .eq('id', artifactId)
        .single()

      if (error) throw error
      setArtifact(data)
    } catch (error) {
      console.error('Error fetching artifact:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const renderContent = () => {
    if (!artifact) return null

    // If there's a URL, show it as a link
    if (artifact.url) {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">External Resource</h3>
            <a
              href={artifact.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {artifact.url}
            </a>
          </div>
        </div>
      )
    }

    // If there's blob data, try to render it based on kind
    if (artifact.blob) {
      const decoder = new TextDecoder()
      const content = decoder.decode(artifact.blob)

      switch (artifact.kind?.toLowerCase()) {
        case 'html':
          return (
            <div className="space-y-4">
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-medium mb-2">HTML Preview</h3>
                <iframe
                  srcDoc={content}
                  className="w-full h-96 border rounded"
                  sandbox="allow-same-origin"
                />
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-medium mb-2">HTML Source</h3>
                <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                  <code>{content}</code>
                </pre>
              </div>
            </div>
          )

        case 'json':
          try {
            const parsed = JSON.parse(content)
            return (
              <div className="bg-card p-4 rounded-lg border">
                <h3 className="font-medium mb-2">JSON Data</h3>
                <pre className="text-sm bg-muted p-3 rounded overflow-x-auto">
                  <code>{JSON.stringify(parsed, null, 2)}</code>
                </pre>
              </div>
            )
          } catch {
            // Fall through to text rendering
          }

        case 'text':
        default:
          return (
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-medium mb-2">Text Content</h3>
              <pre className="text-sm bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">
                {content}
              </pre>
            </div>
          )
      }
    }

    return (
      <div className="text-center py-8 text-muted-foreground">
        No content available for this artifact
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading artifact...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-red-600">Error loading artifact</div>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  if (!artifact) {
    return (
      <div className="text-center py-8">
        <div className="text-lg text-red-600">Artifact not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Artifact Details</h1>
        <p className="text-muted-foreground">ID: {artifact.id}</p>
      </div>

      {/* Metadata */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">Metadata</h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Kind</dt>
            <dd className="mt-1">{artifact.kind || 'Unknown'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Created</dt>
            <dd className="mt-1">{new Date(artifact.created_at).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Run ID</dt>
            <dd className="mt-1">
              <a href={`/runs/${artifact.run_id}`} className="text-primary hover:underline">
                {artifact.run_id}
              </a>
            </dd>
          </div>
          {artifact.node_id && (
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Node ID</dt>
              <dd className="mt-1 font-mono text-sm">{artifact.node_id}</dd>
            </div>
          )}
        </dl>

        {artifact.meta && Object.keys(artifact.meta).length > 0 && (
          <div className="mt-4">
            <dt className="text-sm font-medium text-muted-foreground mb-2">Additional Metadata</dt>
            <dd className="bg-muted p-3 rounded">
              <pre className="text-sm">
                {JSON.stringify(artifact.meta, null, 2)}
              </pre>
            </dd>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Content</h2>
        {renderContent()}
      </div>
    </div>
  )
}
