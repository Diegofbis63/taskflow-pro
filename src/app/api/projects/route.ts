import { NextRequest, NextResponse } from 'next/server'
import { createProject, getProjects, updateProject, deleteProject } from '@/actions/projects'
import { projectRateLimiter } from '@/lib/rate-limit'

// Middleware para verificar autenticación
async function authenticate(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  
  if (!token) {
    const cookieToken = request.cookies.get('auth-token')?.value
    if (!cookieToken) {
      return null
    }
    
    // Import verifyToken here to avoid circular dependencies
    const { verifyToken } = await import('@/lib/auth')
    return verifyToken(cookieToken)
  }
  
  // Import verifyToken here to avoid circular dependencies
  const { verifyToken } = await import('@/lib/auth')
  return verifyToken(token)
}

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip
  const userAgent = request.headers.get('user-agent') || ''
  
  // Use IP + user agent hash as identifier
  return Buffer.from(`${ip}:${userAgent}`).toString('base64')
}

export async function GET(request: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(request)
    const rateLimitResult = projectRateLimiter.isAllowed(clientIdentifier)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': projectRateLimiter.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          }
        }
      )
    }

    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getProjects()
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ projects: result.data })
  } catch (error) {
    console.error('Projects GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(request)
    const rateLimitResult = projectRateLimiter.isAllowed(clientIdentifier)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': projectRateLimiter.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          }
        }
      )
    }

    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = await createProject({ ...body, userId: user.userId })
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Projects POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(request)
    const rateLimitResult = projectRateLimiter.isAllowed(clientIdentifier)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': projectRateLimiter.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          }
        }
      )
    }

    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body
    
    const result = await updateProject(id, data)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error('Projects PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(request)
    const rateLimitResult = projectRateLimiter.isAllowed(clientIdentifier)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': projectRateLimiter.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          }
        }
      )
    }

    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('id')
    
    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    const result = await deleteProject(projectId)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Projects DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}