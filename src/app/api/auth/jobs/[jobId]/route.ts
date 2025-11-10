import { NextRequest, NextResponse } from 'next/server'
import { deleteJob } from '@/lib/mock-data-store'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    console.log('=== Next.js API Route Delete Job Called ===')
    console.log('Job ID:', jobId)

    // Delete job from shared storage
    const deletedJob = deleteJob(jobId)

    if (!deletedJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Job deleted successfully',
      job_id: jobId,
      deleted_job: deletedJob
    })

  } catch (error) {
    console.error('Delete job API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}