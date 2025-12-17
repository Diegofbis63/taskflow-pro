'use client'

import { useState, useEffect, useMemo } from 'react'
import type { TaskFilters } from '@/types'

interface UseFiltersProps {
  initialFilters?: TaskFilters
  onFiltersChange?: (filters: TaskFilters) => void
}

export function useFilters({ initialFilters = {}, onFiltersChange }: UseFiltersProps = {}) {
  const [filters, setFilters] = useState<TaskFilters>(initialFilters)
  const [searchQuery, setSearchQuery] = useState('')

  // Debounced search
  const debouncedSearch = useMemo(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.search) {
        const newFilters = { ...filters, search: searchQuery || undefined }
        setFilters(newFilters)
        onFiltersChange?.(newFilters)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, filters.search, onFiltersChange])

  useEffect(() => {
    return debouncedSearch
  }, [debouncedSearch])

  const updateFilter = useCallback((key: keyof TaskFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }, [filters, onFiltersChange])

  const clearFilters = useCallback(() => {
    const newFilters: TaskFilters = {}
    setFilters(newFilters)
    setSearchQuery('')
    onFiltersChange?.(newFilters)
  }, [onFiltersChange])

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).some(key => {
      const value = filters[key as keyof TaskFilters]
      return value !== undefined && value !== null && value !== ''
    })
  }, [filters])

  const filterCount = useMemo(() => {
    return Object.keys(filters).filter(key => {
      const value = filters[key as keyof TaskFilters]
      return value !== undefined && value !== null && value !== ''
    }).length
  }, [filters])

  return {
    filters,
    searchQuery,
    setSearchQuery,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    filterCount,
  }
}