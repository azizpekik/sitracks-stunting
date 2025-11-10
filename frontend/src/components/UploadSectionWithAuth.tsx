'use client'

import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClientWithAuth } from '@/lib/api'
import { apiInterceptor } from '@/lib/api-interceptor'
import { Upload, FileText, AlertCircle, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface User {
  id: number
  username: string
  full_name: string
  is_active: boolean
  created_at: string
}

interface MasterReference {
  id: number
  name: string
  description?: string
  file_name: string
  created_at: string
}

interface UploadSectionWithAuthProps {
  onFilesSelected: (
    files: { lapangan: File; referensi: File | null },
    analyzerName: string,
    analyzerInstitution: string,
    masterReferenceId: number | null
  ) => void
  disabled?: boolean
  currentUser: User | null
}

export function UploadSectionWithAuth({ onFilesSelected, disabled = false, currentUser }: UploadSectionWithAuthProps) {
  const [lapanganFile, setLapanganFile] = useState<File | null>(null)
  const [referensiFile, setReferensiFile] = useState<File | null>(null)
  const [analyzerName, setAnalyzerName] = useState('')
  const [analyzerInstitution, setAnalyzerInstitution] = useState('')
  const [selectedMasterReferenceId, setSelectedMasterReferenceId] = useState<number | null>(null)
  const [useMasterReference, setUseMasterReference] = useState(false)

  // Fetch master references
  const { data: masterReferences, isLoading: isLoadingReferences } = useQuery<MasterReference[]>({
    queryKey: ['masterReferences'],
    queryFn: async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://$(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')'
      const response = await apiInterceptor.get(`${API_BASE_URL}/auth/master-references`)
      return response.json()
    },
    enabled: true,
  })

  const handleFileChange = useCallback((
    file: File | null,
    type: 'lapangan' | 'referensi'
  ) => {
    if (type === 'lapangan') {
      setLapanganFile(file)
    } else {
      setReferensiFile(file)
      // When a referensi file is uploaded, disable master reference usage
      if (file) {
        setUseMasterReference(false)
        setSelectedMasterReferenceId(null)
      }
    }
  }, [])

  const handleProcess = useCallback(() => {
    console.log('=== DEBUG: handleProcess called ===')
    console.log('lapanganFile:', lapanganFile)
    console.log('referensiFile:', referensiFile)
    console.log('useMasterReference:', useMasterReference)
    console.log('selectedMasterReferenceId:', selectedMasterReferenceId)
    console.log('analyzerName:', analyzerName)
    console.log('analyzerInstitution:', analyzerInstitution)

    // Validate files
    if (!lapanganFile) {
      alert('Silakan pilih file data lapangan')
      return
    }

    if (!useMasterReference && !referensiFile) {
      alert('Silakan pilih file referensi atau pilih master reference')
      return
    }

    if (!analyzerName.trim()) {
      alert('Silakan masukkan nama analyzer')
      return
    }

    if (!analyzerInstitution.trim()) {
      alert('Silakan masukkan nama instansi')
      return
    }

    // All validations passed
    console.log('All validations passed, calling onFilesSelected')

    onFilesSelected(
      {
        lapangan: lapanganFile,
        referensi: useMasterReference ? null : referensiFile
      },
      analyzerName.trim(),
      analyzerInstitution.trim(),
      useMasterReference ? selectedMasterReferenceId : null
    )
  }, [lapanganFile, referensiFile, useMasterReference, selectedMasterReferenceId, analyzerName, analyzerInstitution, onFilesSelected])

  const handleMasterReferenceToggle = (checked: boolean) => {
    setUseMasterReference(checked)
    if (checked) {
      // Clear uploaded referensi file when using master reference
      setReferensiFile(null)
    } else {
      // Clear selected master reference when not using master reference
      setSelectedMasterReferenceId(null)
    }
  }

  const isReady = lapanganFile &&
    (useMasterReference ? selectedMasterReferenceId : referensiFile) &&
    analyzerName.trim() &&
    analyzerInstitution.trim() &&
    !disabled

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Data Pertumbuhan Anak</CardTitle>
        <CardDescription>
          Upload file Excel data lapangan dan pilih referensi untuk memulai analisis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Analyzer Information */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-gray-900">Informasi Analyzer</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Analyzer *
            </label>
            <input
              type="text"
              value={analyzerName}
              onChange={(e) => setAnalyzerName(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Nur Azis"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instansi *
            </label>
            <input
              type="text"
              value={analyzerInstitution}
              onChange={(e) => setAnalyzerInstitution(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Posyandu Dampit"
            />
          </div>
        </div>

        {/* File Upload Areas */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-gray-900">Upload File</h3>
          </div>

          {/* Lapangan File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 transition-colors">
            <input
              type="file"
              id="lapangan"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'lapangan')}
              disabled={disabled}
              className="hidden"
            />
            <label htmlFor="lapangan" className="cursor-pointer">
              <div className="flex flex-col items-center space-y-2">
                <FileText className="h-8 w-8 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {lapanganFile ? lapanganFile.name : 'Pilih File Data Lapangan'}
                </span>
                <span className="text-xs text-gray-500">
                  Excel (.xlsx, .xls) - Maks 10MB
                </span>
              </div>
            </label>
          </div>

          {/* Reference Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Sumber Referensi
            </label>

            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="referenceType"
                  checked={!useMasterReference}
                  onChange={() => handleMasterReferenceToggle(false)}
                  disabled={disabled}
                  className="text-blue-600"
                />
                <span className="text-sm">Upload File Referensi Baru</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="referenceType"
                  checked={useMasterReference}
                  onChange={() => handleMasterReferenceToggle(true)}
                  disabled={disabled}
                  className="text-blue-600"
                />
                <span className="text-sm">Gunakan Master Reference Tersimpan</span>
              </label>
            </div>

            {/* Upload Referensi File */}
            {!useMasterReference && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary-400 transition-colors">
                <input
                  type="file"
                  id="referensi"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null, 'referensi')}
                  disabled={disabled}
                  className="hidden"
                />
                <label htmlFor="referensi" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="h-8 w-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {referensiFile ? referensiFile.name : 'Pilih File Tabel Referensi'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Excel (.xlsx, .xls) - Maks 10MB
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Master Reference Selection */}
            {useMasterReference && (
              <div>
                <select
                  value={selectedMasterReferenceId || ''}
                  onChange={(e) => setSelectedMasterReferenceId(e.target.value ? Number(e.target.value) : null)}
                  disabled={disabled || isLoadingReferences}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Pilih Master Reference</option>
                  {masterReferences?.map((ref) => (
                    <option key={ref.id} value={ref.id}>
                      {ref.name} - {ref.file_name}
                    </option>
                  ))}
                </select>
                {isLoadingReferences && (
                  <p className="text-xs text-gray-500 mt-1">Memuat master references...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Process Button */}
        <button
          onClick={handleProcess}
          disabled={!isReady}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isReady
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>{disabled ? 'Memproses...' : 'Proses Analisis'}</span>
          </div>
        </button>

        {/* Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Format File yang Diperlukan:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><strong>Data Lapangan:</strong> Format wide dengan kolom:
                  <ul className="list-disc list-inside ml-4 mt-1">
                    <li><em>Identitas:</em> No, NIK, nama_anak, TANGGAL LAHIR, JENIS_KELAMIN (L/P)</li>
                    <li><em>Per Bulan (JANUARI-DESEMBER):</em> TANGGALUKUR, UMUR, BERAT, TINGGI, CARAUKUR</li>
                    <li><em>Contoh kolom:</em> JANUARI_TANGGALUKUR, JANUARI_UMUR, JANUARI_BERAT, JANUARI_TINGGI, JANUARI_CARAUKUR</li>
                  </ul>
                </li>
                <li><strong>Tabel Referensi:</strong> Kolom (Umur, BB Ideal (L), PB Ideal (L), BB Ideal (P), PB Ideal (P)) dengan format rentang "min-max"</li>
                <li><strong>Jenis Kelamin:</strong> Otomatis terdeteksi dari kolom JENIS_KELAMIN (L/P/Laki-laki/Perempuan)</li>
              </ul>
              <p className="mt-2 text-xs font-medium">✨ Sistem akan otomatis mendeteksi jenis kelamin per anak dari kolom JENIS_KELAMIN dan menganalisis sesuai standar WHO</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}