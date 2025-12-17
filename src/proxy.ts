import { createProxyMiddleware } from 'next-http-proxy-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export default createProxyMiddleware({
  target: process.env.NODE_ENV === 'production' 
    ? 'https://taskflow-pro-git-main-diegofbis63s-projects.vercel.app' 
    : 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: [
    {
      source: '/api/(.*)',
      destination: '/api/$1',
    },
  ],
  onProxyReq: (proxyReq, req, res) => {
    // Handle authentication for API routes
    if (req.url?.startsWith('/api/') && !req.url?.includes('/api/auth/')) {
      const authHeader = req.headers['authorization']
      const token = authHeader?.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : req.cookies?.['auth-token']

      if (token) {
        try {
          const payload = verifyToken(token)
          if (payload) {
            proxyReq.setHeader('x-user-id', payload.userId)
            proxyReq.setHeader('x-user-email', payload.email)
            proxyReq.setHeader('x-user-name', payload.name || '')
            proxyReq.setHeader('x-user-role', payload.role || 'MEMBER')
          }
        } catch (error) {
          console.error('Proxy auth error:', error)
        }
      }
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    // Handle CORS headers
    proxyRes.headers['Access-Control-Allow-Origin'] = '*'
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err)
    
    // Handle authentication errors
    if (req.url?.startsWith('/api/') && !req.url?.includes('/api/auth/')) {
      return res.status(401).json({ error: 'Authentication failed' })
    }
    
    // Handle protected route errors
    if (req.url?.startsWith('/dashboard') || 
        req.url?.startsWith('/projects') || 
        req.url?.startsWith('/tasks') || 
        req.url?.startsWith('/team') ||
        req.url?.startsWith('/analytics')) {
      return res.redirect(302, '/')
    }
    
    res.writeHead(500, {
      'Content-Type': 'text/plain',
    })
    res.end('Proxy Error')
  },
})

// Export additional middleware for client-side routing
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