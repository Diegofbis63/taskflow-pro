'use client'

import { useState } from 'react'
import { useAuth, useSignIn, useSignUp } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('signup')
  const router = useRouter()
  
  // React Query hooks
  const { data: authData, isLoading: authLoading } = useAuth()
  const signInMutation = useSignIn()
  const signUpMutation = useSignUp()

  const isAuthenticated = !!authData?.user

  // SOLO REDIRIGIR SI HAY SESIÓN ACTIVA Y CARGADA COMPLETAMENTE
  if (isAuthenticated && !authLoading) {
    router.push('/dashboard')
    return null
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    signInMutation.mutate({ email, password })
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const password = formData.get('password') as string
    
    const result = await signUpMutation.mutateAsync({ email, name, password })
    
    if (result.success) {
      // Switch to sign in tab after successful registration
      setTimeout(() => {
        setActiveTab('signin')
      }, 1500)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl mx-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Info */}
        <div className="hidden lg:flex flex-col justify-center space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              TaskFlow Pro
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              Gestión de proyectos a nivel enterprise
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Dashboard en tiempo real</h3>
                <p className="text-gray-600 text-sm">Estadísticas actualizadas al instante</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Kanban Board</h3>
                <p className="text-gray-600 text-sm">Drag & drop para gestión de tareas</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Colaboración en equipo</h3>
                <p className="text-gray-600 text-sm">Trabaja junto con tu equipo</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="secondary">Next.js 16</Badge>
            <Badge variant="secondary">TypeScript</Badge>
            <Badge variant="secondary">PostgreSQL</Badge>
          </div>
        </div>

        {/* Right Panel - Auth Form */}
        <Card className="w-full">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl">Bienvenido</CardTitle>
            <CardDescription>
              {activeTab === 'signup' ? 'Crea tu cuenta para comenzar' : 'Inicia sesión para continuar'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
                <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        name="name"
                        type="text"
                        placeholder="Tu nombre completo"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        placeholder="Crea una contraseña"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={signUpMutation.isPending}
                  >
                    {signUpMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando cuenta...
                      </>
                    ) : (
                      'Crear Cuenta'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="Tu contraseña"
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={signInMutation.isPending}
                  >
                    {signInMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {/* Demo Mode Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Flujo de Registro</p>
                  <p className="text-blue-800">
                    1. Regístrate con tus datos<br/>
                    2. Inicia sesión con las mismas credenciales<br/>
                    3. Accede a tu dashboard personalizado
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}