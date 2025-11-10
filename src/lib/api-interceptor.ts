import { handleAuthError } from './auth-utils'

export interface AuthInterceptorOptions {
  onAuthError?: () => void
}

class ApiInterceptor {
  private onAuthError: () => void

  constructor(options: AuthInterceptorOptions = {}) {
    this.onAuthError = options.onAuthError || handleAuthError
  }

  async request(url: string, options: RequestInit = {}): Promise<Response> {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

    // Add Authorization header if token exists
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      }
    }

    try {
      const response = await fetch(url, options)

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        // Don't redirect on login endpoint itself
        if (!url.includes('/auth/login')) {
          this.onAuthError()
        }
        throw new Error('Authentication required')
      }

      return response
    } catch (error) {
      // Re-throw the error after handling auth
      throw error
    }
  }

  async get(url: string, options: RequestInit = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'GET' })
  }

  async post(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put(url: string, data?: any, options: RequestInit = {}): Promise<Response> {
    return this.request(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(url: string, options: RequestInit = {}): Promise<Response> {
    return this.request(url, { ...options, method: 'DELETE' })
  }

  async upload(url: string, formData: FormData, options: RequestInit = {}): Promise<Response> {
    // For FormData, don't set Content-Type header (browser will set it with boundary)
    return this.request(url, {
      ...options,
      method: 'POST',
      body: formData,
    })
  }
}

// Create singleton instance
export const apiInterceptor = new ApiInterceptor()

// Export class for creating custom instances
export { ApiInterceptor }