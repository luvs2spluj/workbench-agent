'use client'

import { useEffect, useState } from 'react'
import { supabase, type Project } from '@/lib/supabase'

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectRepo, setNewProjectRepo] = useState('')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setCreating(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: newProjectName.trim(),
          repo_url: newProjectRepo.trim() || null
        }])
        .select()
        .single()

      if (error) throw error
      
      setProjects([data, ...projects])
      setNewProjectName('')
      setNewProjectRepo('')
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Error creating project')
    } finally {
      setCreating(false)
    }
  }

  const startRun = async (projectId: string) => {
    try {
      const response = await fetch('/api/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          label: `Run ${new Date().toLocaleTimeString()}`
        }),
      })

      if (!response.ok) throw new Error('Failed to start run')
      
      const { runId } = await response.json()
      window.location.href = `/runs/${runId}`
    } catch (error) {
      console.error('Error starting run:', error)
      alert('Error starting run')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading projects...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-4">Projects</h1>
        <p className="text-muted-foreground">
          Create and manage your agentic development projects
        </p>
      </div>

      {/* Create New Project Form */}
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-xl font-semibold mb-4">Create New Project</h2>
        <form onSubmit={createProject} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="My Awesome Project"
              required
            />
          </div>
          <div>
            <label htmlFor="repo" className="block text-sm font-medium mb-2">
              Repository URL (optional)
            </label>
            <input
              type="url"
              id="repo"
              value={newProjectRepo}
              onChange={(e) => setNewProjectRepo(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="https://github.com/username/repo"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Projects</h2>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No projects yet. Create your first project above!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} className="bg-card p-6 rounded-lg border">
                <h3 className="font-semibold text-lg mb-2">{project.name}</h3>
                {project.repo_url && (
                  <p className="text-sm text-muted-foreground mb-4 break-all">
                    {project.repo_url}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-4">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => startRun(project.id)}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Start Run
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
