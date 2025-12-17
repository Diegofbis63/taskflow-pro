'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Lazy load heavy components
const TaskDetailDialog = dynamic(() => import('@/components/task/task-detail-dialog').then(mod => ({ default: mod.TaskDetailDialog })), {
  loading: () => <Card><CardContent className="p-4"><Skeleton className="h-4 w-full" /></CardContent></Card>,
  ssr: false
})

const CreateTaskDialog = dynamic(() => import('@/components/task/create-task-dialog').then(mod => ({ default: mod.CreateTaskDialog })), {
  loading: () => <Skeleton className="h-10 w-32" />,
  ssr: false
})

const TaskFilters = dynamic(() => import('@/components/task/task-filters').then(mod => ({ default: mod.TaskFilters })), {
  loading: () => <Skeleton className="h-20 w-full" />,
  ssr: false
})

// Chart components (if you add analytics)
const ProjectChart = dynamic(() => import('@/components/analytics/project-chart').then(mod => ({ default: mod.ProjectChart })), {
  loading: () => <Skeleton className="h-64 w-full" />,
  ssr: false
})

export { TaskDetailDialog, CreateTaskDialog, TaskFilters, ProjectChart }