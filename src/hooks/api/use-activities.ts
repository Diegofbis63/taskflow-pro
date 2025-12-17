'use client'

import { useState, useEffect } from 'react'
import { getProjectActivities, getTaskActivities, getUserActivities } from '@/actions'
import type { ActivityWithRelations } from '@/types'

export function useActivities(projectId?: string, taskId?: string, userId?: string) {
  const [activities, setActivities] = useState<ActivityWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActivities = async (limit = 50) => {
    try {
      setLoading(true)
      let result

      if (taskId) {
        result = await getTaskActivities(taskId, limit)
      } else if (projectId) {
        result = await getProjectActivities(projectId, limit)
      } else if (userId) {
        result = await getUserActivities(limit)
      }

      if (result?.success) {
        setActivities(result.data || [])
        setError(null)
      } else {
        setError(result?.error || 'Failed to fetch activities')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [projectId, taskId, userId])

  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
  }
}