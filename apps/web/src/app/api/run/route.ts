import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { z } from 'zod'

const createRunSchema = z.object({
  projectId: z.string().uuid(),
  label: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId, label } = createRunSchema.parse(body)

    const supabase = createServerClient()

    // Verify project exists
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    // Create new run
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert([{
        project_id: projectId,
        label: label || `Run ${new Date().toISOString()}`,
        status: 'queued',
        meta: {}
      }])
      .select()
      .single()

    if (runError) {
      console.error('Error creating run:', runError)
      return NextResponse.json(
        { error: 'Failed to create run' },
        { status: 500 }
      )
    }

    return NextResponse.json({ runId: run.id })
  } catch (error) {
    console.error('API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
