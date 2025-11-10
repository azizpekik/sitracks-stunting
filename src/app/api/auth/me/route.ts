import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { detail: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Mock user data for now
    const mockUser = {
      id: 1,
      username: 'admin',
      full_name: 'Administrator',
      is_active: true,
      created_at: new Date().toISOString()
    }

    return NextResponse.json(mockUser)

  } catch (error) {
    console.error('Auth me error:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}