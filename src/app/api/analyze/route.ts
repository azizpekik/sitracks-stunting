import { NextRequest, NextResponse } from 'next/server'
import { addJob } from '@/lib/mock-data-store'
import { createAnalysisResult, createChildAnalysis, createMonthlyData } from '@/lib/database'
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

interface ValidationResult {
  no: number
  nik: string
  nama_anak: string
  tanggal_lahir: string
  bulan: string
  tanggal_ukur: string
  umur: number
  berat: number
  tinggi: number
  cara_ukur: string
  status_berat: string
  status_tinggi: string
  validasi_input: string
  keterangan: string
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
        jenis_kelamin: row[4]?.toString().toUpperCase() || 'L', // Support both L/P and l/p
        bulan_data: []
      }

      // Parse monthly data (JANUARI to DESEMBER) - looking for month columns
      const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                     'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']

      for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
        const month = months[monthIndex]

        // Look for month columns in headers (wide format)
        for (let col = 0; col < headers.length; col++) {
          const header = headers[col]?.toString().toUpperCase() || ''
          if (header.includes(month)) {
            // Found month column, now get the data for this month
            const monthlyData: MonthlyData = {
              bulan: month,
              tanggal_ukur: row[col + 1] || '',
              umur: parseInt(row[col + 2]) || 0,
              berat: parseFloat(row[col + 3]) || 0,
              tinggi: parseFloat(row[col + 4]) || 0,
              cara_ukur: row[col + 5] || ''
            }

            // Only add if there's actual data
            if (monthlyData.umur > 0 || monthlyData.berat > 0 || monthlyData.tinggi > 0) {
              child.bulan_data.push(monthlyData)
            }
            break // Move to next month
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

  const validationResults: ValidationResult[] = []
  let currentNo = 1

  children.forEach(child => {
    child.bulan_data.forEach((data, index) => {
      totalRecords++

      // Initialize validation result
      const result: ValidationResult = {
        no: currentNo++,
        nik: child.nik,
        nama_anak: child.nama_anak,
        tanggal_lahir: child.tanggal_lahir,
        bulan: data.bulan,
        tanggal_ukur: data.tanggal_ukur,
        umur: data.umur,
        berat: data.berat,
        tinggi: data.tinggi,
        cara_ukur: data.cara_ukur,
        status_berat: 'Ideal',
        status_tinggi: 'Ideal',
        validasi_input: 'OK',
        keterangan: ''
      }

      // Check for missing data
      if (data.berat === 0 || data.tinggi === 0) {
        missing++
        result.status_berat = 'Missing'
        result.status_tinggi = 'Missing'
        result.validasi_input = 'WARNING'
        result.keterangan = 'Data berat dan tinggi kosong'
        validationResults.push(result)
        return
      }

      // Check for height decrease (error)
      if (index > 0 && data.tinggi < child.bulan_data[index - 1].tinggi) {
        error++
        result.status_tinggi = 'Tidak Ideal'
        result.validasi_input = 'ERROR'
        result.keterangan = `Tinggi menurun: ${child.bulan_data[index - 1].tinggi}cm → ${data.tinggi}cm`
        validationResults.push(result)
        return
      }

      // Check for weight anomaly (>10% decrease) (warning)
      if (index > 0 && data.berat < child.bulan_data[index - 1].berat * 0.9) {
        warning++
        result.status_berat = 'Tidak Ideal'
        result.validasi_input = 'WARNING'
        result.keterangan = `Berat turun >10%: ${child.bulan_data[index - 1].berat}kg → ${data.berat}kg`
        validationResults.push(result)
        return
      }

      // Check for data gaps (warning)
      if (index > 0) {
        const prevMonth = child.bulan_data[index - 1]
        const currentMonthAge = data.umur
        const prevMonthAge = prevMonth.umur
        const ageGap = currentMonthAge - prevMonthAge

        if (ageGap > 1) {
          warning++
          result.validasi_input = 'WARNING'
          result.keterangan = `Gap data: tidak ada pengukuran untuk ${ageGap - 1} bulan sebelum ${data.bulan}`
          validationResults.push(result)
          return
        }
      }

      // Default to valid if no issues
      valid++
      validationResults.push(result)
    })

    // Add missing months for children with gaps
    if (child.bulan_data.length > 0) {
      const firstAge = child.bulan_data[0].umur
      if (firstAge > 1) {
        // Add missing months before first measurement
        for (let age = 1; age < firstAge; age++) {
          totalRecords++
          missing++
          const missingResult: ValidationResult = {
            no: currentNo++,
            nik: child.nik,
            nama_anak: child.nama_anak,
            tanggal_lahir: child.tanggal_lahir,
            bulan: 'Missing',
            tanggal_ukur: '',
            umur: age,
            berat: 0,
            tinggi: 0,
            cara_ukur: '',
            status_berat: 'Missing',
            status_tinggi: 'Missing',
            validasi_input: 'WARNING',
            keterangan: 'Tidak diukur'
          }
          validationResults.push(missingResult)
        }
      }
    }
  })

  return {
    total_anak: children.length,
    total_records: totalRecords,
    valid,
    warning,
    error,
    missing,
    validation_results: validationResults
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

    // Store in database
    console.log('Storing analysis results in database...')
    const analysisResult = createAnalysisResult({
      job_id: '', // Will be set after job creation
      analyzer_name: analyzer_name,
      analyzer_institution: analyzer_institution,
      total_anak: analysis.total_anak,
      total_records: analysis.total_records,
      valid: analysis.valid,
      warning: analysis.warning,
      error: analysis.error,
      missing: analysis.missing
    })

    // Group validation results by child and create child analyses
    const childGroups: { [key: string]: any[] } = {}
    analysis.validation_results.forEach(result => {
      const key = `${result.nama_anak}|${result.nik}|${result.tanggal_lahir}`
      if (!childGroups[key]) {
        childGroups[key] = []
      }
      childGroups[key].push(result)
    })

    // Create child analysis records
    Object.entries(childGroups).forEach(([key, results]) => {
      const [nama_anak, nik, tanggal_lahir] = key.split('|')

      // Find original child data to get jenis_kelamin
      const originalChild = children.find(c =>
        c.nama_anak === nama_anak && c.nik === nik && c.tanggal_lahir === tanggal_lahir
      )

      // Determine child status
      let hasError = false
      let hasWarning = false
      let hasMissing = false

      results.forEach(result => {
        if (result.validasi_input === 'ERROR') hasError = true
        if (result.validasi_input === 'WARNING') hasWarning = true
        if (result.status_berat === 'Missing' || result.status_tinggi === 'Missing') hasMissing = true
      })

      let status: 'VALID' | 'WARNING' | 'ERROR' = 'VALID'
      if (hasError) status = 'ERROR'
      else if (hasWarning || hasMissing) status = 'WARNING'

      // Create child analysis
      const childAnalysis = createChildAnalysis({
        analysis_id: analysisResult.id,
        no: results[0].no,
        nik: nik,
        nama_anak: nama_anak,
        tanggal_lahir: tanggal_lahir,
        jenis_kelamin: originalChild?.jenis_kelamin || 'L', // Use actual gender from Excel
        total_data: results.length,
        valid_count: results.filter(r => r.validasi_input === 'OK').length,
        warning_count: results.filter(r => r.validasi_input === 'WARNING').length,
        error_count: results.filter(r => r.validasi_input === 'ERROR').length,
        missing_count: results.filter(r => r.status_berat === 'Missing' || r.status_tinggi === 'Missing').length,
        status: status,
        monthly_data: [] // Initialize empty array, will be populated later
      })

      // Create monthly data records
      results.forEach(result => {
        createMonthlyData({
          child_id: childAnalysis.id,
          bulan: result.bulan,
          tanggal_ukur: result.tanggal_ukur,
          umur: result.umur,
          berat: result.berat,
          tinggi: result.tinggi,
          cara_ukur: result.cara_ukur,
          status_berat: result.status_berat,
          status_tinggi: result.status_tinggi,
          validasi_input: result.validasi_input,
          keterangan: result.keterangan
        })
      })
    })

    // Store validation results in job data for download
    const jobData = {
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
      },
      validation_results: analysis.validation_results,
      analysis_id: analysisResult.id // Link to database
    }

    // Update analysis result with job_id
    analysisResult.job_id = 'temp-job-id'

    // Generate job with actual analysis data
    const newJob = addJob(jobData)

    // Update analysis result with actual job_id
    analysisResult.job_id = newJob.id

    console.log('Analysis completed and stored:', {
      analysis_id: analysisResult.id,
      job_id: newJob.id,
      total_children: analysis.total_anak,
      total_records: analysis.total_records
    })

    // Return response with job ID and analysis ID
    const response = {
      job_id: newJob.id,
      analysis_id: analysisResult.id,
      status: newJob.status,
      message: `Analisis selesai. ${analysis.total_anak} anak berhasil diproses.`,
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