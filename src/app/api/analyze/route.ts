import { NextRequest, NextResponse } from 'next/server'
import { addJob } from '@/lib/mock-data-store'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Next.js API Route Analyze Called ===')

    // Parse form data
    const formData = await request.formData()
    console.log('FormData received')

    // Get files from form data
    const lapangan = formData.get('lapangan') as File
    const referensi = formData.get('referensi') as File | null
    const analyzer_name = formData.get('analyzer_name') as string
    const analyzer_institution = formData.get('analyzer_institution') as string
    const master_reference_id = formData.get('master_reference_id') as string
    const jenis_kelamin_default = formData.get('jenis_kelamin_default') as string

    console.log('Files extracted:', {
      lapangan: lapangan?.name,
      referensi: referensi?.name,
      analyzer_name,
      analyzer_institution,
      master_reference_id,
      jenis_kelamin_default
    })

    // Validate required fields
    if (!lapangan) {
      return NextResponse.json(
        { error: 'Lapangan file is required' },
        { status: 400 }
      )
    }

    if (!analyzer_name || !analyzer_institution) {
      return NextResponse.json(
        { error: 'Analyzer name and institution are required' },
        { status: 400 }
      )
    }

    // Generate job with proper analysis data
    const newJob = addJob({
      analyzer_name: analyzer_name,
      analyzer_institution: analyzer_institution,
      status: 'completed', // Mark as completed immediately for demo
      completed_at: new Date().toISOString(),
      summary: {
        total_anak: 20, // Correct count: 10 L + 10 P
        total_records: 240, // 12 months × 20 children
        valid: 180, // 75% valid
        warning: 42, // 17.5% warning
        error: 18, // 7.5% error
        missing: 0
      }
    })

    console.log('New analysis job created:', newJob)

    // Return response with job ID
    const response = {
      job_id: newJob.id,
      status: newJob.status,
      message: 'Analisis selesai. Data telah diproses. (Mock response - Next.js API)',
      summary: newJob.summary
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Analyze API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}