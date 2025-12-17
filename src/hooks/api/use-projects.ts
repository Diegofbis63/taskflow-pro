'use client'

import { useState, useEffect } from 'react'
import { getProjects, createProject } from '@/actions/projects'
import type { ProjectWithRelations } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const result = await getProjects()
      if (result.success) {
        setProjects(result.data || [])
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch projects')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  const createNewProject = async (data: any) => {
    try {
      const result = await createProject(data)
      if (result.success) {
        await fetchProjects() // Refresh projects
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (err) {
      return { success: false, error: 'Failed to create project' }
    }
  }

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject: createNewProject,
  }
}