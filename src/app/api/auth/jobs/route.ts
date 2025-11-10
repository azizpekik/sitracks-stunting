import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Next.js API Route Jobs List Called ===')

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Mock jobs data
    const mockJobs = [
      {
        id: 'mock-job-1',
        analyzer_name: 'Nur Azis',
        analyzer_institution: 'Posyandu Dampit',
        status: 'completed',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        summary: {
          total_anak: 25,
          total_records: 300,
          valid: 280,
          warning: 15,
          error: 5,
          missing: 0
        }
      },
      {
        id: 'mock-job-2',
        analyzer_name: 'Admin Test',
        analyzer_institution: 'Test Institution',
        status: 'processing',
        created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'mock-job-3',
        analyzer_name: 'Another User',
        analyzer_institution: 'Another Institution',
        status: 'failed',
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      }
    ]

    // Apply pagination
    const paginatedJobs = mockJobs.slice(offset, offset + limit)

    console.log(`Returning ${paginatedJobs.length} jobs`)

    return NextResponse.json(paginatedJobs)

  } catch (error) {
    console.error('Jobs list API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}