export type ValidationStatus = 'OK' | 'ERROR' | 'WARNING'
export type GrowthStatus = 'Ideal' | 'Tidak Ideal' | 'Missing'

export interface MeasurementPreview {
  nama_anak: string
  bulan: string
  umur?: number
  berat?: number
  tinggi?: number
  status_berat: GrowthStatus
  status_tinggi: GrowthStatus
  validasi_input: ValidationStatus
  keterangan: string
}

export interface AnalysisSummary {
  total_anak: number
  total_records: number
  valid: number
  warning: number
  error: number
  missing: number
}

export interface Downloads {
  excel: string
  laporan: string
}

export interface AnalysisRequest {
  lapangan: File
  referensi: File
  jenis_kelamin_default: 'L' | 'P'
  gender?: 'L' | 'P'  // For backward compatibility with frontend
}

export interface AnalysisResponse {
  job_id: string
  status: string
  message: string
}

export interface JobStatus {
  job_id: string
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  summary?: AnalysisSummary
  downloads?: Downloads
  preview?: MeasurementPreview[]
  error_message?: string
}