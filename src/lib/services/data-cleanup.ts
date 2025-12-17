import { db } from '@/lib/db'

// Script para limpiar datos antiguos y mantener la base de datos ligera
// Optimizado para el plan gratuito de Neon (500 MB)

export class DataCleanupService {
  // Limpiar actividades antiguas (más de 30 días)
  static async cleanupOldActivities() {
    if (!db) {
      console.log('🧹 Database no disponible - omitiendo limpieza de actividades')
      return
    }

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 30)

      const result = await db.activity.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      console.log(`🧹 Eliminadas ${result.count} actividades antiguas (más de 30 días)`)
      return result.count
    } catch (error) {
      console.error('❌ Error limpiando actividades:', error)
      return 0
    }
  }

  // Limpiar comentarios no utilizados (sin tarea asociada)
  static async cleanupOrphanedComments() {
    if (!db) {
      console.log('🧹 Database no disponible - omitiendo limpieza de comentarios')
      return
    }

    try {
      const result = await db.comment.deleteMany({
        where: {
          task: {
            id: {
              notIn: db.$queryRaw`SELECT DISTINCT id FROM tasks`
            }
          }
        }
      })

      console.log(`🧹 Eliminados ${result.count} comentarios huérfanos`)
      return result.count
    } catch (error) {
      console.error('❌ Error limpiando comentarios:', error)
      return 0
    }
  }

  // Limpiar proyectos vacíos sin actividad reciente
  static async cleanupEmptyProjects() {
    if (!db) {
      console.log('🧹 Database no disponible - omitiendo limpieza de proyectos')
      return
    }

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 90) // 3 meses

      const result = await db.project.deleteMany({
        where: {
          AND: [
            {
              tasks: {
                none: {}
              }
            },
            {
              updatedAt: {
                lt: cutoffDate
              }
            }
          ]
        }
      })

      console.log(`🧹 Eliminados ${result.count} proyectos vacíos (sin actividad por 3 meses)`)
      return result.count
    } catch (error) {
      console.error('❌ Error limpiando proyectos:', error)
      return 0
    }
  }

  // Compactar la base de datos (PostgreSQL específico)
  static async optimizeDatabase() {
    if (!db) {
      console.log('🧹 Database no disponible - omitiendo optimización')
      return
    }

    try {
      // VACUUM recupera espacio y actualiza estadísticas
      await db.$executeRaw`VACUUM ANALYZE`
      console.log('🧹 Base de datos optimizada con VACUUM ANALYZE')
    } catch (error) {
      console.error('❌ Error optimizando base de datos:', error)
    }
  }

  // Ejecutar todo el proceso de limpieza
  static async performFullCleanup() {
    console.log('🧹 Iniciando limpieza completa de datos...')
    
    const startTime = Date.now()
    
    const [
      deletedActivities,
      deletedComments,
      deletedProjects
    ] = await Promise.all([
      this.cleanupOldActivities(),
      this.cleanupOrphanedComments(),
      this.cleanupEmptyProjects()
    ])

    await this.optimizeDatabase()
    
    const totalTime = Date.now() - startTime
    const totalDeleted = deletedActivities + deletedComments + deletedProjects
    
    console.log(`✅ Limpieza completada en ${totalTime}ms:`)
    console.log(`   - Actividades eliminadas: ${deletedActivities}`)
    console.log(`   - Comentarios eliminados: ${deletedComments}`)
    console.log(`   - Proyectos eliminados: ${deletedProjects}`)
    console.log(`   - Total eliminado: ${totalDeleted} registros`)
    
    return {
      deletedActivities,
      deletedComments,
      deletedProjects,
      totalDeleted,
      totalTime
    }
  }

  // Obtener estadísticas de uso de almacenamiento
  static async getStorageStats() {
    if (!db) {
      return {
        totalSize: 'Desconocido',
        tableSizes: []
      }
    }

    try {
      const result = await db.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(table_name) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      ` as Array<{
        schemaname: string
        tablename: string
        size: string
      }>

      return {
        totalSize: result.reduce((acc, row) => acc + ' + row.size, ''),
        tableSizes: result
      }
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error)
      return {
        totalSize: 'Error',
        tableSizes: []
      }
    }
  }
}