import { NextRequest, NextResponse } from 'next/server'

// Import shared storage utilities
import { getMasterReferences, updateMasterReference, deleteMasterReference } from '@/lib/mock-data-store'

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

    const masterReferenceId = parseInt(id)
    const updatedReference = updateMasterReference(masterReferenceId, { name, description })

    if (!updatedReference) {
      return NextResponse.json(
        { error: 'Master reference not found' },
        { status: 404 }
      )
    }

    console.log('Master reference updated:', updatedReference)

    return NextResponse.json(updatedReference)

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

    const masterReferenceId = parseInt(id)
    const deletedReference = deleteMasterReference(masterReferenceId)

    if (!deletedReference) {
      return NextResponse.json(
        { error: 'Master reference not found' },
        { status: 404 }
      )
    }

    console.log('Master reference deleted:', deletedReference)

    return NextResponse.json({
      message: 'Master reference deleted successfully',
      id: masterReferenceId
    })

  } catch (error) {
    console.error('Delete master reference error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}