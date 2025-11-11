import { NextRequest, NextResponse } from 'next/server'
import { addJob } from '@/lib/mock-data-store'
import { createAnalysisResult, createChildAnalysis, createMonthlyData } from '@/lib/database'
import { calculateZScores, validateMeasurement, VALIDATION_THRESHOLDS, ValidationStatus } from '@/lib/who-standards'
import { normalizeChildData, sortMeasurementsChronologically, detectMissingMonths, getMonthName, formatAge } from '@/lib/date-utils'
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

async function parseExcelFile(file: File): Promise<any[]> {
  try {
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

    console.log('=== Excel Parsing Debug (PRD Compliant) ===')
    console.log('Total rows:', data.length)
    console.log('Headers:', data[0])

    // Skip header row and parse data
    const children: any[] = []
    const headers = data[0] as string[]

    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[]
      if (!row[0] || !row[1] || !row[2]) {
        console.log(`Skipping row ${i}: empty basic data`, row.slice(0, 5))
        continue
      }

      console.log(`\nProcessing row ${i}:`, row.slice(0, 10))

      // Use the comprehensive normalization system
      const normalizedChild = normalizeChildData(row, headers)

      if (!normalizedChild.is_valid) {
        console.log(`Skipping row ${i}: validation failed`, normalizedChild.validation_errors)
        continue
      }

      console.log(`Normalized child ${i}: ${normalizedChild.nama_anak}`)
      console.log(`- NIK: ${normalizedChild.nik}`)
      console.log(`- Tgl Lahir: ${normalizedChild.tanggal_lahir.formatted} (${normalizedChild.tanggal_lahir.parseMethod})`)
      console.log(`- Gender: ${normalizedChild.jenis_kelamin}`)
      console.log(`- Measurements: ${normalizedChild.measurements.length}`)

      // Convert normalized measurements back to the expected format
      const child: any = {
        no: normalizedChild.no,
        nik: normalizedChild.nik,
        nama_anak: normalizedChild.nama_anak,
        tanggal_lahir: normalizedChild.tanggal_lahir.formatted,
        jenis_kelamin: normalizedChild.jenis_kelamin,
        bulan_data: normalizedChild.measurements.map((measurement: any) => ({
          bulan: measurement.bulan || getMonthName(measurement.age_months),
          tanggal_ukur: measurement.formatted_date,
          umur: measurement.age_months,
          berat: measurement.berat || 0,
          tinggi: measurement.tinggi || 0,
          cara_ukur: measurement.cara_ukur || ''
        }))
      }

      console.log(`Final child data for ${child.nama_anak}: ${child.bulan_data.length} monthly records`)

      if (child.nama_anak && child.bulan_data.length > 0) {
        children.push(child)
      }
    }

    console.log(`\n=== Parsing Complete ===`)
    console.log(`Successfully parsed ${children.length} children from Excel file`)

    // Summary statistics
    const totalMeasurements = children.reduce((sum, child) => sum + child.bulan_data.length, 0)
    console.log(`Total measurements across all children: ${totalMeasurements}`)

    children.forEach((child, index) => {
      const measurementsWithWeight = child.bulan_data.filter((m: any) => m.berat > 0).length
      const measurementsWithHeight = child.bulan_data.filter((m: any) => m.tinggi > 0).length
      console.log(`${index + 1}. ${child.nama_anak}: ${child.bulan_data.length} measurements (${measurementsWithWeight} with weight, ${measurementsWithHeight} with height)`)
    })

    return children
  } catch (error) {
    console.error('Error parsing Excel file:', error)
    throw new Error('Gagal membaca file Excel. Pastikan format file sesuai.')
  }
}

function analyzeChildData(children: any[]) {
  let totalRecords = 0
  let valid = 0
  let warning = 0
  let error = 0
  let missing = 0

  const validationResults: ValidationResult[] = []
  let currentNo = 1

  console.log('=== Starting Complete Analysis (PRD Compliant) ===')

  children.forEach(child => {
    console.log(`\nAnalyzing child: ${child.nama_anak}, ${child.bulan_data.length} measurements`)

    // Normalize child data first
    const normalizedChild = {
      ...child,
      measurements: child.bulan_data.map((data: any) => ({
        age_months: data.umur,
        weight_kg: data.berat,
        height_cm: data.tinggi,
        berat: data.berat,
        tinggi: data.tinggi,
        cara_ukur: data.cara_ukur,
        bulan: data.bulan,
        date: data.tanggal_ukur ? new Date(data.tanggal_ukur) : new Date(),
        month: data.bulan,
        formatted_date: data.tanggal_ukur || '',
        age_calculation: {
          years: Math.floor(data.umur / 12),
          months: data.umur % 12,
          total_months: data.umur,
          days: 0,
          is_precise: true
        },
        is_valid_date: !!data.tanggal_ukur
      }))
    }

    // Sort measurements by age for proper analysis
    const sortedMeasurements = sortMeasurementsChronologically(normalizedChild.measurements)
    console.log(`Sorted ${sortedMeasurements.length} measurements chronologically`)

    // Detect missing months in the expected range
    const validMeasurements = sortedMeasurements.filter(m => m.weight_kg > 0 || m.height_cm > 0)
    const { missing_months, has_gaps } = detectMissingMonths(validMeasurements)

    if (has_gaps) {
      console.log(`Missing months detected: ${missing_months.join(', ')}`)
    }

    // Process each measurement with full PRD validation
    sortedMeasurements.forEach((measurement, index) => {
      totalRecords++

      console.log(`\nProcessing ${measurement.month || 'Unknown'}: age=${measurement.age_months}, weight=${measurement.weight_kg}kg, height=${measurement.height_cm}cm`)

      // Initialize validation result with default values
      const result: ValidationResult = {
        no: currentNo++,
        nik: child.nik,
        nama_anak: child.nama_anak,
        tanggal_lahir: child.tanggal_lahir,
        bulan: measurement.month || 'Unknown',
        tanggal_ukur: measurement.date ? measurement.date.toLocaleDateString('id-ID') : '',
        umur: measurement.age_months,
        berat: measurement.weight_kg || 0,
        tinggi: measurement.height_cm || 0,
        cara_ukur: (measurement as any).cara_ukur || '',
        status_berat: 'Ideal',
        status_tinggi: 'Ideal',
        validasi_input: 'OK',
        keterangan: ''
      }

      // PRD 4.1 - Hierarki Validasi (Short-circuit evaluation)

      // 1. Missing Data Check (Priority: Missing)
      if (measurement.weight_kg === 0 || measurement.height_cm === 0) {
        missing++
        result.status_berat = 'Missing'
        result.status_tinggi = 'Missing'
        result.validasi_input = 'WARNING' // Following PRD: Missing = WARNING level
        result.keterangan = measurement.weight_kg === 0 && measurement.height_cm === 0
          ? 'Data berat dan tinggi kosong'
          : measurement.weight_kg === 0 ? 'Data berat kosong' : 'Data tinggi kosong'
        validationResults.push(result)
        console.log(`Missing data detected: ${result.keterangan}`)
        return
      }

      // Get previous measurement for comparison
      const previousMeasurement = index > 0 ? sortedMeasurements[index - 1] : null

      // Create validation input for WHO standards
      const currentMeasurement = {
        age_months: measurement.age_months,
        weight_kg: measurement.weight_kg,
        height_cm: measurement.height_cm,
        date: measurement.date
      }

      const previousValidationData = previousMeasurement ? {
        age_months: previousMeasurement.age_months,
        weight_kg: previousMeasurement.weight_kg,
        height_cm: previousMeasurement.height_cm,
        date: previousMeasurement.date
      } : undefined

      // Perform comprehensive validation
      const validationResult = validateMeasurement(
        currentMeasurement,
        previousValidationData,
        child.jenis_kelamin
      )

      console.log(`Validation result: ${validationResult.status}, flags: [${validationResult.flags.join(', ')}]`)

      // Apply validation results
      if (validationResult.flags.length > 0) {
        result.keterangan = validationResult.flags.join('; ')
      }

      // Set status based on validation result with priority system
      // Priority: ERROR > WARNING > OK
      switch (validationResult.status) {
        case 'ERROR':
          error++
          result.validasi_input = 'ERROR'
          result.status_berat = 'Tidak Ideal'
          result.status_tinggi = 'Tidak Ideal'
          console.log(`ERROR detected: ${result.keterangan}`)
          break

        case 'WARNING':
          warning++
          result.validasi_input = 'WARNING'
          // Set specific status based on flags
          if (result.keterangan.includes('tidak ideal')) {
            result.status_berat = result.keterangan.includes('berat') ? 'Tidak Ideal' : 'Ideal'
            result.status_tinggi = result.keterangan.includes('tinggi') ? 'Tidak Ideal' : 'Ideal'
          }
          console.log(`WARNING detected: ${result.keterangan}`)
          break

        case 'OK':
          valid++
          result.validasi_input = 'OK'
          // Use Z-score results to determine status if available
          if (validationResult.z_scores) {
            const { z_wfa, z_hfa, wfa_status, hfa_status } = validationResult.z_scores

            result.status_berat = wfa_status.includes('UNDER') || wfa_status.includes('SEVERE') ? 'Tidak Ideal' : 'Ideal'
            result.status_tinggi = hfa_status.includes('STUNTED') ? 'Tidak Ideal' : 'Ideal'

            // Add Z-score info to remarks if significant
            if (Math.abs(z_wfa) > 2 || Math.abs(z_hfa) > 2) {
              const zInfo = []
              if (Math.abs(z_wfa) > 2) zInfo.push(`WFA=${z_wfa}`)
              if (Math.abs(z_hfa) > 2) zInfo.push(`HFA=${z_hfa}`)
              if (result.keterangan) {
                result.keterangan += ` (Z-score: ${zInfo.join(', ')})`
              } else {
                result.keterangan = `Z-score: ${zInfo.join(', ')}`
              }
            }
          }
          console.log(`Valid measurement recorded`)
          break
      }

      validationResults.push(result)
    })

    // Add missing months that were detected but not recorded
    if (has_gaps) {
      console.log(`Adding ${missing_months.length} missing month records`)
      missing_months.forEach(missingAge => {
        totalRecords++
        missing++

        const missingResult: ValidationResult = {
          no: currentNo++,
          nik: child.nik,
          nama_anak: child.nama_anak,
          tanggal_lahir: child.tanggal_lahir,
          bulan: getMonthName(missingAge),
          tanggal_ukur: '',
          umur: missingAge,
          berat: 0,
          tinggi: 0,
          cara_ukur: '',
          status_berat: 'Missing',
          status_tinggi: 'Missing',
          validasi_input: 'WARNING',
          keterangan: 'Tidak diukur'
        }
        validationResults.push(missingResult)
      })
    }

    // Add missing months before first measurement if age > 1
    if (sortedMeasurements.length > 0) {
      const firstAge = sortedMeasurements[0].age_months
      if (firstAge > 1) {
        console.log(`Adding missing months before first measurement for ${child.nama_anak}: ages 1 to ${firstAge - 1}`)
        for (let age = 1; age < firstAge; age++) {
          // Skip if this age was already handled by gap detection
          if (!missing_months.includes(age)) {
            totalRecords++
            missing++

            const missingResult: ValidationResult = {
              no: currentNo++,
              nik: child.nik,
              nama_anak: child.nama_anak,
              tanggal_lahir: child.tanggal_lahir,
              bulan: getMonthName(age),
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
    }
  })

  console.log('\n=== Analysis Complete ===')
  console.log(`Total children: ${children.length}`)
  console.log(`Total records: ${totalRecords}`)
  console.log(`Valid: ${valid} (${((valid/totalRecords)*100).toFixed(1)}%)`)
  console.log(`Warning: ${warning} (${((warning/totalRecords)*100).toFixed(1)}%)`)
  console.log(`Error: ${error} (${((error/totalRecords)*100).toFixed(1)}%)`)
  console.log(`Missing: ${missing} (${((missing/totalRecords)*100).toFixed(1)}%)`)

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