'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Upload, FileText, Plus, Edit, Trash2, Eye, Calendar, User, CheckCircle, AlertTriangle, X, Download } from 'lucide-react'
import { DashboardHeader } from '@/components/DashboardHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiClientWithAuth } from '@/lib/api'
import { apiInterceptor } from '@/lib/api-interceptor'
import { useAuth } from '@/contexts/AuthContext'

interface MasterReference {
  id: number
  name: string
  description?: string
  file_name: string
  is_active: boolean
  created_at: string
  creator?: {
    id: number
    username: string
    full_name: string
  }
}

interface CreateReferenceForm {
  name: string
  description: string
  file: File | null
}

interface EditReferenceForm {
  name: string
  description: string
}

export default function MasterReferencesPage() {
  const { user, token } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<CreateReferenceForm>({
    name: '',
    description: '',
    file: null
  })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedReference, setSelectedReference] = useState<MasterReference | null>(null)
  const [editForm, setEditForm] = useState<EditReferenceForm>({
    name: '',
    description: ''
  })

  // Fetch master references
  const { data: references = [], isLoading, error } = useQuery<MasterReference[]>({
    queryKey: ['masterReferences'],
    queryFn: async () => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await apiInterceptor.get(`${API_BASE_URL}/auth/master-references`)
      return response.json()
    },
    enabled: !!user && !!token,
  })

  // Create master reference mutation
  const createReferenceMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await apiInterceptor.upload(`${API_BASE_URL}/auth/master-references`, formData)
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['masterReferences'] })
      setShowCreateForm(false)
      setCreateForm({ name: '', description: '', file: null })
      setSuccessMessage('Master reference berhasil dibuat!')
      setErrorMessage(null)
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: (error) => {
      setErrorMessage(`Gagal membuat master reference: ${error.message}`)
      setSuccessMessage(null)
      setTimeout(() => setErrorMessage(null), 5000)
    },
  })

  // Delete master reference mutation
  const deleteReferenceMutation = useMutation({
    mutationFn: async (id: number) => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await apiInterceptor.delete(`${API_BASE_URL}/auth/master-references/${id}`)
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterReferences'] })
      setSuccessMessage('Master reference berhasil dihapus!')
      setErrorMessage(null)
      setShowViewModal(false)
      setSelectedReference(null)
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: (error) => {
      setErrorMessage(`Gagal menghapus master reference: ${error.message}`)
      setSuccessMessage(null)
      setTimeout(() => setErrorMessage(null), 5000)
    },
  })

  // Update master reference mutation
  const updateReferenceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string } }) => {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await apiInterceptor.put(`${API_BASE_URL}/auth/master-references/${id}`, data)
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['masterReferences'] })
      setSuccessMessage('Master reference berhasil diperbarui!')
      setErrorMessage(null)
      setShowEditModal(false)
      setSelectedReference(null)
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: (error) => {
      setErrorMessage(`Gagal memperbarui master reference: ${error.message}`)
      setSuccessMessage(null)
      setTimeout(() => setErrorMessage(null), 5000)
    },
  })

  const handleCreateReference = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!createForm.name.trim()) {
      setErrorMessage('Nama master reference harus diisi')
      return
    }

    if (!createForm.file) {
      setErrorMessage('File harus dipilih')
      return
    }

    if (!createForm.file.name.match(/\.(xlsx|xls)$/)) {
      setErrorMessage('File harus berformat Excel (.xlsx atau .xls)')
      return
    }

    const formData = new FormData()
    formData.append('name', createForm.name.trim())
    formData.append('description', createForm.description.trim())
    formData.append('file', createForm.file)

    createReferenceMutation.mutate(formData)
  }

  const handleDeleteReference = (id: number) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus master reference ini? Tindakan ini tidak dapat dibatalkan.')) {
      deleteReferenceMutation.mutate(id)
    }
  }

  const handleViewReference = (reference: MasterReference) => {
    setSelectedReference(reference)
    setShowViewModal(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleEditReference = (reference: MasterReference) => {
    setSelectedReference(reference)
    setEditForm({
      name: reference.name,
      description: reference.description || ''
    })
    setShowEditModal(true)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleUpdateReference = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!editForm.name.trim()) {
      setErrorMessage('Nama master reference harus diisi')
      return
    }

    if (!selectedReference) {
      setErrorMessage('Tidak ada master reference yang dipilih')
      return
    }

    updateReferenceMutation.mutate({
      id: selectedReference.id,
      data: {
        name: editForm.name.trim(),
        description: editForm.description.trim()
      }
    })
  }

  const handleDownloadReference = async () => {
    if (!selectedReference) {
      setErrorMessage('Gagal mengunduh file: data tidak lengkap')
      return
    }

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')
      const response = await apiInterceptor.get(`${API_BASE_URL}/auth/master-references/${selectedReference.id}/download`)

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition')
      let filename = selectedReference.file_name
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setSuccessMessage(`File ${filename} berhasil diunduh`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Download error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setErrorMessage(`Gagal mengunduh file: ${errorMessage}`)
      setTimeout(() => setErrorMessage(null), 3000)
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

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="/dashboard/references" />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Master Table Referensi
              </h1>
              <p className="text-gray-600">
                Kelola tabel referensi standar pertumbuhan anak WHO untuk digunakan dalam analisis.
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Master Reference Baru</span>
            </Button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4 flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800 text-sm">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800 text-sm">{errorMessage}</p>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Upload Master Reference Baru</CardTitle>
              <CardDescription>
                Upload file Excel yang berisi tabel referensi standar pertumbuhan anak.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateReference} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Master Reference *
                    </label>
                    <Input
                      type="text"
                      value={createForm.name}
                      onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                      placeholder="Contoh: Standar WHO 0-2 Tahun"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      File Excel *
                    </label>
                    <Input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => setCreateForm({ ...createForm, file: e.target.files?.[0] || null })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <Input
                    type="text"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Deskripsi opsional untuk master reference ini"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={createReferenceMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Upload className="h-4 w-4" />
                    <span>{createReferenceMutation.isPending ? 'Mengupload...' : 'Upload'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setCreateForm({ name: '', description: '', file: null })
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Master Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{references.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {references.filter(ref => ref.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tidak Aktif</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {references.filter(ref => !ref.is_active).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* References List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Master Reference</CardTitle>
            <CardDescription>
              Daftar tabel referensi yang tersedia untuk analisis pertumbuhan anak
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
                <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600">Gagal memuat master references</p>
              </div>
            ) : references.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Belum ada master reference yang tersedia</p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Master Reference Pertama
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Nama</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">File</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Dibuat Oleh</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Tanggal Dibuat</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {references.map((reference) => (
                      <tr key={reference.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{reference.name}</div>
                            {reference.description && (
                              <div className="text-sm text-gray-500">{reference.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{reference.file_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={reference.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {reference.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {reference.creator ? (
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{reference.creator.full_name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{formatDate(reference.created_at)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewReference(reference)}
                              className="text-blue-600 hover:text-blue-700"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditReference(reference)}
                              className="text-yellow-600 hover:text-yellow-700"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteReference(reference.id)}
                              disabled={deleteReferenceMutation.isPending}
                              className="text-red-600 hover:text-red-700"
                              title="Hapus"
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

        {/* View Modal */}
        {showViewModal && selectedReference && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Detail Master Reference</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedReference(null)
                  }}
                  className="p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Nama</h3>
                  <p className="text-lg font-semibold text-gray-900">{selectedReference.name}</p>
                </div>

                {selectedReference.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Deskripsi</h3>
                    <p className="text-gray-900">{selectedReference.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">File</h3>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-900 font-medium">{selectedReference.file_name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadReference}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Unduh
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  <Badge className={selectedReference.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {selectedReference.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </Badge>
                </div>

                {selectedReference.creator && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Dibuat Oleh</h3>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">{selectedReference.creator.full_name}</span>
                      <span className="text-gray-500">({selectedReference.creator.username})</span>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Tanggal Dibuat</h3>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(selectedReference.created_at)}</span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-4 border-t">
                <Button
                  onClick={() => {
                    setShowViewModal(false)
                    handleEditReference(selectedReference)
                  }}
                  className="flex items-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteReference(selectedReference.id)}
                  disabled={deleteReferenceMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deleteReferenceMutation.isPending ? 'Menghapus...' : 'Hapus'}</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false)
                    setSelectedReference(null)
                  }}
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedReference && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Edit Master Reference</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedReference(null)
                    setEditForm({ name: '', description: '' })
                  }}
                  className="p-1"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <form onSubmit={handleUpdateReference} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Master Reference *
                  </label>
                  <Input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Masukkan nama master reference"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Deskripsi
                  </label>
                  <Input
                    type="text"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Masukkan deskripsi (opsional)"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Informasi:</strong> File master reference tidak dapat diubah. Jika Anda perlu mengganti file, silakan hapus master reference ini dan buat yang baru.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button
                    type="submit"
                    disabled={updateReferenceMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{updateReferenceMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false)
                      setSelectedReference(null)
                      setEditForm({ name: '', description: '' })
                    }}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Informasi Format File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Format File Master Reference:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>File harus berformat Excel (.xlsx atau .xls)</li>
                  <li>Kolom wajib: Umur, BB Ideal (L), PB Ideal (L), BB Ideal (P), PB Ideal (P)</li>
                  <li>Kolom Umur: berisi data umur dalam bulan (0, 1, 2, dst)</li>
                  <li>Kolom BB Ideal: berat badan ideal dalam kg dengan format rentang "min-max" (contoh: "3.2-5.4")</li>
                  <li>Kolom PB Ideal: panjang badan ideal dalam cm dengan format rentang "min-max" (contoh: "49.5-54.2")</li>
                  <li>(L) = Laki-laki, (P) = Perempuan</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}