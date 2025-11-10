import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    console.log('=== Next.js API Route Login ===')
    console.log('Username:', username)
    console.log('Password provided:', !!password)

    // Mock authentication for now
    if (username === 'admin' && password === 'admin') {
      const mockUser = {
        id: 1,
        username: 'admin',
        full_name: 'Administrator',
        is_active: true,
        created_at: new Date().toISOString()
      }

      const mockToken = 'mock-jwt-token-for-testing'

      return NextResponse.json({
        access_token: mockToken,
        token_type: 'bearer',
        user: mockUser
      })
    }

    // Invalid credentials
    return NextResponse.json(
      { detail: 'Incorrect username or password' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}