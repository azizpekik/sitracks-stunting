// Date normalization and age calculation utilities
// Following analyze.md specifications for proper date handling

export interface NormalizedDate {
  originalValue: string | number | Date | null | undefined
  normalizedDate: Date
  formatted: string // DD/MM/YYYY
  isValid: boolean
  parseMethod: 'direct' | 'excel_serial' | 'format_detection'
}

export interface AgeCalculation {
  years: number
  months: number
  total_months: number
  days: number
  is_precise: boolean // true if exact date, false if estimated
}

export interface MeasurementRecord {
  date: Date
  formatted_date: string
  age_months: number
  age_calculation: AgeCalculation
  is_valid_date: boolean
  weight_kg?: number
  height_cm?: number
  berat?: number
  tinggi?: number
  cara_ukur?: string
  bulan?: string
}

// Convert Excel serial date to JavaScript Date
export function convertExcelSerialDate(serial: number): Date {
  // Excel's epoch starts on 1900-01-01, but it incorrectly treats 1900 as a leap year
  // Excel day 1 = 1900-01-01, Excel day 60 = 1900-02-29 (non-existent), Excel day 61 = 1900-03-01
  const excelEpoch = new Date(1900, 0, 1)
  const daysSinceEpoch = serial - 1

  // Adjust for Excel's leap year bug
  const adjustedDays = serial > 59 ? daysSinceEpoch - 1 : daysSinceEpoch

  const result = new Date(excelEpoch.getTime() + adjustedDays * 24 * 60 * 60 * 1000)
  return result
}

// Parse various date formats with automatic detection
export function parseDate(input: string | number | Date | null | undefined): NormalizedDate {
  if (!input) {
    return {
      originalValue: input,
      normalizedDate: new Date(),
      formatted: '',
      isValid: false,
      parseMethod: 'direct'
    }
  }

  // If already a Date object
  if (input instanceof Date) {
    if (isNaN(input.getTime())) {
      return {
        originalValue: input,
        normalizedDate: new Date(),
        formatted: '',
        isValid: false,
        parseMethod: 'direct'
      }
    }

    return {
      originalValue: input,
      normalizedDate: input,
      formatted: formatDateIndonesian(input),
      isValid: true,
      parseMethod: 'direct'
    }
  }

  // If it's a number, try Excel serial conversion first
  if (typeof input === 'number') {
    if (input > 0 && input < 100000) { // Reasonable Excel serial range
      try {
        const excelDate = convertExcelSerialDate(input)
        return {
          originalValue: input,
          normalizedDate: excelDate,
          formatted: formatDateIndonesian(excelDate),
          isValid: true,
          parseMethod: 'excel_serial'
        }
      } catch (error) {
        console.warn('Failed to convert Excel serial date:', input, error)
      }
    }

    // If not Excel serial, treat as invalid
    return {
      originalValue: input,
      normalizedDate: new Date(),
      formatted: '',
      isValid: false,
      parseMethod: 'direct'
    }
  }

  // If it's a string, try various formats
  if (typeof input === 'string') {
    const trimmed = input.trim()
    if (!trimmed) {
      return {
        originalValue: input,
        normalizedDate: new Date(),
        formatted: '',
        isValid: false,
        parseMethod: 'direct'
      }
    }

    // Try Excel serial conversion if it looks like a number string
    if (/^\d+$/.test(trimmed)) {
      try {
        const serial = parseInt(trimmed)
        if (serial > 0 && serial < 100000) {
          const excelDate = convertExcelSerialDate(serial)
          return {
            originalValue: input,
            normalizedDate: excelDate,
            formatted: formatDateIndonesian(excelDate),
            isValid: true,
            parseMethod: 'excel_serial'
          }
        }
      } catch (error) {
        // Continue to other formats
      }
    }

    // Try various date formats
    const formats = [
      // Indonesian formats (DD/MM/YYYY, DD-MM-YYYY)
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
      // ISO format (YYYY-MM-DD)
      /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/,
      // US format (MM/DD/YYYY) - try last as it can conflict with Indonesian
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
    ]

    for (const format of formats) {
      const match = trimmed.match(format)
      if (match) {
        try {
          let day, month, year

          if (trimmed.includes('/') || trimmed.includes('-')) {
            // Try Indonesian format first (DD/MM/YYYY)
            if (format.source.includes('\\\\d{1,2}[\\\\/-]\\\\d{1,2}[\\\\/-]\\\\d{4}')) {
              day = parseInt(match[1])
              month = parseInt(match[2])
              year = parseInt(match[3])

              // Check if this makes sense as Indonesian format
              if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
                const date = new Date(year, month - 1, day)
                if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                  return {
                    originalValue: input,
                    normalizedDate: date,
                    formatted: formatDateIndonesian(date),
                    isValid: true,
                    parseMethod: 'format_detection'
                  }
                }
              }

              // Try swapping day/month (US format)
              day = parseInt(match[2])
              month = parseInt(match[1])
              const date = new Date(year, month - 1, day)
              if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
                return {
                  originalValue: input,
                  normalizedDate: date,
                  formatted: formatDateIndonesian(date),
                  isValid: true,
                  parseMethod: 'format_detection'
                }
              }
            }
          }
        } catch (error) {
          // Continue to next format
        }
      }
    }

    // Try native Date parsing as last resort
    try {
      const date = new Date(trimmed)
      if (!isNaN(date.getTime())) {
        return {
          originalValue: input,
          normalizedDate: date,
          formatted: formatDateIndonesian(date),
          isValid: true,
          parseMethod: 'format_detection'
        }
      }
    } catch (error) {
      // Continue to failure
    }
  }

  // All parsing attempts failed
  return {
    originalValue: input,
    normalizedDate: new Date(),
    formatted: String(input),
    isValid: false,
    parseMethod: 'direct'
  }
}

// Format date in Indonesian format (DD/MM/YYYY)
export function formatDateIndonesian(date: Date): string {
  if (isNaN(date.getTime())) return ''

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  return `${day}/${month}/${year}`
}

// Calculate age in months with precision tracking
export function calculateAge(birthDate: Date, measurementDate: Date): AgeCalculation {
  if (isNaN(birthDate.getTime()) || isNaN(measurementDate.getTime())) {
    return {
      years: 0,
      months: 0,
      total_months: 0,
      days: 0,
      is_precise: false
    }
  }

  // Ensure measurement date is after birth date
  if (measurementDate < birthDate) {
    return {
      years: 0,
      months: 0,
      total_months: 0,
      days: 0,
      is_precise: false
    }
  }

  let years = measurementDate.getFullYear() - birthDate.getFullYear()
  let months = measurementDate.getMonth() - birthDate.getMonth()
  let days = measurementDate.getDate() - birthDate.getDate()

  // Adjust for negative values
  if (days < 0) {
    months--
    const lastMonth = new Date(measurementDate.getFullYear(), measurementDate.getMonth(), 0)
    days += lastMonth.getDate()
  }

  if (months < 0) {
    years--
    months += 12
  }

  const total_months = years * 12 + months

  // Determine precision (consider precise if we have exact dates)
  const is_precise = true // We'll always use exact calculation now

  return {
    years,
    months,
    total_months,
    days,
    is_precise
  }
}

// Create measurement record with normalized date and calculated age
export function createMeasurementRecord(
  dateInput: string | number | Date | null | undefined,
  birthDate: Date,
  recordIndex?: number
): MeasurementRecord {
  const normalizedDate = parseDate(dateInput)

  const age_calculation = normalizedDate.isValid
    ? calculateAge(birthDate, normalizedDate.normalizedDate)
    : {
        years: 0,
        months: 0,
        total_months: 0,
        days: 0,
        is_precise: false
      }

  return {
    date: normalizedDate.normalizedDate,
    formatted_date: normalizedDate.formatted,
    age_months: age_calculation.total_months,
    age_calculation,
    is_valid_date: normalizedDate.isValid
  }
}

// Sort measurement records chronologically
export function sortMeasurementsChronologically(measurements: MeasurementRecord[]): MeasurementRecord[] {
  return [...measurements].sort((a, b) => {
    if (!a.is_valid_date && !b.is_valid_date) return 0
    if (!a.is_valid_date) return 1
    if (!b.is_valid_date) return -1
    return a.date.getTime() - b.date.getTime()
  })
}

// Detect data gaps and missing months
export function detectMissingMonths(
  measurements: MeasurementRecord[],
  startAge?: number,
  endAge?: number
): { missing_months: number[]; has_gaps: boolean } {
  const validMeasurements = measurements.filter(m => m.is_valid_date && m.age_months >= 0)
  if (validMeasurements.length === 0) {
    return { missing_months: [], has_gaps: false }
  }

  const sortedMeasurements = sortMeasurementsChronologically(validMeasurements)
  const missing_months: number[] = []

  // Find the actual age range from measurements
  const firstAge = startAge ?? sortedMeasurements[0].age_months
  const lastAge = endAge ?? sortedMeasurements[sortedMeasurements.length - 1].age_months

  // Create set of ages that have measurements
  const measuredAges = new Set(sortedMeasurements.map(m => m.age_months))

  // Check for gaps in the expected range
  for (let age = firstAge; age <= lastAge; age++) {
    if (!measuredAges.has(age)) {
      missing_months.push(age)
    }
  }

  return {
    missing_months,
    has_gaps: missing_months.length > 0
  }
}

// Normalize and validate child data
export interface NormalizedChildData {
  no: number
  nik: string
  nama_anak: string
  tanggal_lahir: NormalizedDate
  jenis_kelamin: 'L' | 'P'
  measurements: MeasurementRecord[]
  is_valid: boolean
  validation_errors: string[]
}

export function normalizeChildData(
  rawData: any,
  headers: string[]
): NormalizedChildData {
  const validation_errors: string[] = []

  // Extract basic child information
  const child: NormalizedChildData = {
    no: parseInt(rawData[0]) || 0,
    nik: String(rawData[1] || '').trim(),
    nama_anak: String(rawData[2] || '').trim(),
    tanggal_lahir: parseDate(rawData[3]),
    jenis_kelamin: (String(rawData[4] || '').toUpperCase().charAt(0) as 'L' | 'P') || 'L',
    measurements: [],
    is_valid: true,
    validation_errors
  }

  // Validate required fields
  if (!child.nik) {
    validation_errors.push('NIK kosong')
    child.is_valid = false
  }

  if (!child.nama_anak) {
    validation_errors.push('Nama anak kosong')
    child.is_valid = false
  }

  if (!child.tanggal_lahir.isValid) {
    validation_errors.push(`Tanggal lahir tidak valid: ${child.tanggal_lahir.originalValue}`)
    child.is_valid = false
  }

  // Parse monthly measurements
  const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']

  // Create a map of month name to column index
  const monthColumns: { [key: string]: number } = {}
  for (let col = 0; col < headers.length; col++) {
    const header = headers[col]?.toString().toUpperCase() || ''
    const month = months.find(m => header.includes(m))
    if (month) {
      monthColumns[month] = col
    }
  }

  // Parse each month's data
  for (const month of months) {
    if (monthColumns[month] !== undefined) {
      const baseCol = monthColumns[month]

      const tanggal_ukur = parseDate(rawData[baseCol + 1])
      const umur = parseInt(rawData[baseCol + 2]) || 0
      const berat = parseFloat(rawData[baseCol + 3]) || 0
      const tinggi = parseFloat(rawData[baseCol + 4]) || 0
      const cara_ukur = String(rawData[baseCol + 5] || '').trim()

      // Only create measurement if there's meaningful data
      if (umur > 0 || berat > 0 || tinggi > 0 || tanggal_ukur.isValid) {
        const measurement = createMeasurementRecord(
          tanggal_ukur.isValid ? tanggal_ukur : month, // Use month as fallback
          child.tanggal_lahir.normalizedDate
        )

        // Override age if provided in data
        if (umur > 0) {
          measurement.age_months = umur
          measurement.age_calculation.total_months = umur
          measurement.age_calculation.years = Math.floor(umur / 12)
          measurement.age_calculation.months = umur % 12
        }

        // Store measurement data
        (measurement as any).berat = berat
        (measurement as any).tinggi = tinggi
        (measurement as any).cara_ukur = cara_ukur
        (measurement as any).bulan = month

        child.measurements.push(measurement)
      }
    }
  }

  // Sort measurements by age
  child.measurements = sortMeasurementsChronologically(child.measurements)

  return child
}

// Get month name from number (1 = JANUARI, 12 = DESEMBER)
export function getMonthName(monthNumber: number): string {
  const months = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER']

  if (monthNumber >= 1 && monthNumber <= 12) {
    return months[monthNumber - 1]
  }

  return 'UNKNOWN'
}

// Format age for display
export function formatAge(age: AgeCalculation): string {
  if (age.years > 0) {
    return `${age.years} tahun ${age.months} bulan`
  }
  return `${age.months} bulan`
}