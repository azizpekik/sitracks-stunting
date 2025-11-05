'use client'

import { useState, useCallback } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface UploadSectionProps {
  onFilesSelected: (files: { lapangan: File; referensi: File; gender: 'L' | 'P' }) => void
  disabled?: boolean
}

export function UploadSection({ onFilesSelected, disabled = false }: UploadSectionProps) {
  const [lapanganFile, setLapanganFile] = useState<File | null>(null)
  const [referensiFile, setReferensiFile] = useState<File | null>(null)
  const [gender, setGender] = useState<'L' | 'P'>('L')

  const handleFileChange = useCallback((
    file: File | null,
    type: 'lapangan' | 'referensi'
  ) => {
    if (type === 'lapangan') {
      setLapanganFile(file)
    } else {
      setReferensiFile(file)
    }
  }, [])

  const handleProcess = useCallback(() => {
    console.log('=== DEBUG: handleProcess called ===')
    console.log('lapanganFile:', lapanganFile)
    console.log('referensiFile:', referensiFile)
    console.log('gender:', gender)
    console.log('onFilesSelected function:', typeof onFilesSelected)

    if (lapanganFile && referensiFile) {
      console.log('Calling onFilesSelected with:', {
        lapanganFileName: lapanganFile.name,
        lapanganSize: lapanganFile.size,
        lapanganType: lapanganFile.type,
        referensiFileName: referensiFile.name,
        referensiSize: referensiFile.size,
        referensiType: referensiFile.type,
        gender: gender
      })
      onFilesSelected({ lapangan: lapanganFile, referensi: referensiFile, gender })
    } else {
      console.log('Files not ready:', { lapanganFile: !!lapanganFile, referensiFile: !!referensiFile })
    }
  }, [lapanganFile, referensiFile, gender, onFilesSelected])

  const isReady = lapanganFile && referensiFile && !disabled

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Data Pertumbuhan Anak</CardTitle>
        <CardDescription>
          Upload file Excel data lapangan dan tabel referensi pertumbuhan untuk memulai analisis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Referensi File Upload */}
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
        </div>

        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jenis Kelamin Default
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as 'L' | 'P')}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="L">Laki-laki (L)</option>
            <option value="P">Perempuan (P)</option>
          </select>
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
                <li><strong>Jenis Kelamin:</strong> Kolom JENIS_KELAMIN wajib diisi dengan nilai "L" (Laki-laki) atau "P" (Perempuan)</li>
              </ul>
              <p className="mt-2 text-xs font-medium">ℹ️ Jika tidak ada kolom JENIS_KELAMIN, gunakan dropdown Jenis Kelamin Default</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}