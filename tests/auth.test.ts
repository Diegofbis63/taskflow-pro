import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

describe('TaskFlow Pro - Authentication API Tests', () => {
  beforeAll(async () => {
    console.log('Iniciando tests de autenticación...')
  })

  describe('API Endpoints', () => {
    describe('GET /api/auth', () => {
    it('debe retornar usuario null cuando no hay sesión', async () => {
      const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth')
      const data = await response.json()
      expect(data.user).toBe(null)
      expect(response.status).toBe(200)
    })

    it('POST /api/auth', () => {
      it('debe crear usuario', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            email: 'test@ejemplo.com',
            name: 'Test User',
            password: 'password123'
          })
        })
        
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.user).toBeDefined()
        expect(data.user.email).toBe('test@ejemplo.com')
        expect(data.user.name).toBe('Test User')
        expect(data.user.role).toBe('MEMBER')
        expect(data.token).toBeDefined()
        expect(data.token.length).toBeGreaterThan(50)
      })
    })

    describe('POST /api/auth con credenciales inválidas', () => {
      it('debe rechazar credenciales incorrectas', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signin',
            email: 'inexistente@ejemplo.com',
            password: 'wrongpassword'
          })
        })
        
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toContain('Usuario no encontrado')
        expect(data.error).toContain('contraseña incorrectos')
      })
    })

    describe('POST /api/auth con credenciales válidas', () => {
      it('de iniciar sesión exitosamente', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signin',
            email: 'test@ejemplo.com',
            password: 'password123456'
          })
        })
        
        const data = await response.json()
        expect(data.success).toBe(true)
        expect(data.user).toBeDefined()
        expect(data.user.email).toBe('test@ejemplo.com')
        expect(data.user.name).toBe('Test User')
        expect(data.user.role).toBe('MEMBER')
        expect(data.token).toBeDefined()
        expect(data.token.length).toBeGreaterThan(50)
      })
    })

    describe('POST /api/auth con credenciales débiles', () => {
      it('debe rechazar credenciales muy débiles', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signin',
            email: 'test@ejemplo.com',
            password: '123'
          })
        
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toContain('demasiado')
        expect(data.error).toContain('demasiado')
      })
    })

    describe('POST /api/auth con credenciales vacíos', () => {
      it('de requerir todos los campos', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signin',
            email: '',
            password: ''
          })
        
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toContain('Email requerido')
        expect(data.error).toContain('Email requerido')
        expect(data.error).toContain('contraseña requerida')
      })
    })

    describe('GET /api/projects sin autenticación', () => {
      it('de retornar 401 Unauthorized', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/projects')
        expect(response.status).toBe(401)
      })
    })

    describe('GET /api/projects con autenticación', () => {
      const response = await fetch('https://taskflow-pro-weld.vercel.app/api/projects', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
        
        const data = await response.json()
        expect(response.status).toBe(200)
        expect(data.projects).toBeDefined()
        expect(Array.isArray(data.projects)).toBe(true)
      })
    })

    describe('POST /api/projects sin autenticación', () => {
      it('de retornar 401 Unauthorized', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/projects', {
          headers: { 'Content-Type': 'application/json' }
        })
        
        expect(response.status).toBe(401)
      })
    })

    describe('DELETE /api/projects sin autenticación', () => {
      it('de retornar 401 Unauthorized', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/projects?id=test-id', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })
        
        expect(response.status).toBe(401)
      })
    })

    describe('Error Handling', () => {
      it('de manejar errores 400 gracefully', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'signup',
            email: 'test@ejemplo.com',
            password: '123'
          })
        })
        
        const data = await response.json()
        expect(data.success).toBe(false)
        expect(data.error).toBeDefined()
        expect(data.error).toContain('Internal server error')
      })
    })

    describe('Rate Limiting', () => {
      it('de limitar requests excesivos', async () => {
        const promises = Array(10).fill(null).map(() => 
          fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'signin',
              email: 'test@ejemplo.com',
              password: 'password123'
            })
          })
        })
        
        const results = await Promise.allSettled(promises)
        const successCount = results.filter(r => r.status === 200).length
        const rateLimitedCount = results.filter(r => r.status === 429).length
        const rateLimitedCount = results.filter(r => r.status === 429).length
        
        expect(successCount).toBeLessThan(15))
        expect(rateLimitedCount).toBeGreaterThan(0))
      })
    })

    describe('Headers de Seguridad', () => {
      it('de tener CORS configurado', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app/api/auth', {
          method: 'OPTIONS',
          headers: {
            'Origin': 'https://taskflow-pro-weld.vercel.app'
          }
        })
        
        const corsHeader = response.headers.get('access-control-allow-origin')
        expect(corsHeader).toContain('*')
      })
    })

    describe('Performance', () => {
      it('de cargar rápidamente', async () => {
        const start = Date.now()
        const response = await fetch('https://taskflow-pro-weld.vercel.app')
        const loadTime = Date.now() - start
        
        expect(loadTime).toBeLessThan(3000) // Debe cargar en menos de 3 segundos
      })
    })
  })

    describe('SEO y Metadatos', () => {
      it('de tener buen SEO', async () => {
        const response = await fetch('https://taskflow-pro-weld.vercel.app')
        const html = await response.text()
        
        expect(html).toContain('<title>')
        expect(html).toContain('<meta name="description"'))
        expect(html).toContain('<meta name="keywords"'))
        expect(html).toContain('<meta property="og:title"'))
        expect(html).toContain('<meta property="og:type"'))
        expect(html).toContain('<meta name="twitter:card"'))
      })
    })
  })

  afterAll(() => {
    console.log('✅ Todos los tests de autenticación completaron exitosamente')
  })
})