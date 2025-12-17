'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface WeeklyChartProps {
  data: Array<{
    date: Date
    completed: number
  }>
  isLoading?: boolean
}

export function WeeklyTasksChart({ data, isLoading }: WeeklyChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 w-full flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 h-48 w-full rounded-lg"></div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 w-full flex items-center justify-center text-gray-500">
        <p>No hay datos disponibles para el gráfico</p>
      </div>
    )
  }

  // Formatear datos para el gráfico
  const chartData = data.map(item => ({
    day: format(item.date, 'EEE', { locale: es }), // Lun, Mar, Mié...
    fullDay: format(item.date, 'EEEE', { locale: es }), // Lunes, Martes...
    completed: item.completed,
    date: item.date,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">
            {payload[0].payload.fullDay}
          </p>
          <p className="text-sm text-gray-600">
            Tareas completadas: <span className="font-bold text-blue-600">{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  const maxCompleted = Math.max(...data.map(d => d.completed), 1)

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 12 }}
            className="text-gray-600"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            className="text-gray-600"
            domain={[0, Math.ceil(maxCompleted * 1.2)]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="completed" 
            fill="#3B82F6" 
            radius={[4, 4, 0, 0]}
            animationDuration={500}
            className="hover:opacity-80 transition-opacity"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}