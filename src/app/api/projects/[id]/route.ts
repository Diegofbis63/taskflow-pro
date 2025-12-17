import { NextRequest, NextResponse } from 'next/server'
import { getProject } from '@/actions/projects'
import { verifyToken } from '@/lib/auth'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getProject(params.id)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ project: result.data })
  } catch (error) {
    console.error('Project GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}