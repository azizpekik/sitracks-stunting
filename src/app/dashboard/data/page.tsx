'use client'
// Last updated: 2025-11-10 21:35 UTC - Cache bust 2

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, Download, Calendar, User, FileText, Search, Filter, CheckCircle, XCircle, Clock, AlertTriangle, Trash2, MessageCircle, Maximize2, Minimize2 } from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiClientWithAuth, downloadFile } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { getContextContentWithFallback } from '@/lib/report-reader'
import ChatBot from '@/components/ui/chatbot'

interface AnalysisResult {
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

interface ChildAnalysis {
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
  monthly_data: any[]
}

interface ApiResponse {
  results: AnalysisResult[]
  pagination: {
    limit: number
    offset: number
    total: number
    hasMore: boolean
  }
  statistics: {
    total_analyses: number
    total_children: number
    total_records: number
  }
}

const statusColors = {
  processing: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800'
}

const statusIcons = {
  processing: Clock,
  completed: CheckCircle,
  failed: XCircle
}

export default function DataAnalyzePage() {
  const { user, token } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  // const [statusFilter, setStatusFilter] = useState<string>('all') // Not needed for analyses
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // ChatBot state
  const [chatBotJob, setChatBotJob] = useState<{ id: string; name: string; content: string } | null>(null)
  const [isChatBotOpen, setIsChatBotOpen] = useState(false)
  const [chatBotSize, setChatBotSize] = useState<'normal' | 'wide'>('normal')

  // Fetch analysis results with authentication
  const { data: analysisData, isLoading, error, refetch } = useQuery<ApiResponse>({
    queryKey: ['analyses'],
    queryFn: async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
        const response = await fetch(`${API_BASE_URL}/api/analyses?limit=100&offset=0`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Analysis API response:', data)

        // Ensure we have the expected structure
        if (data && data.results && Array.isArray(data.results)) {
          return data
        } else {
          console.error('API response does not have expected structure:', data)
          return {
            results: [],
            pagination: { limit: 100, offset: 0, total: 0, hasMore: false },
            statistics: { total_analyses: 0, total_children: 0, total_records: 0 }
          }
        }
      } catch (error) {
        console.error('Error fetching analyses:', error)
        return {
          results: [],
          pagination: { limit: 100, offset: 0, total: 0, hasMore: false },
          statistics: { total_analyses: 0, total_children: 0, total_records: 0 }
        }
      }
    },
    enabled: !!user && !!token,
    refetchInterval: 10000, // Refresh every 10 seconds
  })

  const analyses = analysisData?.results || []
  const statistics = analysisData?.statistics || { total_analyses: 0, total_children: 0, total_records: 0 }

  // Filter analyses based on search
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch =
      analysis.analyzer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.analyzer_institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      analysis.id.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleDownload = async (analysis: AnalysisResult, filename: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const downloadUrl = `${API_BASE_URL}/api/download/${filename}?job=${analysis.job_id}`
      await downloadFile(downloadUrl, filename)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Gagal mengunduh file. Silakan coba lagi.')
    }
  }

  const queryClient = useQueryClient()

  const handleDeleteAnalysis = async (analysisId: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await fetch(`${API_BASE_URL}/api/analyses?id=${analysisId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      await refetch()
      setShowDeleteModal(false)
      setDeletingJobId(null)
    } catch (error: any) {
      console.error('Error deleting analysis:', error)
      alert(error.message || 'Gagal menghapus data analisis')
    }
  }

  const handleDeleteClick = (analysis: AnalysisResult) => {
    setDeletingJobId(analysis.id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deletingJobId) {
      handleDeleteAnalysis(deletingJobId)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertTriangle
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors]} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const handleChatBotOpen = async (analysis: AnalysisResult) => {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        console.error('Window is not available')
        return
      }

      const jobName = `${analysis.analyzer_name} - ${analysis.analyzer_institution}`
      const reportContent = await getContextContentWithFallback(analysis.job_id)

      setChatBotJob({
        id: analysis.id,
        name: jobName,
        content: reportContent
      })
      setIsChatBotOpen(true)
    } catch (error: any) {
      console.error('Error opening ChatBot:', error)

      // Show error message with fallback
      setChatBotJob({
        id: analysis.id,
        name: `${analysis.analyzer_name} - ${analysis.analyzer_institution}`,
        content: `
LAPORAN ANALISIS PERTUMBUHAN ANAK
================================

Status: completed

Informasi Job:
- ID: ${analysis.id}
- Analyzer: ${analysis.analyzer_name}
- Institution: ${analysis.analyzer_institution}
- Status: completed
- Created: ${formatDate(analysis.created_at)}

Ringkasan:
- Total Anak: ${analysis.total_anak}
- Total Records: ${analysis.total_records}
- Valid: ${analysis.valid}
- Warning: ${analysis.warning}
- Error: ${analysis.error}
- Missing: ${analysis.missing}

Catatan:
Analisis telah selesai. Anda dapat menanyakan hasil analisis kepada asisten AI.
        `
      })
      setIsChatBotOpen(true)
    }
  }

  const handleChatBotClose = () => {
    setIsChatBotOpen(false)
    setTimeout(() => {
      setChatBotJob(null)
    }, 300) // Wait for animation to complete
  }

  const handleChatBotSizeToggle = () => {
    setChatBotSize(chatBotSize === 'normal' ? 'wide' : 'normal')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="/dashboard/data" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Data Analyze
          </h1>
          <p className="text-gray-600">
            Kelola dan lihat semua data analisis pertumbuhan anak yang telah diproses.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Analisis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{statistics.total_analyses}</div>
              <div className="text-xs text-gray-500 mt-1">Analisis yang telah diproses</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Anak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.total_children}</div>
              <div className="text-xs text-gray-500 mt-1">Anak dianalisis</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{statistics.total_records}</div>
              <div className="text-xs text-gray-500 mt-1">Data pengukuran</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Data Valid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {analyses.reduce((sum, a) => sum + a.valid, 0)}
              </div>
              <div className="text-xs text-gray-500 mt-1">Data yang valid</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama analyzer, instansi, atau ID analisis..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Analisis</CardTitle>
            <CardDescription>
              Menampilkan {filteredAnalyses.length} dari {analyses.length} analisis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Memuat data...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">Gagal memuat data analisis</p>
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tidak ada data analisis yang ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Analyzer</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Instansi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Anak</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Validasi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalyses.map((analysis) => (
                      <tr key={analysis.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono text-gray-600">
                            {analysis.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{analysis.analyzer_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600">{analysis.analyzer_institution}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{formatDate(analysis.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="font-medium text-blue-600">{analysis.total_anak} anak</div>
                            <div className="text-gray-500 text-xs">
                              {analysis.total_records} data pengukuran
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="flex space-x-2">
                              <span className="text-green-600">{analysis.valid} ✓</span>
                              <span className="text-yellow-600">{analysis.warning} ⚠</span>
                              <span className="text-red-600">{analysis.error} ✗</span>
                              <span className="text-gray-600">{analysis.missing} -</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {Math.round((analysis.valid / analysis.total_records) * 100)}% valid
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(analysis, 'hasil_validasi.xlsx')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Excel
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownload(analysis, 'laporan_validasi.txt')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Laporan
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(analysis)}
                              className="text-red-600 hover:text-red-700"
                              title="Hapus data analisis"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="flex items-center mb-4">
                <div className="bg-red-100 rounded-full p-3 mr-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Konfirmasi Hapus</h3>
                  <p className="text-sm text-gray-600">
                    Apakah Anda yakin ingin menghapus data analisis ini?
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Semua file terkait (Excel, Laporan, dan data upload) akan dihapus permanen.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  Batal
                </Button>
                <Button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Hapus
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ChatBot Component */}
        {chatBotJob && (
          <ChatBot
            jobId={chatBotJob.id}
            jobName={chatBotJob.name}
            reportContent={chatBotJob.content}
            isOpen={isChatBotOpen}
            onToggle={handleChatBotClose}
            size={chatBotSize}
            onSizeChange={handleChatBotSizeToggle}
          />
        )}
      </div>
    </div>
  )
}// Cache bust Mon Nov 10 21:34:20 WIB 2025
