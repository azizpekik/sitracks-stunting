'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { UploadSection } from '@/components/UploadSection'
import { ResultsSection } from '@/components/ResultsSection'
import { apiClient } from '@/lib/api'
import { JobStatus } from '@/types'

function AnalysisPageContent() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  // Poll job status if we have a job ID
  const { data: jobStatus, error } = useQuery<JobStatus>({
    queryKey: ['jobStatus', currentJobId],
    queryFn: () => apiClient.getJobStatus(currentJobId!),
    enabled: !!currentJobId,
    refetchInterval: (data) => {
      // Auto-refresh every 2 seconds while processing
      return data?.status === 'processing' ? 2000 : false
    },
    staleTime: 1000,
  })

  const handleFilesSelected = async (files: { lapangan: File; referensi: File }) => {
    try {
      console.log('Starting analysis with files:', files)
      // Start analysis - backend will auto-detect gender
      const response = await apiClient.analyzeData({
        lapangan: files.lapangan,
        referensi: files.referensi
      })
      console.log('Analysis started:', response)
      setCurrentJobId(response.job_id)
    } catch (error) {
      console.error('Error starting analysis:', error)
      if (error instanceof Error) {
        alert(`Gagal memulai analisis: ${error.message}. Silakan periksa file Anda dan coba lagi.`)
      } else {
        alert('Gagal memulai analisis. Silakan periksa file Anda dan coba lagi.')
      }
    }
  }

  const handleReset = () => {
    setCurrentJobId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sitracking Stunting
          </h1>
          <p className="text-gray-600">
            Sistem Analisis Ketelitian Data Pertumbuhan Anak (0–2 Tahun)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section - Takes 1/3 width on large screens */}
          <div className="lg:col-span-1">
            <UploadSection
              onFilesSelected={handleFilesSelected}
              disabled={jobStatus?.status === 'processing'}
            />

            {jobStatus && (
              <div className="mt-4">
                <button
                  onClick={handleReset}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Analisis Baru
                </button>
              </div>
            )}
          </div>

          {/* Results Section - Takes 2/3 width on large screens */}
          <div className="lg:col-span-2">
            {jobStatus ? (
              <ResultsSection jobStatus={jobStatus} />
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum Ada Analisis
                  </h3>
                  <p className="text-gray-500">
                    Upload file data lapangan dan referensi untuk memulai analisis pertumbuhan anak.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Terjadi Kesalahan
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Gagal memuat status analisis. Silakan refresh halaman.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return <AnalysisPageContent />
}