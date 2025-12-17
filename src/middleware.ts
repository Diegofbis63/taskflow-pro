import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Static files and resources - exclude them early
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/api/robots') ||
    pathname.startsWith('/api/sitemap')
  ) {
    return NextResponse.next()
  }
  
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/api/auth/login', '/api/auth/register']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // API routes - check JWT
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
      const response = NextResponse.next()
      response.headers.set('x-user-id', payload.userId)
      response.headers.set('x-user-email', payload.email)
      response.headers.set('x-user-name', payload.name || '')
      response.headers.set('x-user-role', payload.role || 'MEMBER')

      return response
    } catch (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
  
  // Protected routes - check authentication
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/projects') || 
      pathname.startsWith('/tasks') || 
      pathname.startsWith('/team') ||
      pathname.startsWith('/analytics')) {
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

      return NextResponse.next()
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