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

interface Job {
  id: string
  analyzer_name: string
  analyzer_institution: string
  status: 'processing' | 'completed' | 'failed'
  created_at: string
  completed_at?: string
  summary?: {
    total_anak: number
    total_records: number
    valid: number
    warning: number
    error: number
    missing: number
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // ChatBot state
  const [chatBotJob, setChatBotJob] = useState<{ id: string; name: string; content: string } | null>(null)
  const [isChatBotOpen, setIsChatBotOpen] = useState(false)
  const [chatBotSize, setChatBotSize] = useState<'normal' | 'wide'>('normal')

  // Fetch jobs with authentication
  const { data: jobs = [], isLoading, error } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
        const response = await apiClientWithAuth.getJobs(100, 0)

        // Ensure response is an array
        if (Array.isArray(response)) {
          return response
        } else {
          console.error('API response is not an array:', response)
          return []
        }
      } catch (error) {
        console.error('Error fetching jobs:', error)
        return [] // Return empty array on error to prevent filter issues
      }
    },
    enabled: !!user && !!token,
  })

  // Filter jobs based on search and status
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.analyzer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.analyzer_institution.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleDownload = async (job: Job, filename: string) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const downloadUrl = `${API_BASE_URL}/api/download/${filename}?job=${job.id}`
      await downloadFile(downloadUrl, filename)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Gagal mengunduh file. Silakan coba lagi.')
    }
  }

  const queryClient = useQueryClient()

  const handleDeleteJob = async (jobId: string) => {
    try {
      await apiClientWithAuth.deleteJob(jobId)
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
      setShowDeleteModal(false)
      setDeletingJobId(null)
    } catch (error: any) {
      console.error('Error deleting job:', error)
      alert(error.message || 'Gagal menghapus data analisis')
    }
  }

  const handleDeleteClick = (job: Job) => {
    setDeletingJobId(job.id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (deletingJobId) {
      handleDeleteJob(deletingJobId)
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

  const handleChatBotOpen = async (job: Job) => {
    try {
      // Ensure we're in browser environment
      if (typeof window === 'undefined') {
        console.error('Window is not available')
        return
      }

      const jobName = `${job.analyzer_name} - ${job.analyzer_institution}`
      const reportContent = await getContextContentWithFallback(job.id)

      setChatBotJob({
        id: job.id,
        name: jobName,
        content: reportContent
      })
      setIsChatBotOpen(true)
    } catch (error: any) {
      console.error('Error opening ChatBot:', error)

      // Show error message with fallback
      setChatBotJob({
        id: job.id,
        name: `${job.analyzer_name} - ${job.analyzer_institution}`,
        content: `
LAPORAN ANALISIS PERTUMBUHAN ANAK
================================

Status: ${job.status}

Informasi Job:
- ID: ${job.id}
- Analyzer: ${job.analyzer_name}
- Institution: ${job.analyzer_institution}
- Status: ${job.status}
- Created: ${formatDate(job.created_at)}

${job.summary ? `
Ringkasan:
- Total Anak: ${job.summary.total_anak}
- Total Records: ${job.summary.total_records}
- Valid: ${job.summary.valid}
- Warning: ${job.summary.warning}
- Error: ${job.summary.error}
- Missing: ${job.summary.missing}
` : ''}

Catatan:
${job.status === 'completed'
  ? 'Analisis telah selesai. Anda dapat menanyakan hasil analisis kepada asisten AI.'
  : job.status === 'processing'
  ? 'Analisis sedang diproses. Chatbot akan tersedia setelah analisis selesai.'
  : 'Analisis gagal. Silakan periksa data input dan coba lagi.'}
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
              <div className="text-2xl font-bold text-blue-600">{jobs.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Berhasil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {jobs.filter(job => job.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sedang Diproses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {jobs.filter(job => job.status === 'processing').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gagal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {jobs.filter(job => job.status === 'failed').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter dan Pencarian</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cari berdasarkan nama, instansi, atau ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="processing">Sedang Diproses</option>
                  <option value="completed">Berhasil</option>
                  <option value="failed">Gagal</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Analisis</CardTitle>
            <CardDescription>
              Menampilkan {filteredJobs.length} dari {jobs.length} analisis
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
            ) : filteredJobs.length === 0 ? (
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal Dibuat</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ringkasan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="text-sm font-mono text-gray-600">
                            {job.id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">{job.analyzer_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600">{job.analyzer_institution}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{formatDate(job.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {job.summary && job.status === 'completed' ? (
                            <div className="text-sm">
                              <div className="flex space-x-4">
                                <span className="text-green-600">{job.summary.valid} valid</span>
                                <span className="text-yellow-600">{job.summary.warning} warning</span>
                                <span className="text-red-600">{job.summary.error} error</span>
                              </div>
                              <div className="text-gray-500 text-xs mt-1">
                                {job.summary.total_anak} anak, {job.summary.total_records} records
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            {job.status === 'completed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(job, 'hasil_validasi.xlsx')}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Excel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownload(job, 'laporan_validasi.txt')}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Laporan
                                </Button>
                              </>
                            )}
                            {job.status === 'processing' && (
                              <span className="text-sm text-gray-500">Memproses...</span>
                            )}
                            {job.status === 'failed' && (
                              <span className="text-sm text-red-500">Gagal</span>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleChatBotOpen(job)}
                              className="text-purple-600 hover:text-purple-700"
                              title="AI Assistant - Analisis Data"
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              AI
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteClick(job)}
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
