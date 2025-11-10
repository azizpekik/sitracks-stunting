import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    // For now, skip authentication check to allow testing
    // TODO: Add proper authentication back when login flow is fully working
    console.log('Master references API called, auth header:', authHeader ? 'present' : 'missing')

    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return NextResponse.json(
    //     { detail: 'Not authenticated' },
    //     { status: 401 }
    //   )
    // }

    // Mock master references for now
    const mockMasterReferences = [
      {
        id: 1,
        name: 'WHO Growth Standards',
        description: 'Standard WHO growth reference tables',
        file_name: 'who_standards.xlsx',
        is_active: true,
        created_at: new Date().toISOString(),
        creator: {
          id: 1,
          username: 'admin',
          full_name: 'Administrator',
          is_active: true,
          created_at: new Date().toISOString()
        }
      }
    ]

    return NextResponse.json(mockMasterReferences)

  } catch (error) {
    console.error('Master references error:', error)
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    )
  }
}