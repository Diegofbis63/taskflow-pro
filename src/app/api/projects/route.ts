import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { db } from '@/lib/db'

// Middleware para verificar autenticación
async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    const cookieToken = request.cookies.get('auth-token')?.value
    if (!cookieToken) {
      return null
    }
    return verifyToken(cookieToken)
  }
  
  return verifyToken(token)
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user || !db) {
      return NextResponse.json({ projects: [] })
    }

    const projects = await db.project.findMany({
      where: {
        ownerId: user.userId
      },
        include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ projects: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!user || !db) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, color, priority } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const project = await db.project.create({
      data: {
        title,
        description,
        color: color || '#3B82F6',
        priority: priority || 'MEDIUM',
        ownerId: user.userId
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true,
            tasks: true
          }
        }
      }
    })

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Projects POST error:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}