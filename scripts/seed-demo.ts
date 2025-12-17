import { PrismaClient } from '@prisma/client'
import { TaskStatus, Priority, ProjectRole, ActivityType, EntityType } from '@prisma/client'

const db = new PrismaClient()

// Datos de demo optimizados para el plan gratuito de Neon
export async function seedDemoData() {
  try {
    console.log('🌱 Creando datos de demo optimizados...')

    // Usuario demo
    const demoUser = await db.user.upsert({
      where: { email: 'demo@taskflow.pro' },
      update: {},
      create: {
        email: 'demo@taskflow.pro',
        name: 'Usuario Demo',
        role: 'ADMIN',
      }
    })

    // Proyecto demo
    const demoProject = await db.project.upsert({
      where: { id: 'demo-project-1' },
      update: {},
      create: {
        id: 'demo-project-1',
        title: 'Website Redesign',
        description: 'Rediseño completo del sitio web corporativo',
        color: '#3B82F6',
        ownerId: demoUser.id,
      }
    })

    // Añadir miembro demo
    await db.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: demoProject.id,
          userId: demoUser.id
        }
      },
      update: {},
      create: {
        projectId: demoProject.id,
        userId: demoUser.id,
        role: ProjectRole.OWNER,
      }
    })

    // Tareas demo - crearlas individualmente para evitar el error de upsert
    const task1 = await db.task.upsert({
      where: { id: 'task-1' },
      update: {
        title: 'Diseñar landing page',
        description: 'Crear maquetación responsive',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
        position: 0,
        tags: 'diseño,ui',
      },
      create: {
        id: 'task-1',
        title: 'Diseñar landing page',
        description: 'Crear maquetación responsive',
        status: TaskStatus.DONE,
        priority: Priority.HIGH,
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
        position: 0,
        tags: 'diseño,ui',
      }
    })

    const task2 = await db.task.upsert({
      where: { id: 'task-2' },
      update: {
        title: 'Implementar autenticación',
        description: 'Configurar sistema de login',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
        position: 1,
        tags: 'backend,auth',
      },
      create: {
        id: 'task-2',
        title: 'Implementar autenticación',
        description: 'Configurar sistema de login',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.MEDIUM,
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
        position: 1,
        tags: 'backend,auth',
      }
    })

    const task3 = await db.task.upsert({
      where: { id: 'task-3' },
      update: {
        title: 'Configurar base de datos',
        description: 'Setup PostgreSQL con Prisma',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
        position: 2,
        tags: 'backend,db',
      },
      create: {
        id: 'task-3',
        title: 'Configurar base de datos',
        description: 'Setup PostgreSQL con Prisma',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        projectId: demoProject.id,
        creatorId: demoUser.id,
        assigneeId: demoUser.id,
        position: 2,
        tags: 'backend,db',
      }
    })

    // Crear actividades para las tareas completadas
    if (task1.status === TaskStatus.DONE) {
      await db.activity.create({
        data: {
          action: ActivityType.STATUS_CHANGED,
          entityType: EntityType.TASK,
          entityId: task1.id,
          projectId: demoProject.id,
          userId: demoUser.id,
          metadata: {
            oldStatus: 'TODO',
            newStatus: 'DONE',
            taskTitle: task1.title
          }
        }
      })
    }

    console.log('✅ Datos de demo creados exitosamente')
    console.log(`   - 1 usuario: ${demoUser.name}`)
    console.log(`   - 1 proyecto: ${demoProject.title}`)
    console.log(`   - 3 tareas creadas`)
    console.log(`   - Actividades generadas para tareas completadas`)

  } catch (error) {
    console.error('❌ Error creando datos de demo:', error)
    throw error
  } finally {
    await db.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const command = process.argv[2]
  
  if (command === 'seed') {
    await seedDemoData()
  } else {
    console.log('Uso: bun run seed [seed]')
  }
}