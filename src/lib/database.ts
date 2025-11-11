// Simple in-memory database for storing analysis results
// In production, this would be replaced with actual database (PostgreSQL, MySQL, etc.)

export interface AnalysisResult {
  id: string
  job_id: string
  analyzer_name: string
  analyzer_institution: string
  created_at: string
  total_anak: number
  total_records: number
  valid: number
  warning: number
  error: number
  missing: number
  children: ChildAnalysis[]
  excel_file_url?: string
  txt_file_url?: string
}

export interface ChildAnalysis {
  id: string
  analysis_id: string
  no: number
  nik: string
  nama_anak: string
  tanggal_lahir: string
  jenis_kelamin: string
  total_data: number
  valid_count: number
  warning_count: number
  error_count: number
  missing_count: number
  status: 'VALID' | 'WARNING' | 'ERROR'
  monthly_data: MonthlyData[]
}

export interface MonthlyData {
  id: string
  child_id: string
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

// In-memory storage
let analysisResults: AnalysisResult[] = []
let childAnalyses: ChildAnalysis[] = []
let monthlyDataStorage: MonthlyData[] = []

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Analysis Results operations
export function createAnalysisResult(data: Omit<AnalysisResult, 'id' | 'children' | 'created_at'>): AnalysisResult {
  const analysis: AnalysisResult = {
    id: generateId(),
    created_at: new Date().toISOString(),
    children: [],
    ...data
  }

  analysisResults.unshift(analysis) // Add to beginning (newest first)
  console.log(`Created analysis result: ${analysis.id} with ${analysis.total_anak} children`)
  return analysis
}

export function getAnalysisResults(limit: number = 50, offset: number = 0): AnalysisResult[] {
  const results = analysisResults.slice(offset, offset + limit)
  console.log(`GET analysis results: returning ${results.length} results (offset: ${offset}, limit: ${limit})`)
  return results
}

export function getAnalysisResultById(id: string): AnalysisResult | null {
  const result = analysisResults.find(r => r.id === id)
  return result || null
}

export function deleteAnalysisResult(id: string): boolean {
  const index = analysisResults.findIndex(r => r.id === id)
  if (index === -1) return false

  const deleted = analysisResults.splice(index, 1)[0]

  // Also delete related child analyses
  childAnalyses = childAnalyses.filter(c => c.analysis_id !== id)
  monthlyDataStorage = monthlyDataStorage.filter(m => {
    const child = childAnalyses.find(c => c.id === m.child_id)
    return child?.analysis_id !== id
  })

  console.log(`Deleted analysis result: ${deleted.id}`)
  return true
}

// Child Analysis operations
export function createChildAnalysis(data: Omit<ChildAnalysis, 'id' | 'created_at'>): ChildAnalysis {
  const child: ChildAnalysis = {
    id: generateId(),
    ...data
  }

  childAnalyses.push(child)

  // Update parent analysis with children
  const parent = analysisResults.find(a => a.id === child.analysis_id)
  if (parent) {
    parent.children.push(child)
  }

  return child
}

export function getChildAnalysesByAnalysisId(analysisId: string): ChildAnalysis[] {
  return childAnalyses.filter(c => c.analysis_id === analysisId)
}

// Monthly Data operations
export function createMonthlyData(data: Omit<MonthlyData, 'id'>): MonthlyData {
  const monthly: MonthlyData = {
    id: generateId(),
    ...data
  }

  monthlyDataStorage.push(monthly)
  return monthly
}

export function getMonthlyDataByChildId(childId: string): MonthlyData[] {
  return monthlyDataStorage.filter(m => m.child_id === childId)
}

// Statistics
export function getAnalysisStatistics() {
  const total = analysisResults.length
  const totalChildren = analysisResults.reduce((sum, a) => sum + a.total_anak, 0)
  const totalRecords = analysisResults.reduce((sum, a) => sum + a.total_records, 0)

  return {
    total_analyses: total,
    total_children: totalChildren,
    total_records: totalRecords
  }
}

// Search and filter
export function searchAnalysisResults(query: string): AnalysisResult[] {
  const lowerQuery = query.toLowerCase()
  return analysisResults.filter(a =>
    a.analyzer_name.toLowerCase().includes(lowerQuery) ||
    a.analyzer_institution.toLowerCase().includes(lowerQuery) ||
    a.children.some(c =>
      c.nama_anak.toLowerCase().includes(lowerQuery) ||
      c.nik.includes(query)
    )
  )
}

export function filterAnalysisResultsByDate(startDate: string, endDate: string): AnalysisResult[] {
  const start = new Date(startDate)
  const end = new Date(endDate)

  return analysisResults.filter(a => {
    const date = new Date(a.created_at)
    return date >= start && date <= end
  })
}

// Initialize with sample data
export function initializeSampleData() {
  console.log('Initializing sample data...')

  const sampleAnalysis = createAnalysisResult({
    job_id: 'sample-job-123',
    analyzer_name: 'Dr. Ahmad',
    analyzer_institution: 'Puskesmas Sehat',
    total_anak: 20,
    total_records: 240,
    valid: 180,
    warning: 42,
    error: 18,
    missing: 0
  })

  // Add sample children
  for (let i = 1; i <= 20; i++) {
    const child = createChildAnalysis({
      analysis_id: sampleAnalysis.id,
      no: i,
      nik: `350704${i.toString().padStart(6, '0')}`,
      nama_anak: `Anak ${i}`,
      tanggal_lahir: '2023-01-15',
      jenis_kelamin: i % 2 === 0 ? 'P' : 'L',
      total_data: 12,
      valid_count: 10,
      warning_count: 2,
      error_count: 0,
      missing_count: 0,
      status: i % 5 === 0 ? 'WARNING' : 'VALID'
    })

    // Add sample monthly data
    for (let month = 1; month <= 12; month++) {
      createMonthlyData({
        child_id: child.id,
        bulan: ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
                 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'][month - 1],
        tanggal_ukur: `15/${month.toString().padStart(2, '0')}/2023`,
        umur: month,
        berat: 3 + (month * 0.2),
        tinggi: 50 + (month * 1.5),
        cara_ukur: month <= 6 ? 'Terlentang' : 'Berdiri',
        status_berat: 'Ideal',
        status_tinggi: 'Ideal',
        validasi_input: 'OK',
        keterangan: ''
      })
    }
  }

  console.log('Sample data initialized')
}