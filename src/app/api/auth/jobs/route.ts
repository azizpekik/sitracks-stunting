import { NextRequest, NextResponse } from 'next/server'
import { getJobs } from '@/lib/mock-data-store'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Next.js API Route Jobs List Called ===')

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get jobs from shared storage
    const jobs = getJobs(limit, offset)

    return NextResponse.json(jobs)

  } catch (error) {
    console.error('Jobs list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}