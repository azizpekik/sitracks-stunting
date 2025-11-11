import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { getJobs } from '@/lib/mock-data-store'

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
  const jobs = getJobs()
  const job = jobs.find((j: any) => j.id === jobId)

  if (!job || !job.validation_results) {
    // Fallback to empty template if no validation results
    const wb = XLSX.utils.book_new()
    createEmptySheets(wb)
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  }

  console.log(`=== Generating PRD Compliant Excel Output for Job ${jobId} ===`)

  const wb = XLSX.utils.book_new()

  // 1. Raw_with_Flags Sheet (Main audit data)
  const rawData = createRawWithFlagsSheet(job.validation_results)
  const wsRaw = XLSX.utils.aoa_to_sheet(rawData.data)
  applyRawSheetStyling(wsRaw, rawData.validationResults)
  XLSX.utils.book_append_sheet(wb, wsRaw, "Raw_with_Flags")

  // 2. Per_Anak_Summary Sheet (1 row per NIK)
  const summaryData = createPerChildSummarySheet(job.validation_results)
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData.data)
  applySummarySheetStyling(wsSummary, summaryData.childSummaries)
  XLSX.utils.book_append_sheet(wb, wsSummary, "Per_Anak_Summary")

  // 3. Dashboard Sheet (Global recap)
  const dashboardData = createDashboardSheet(job)
  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData.data)
  applyDashboardSheetStyling(wsDashboard)
  XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard")

  // 4. WHO_Reference Sheet (Optional cache)
  const whoData = createWHOReferenceSheet()
  const wsWHO = XLSX.utils.aoa_to_sheet(whoData)
  XLSX.utils.book_append_sheet(wb, wsWHO, "WHO_Reference")

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  console.log(`Generated comprehensive Excel output with 4 sheets for job ${jobId}`)
  return excelBuffer
}

function createEmptySheets(wb: XLSX.WorkBook) {
  // Raw_with_Flags
  const rawHeaders = [
    'No', 'NIK', 'Nama', 'Tanggal_Lahir', 'Tanggal_Ukur', 'Usia_Bulan',
    'Berat_kg', 'Tinggi_cm', 'ΔBerat_kg', 'ΔTinggi_cm', 'Z_WFA', 'Z_HFA', 'Z_WFH',
    'Status', 'Flag_Detail', 'Status_Icon'
  ]
  const wsRaw = XLSX.utils.aoa_to_sheet([rawHeaders])
  XLSX.utils.book_append_sheet(wb, wsRaw, "Raw_with_Flags")

  // Per_Anak_Summary
  const summaryHeaders = [
    'NIK', 'Nama', 'Tgl_Lahir', 'Periode_Mulai', 'Periode_Akhir',
    'Jml_Pengukuran', 'OK', 'Warning', 'Error', 'Missing',
    'Bulan_Tidak_Diukur', 'Catatan_Utama'
  ]
  const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders])
  XLSX.utils.book_append_sheet(wb, wsSummary, "Per_Anak_Summary")

  // Dashboard
  const dashboardData = [
    ['DASHBOARD ANALISIS PERTUMBUHAN ANAK'],
    [''],
    ['KPI UTAMA'],
    ['Total Anak', 0],
    ['Total Pengukuran', 0],
    ['Valid (%)', '0%'],
    ['Warning (%)', '0%'],
    ['Error (%)', '0%'],
    ['Missing (%)', '0%'],
    [''],
    ['DISTRIBUSI STATUS'],
    ['Status', 'Jumlah', 'Persentase'],
    ['OK', 0, '0%'],
    ['WARNING', 0, '0%'],
    ['ERROR', 0, '0%'],
    ['MISSING', 0, '0%']
  ]
  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData)
  XLSX.utils.book_append_sheet(wb, wsDashboard, "Dashboard")

  // WHO_Reference
  const whoData = [
    ['WHO REFERENCE DATA'],
    [''],
    ['Note: Complete WHO reference tables would be included here'],
    ['Age (months)', 'Gender', 'Weight Median (kg)', 'Height Median (cm)', 'Weight SD', 'Height SD']
  ]
  const wsWHO = XLSX.utils.aoa_to_sheet(whoData)
  XLSX.utils.book_append_sheet(wb, wsWHO, "WHO_Reference")
}

function createRawWithFlagsSheet(validationResults: any[]) {
  // Group by child for delta calculations
  const childGroups: { [key: string]: any[] } = {}
  validationResults.forEach(result => {
    const key = `${result.nik}_${result.nama_anak}_${result.tanggal_lahir}`
    if (!childGroups[key]) {
      childGroups[key] = []
    }
    childGroups[key].push(result)
  })

  const headers = [
    'No', 'NIK', 'Nama', 'Tanggal_Lahir', 'Tanggal_Ukur', 'Usia_Bulan',
    'Berat_kg', 'Tinggi_cm', 'ΔBerat_kg', 'ΔTinggi_cm', 'Z_WFA', 'Z_HFA', 'Z_WFH',
    'Status', 'Flag_Detail', 'Status_Icon'
  ]

  const data = [headers]

  Object.values(childGroups).forEach((childData: any[]) => {
    // Sort by age for delta calculations
    const sortedData = childData.sort((a, b) => a.umur - b.umur)

    sortedData.forEach((result, index) => {
      // Calculate deltas
      let deltaBerat = 0
      let deltaTinggi = 0

      if (index > 0) {
        const prevResult = sortedData[index - 1]
        deltaBerat = result.berat - prevResult.berat
        deltaTinggi = result.tinggi - prevResult.tinggi
      }

      // Extract Z-scores from keterangan if available
      let z_wfa = '', z_hfa = '', z_wfh = ''
      if (result.keterangan.includes('Z-score:')) {
        const zMatch = result.keterangan.match(/Z-score: (WFA=[-+]?\d+\.?\d*)?,?(HFA=[-+]?\d+\.?\d*)?/i)
        if (zMatch) {
          if (zMatch[1]) z_wfa = zMatch[1].replace('WFA=', '')
          if (zMatch[2]) z_hfa = zMatch[2].replace('HFA=', '')
        }
      }

      // Create flag details array
      const flagDetails = result.keterangan.split(';').map(flag => flag.trim()).filter(Boolean)

      // Status icon
      const statusIcon = result.validasi_input === 'ERROR' ? '⛔' :
                        result.validasi_input === 'WARNING' ? '⚠️' :
                        result.validasi_input === 'OK' ? '✅' : '◻️'

      const row = [
        result.no,
        result.nik,
        result.nama_anak,
        result.tanggal_lahir,
        result.tanggal_ukur,
        result.umur,
        result.berat > 0 ? result.berat.toFixed(1) : '',
        result.tinggi > 0 ? result.tinggi.toFixed(1) : '',
        deltaBerat !== 0 ? deltaBerat.toFixed(1) : '',
        deltaTinggi !== 0 ? deltaTinggi.toFixed(1) : '',
        z_wfa,
        z_hfa,
        z_wfh,
        result.validasi_input,
        flagDetails.join(', '),
        statusIcon
      ]

      data.push(row)
    })
  })

  return { data, validationResults }
}

function createPerChildSummarySheet(validationResults: any[]) {
  // Group by child
  const childGroups: { [key: string]: any[] } = {}
  validationResults.forEach(result => {
    const key = `${result.nik}_${result.nama_anak}_${result.tanggal_lahir}`
    if (!childGroups[key]) {
      childGroups[key] = []
    }
    childGroups[key].push(result)
  })

  const headers = [
    'NIK', 'Nama', 'Tgl_Lahir', 'Periode_Mulai', 'Periode_Akhir',
    'Jml_Pengukuran', 'OK', 'Warning', 'Error', 'Missing',
    'Bulan_Tidak_Diukur', 'Catatan_Utama', 'Status_Anak'
  ]

  const data = [headers]
  const childSummaries: any[] = []

  Object.entries(childGroups).forEach(([key, results]) => {
    const childData = results as any[]
    const firstResult = childData[0]
    const lastResult = childData[childData.length - 1]

    // Count statuses
    const okCount = childData.filter(r => r.validasi_input === 'OK').length
    const warningCount = childData.filter(r => r.validasi_input === 'WARNING').length
    const errorCount = childData.filter(r => r.validasi_input === 'ERROR').length
    const missingCount = childData.filter(r => r.status_berat === 'Missing' || r.status_tinggi === 'Missing').length

    // Find missing months
    const missingMonths = childData
      .filter(r => r.keterangan.includes('Tidak diukur'))
      .map(r => r.bulan)
      .filter((bulan, index, arr) => arr.indexOf(bulan) === index) // Remove duplicates

    // Determine main issues
    const mainIssues = []
    if (errorCount > 0) mainIssues.push('Tinggi menurun')
    if (childData.some(r => r.keterangan.includes('Gap data'))) mainIssues.push('Gap data')
    if (childData.some(r => r.keterangan.includes('tidak ideal'))) mainIssues.push('Nilai di luar ideal')

    // Determine child status
    let childStatus = 'VALID'
    if (errorCount > 0) childStatus = 'ERROR'
    else if (warningCount > 0 || missingCount > 0) childStatus = 'WARNING'

    const row = [
      firstResult.nik,
      firstResult.nama_anak,
      firstResult.tanggal_lahir,
      firstResult.bulan,
      lastResult.bulan,
      childData.length,
      okCount,
      warningCount,
      errorCount,
      missingCount,
      missingMonths.join(', '),
      mainIssues.join(', ') || 'SEMUA DATA VALID ✓',
      childStatus
    ]

    data.push(row)
    childSummaries.push({
      status: childStatus,
      okCount,
      warningCount,
      errorCount,
      missingCount
    })
  })

  return { data, childSummaries }
}

function createDashboardSheet(job: any) {
  const summary = job.summary || {}
  const total = summary.total_records || 1

  const validPercent = ((summary.valid || 0) / total * 100).toFixed(1)
  const warningPercent = ((summary.warning || 0) / total * 100).toFixed(1)
  const errorPercent = ((summary.error || 0) / total * 100).toFixed(1)
  const missingPercent = ((summary.missing || 0) / total * 100).toFixed(1)

  const data = [
    ['DASHBOARD ANALISIS PERTUMBUHAN ANAK'],
    [''],
    ['INFORMASI ANALISIS'],
    ['Analyzer', job.analyzer_name || 'N/A'],
    ['Institution', job.analyzer_institution || 'N/A'],
    ['Job ID', job.id],
    ['Tanggal Generate', new Date().toLocaleString('id-ID')],
    [''],
    ['KPI UTAMA'],
    ['Total Anak', summary.total_anak || 0],
    ['Total Pengukuran', summary.total_records || 0],
    ['Valid (%)', `${validPercent}%`],
    ['Warning (%)', `${warningPercent}%`],
    ['Error (%)', `${errorPercent}%`],
    ['Missing (%)', `${missingPercent}%`],
    [''],
    ['DISTRIBUSI STATUS'],
    ['Status', 'Jumlah', 'Persentase'],
    ['OK', summary.valid || 0, `${validPercent}%`],
    ['WARNING', summary.warning || 0, `${warningPercent}%`],
    ['ERROR', summary.error || 0, `${errorPercent}%`],
    ['MISSING', summary.missing || 0, `${missingPercent}%`],
    [''],
    ['LEGENDA WARNA'],
    ['Status', 'Warna Background', 'Ikon', 'Deskripsi'],
    ['OK', 'Hijau muda #E6F4EA', '✅', 'Semua cek lolos'],
    ['WARNING', 'Kuning muda #FFF7CC', '⚠️', 'Perlu perhatian'],
    ['ERROR', 'Merah muda #FDECEA', '⛔', 'Ada masalah serius'],
    ['MISSING', 'Abu-abu #EEEEEE', '◻️', 'Data tidak ada']
  ]

  return { data }
}

function createWHOReferenceSheet() {
  const data = [
    ['WHO REFERENCE DATA'],
    [''],
    ['Catatan: Tabel referensi WHO lengkap akan dimuat di sini'],
    ['Untuk keperluan audit dan validasi offline'],
    [''],
    ['CONTOH DATA REFERENSI'],
    ['Age (months)', 'Gender', 'Weight Median (kg)', 'Height Median (cm)', 'Weight SD', 'Height SD', 'WFA -2SD', 'WFA +2SD', 'HFA -2SD', 'HFA +2SD'],
    ['0', 'L', '3.5', '50.0', '0.15', '0.03', '2.8', '4.4', '47.2', '52.8'],
    ['1', 'L', '4.5', '54.7', '0.14', '0.03', '3.7', '5.5', '51.9', '57.5'],
    ['2', 'L', '5.6', '58.4', '0.14', '0.03', '4.6', '6.7', '56.3', '60.5'],
    ['3', 'L', '6.4', '61.4', '0.14', '0.03', '5.2', '7.6', '59.5', '63.3'],
    ['6', 'L', '7.8', '67.6', '0.14', '0.03', '6.3', '9.3', '65.3', '69.9'],
    ['12', 'L', '9.6', '75.7', '0.15', '0.03', '7.8', '11.8', '72.9', '78.5'],
    ['24', 'L', '12.2', '87.1', '0.16', '0.03', '9.9', '15.1', '83.2', '91.0'],
    ['36', 'L', '14.3', '96.1', '0.17', '0.03', '11.6', '17.7', '91.4', '100.8'],
    ['48', 'L', '16.4', '103.4', '0.18', '0.03', '13.2', '20.4', '98.6', '108.2'],
    ['60', 'L', '18.3', '109.8', '0.19', '0.03', '14.7', '22.9', '104.9', '114.7'],
    [''],
    ['Gender: L = Laki-laki, P = Perempuan'],
    ['SD = Standard Deviation'],
    ['WFA = Weight-for-Age Z-score'],
    ['HFA = Height-for-Age Z-score'],
    ['-2SD = Batas bawah normal', '+2SD = Batas atas normal']
  ]

  return data
}

function applyRawSheetStyling(ws: XLSX.WorkSheet, validationResults: any[]) {
  // Set column widths
  const colWidths = [
    { wch: 5 },   // No
    { wch: 15 },  // NIK
    { wch: 25 },  // Nama
    { wch: 12 },  // Tanggal_Lahir
    { wch: 12 },  // Tanggal_Ukur
    { wch: 8 },   // Usia_Bulan
    { wch: 10 },  // Berat_kg
    { wch: 10 },  // Tinggi_cm
    { wch: 10 },  // ΔBerat_kg
    { wch: 10 },  // ΔTinggi_cm
    { wch: 8 },   // Z_WFA
    { wch: 8 },   // Z_HFA
    { wch: 8 },   // Z_WFH
    { wch: 10 },  // Status
    { wch: 30 },  // Flag_Detail
    { wch: 8 }    // Status_Icon
  ]
  ws['!cols'] = colWidths

  // Style header
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let col = 0; col <= 15; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellAddress]) ws[cellAddress] = {}
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
  }

  // Style data rows based on validation status
  validationResults.forEach((result, index) => {
    const rowNum = index + 1

    let fillColor = 'FFFFFF' // Default white
    let fontColor = '000000' // Default black

    switch (result.validasi_input) {
      case 'ERROR':
        fillColor = 'FDECEA' // Merah muda
        fontColor = 'C00'     // Merah tua
        break
      case 'WARNING':
        fillColor = 'FFF7CC' // Kuning muda
        fontColor = 'A07900' // Kuning tua
        break
      case 'OK':
        fillColor = 'E6F4EA' // Hijau muda
        fontColor = '0B8043' // Hijau tua
        break
      case 'MISSING':
        fillColor = 'EEEEEE' // Abu-abu
        fontColor = '5F6368' // Abu-abu tua
        break
    }

    // Apply style to all cells in this row
    for (let col = 0; col <= 15; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: col })
      if (ws[cellAddress]) {
        if (!ws[cellAddress].s) ws[cellAddress].s = {}
        ws[cellAddress].s.fill = { fgColor: { rgb: fillColor } }
        ws[cellAddress].s.font = { color: { rgb: fontColor } }
      }
    }
  })
}

function applySummarySheetStyling(ws: XLSX.WorkSheet, childSummaries: any[]) {
  // Set column widths
  const colWidths = [
    { wch: 15 }, // NIK
    { wch: 25 }, // Nama
    { wch: 12 }, // Tgl_Lahir
    { wch: 12 }, // Periode_Mulai
    { wch: 12 }, // Periode_Akhir
    { wch: 12 }, // Jml_Pengukuran
    { wch: 6 },  // OK
    { wch: 8 },  // Warning
    { wch: 6 },  // Error
    { wch: 8 },  // Missing
    { wch: 20 }, // Bulan_Tidak_Diukur
    { wch: 25 }, // Catatan_Utama
    { wch: 10 }  // Status_Anak
  ]
  ws['!cols'] = colWidths

  // Style header
  for (let col = 0; col <= 12; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!ws[cellAddress]) ws[cellAddress] = {}
    ws[cellAddress].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'center' }
    }
  }

  // Style data rows based on child status
  childSummaries.forEach((summary, index) => {
    const rowNum = index + 1

    let fillColor = 'FFFFFF'
    let fontColor = '000000'

    switch (summary.status) {
      case 'ERROR':
        fillColor = 'FDECEA'
        fontColor = 'C00'
        break
      case 'WARNING':
        fillColor = 'FFF7CC'
        fontColor = 'A07900'
        break
      case 'VALID':
        fillColor = 'E6F4EA'
        fontColor = '0B8043'
        break
    }

    for (let col = 0; col <= 12; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: col })
      if (ws[cellAddress]) {
        if (!ws[cellAddress].s) ws[cellAddress].s = {}
        ws[cellAddress].s.fill = { fgColor: { rgb: fillColor } }
        ws[cellAddress].s.font = { color: { rgb: fontColor } }
      }
    }
  })
}

function applyDashboardSheetStyling(ws: XLSX.WorkSheet) {
  // Set column widths
  ws['!cols'] = [
    { wch: 20 }, // Column A
    { wch: 15 }, // Column B
    { wch: 12 }  // Column C
  ]

  // Style main title
  const titleCell = XLSX.utils.encode_cell({ r: 0, c: 0 })
  if (!ws[titleCell]) ws[titleCell] = {}
  ws[titleCell].s = {
    font: { bold: true, sz: 16, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '4472C4' } },
    alignment: { horizontal: 'center' }
  }

  // Style section headers
  const sectionHeaders = [
    { row: 2, text: 'INFORMASI ANALISIS' },
    { row: 8, text: 'KPI UTAMA' },
    { row: 14, text: 'DISTRIBUSI STATUS' },
    { row: 21, text: 'LEGENDA WARNA' }
  ]

  sectionHeaders.forEach(({ row }) => {
    const cellAddress = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (ws[cellAddress]) {
      if (!ws[cellAddress].s) ws[cellAddress].s = {}
      ws[cellAddress].s = {
        font: { bold: true, sz: 14 },
        fill: { fgColor: { rgb: 'E2EFDA' } }
      }
    }
  })

  // Style KPI values
  const kpiRows = [9, 10, 11, 12, 13]
  kpiRows.forEach(row => {
    for (let col = 0; col <= 1; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
      if (ws[cellAddress]) {
        if (!ws[cellAddress].s) ws[cellAddress].s = {}
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: 'FCE4D6' } }
        }
      }
    }
  })
}

function generateTextReport(jobId: string): string {
  // Get the job with validation results
  const jobs = getJobs()
  const job = jobs.find((j: any) => j.id === jobId)

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