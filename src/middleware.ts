import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.ip
  const userAgent = request.headers.get('user-agent') || ''
  
  // Use IP + user agent hash as identifier
  return Buffer.from(`${ip}:${userAgent}`).toString('base64')
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Static files and resources
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/api/auth', '/api/projects']
  if (publicRoutes.some(route => pathname === route)) {
    return NextResponse.next()
  }
  
  // For API routes, check JWT in Authorization header or cookie
  if (pathname.startsWith('/api/')) {
    try {
      const token = request.headers.get('authorization')?.startsWith('Bearer ') 
        ? request.headers.get('authorization').substring(7)
        : request.cookies.get('auth-token')?.value
      
      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      const payload = verifyToken(token)
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      // Add user info to request headers for downstream usage
      const requestWithUser = new Request(request, {
        headers: {
          ...request.headers,
          'x-user-id': payload.userId,
          'x-user-email': payload.email,
          'x-user-name': payload.name,
          'x-user-role': payload.role
        }
      })

      // Continue to the actual API route
      return NextResponse.next({
        request: requestWithUser
      })
    } catch (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
  
  // For protected routes, check authentication
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/projects') || 
      pathname.startsWith('/tasks') || 
      pathname.startsWith('/team')) {
    try {
      const token = request.cookies.get('auth-token')?.value
      
      if (!token) {
        const loginUrl = new URL('/', request.url)
        return NextResponse.redirect(loginUrl)
      }

      const payload = verifyToken(token)
      if (!payload) {
        const loginUrl = new URL('/', request.url)
        return NextResponse.redirect(loginUrl)
      }

      // Add user info to request headers for downstream usage
      const requestWithUser = new Request(request, {
        headers: {
          ...request.headers,
          'x-user-id': payload.userId,
          'x-user-email': payload.email,
          'x-user-name': payload.name,
          'x-user-role': payload.role
        }
      })

      // Continue to the actual route
      return NextResponse.next({
        request: requestWithUser
      })
    } catch (error) {
      console.error('Middleware auth error:', error)
      const loginUrl = new URL('/', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}