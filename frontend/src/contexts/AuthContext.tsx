'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { handleAuthError } from '@/lib/auth-utils'
import { apiInterceptor } from '@/lib/api-interceptor'

interface User {
  id: number
  username: string
  full_name: string
  is_active: boolean
  created_at: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isLoading: boolean
  token: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  
  useEffect(() => {
    // Check for existing session on mount
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(parsedUser)

        // Only validate token with server if we have one
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
        apiInterceptor.get(`${API_BASE_URL}/auth/me`).catch(() => {
          // If auth check fails, user will be logged out automatically via handleAuthError
        })
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await apiInterceptor.post(`${API_BASE_URL}/auth/login`, { username, password })

      if (response.ok) {
        try {
          const data = await response.json()

          // Validate response data
          if (!data.access_token || !data.user) {
            console.error('Invalid response data:', data)
            return { success: false, error: 'Invalid response from server' }
          }

          // Store token and user
          setToken(data.access_token)
          setUser(data.user)

          // Persist to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', data.access_token)
            localStorage.setItem('auth_user', JSON.stringify(data.user))
          }

          return { success: true }
        } catch (parseError) {
          console.error('Error parsing response:', parseError)
          return { success: false, error: 'Error parsing server response' }
        }
      } else {
        try {
          const errorData = await response.json()
          console.error('Login failed:', errorData)
          return { success: false, error: errorData.detail || 'Login failed' }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
          return { success: false, error: `Login failed: ${response.statusText}` }
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)

    // Use the centralized handleAuthError function for consistency
    handleAuthError()
  }

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    token,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}