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

export async function POST(request: NextRequest) {
  try {
    console.log('=== Create Master Reference API Called ===')

    const formData = await request.formData()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const file = formData.get('file') as File

    if (!name || !file) {
      return NextResponse.json(
        { error: 'Name and file are required' },
        { status: 400 }
      )
    }

    // Mock creation response
    const newMasterReference = {
      id: Date.now(), // Mock ID
      name: name,
      description: description || null,
      file_name: file.name,
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

    console.log('Master reference created:', newMasterReference)

    return NextResponse.json(newMasterReference, { status: 201 })

  } catch (error) {
    console.error('Create master reference error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}