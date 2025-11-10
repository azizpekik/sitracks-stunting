import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    console.log('=== Next.js API Route Delete Job Called ===')
    console.log('Job ID:', jobId)

    // Mock delete operation
    // In a real implementation, this would delete from a database

    console.log(`Job ${jobId} deleted successfully (mock)`)

    return NextResponse.json({
      message: 'Job deleted successfully',
      job_id: jobId
    })

  } catch (error) {
    console.error('Delete job API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}