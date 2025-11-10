export const handleAuthError = () => {
  console.log('Authentication error detected, logging out...')

  // Clear auth data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')

    // Only redirect if not already on login page to prevent redirect loops
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
  }
}

// Enhanced fetch with auth error handling
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  // Add Authorization header if token exists and it's not the login endpoint
  if (token && !url.includes('/auth/login')) {
    options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    }
  }

  try {
    const response = await fetch(url, options)

    // Handle authentication errors (401 Unauthorized or 403 Forbidden)
    // Only trigger auth error if we have a token (meaning we thought we were authenticated)
    if (token && (response.status === 401 || response.status === 403) && !url.includes('/auth/login')) {
      handleAuthError()
      throw new Error('Authentication required')
    }

    return response
  } catch (error) {
    // Re-throw the error after handling auth
    throw error
  }
}