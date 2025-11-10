import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job')

    console.log('=== Download API Called ===')
    console.log('Filename:', filename)
    console.log('Job ID:', jobId)

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Handle different file types
    if (filename.includes('hasil_validasi.xlsx')) {
      // Generate proper Excel file
      const excelBuffer = generateExcelValidationResults(jobId)

      const response = new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="hasil_validasi.xlsx"`,
        },
      })

      return response
    } else if (filename.includes('laporan_validasi.txt')) {
      // Generate text report matching real format
      const textReport = generateTextReport(jobId)

      const response = new NextResponse(textReport, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="laporan_validasi.txt"`,
        },
      })

      return response
    } else {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

function generateExcelValidationResults(jobId: string): ArrayBuffer {
  // Get the job with validation results
  const { getJobs } = require('@/lib/mock-data-store')
  const jobs = getJobs()
  const job = jobs.find(j => j.id === jobId)

  if (!job || !job.validation_results) {
    // Fallback to empty template if no validation results
    const data = [
      ['No', 'NIK', 'Nama Anak', 'Tanggal Lahir', 'Bulan', 'Tanggal Ukur', 'Umur (bulan)', 'Berat (kg)', 'Tinggi (cm)', 'Cara Ukur', 'Status Berat', 'Status Tinggi', 'Validasi Input', 'Keterangan']
    ]

    const ws = XLSX.utils.aoa_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Hasil Validasi")
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  }

  // Create header row matching the actual format
  const data = [
    ['No', 'NIK', 'Nama Anak', 'Tanggal Lahir', 'Bulan', 'Tanggal Ukur', 'Umur (bulan)', 'Berat (kg)', 'Tinggi (cm)', 'Cara Ukur', 'Status Berat', 'Status Tinggi', 'Validasi Input', 'Keterangan']
  ]

  // Add validation results
  job.validation_results.forEach(result => {
    const row = [
      result.no,
      result.nik,
      result.nama_anak,
      result.tanggal_lahir,
      result.bulan,
      result.tanggal_ukur,
      result.umur,
      result.berat || '',
      result.tinggi || '',
      result.cara_ukur,
      result.status_berat,
      result.status_tinggi,
      result.validasi_input,
      result.keterangan
    ]
    data.push(row)
  })

  // Create workbook with multiple sheets
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Hasil Validasi")

  // Add summary sheet
  const summaryData = [
    ['Ringkasan Analisis'],
    [],
    ['Total Anak', job.summary?.total_anak || 0],
    ['Total Records', job.summary?.total_records || 0],
    ['Valid', job.summary?.valid || 0],
    ['Warning', job.summary?.warning || 0],
    ['Error', job.summary?.error || 0],
    ['Missing', job.summary?.missing || 0],
    [],
    ['Informasi'],
    ['Analyzer', job.analyzer_name],
    ['Institution', job.analyzer_institution],
    ['Job ID', jobId],
    ['Tanggal', new Date().toLocaleString('id-ID')]
  ]

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan")

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  console.log(`Generated Excel validation results for job ${jobId}: ${data.length - 1} rows`)
  return excelBuffer
}

function generateTextReport(jobId: string): string {
  // Get the job with validation results
  const { getJobs } = require('@/lib/mock-data-store')
  const jobs = getJobs()
  const job = jobs.find(j => j.id === jobId)

  if (!job || !job.validation_results) {
    // Fallback to empty template if no validation results
    return `LAPORAN VALIDASI DATA PERTUMBUHAN ANAK
==================================================

Tanggal Generate: ${new Date().toLocaleString('id-ID')}

RINGKASAN ANALISIS
--------------------
Total Anak: 0
Total Data Pengukuran: 0
Valid (OK): 0
Peringatan (Warning): 0
Error: 0
Missing Data: 0

ANALISIS DETAIL PER ANAK
==============================
Tidak ada data untuk dianalisis.
`
  }

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/')
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  // Group validation results by child
  const childGroups: { [key: string]: any[] } = {}
  job.validation_results.forEach(result => {
    const key = `${result.nama_anak}|${result.nik}|${result.tanggal_lahir}`
    if (!childGroups[key]) {
      childGroups[key] = []
    }
    childGroups[key].push(result)
  })

  let reportContent = `LAPORAN VALIDASI DATA PERTUMBUHAN ANAK
==================================================

Tanggal Generate: ${currentDate} ${currentTime}

RINGKASAN ANALISIS
--------------------
Total Anak: ${job.summary?.total_anak || 0}
Total Data Pengukuran: ${job.summary?.total_records || 0}
Valid (OK): ${job.summary?.valid || 0}
Peringatan (Warning): ${job.summary?.warning || 0}
Error: ${job.summary?.error || 0}
Missing Data: ${job.summary?.missing || 0}

ANALISIS DETAIL PER ANAK
==============================
`

  // Generate detailed analysis for each child
  Object.values(childGroups).forEach(childData => {
    const firstResult = childData[0]

    reportContent += `
NAMA: ${firstResult.nama_anak}
NIK: ${firstResult.nik}
TANGGAL LAHIR: ${firstResult.tanggal_lahir}
--------------------`

    // Check for missing months
    const missingMonths = childData
      .filter(r => r.validasi_input === 'WARNING' && r.keterangan === 'Tidak diukur')
      .map(r => r.bulan)

    if (missingMonths.length > 0) {
      reportContent += `
Tidak diukur pada bulan: ${missingMonths.join(', ')}`
    }

    // Check for height issues
    const heightIssues = childData.filter(r =>
      r.keterangan.includes('Tinggi menurun')
    )

    if (heightIssues.length > 0) {
      reportContent += `

MASALAH TINGGI BADAN:`
      heightIssues.forEach(issue => {
        reportContent += `
- ${issue.keterangan}`
      })
    }

    // Check for weight issues
    const weightIssues = childData.filter(r =>
      r.keterangan.includes('Berat turun')
    )

    if (weightIssues.length > 0) {
      reportContent += `

MASALAH BERAT BADAN:`
      weightIssues.forEach(issue => {
        reportContent += `
- ${issue.keterangan}`
      })
    }

    // Check for gap data
    const gapIssues = childData.filter(r =>
      r.keterangan.includes('Gap data')
    )

    if (gapIssues.length > 0) {
      reportContent += `

PERINGATAN:`
      gapIssues.forEach(issue => {
        reportContent += `
- ${issue.keterangan}`
      })
    }

    // Check for missing data
    const missingDataIssues = childData.filter(r =>
      r.keterangan.includes('kosong')
    )

    if (missingDataIssues.length > 0) {
      reportContent += `

DATA HILANG:`
      missingDataIssues.forEach(issue => {
        reportContent += `
- ${issue.bulan}: ${issue.keterangan}`
      })
    }

    // If no issues, mark as valid
    const hasIssues = missingMonths.length > 0 ||
                      heightIssues.length > 0 ||
                      weightIssues.length > 0 ||
                      gapIssues.length > 0 ||
                      missingDataIssues.length > 0

    if (!hasIssues) {
      reportContent += `

SEMUA DATA VALID ✓`
    }

    reportContent += `

==================================================`
  })

  reportContent += `

`

  console.log(`Generated text report for job ${jobId}`)
  return reportContent
}