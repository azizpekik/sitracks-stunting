'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Upload, FileText, AlertTriangle } from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { UploadSectionWithAuth } from '@/components/UploadSectionWithAuth'
import { ResultsSection } from '@/components/ResultsSection'
import { apiClientWithAuth } from '@/lib/api'
import { apiInterceptor } from '@/lib/api-interceptor'
import { JobStatus } from '@/types'
import { useAuth } from '@/contexts/AuthContext'

function DashboardAnalyzePageContent() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false)
  const { user } = useAuth()

  // Poll job status if we have a job ID
  const { data: jobStatus, error } = useQuery<JobStatus>({
    queryKey: ['jobStatus', currentJobId],
    queryFn: async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await apiInterceptor.get(`${API_BASE_URL}/api/jobs/${currentJobId}`)
      return await response.json()
    },
    enabled: !!currentJobId,
    refetchInterval: (query) => {
      // Auto-refresh every 1 second while processing for faster error detection
      return query.state.data?.status === 'processing' ? 1000 : false
    },
    staleTime: 1000,
  })

  const handleFilesSelected = async (
    files: { lapangan: File; referensi: File | null },
    analyzerName: string,
    analyzerInstitution: string,
    masterReferenceId: number | null
  ) => {
    try {
      console.log('Starting analysis with files:', files)
      console.log('Analyzer:', analyzerName, '-', analyzerInstitution)
      setIsStartingAnalysis(true)

      // Add a small delay to allow the loading animation to start
      await new Promise(resolve => setTimeout(resolve, 800))

      // Start analysis with new parameters
      const response = await apiClientWithAuth.analyzeDataWithAuth({
        lapangan: files.lapangan,
        referensi: files.referensi,
        analyzer_name: analyzerName,
        analyzer_institution: analyzerInstitution,
        master_reference_id: masterReferenceId
      })
      console.log('Analysis started:', response)
      setCurrentJobId(response.job_id)
      setIsStartingAnalysis(false)
    } catch (error) {
      console.error('Error starting analysis:', error)
      setIsStartingAnalysis(false)
      if (error instanceof Error) {
        alert(`Gagal memulai analisis: ${error.message}. Silakan periksa file Anda dan coba lagi.`)
      } else {
        alert('Gagal memulai analisis. Silakan periksa file Anda dan coba lagi.')
      }
    }
  }

  const handleReset = () => {
    setCurrentJobId(null)
    setIsStartingAnalysis(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="/dashboard/analyze" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analyze Now
          </h1>
          <p className="text-gray-600">
            Upload file data lapangan dan referensi untuk memulai analisis pertumbuhan anak dengan standar WHO.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section - Takes 1/3 width on large screens */}
          <div className="lg:col-span-1">
            <UploadSectionWithAuth
              onFilesSelected={handleFilesSelected}
              disabled={jobStatus?.status === 'processing' || isStartingAnalysis}
              currentUser={user}
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
            {isStartingAnalysis ? (
              <div className="flex items-center justify-center">
                <div className="w-full max-w-2xl">
                  <div className="text-center mb-4">
                    <div className="text-blue-500 mb-2">
                      <svg className="mx-auto h-8 w-8 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Memulai Analisis
                    </h3>
                    <p className="text-gray-600">
                      Sistem sedang mempersiapkan proses analisis data pertumbuhan anak...
                    </p>
                  </div>
                </div>
              </div>
            ) : jobStatus ? (
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

export default function DashboardAnalyzePage() {
  return <DashboardAnalyzePageContent />
}