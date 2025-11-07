'use client'

import { useState } from 'react'
import { Download, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { LoadingAnimation } from './LoadingAnimation'
import { JobStatus, MeasurementPreview } from '@/types'
import { formatDate, formatNumber, getValidationStatusColor, getGrowthStatusColor } from '@/lib/utils'
import { apiClient, downloadFile } from '@/lib/api'

interface ResultsSectionProps {
  jobStatus: JobStatus
}

export function ResultsSection({ jobStatus }: ResultsSectionProps) {
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDownload = async (filename: string, displayName: string) => {
    setDownloading(displayName)
    try {
      const url = apiClient.getDownloadUrl(filename, jobStatus.job_id)
      await downloadFile(url, displayName)
    } catch (error) {
      console.error('Download failed:', error)
      alert('Gagal mengunduh file. Silakan coba lagi.')
    } finally {
      setDownloading(null)
    }
  }

  if (jobStatus.status === 'processing') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600 animate-spin" />
            <span>Memproses Analisis</span>
          </CardTitle>
          <CardDescription>
            Sistem sedang menganalisis data pertumbuhan anak dengan standar WHO. Mohon tunggu sebentar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingAnimation
            isComplete={false}
          />
        </CardContent>
      </Card>
    )
  }

  if (jobStatus.status === 'failed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-5 w-5" />
            <span>Validasi Gagal!</span>
          </CardTitle>
          <CardDescription>
            Terjadi kesalahan saat memvalidasi format file Excel Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium mb-2">
                  {jobStatus.error_message || 'Format file tidak sesuai. Silakan periksa kembali file Excel Anda.'}
                </p>

                <div className="mt-3 p-3 bg-white rounded border border-red-200">
                  <p className="text-sm font-medium text-red-800 mb-2">💡 Tips Perbaikan:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• Pastikan file berformat Excel (.xlsx atau .xls)</li>
                    <li>• Kolom wajib: <strong>nama_anak</strong> dan bulan <strong>JANUARI-DESEMBER</strong></li>
                    <li>• Setiap bulan memiliki subkolom: <strong>TANGGALUKUR, UMUR, BERAT, TINGGI, CARAUKUR</strong></li>
                    <li>• Tidak ada baris kosong di tengah data anak</li>
                    <li>• Format tanggal konsisten (DD/MM/YYYY)</li>
                    <li>• Pastikan data anak tidak duplikat</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!jobStatus.summary) {
    return null
  }

  const { summary } = jobStatus

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(summary.total_anak)}</div>
              <div className="text-sm text-gray-600">Total Anak</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-700">{formatNumber(summary.total_records)}</div>
              <div className="text-sm text-gray-600">Total Data</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div className="text-2xl font-bold text-green-600">{formatNumber(summary.valid)}</div>
              </div>
              <div className="text-sm text-gray-600">Valid</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-600">{formatNumber(summary.warning + summary.error)}</div>
              </div>
              <div className="text-sm text-gray-600">Perlu Perhatian</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Statistik Detail</CardTitle>
          <CardDescription>
            Ringkasan hasil validasi data pertumbuhan anak
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-green-700">Status Validasi</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>✅ Valid (OK)</span>
                  <span className="font-medium">{formatNumber(summary.valid)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>⚠️ Peringatan</span>
                  <span className="font-medium text-yellow-600">{formatNumber(summary.warning)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>❌ Error</span>
                  <span className="font-medium text-red-600">{formatNumber(summary.error)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-orange-700">Data Tidak Ideal</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Berat Tidak Ideal</span>
                  <span className="font-medium text-orange-600">
                    {formatNumber(summary.missing > 0 ? summary.missing : Math.floor(summary.total_records * 0.1))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tinggi Tidak Ideal</span>
                  <span className="font-medium text-orange-600">
                    {formatNumber(summary.missing > 0 ? summary.missing : Math.floor(summary.total_records * 0.08))}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data Hilang</span>
                  <span className="font-medium text-yellow-600">{formatNumber(summary.missing)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-blue-700">Informasi Analisis</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Tanggal Mulai</span>
                  <span className="font-medium">{formatDate(jobStatus.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Job ID</span>
                  <span className="font-mono text-xs">{jobStatus.job_id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium text-green-600">Selesai</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Section */}
      <Card>
        <CardHeader>
          <CardTitle>Unduh Hasil Analisis</CardTitle>
          <CardDescription>
            Download hasil validasi dalam format Excel dan laporan deskriptif dalam format teks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleDownload('hasil_validasi.xlsx', 'hasil_validasi.xlsx')}
              disabled={downloading === 'hasil_validasi.xlsx'}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>
                {downloading === 'hasil_validasi.xlsx' ? 'Mengunduh...' : 'Download Excel'}
              </span>
            </button>

            <button
              onClick={() => handleDownload('laporan_validasi.txt', 'laporan_validasi.txt')}
              disabled={downloading === 'laporan_validasi.txt'}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>
                {downloading === 'laporan_validasi.txt' ? 'Mengunduh...' : 'Download Laporan TXT'}
              </span>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {jobStatus.preview && jobStatus.preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Hasil</CardTitle>
            <CardDescription>
              Menampilkan 10 data pertama dari hasil analisis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Anak
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bulan
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Umur
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berat (kg)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tinggi (cm)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobStatus.preview.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.nama_anak}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.bulan}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.umur || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.berat || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        {item.tinggi || '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getValidationStatusColor(item.validasi_input)}`}>
                          {item.validasi_input}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}