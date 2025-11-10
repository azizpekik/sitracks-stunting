import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001'

export async function getReportContent(jobId: string): Promise<string> {
  try {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available on server side')
    }

    const token = localStorage.getItem('auth_token')

    if (!token) {
      throw new Error('No authentication token found')
    }

    // Try to download the report file directly first
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download/laporan_validasi.txt?job=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'text'
      })

      return response.data
    } catch (downloadError: any) {
      console.warn('Direct download failed, trying job info first:', downloadError.message)

      // If direct download fails, try to get job info first
      try {
        const jobResponse = await axios.get(`${API_BASE_URL}/auth/jobs/${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!jobResponse.data.report_path && jobResponse.data.status !== 'completed') {
          throw new Error(`Job status: ${jobResponse.data.status}. Analisis belum selesai atau laporan tidak tersedia.`)
        }

        // Try download again
        const response = await axios.get(`${API_BASE_URL}/api/download/laporan_validasi.txt?job=${jobId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          responseType: 'text'
        })

        return response.data
      } catch (jobError: any) {
        throw new Error(`Tidak dapat mengakses laporan: ${jobError.response?.data?.detail || jobError.message}`)
      }
    }

  } catch (error: any) {
    console.error('Error reading report content:', error)

    if (error.response?.status === 404) {
      throw new Error('File laporan tidak ditemukan. Pastikan analisis telah selesai.')
    } else if (error.response?.status === 401) {
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    } else if (error.response?.status === 403) {
      throw new Error('Tidak memiliki izin untuk mengakses laporan ini.')
    } else {
      throw new Error(`Gagal membaca laporan: ${error.message || 'Error tidak diketahui'}`)
    }
  }
}

export async function getReportContentWithFallback(jobId: string): Promise<string> {
  try {
    return await getReportContent(jobId)
  } catch (error: any) {
    // Return a default message if report is not available
    if (error.message?.includes('not found') || error.message?.includes('tidak ditemukan')) {
      return `
LAPORAN ANALISIS PERTUMBUHAN ANAK
================================

Status: Analisis mungkin belum selesai atau file laporan tidak tersedia

Informasi Job ID: ${jobId}

Catatan:
- Laporan analisis akan tersedia setelah proses selesai
- Anda dapat menanyakan status analisis kepada asisten AI
- Pastikan job memiliki status "completed" sebelum membuka laporan

Untuk informasi lebih lanjut, silakan hubungi administrator.
      `
    }
    throw error
  }
}

export async function getContextContent(jobId: string): Promise<string> {
  try {
    // Ensure we're in browser environment
    if (typeof window === 'undefined') {
      throw new Error('localStorage is not available on server side')
    }

    const token = localStorage.getItem('auth_token')

    if (!token) {
      throw new Error('No authentication token found')
    }

    // Try to download the comprehensive context file
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download/konteks_lengkap.txt?job=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        responseType: 'text'
      })

      return response.data
    } catch (downloadError: any) {
      console.warn('Context file download failed, trying regular report as fallback:', downloadError.message)

      // If context file fails, try to get the regular report as fallback
      return await getReportContent(jobId)
    }

  } catch (error: any) {
    console.error('Error reading context content:', error)

    if (error.response?.status === 404) {
      throw new Error('File konteks tidak ditemukan. Pastikan analisis telah selesai.')
    } else if (error.response?.status === 401) {
      throw new Error('Sesi telah berakhir. Silakan login kembali.')
    } else if (error.response?.status === 403) {
      throw new Error('Tidak memiliki izin untuk mengakses konteks ini.')
    } else {
      throw new Error(`Gagal membaca konteks: ${error.message || 'Error tidak diketahui'}`)
    }
  }
}

export async function getContextContentWithFallback(jobId: string): Promise<string> {
  try {
    return await getContextContent(jobId)
  } catch (error: any) {
    // Return basic context if files are not available
    if (error.message?.includes('not found') || error.message?.includes('tidak ditemukan')) {
      return `
KONTEKS DATA ANALISIS PERTUMBUHAN ANAK
======================================

Status: File konteks lengkap tidak tersedia

Informasi Job ID: ${jobId}

Catatan:
- File konteks berisi data lengkap dari Excel untuk analisis AI
- File ini akan tersedia setelah proses analisis selesai
- Untuk sementara, AI akan menggunakan informasi dasar yang tersedia

Anda tetap bisa menanyakan pertanyaan umum tentang analisis data pertumbuhan anak.
      `
    }
    throw error
  }
}