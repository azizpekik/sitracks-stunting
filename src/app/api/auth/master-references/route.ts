import { NextRequest, NextResponse } from 'next/server'

// Import shared storage utilities
import { getMasterReferences, addMasterReference } from '@/lib/mock-data-store'

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

    const masterReferences = getMasterReferences()
    console.log('GET master references: returning', masterReferences.length, 'items')
    return NextResponse.json(masterReferences)

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

    // Add to shared storage
    const newMasterReference = addMasterReference({
      name: name,
      description: description || null,
      file_name: file.name,
    })

    return NextResponse.json(newMasterReference, { status: 201 })

  } catch (error) {
    console.error('Create master reference error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}