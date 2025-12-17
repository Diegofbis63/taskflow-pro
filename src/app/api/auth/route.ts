import { NextRequest, NextResponse } from 'next/server'
import { signIn, signUp, signOut, verifyToken } from '@/lib/auth'
import { authRateLimiter } from '@/lib/rate-limit'

// Extraer token de las cookies o headers
function getTokenFromRequest(request: NextRequest): string | null {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Fallback to cookie
  const token = request.cookies.get('auth-token')?.value
  return token || null
}

// Get client identifier for rate limiting
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const userAgent = request.headers.get('user-agent') || ''
  
  // Use forwarded IP + user agent hash as identifier
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  return Buffer.from(`${ip}:${userAgent}`).toString('base64')
}

export async function GET(request: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(request)
    const rateLimitResult = authRateLimiter.isAllowed(clientIdentifier)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': authRateLimiter.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          }
        }
      )
    }

    const token = getTokenFromRequest(request)
    
    if (!token) {
      return NextResponse.json({ user: null })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ 
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role
      }
    })
  } catch (error) {
    console.error('Auth GET error:', error)
    return NextResponse.json({ user: null })
  }
}

export async function POST(request: NextRequest) {
  try {
    const clientIdentifier = getClientIdentifier(request)
    const rateLimitResult = authRateLimiter.isAllowed(clientIdentifier)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many authentication attempts. Please try again later.',
          resetTime: rateLimitResult.resetTime 
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': authRateLimiter.config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimitResult.resetTime?.toString() || '',
          }
        }
      )
    }

    const body = await request.json()
    const { action, ...credentials } = body
    
    // Validate input size
    const contentLength = JSON.stringify(body).length
    if (contentLength > 1024) { // 1KB limit
      return NextResponse.json(
        { error: 'Request too large' },
        { status: 413 }
      )
    }
    
    switch (action) {
      case 'signin':
        const signInResult = await signIn(credentials.email, credentials.password)
        if (signInResult.success && signInResult.token) {
          const response = NextResponse.json(signInResult)
          
          // Set HTTP-only cookie with the token
          response.cookies.set('auth-token', signInResult.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
          })
          
          return response
        }
        return NextResponse.json(signInResult)
        
      case 'signup':
        const signUpResult = await signUp(credentials.email, credentials.name, credentials.password)
        return NextResponse.json(signUpResult)
        
      case 'signout':
        const signOutResult = await signOut()
        if (signOutResult.success) {
          const response = NextResponse.json(signOutResult)
          
          // Clear the auth cookie
          response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
          })
          
          return response
        }
        return NextResponse.json(signOutResult)
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Auth API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}