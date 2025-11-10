import { NextRequest, NextResponse } from 'next/server'
import { addJob } from '@/lib/mock-data-store'
import * as XLSX from 'xlsx'

// Excel parsing functions
interface ChildData {
  no: number
  nik: string
  nama_anak: string
  tanggal_lahir: string
  jenis_kelamin: string
  bulan_data: MonthlyData[]
}

interface MonthlyData {
  bulan: string
  tanggal_ukur: string
  umur: number
  berat: number
  tinggi: number
  cara_ukur: string
}

async function parseExcelFile(file: File): Promise<ChildData[]> {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    // Skip header row and parse data
    const children: ChildData[] = []
    const headers = data[0] as string[]

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as string[]
      if (!row[0] || !row[1] || !row[2]) continue // Skip empty rows

      const child: ChildData = {
        no: parseInt(row[0]) || i,
        nik: row[1] || '',
        nama_anak: row[2] || '',
        tanggal_lahir: row[3] || '',
        jenis_kelamin: row[4] || 'L', // Default L if not specified
        bulan_data: []
      }

      // Parse monthly data (JANUARI to DESEMBER)
      const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                     'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']

      for (const month of months) {
        const monthIndex = headers.findIndex(h => h && h.toString().toUpperCase().includes(month))
        if (monthIndex !== -1) {
          const monthlyData: MonthlyData = {
            bulan: month,
            tanggal_ukur: row[monthIndex + 1] || '',
            umur: parseInt(row[monthIndex + 2]) || 0,
            berat: parseFloat(row[monthIndex + 3]) || 0,
            tinggi: parseFloat(row[monthIndex + 4]) || 0,
            cara_ukur: row[monthIndex + 5] || ''
          }

          // Only add if there's actual data
          if (monthlyData.umur > 0 || monthlyData.berat > 0 || monthlyData.tinggi > 0) {
            child.bulan_data.push(monthlyData)
          }
        }
      }

      if (child.nama_anak) {
        children.push(child)
      }
    }

    console.log(`Parsed ${children.length} children from Excel file`)
    return children
  } catch (error) {
    console.error('Error parsing Excel file:', error)
    throw new Error('Gagal membaca file Excel. Pastikan format file sesuai.')
  }
}

function analyzeChildData(children: ChildData[]) {
  let totalRecords = 0
  let valid = 0
  let warning = 0
  let error = 0
  let missing = 0

  const results = children.map(child => {
    let childValid = 0
    let childWarning = 0
    let childError = 0
    let childMissing = 0

    child.bulan_data.forEach((data, index) => {
      totalRecords++

      // Check for missing data
      if (data.berat === 0 || data.tinggi === 0) {
        missing++
        childMissing++
        return
      }

      // Check for height decrease (error)
      if (index > 0 && data.tinggi < child.bulan_data[index - 1].tinggi) {
        error++
        childError++
        return
      }

      // Check for weight anomaly (>10% decrease) (warning)
      if (index > 0 && data.berat < child.bulan_data[index - 1].berat * 0.9) {
        warning++
        childWarning++
        return
      }

      // Default to valid if no issues
      valid++
      childValid++
    })

    return {
      nama_anak: child.nama_anak,
      nik: child.nik,
      total_data: child.bulan_data.length,
      valid: childValid,
      warning: childWarning,
      error: childError,
      missing: childMissing
    }
  })

  return {
    total_anak: children.length,
    total_records: totalRecords,
    valid,
    warning,
    error,
    missing,
    children_details: results
  }
}

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

    // Parse Excel file and analyze data
    console.log('Parsing Excel file...')
    const children = await parseExcelFile(lapangan)

    if (children.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data anak yang valid dalam file Excel' },
        { status: 400 }
      )
    }

    console.log(`Analyzing data for ${children.length} children...`)
    const analysis = analyzeChildData(children)

    // Generate job with actual analysis data
    const newJob = addJob({
      analyzer_name: analyzer_name,
      analyzer_institution: analyzer_institution,
      status: 'completed',
      completed_at: new Date().toISOString(),
      summary: {
        total_anak: analysis.total_anak,
        total_records: analysis.total_records,
        valid: analysis.valid,
        warning: analysis.warning,
        error: analysis.error,
        missing: analysis.missing
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