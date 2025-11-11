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

// Convert Excel serial date to JavaScript date
function convertExcelDate(excelDate: any): string {
  if (!excelDate) return ''

  // If it's already a string, return as is
  if (typeof excelDate === 'string') return excelDate

  // If it's a number, convert from Excel serial date
  if (typeof excelDate === 'number') {
    const date = new Date((excelDate - 25569) * 86400 * 1000)
    return date.toLocaleDateString('id-ID')
  }

  return ''
}

async function parseExcelFile(file: File): Promise<ChildData[]> {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    console.log('=== Excel Parsing Debug ===')
    console.log('Total rows:', data.length)
    console.log('Headers:', data[0])

    // Skip header row and parse data
    const children: ChildData[] = []
    const headers = data[0] as string[]

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[]
      if (!row[0] || !row[1] || !row[2]) {
        console.log(`Skipping row ${i}: empty data`, row.slice(0, 5))
        continue
      }

      console.log(`Processing row ${i}:`, row.slice(0, 8))

      const child: ChildData = {
        no: parseInt(row[0]) || i,
        nik: row[1] ? row[1].toString() : '',
        nama_anak: row[2] ? row[2].toString() : '',
        tanggal_lahir: convertExcelDate(row[3]),
        jenis_kelamin: row[4] ? row[4].toString().toUpperCase() : 'L',
        bulan_data: []
      }

      console.log(`Child ${i}: ${child.nama_anak}, NIK: ${child.nik}, Tgl Lahir: ${child.tanggal_lahir}`)

      // Parse monthly data - improved logic for wide format
      const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                     'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']

      // Create a map of month name to column index
      const monthColumns: { [key: string]: number } = {}

      for (let col = 0; col < headers.length; col++) {
        const header = headers[col]?.toString().toUpperCase() || ''
        const month = months.find(m => header.includes(m))
        if (month) {
          monthColumns[month] = col
          console.log(`Found ${month} at column ${col}`)
        }
      }

      // Parse data for each month
      for (const month of months) {
        if (monthColumns[month] !== undefined) {
          const baseCol = monthColumns[month]

          const monthlyData: MonthlyData = {
            bulan: month,
            tanggal_ukur: convertExcelDate(row[baseCol + 1]) || '',
            umur: parseInt(row[baseCol + 2]) || 0,
            berat: parseFloat(row[baseCol + 3]) || 0,
            tinggi: parseFloat(row[baseCol + 4]) || 0,
            cara_ukur: row[baseCol + 5] ? row[baseCol + 5].toString() : ''
          }

          console.log(`${month}: umur=${monthlyData.umur}, berat=${monthlyData.berat}, tinggi=${monthlyData.tinggi}`)

          // Add if there's meaningful data (age > 0 OR weight/height > 0)
          if (monthlyData.umur > 0 || monthlyData.berat > 0 || monthlyData.tinggi > 0) {
            child.bulan_data.push(monthlyData)
          }
        }
      }

      console.log(`Total monthly data for ${child.nama_anak}: ${child.bulan_data.length}`)

      if (child.nama_anak) {
        children.push(child)
      }
    }

    console.log(`=== Parsing Complete ===`)
    console.log(`Parsed ${children.length} children from Excel file`)
    children.forEach(child => {
      console.log(`- ${child.nama_anak}: ${child.bulan_data.length} measurements`)
    })

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

  console.log('=== Starting Analysis ===')

  children.forEach(child => {
    console.log(`Analyzing child: ${child.nama_anak}, ${child.bulan_data.length} measurements`)

    // Sort monthly data by age for proper analysis
    const sortedData = [...child.bulan_data].sort((a, b) => a.umur - b.umur)

    sortedData.forEach((data, index) => {
      totalRecords++

      // Initialize validation result with default values
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

      console.log(`Processing ${data.bulan}: age=${data.umur}, weight=${data.berat}, height=${data.tinggi}`)

      // PRD 4.1 - Hierarki Validasi
      // 1. Missing Data Check
      if (data.berat === 0 || data.tinggi === 0) {
        missing++
        result.status_berat = 'Missing'
        result.status_tinggi = 'Missing'
        result.validasi_input = 'WARNING' // Kuning - Missing data
        result.keterangan = data.berat === 0 && data.tinggi === 0
          ? 'Data berat dan tinggi kosong'
          : data.berat === 0 ? 'Data berat kosong' : 'Data tinggi kosong'
        validationResults.push(result)
        console.log(`Missing data detected: ${result.keterangan}`)
        return
      }

      // 2. Konsistensi Tinggi Badan (Priority 1 - ERROR)
      if (index > 0 && data.tinggi < sortedData[index - 1].tinggi) {
        error++
        result.status_tinggi = 'Tidak Ideal'
        result.validasi_input = 'ERROR' // Merah - Tinggi menurun
        result.keterangan = `Tinggi menurun (indikasi salah input): ${sortedData[index - 1].tinggi}cm → ${data.tinggi}cm`
        validationResults.push(result)
        console.log(`Height decrease detected: ${result.keterangan}`)
        return
      }

      // 3. Gap umur antar baris anak > 1 bulan (Missing month)
      if (index > 0) {
        const prevMonth = sortedData[index - 1]
        const currentMonthAge = data.umur
        const prevMonthAge = prevMonth.umur
        const ageGap = currentMonthAge - prevMonthAge

        if (ageGap > 1) {
          warning++
          result.validasi_input = 'WARNING' // Kuning - Missing month
          result.keterangan = `Gap data: tidak ada pengukuran untuk ${ageGap - 1} bulan sebelum ${data.bulan}`
          // Add missing month records
          for (let gapAge = prevMonthAge + 1; gapAge < currentMonthAge; gapAge++) {
            totalRecords++
            missing++
            const missingResult: ValidationResult = {
              no: currentNo++,
              nik: child.nik,
              nama_anak: child.nama_anak,
              tanggal_lahir: child.tanggal_lahir,
              bulan: 'Missing',
              tanggal_ukur: '',
              umur: gapAge,
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
          validationResults.push(result)
          console.log(`Age gap detected: ${result.keterangan}`)
          return
        }
      }

      // 4. Anomali Berat (>10% decrease) (Priority 2 - WARNING ORANYE)
      if (index > 0 && data.berat < sortedData[index - 1].berat * 0.9) {
        const weightDecrease = ((sortedData[index - 1].berat - data.berat) / sortedData[index - 1].berat) * 100
        warning++
        result.status_berat = 'Tidak Ideal'
        result.validasi_input = 'WARNING' // Oranye - Anomali berat
        result.keterangan = `Anomali berat >10%: turun ${weightDecrease.toFixed(1)}% (${sortedData[index - 1].berat}kg → ${data.berat}kg)`
        validationResults.push(result)
        console.log(`Weight anomaly detected: ${result.keterangan}`)
        return
      }

      // 5. Rasionalitas vs Tabel Ideal (simplified check - WARNING ORANYE if not ideal)
      // For now, we'll use basic ranges - in production this should use WHO standards
      const weightStatus = checkWeightIdeal(data.umur, data.berat, child.jenis_kelamin)
      const heightStatus = checkHeightIdeal(data.umur, data.tinggi, child.jenis_kelamin)

      result.status_berat = weightStatus
      result.status_tinggi = heightStatus

      if (weightStatus === 'Tidak Ideal' || heightStatus === 'Tidak Ideal') {
        warning++
        result.validasi_input = 'WARNING' // Oranye - Berat/Tinggi tidak ideal
        result.keterangan = weightStatus === 'Tidak Ideal' && heightStatus === 'Tidak Ideal'
          ? 'Berat dan tinggi tidak ideal'
          : weightStatus === 'Tidak Ideal' ? 'Berat tidak ideal' : 'Tinggi tidak ideal'
        validationResults.push(result)
        console.log(`Non-ideal measurements: ${result.keterangan}`)
        return
      }

      // Default to valid if no issues (Hijau - OK)
      valid++
      result.validasi_input = 'OK'
      validationResults.push(result)
      console.log(`Valid measurement recorded`)
    })

    // Add missing months before first measurement if age > 1
    if (sortedData.length > 0) {
      const firstAge = sortedData[0].umur
      if (firstAge > 1) {
        console.log(`Adding missing months before first measurement for ${child.nama_anak}: ages 1 to ${firstAge - 1}`)
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

  console.log('=== Analysis Complete ===')
  console.log(`Total children: ${children.length}`)
  console.log(`Total records: ${totalRecords}`)
  console.log(`Valid: ${valid}, Warning: ${warning}, Error: ${error}, Missing: ${missing}`)

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

// Simplified ideal weight/height checks (in production use WHO standards)
function checkWeightIdeal(age: number, weight: number, gender: string): string {
  if (age < 1 || weight === 0) return 'Missing'

  // Basic ranges for demonstration (should use proper WHO tables)
  const minWeight = age * 0.5 + 3
  const maxWeight = age * 0.8 + 12

  return (weight >= minWeight && weight <= maxWeight) ? 'Ideal' : 'Tidak Ideal'
}

function checkHeightIdeal(age: number, height: number, gender: string): string {
  if (age < 1 || height === 0) return 'Missing'

  // Basic ranges for demonstration (should use proper WHO tables)
  const minHeight = age * 2 + 45
  const maxHeight = age * 3 + 80

  return (height >= minHeight && height <= maxHeight) ? 'Ideal' : 'Tidak Ideal'
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
      status: 'completed' as const,
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