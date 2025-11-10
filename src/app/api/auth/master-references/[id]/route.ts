import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('=== Update Master Reference API Called ===')
    console.log('Master Reference ID:', id)

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Mock update response
    const updatedMasterReference = {
      id: parseInt(id),
      name: name,
      description: description || null,
      file_name: 'who_standards.xlsx', // Mock file name
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

    console.log('Master reference updated:', updatedMasterReference)

    return NextResponse.json(updatedMasterReference)

  } catch (error) {
    console.error('Update master reference error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('=== Delete Master Reference API Called ===')
    console.log('Master Reference ID:', id)

    // Mock delete operation
    // In a real implementation, this would delete from a database

    console.log(`Master reference ${id} deleted successfully (mock)`)

    return NextResponse.json({
      message: 'Master reference deleted successfully',
      id: parseInt(id)
    })

  } catch (error) {
    console.error('Delete master reference error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}