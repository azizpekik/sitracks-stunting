import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params

    console.log('=== Next.js API Route Job Status Called ===')
    console.log('Job ID:', jobId)

    // Mock job status response
    const mockResponse = {
      job_id: jobId,
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      analyzer_name: 'Mock Analyzer',
      analyzer_institution: 'Mock Institution',
      summary: {
        total_anak: 10,
        total_records: 120,
        valid: 100,
        warning: 15,
        error: 5,
        missing: 0
      },
      excel_path: `/api/download/hasil_validasi.xlsx?job=${jobId}`,
      report_path: `/api/download/laporan_validasi.txt?job=${jobId}`,
      preview: {
        total_records: 120,
        status_distribution: {
          valid: 100,
          warning: 15,
          error: 5
        }
      }
    }

    console.log('Mock job status:', mockResponse)

    return NextResponse.json(mockResponse)

  } catch (error) {
    console.error('Job status API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}