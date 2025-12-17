'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { signIn, signUp } from '@/lib/auth'
import Link from 'next/link'

export default function DebugPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        const allUsers = await db.user.findMany()
        console.log('Users in database:', allUsers)
        setUsers(allUsers)
        setTestResult('Database connection successful')
      } catch (error) {
        console.error('Database error:', error)
        setTestResult(`Database error: ${error}`)
      } finally {
        setLoading(false)
      }
    }

    checkDatabase()
  }, [])

  const testAuth = async () => {
    try {
      console.log('Testing sign in with test@example.com')
      const result = await signIn('test@example.com', 'password123')
      console.log('Auth test result:', result)
      setTestResult(`Sign in test: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.error}`)
    } catch (error) {
      console.error('Auth test error:', error)
      setTestResult(`Auth test error: ${error}`)
    }
  }

  const testSignUp = async () => {
    try {
      console.log('Testing sign up with newuser@example.com')
      const result = await signUp('newuser@example.com', 'Test User', 'password123')
      console.log('Sign up test result:', result)
      setTestResult(`Sign up test: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.error}`)
    } catch (error) {
      console.error('Sign up test error:', error)
      setTestResult(`Sign up test error: ${error}`)
    }
  }

  const testFailedSignIn = async () => {
    try {
      console.log('Testing sign in with nonexistent@nonexistent.com')
      const result = await signIn('nonexistent@nonexistent.com', 'password123')
      console.log('Failed sign in test result:', result)
      setTestResult(`Failed sign in test: ${result.success ? 'UNEXPECTED SUCCESS' : 'EXPECTED FAILURE'} - ${result.error}`)
    } catch (error) {
      console.error('Failed sign in test error:', error)
      setTestResult(`Failed sign in test error: ${error}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">TaskFlow Pro - Debug Panel</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Database Status */}
          <Card>
            <CardHeader>
              <CardTitle>Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p>Checking database...</p>
              ) : (
                <div>
                  <p className="mb-2"><strong>Status:</strong> {testResult}</p>
                  <p className="mb-2"><strong>Users found:</strong> {users.length}</p>
                  <div className="space-y-1">
                    {users.map(user => (
                      <div key={user.id} className="text-sm p-2 bg-gray-100 rounded">
                        <strong>{user.email}</strong> - {user.name} ({user.role})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Auth Test */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">1. Test Sign Up (Should Work)</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Creates a new user in database
                  </p>
                  <Button onClick={testSignUp} className="w-full">
                    Test Sign Up (newuser@example.com)
                  </Button>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">2. Test Sign In with Existing User (Should Work)</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Uses the user created in step 1
                  </p>
                  <Button onClick={testAuth} className="w-full">
                    Test Sign In (newuser@example.com)
                  </Button>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">3. Test Sign In with Non-existent User (Should Fail)</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Should show "User not found" error
                  </p>
                  <Button onClick={testFailedSignIn} className="w-full" variant="outline">
                    Test Sign In (nonexistent@nonexistent.com)
                  </Button>
                </div>
                
                {testResult && (
                  <div className="p-3 bg-gray-100 rounded">
                    <strong>Result:</strong> {testResult}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>How the System Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">📋 Correct Flow:</h3>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li><strong>Step 1:</strong> Sign Up with new credentials</li>
                    <li><strong>Step 2:</strong> Sign In with the same credentials</li>
                    <li><strong>Result:</strong> Should access dashboard</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">❌ Incorrect Flow:</h3>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li><strong>Step 1:</strong> Try to Sign In without signing up first</li>
                    <li><strong>Result:</strong> Should show "User not found" error</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">🧪 Test Instructions:</h3>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Click "Test Sign Up" to create a user</li>
                    <li>Verify user appears in database list</li>
                    <li>Click "Test Sign In with Existing User"</li>
                    <li>Should see success message</li>
                    <li>Click "Test Sign In with Non-existent User"</li>
                    <li>Should see error message</li>
                  </ol>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">🚀 Test Main Application</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Go to <Link href="/" className="text-blue-600 underline">main page</Link> and try the complete flow:
                  </p>
                  <ul className="text-sm text-gray-600 ml-4 mt-2">
                    <li>• Sign up with a new account</li>
                    <li>• Sign in with your credentials</li>
                    <li>• Try to access the dashboard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}