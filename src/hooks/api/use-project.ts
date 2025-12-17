'use client'

import { useState, useEffect } from 'react'
import { getProject } from '@/actions/projects'
import type { ProjectWithRelations } from '@/types'

export function useProject(projectId: string) {
  const [project, setProject] = useState<ProjectWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      const result = await getProject(projectId)
      if (result.success) {
        setProject(result.data || null)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch project')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [projectId])

  return {
    project,
    loading,
    error,
    refetch: fetchProject,
  }
}