import { apiInterceptor } from '@/lib/api-interceptor'
import { AnalysisRequest, AnalysisResponse, JobStatus } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000')

export const apiClient = {
  // Analyze data
  async analyzeData(data: { lapangan: File; referensi: File; jenis_kelamin_default?: string }): Promise<AnalysisResponse> {
    try {
      console.log('=== DEBUG: API Client analyzeData called ===')
      console.log('Data received:', data)

      const formData = new FormData()
      formData.append('lapangan', data.lapangan)
      formData.append('referensi', data.referensi)

      // Auto-detect gender from Excel - only use default if specified
      if (data.jenis_kelamin_default) {
        formData.append('jenis_kelamin_default', data.jenis_kelamin_default)
        console.log('Using default gender:', data.jenis_kelamin_default)
      } else {
        console.log('Auto-detecting gender from Excel file')
      }

      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, value.name, value.size, value.type)
        } else {
          console.log(`${key}:`, value)
        }
      }

      const response = await apiInterceptor.upload(`${API_BASE_URL}/api/analyze`, formData)

      return await response.json()
    } catch (error: any) {
      console.error('API Error in analyzeData:', error)
      throw error
    }
  },

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await apiInterceptor.get(`${API_BASE_URL}/api/jobs/${jobId}`)
    return await response.json()
  },

  // Download file
  getDownloadUrl(filename: string, jobId: string): string {
    return `${API_BASE_URL}/api/download/${filename}?job=${jobId}`
  },

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    const response = await apiInterceptor.get(`${API_BASE_URL}/health`)
    return await response.json()
  },
}

// New analyze method with authentication and additional fields
export const apiClientWithAuth = {
  // Analyze data with authentication
  async analyzeDataWithAuth(data: {
    lapangan: File;
    referensi: File | null;
    analyzer_name: string;
    analyzer_institution: string;
    master_reference_id?: number | null;
  }): Promise<any> {
    try {
      console.log('=== DEBUG: API Client analyzeDataWithAuth called ===')
      console.log('Data received:', data)

      const formData = new FormData()
      formData.append('lapangan', data.lapangan)

      if (data.referensi) {
        formData.append('referensi', data.referensi)
      }

      formData.append('analyzer_name', data.analyzer_name)
      formData.append('analyzer_institution', data.analyzer_institution)

      if (data.master_reference_id) {
        formData.append('master_reference_id', data.master_reference_id.toString())
      }

      // Add jenis_kelamin_default as null to let backend auto-detect
      formData.append('jenis_kelamin_default', '')

      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, value.name, value.size, value.type)
        } else {
          console.log(`${key}:`, value)
        }
      }

      const response = await apiInterceptor.upload(`${API_BASE_URL}/api/analyze`, formData)

      return await response.json()
    } catch (error: any) {
      console.error('API Error in analyzeDataWithAuth:', error)
      throw error
    }
  },

  // Get master references
  async getMasterReferences(): Promise<any[]> {
    try {
      const response = await apiInterceptor.get(`${API_BASE_URL}/api/auth/master-references`)
      return await response.json()
    } catch (error: any) {
      console.error('Error fetching master references:', error)
      throw error
    }
  },

  // Get jobs
  async getJobs(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      const response = await apiInterceptor.get(`${API_BASE_URL}/auth/jobs?limit=${limit}&offset=${offset}`)
      return await response.json()
    } catch (error: any) {
      console.error('Error fetching jobs:', error)
      throw error
    }
  },

  // Delete job
  async deleteJob(jobId: string): Promise<any> {
    try {
      const response = await apiInterceptor.delete(`${API_BASE_URL}/auth/jobs/${jobId}`)
      return await response.json()
    } catch (error: any) {
      console.error('Error deleting job:', error)
      throw error
    }
  },
}

// Utility function to download files
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await apiInterceptor.get(url)

    // Handle different response types based on URL
    if (url.includes('.txt')) {
      // For text files, create a text blob
      const text = await response.text()
      const blob = new Blob([text], { type: 'text/plain' })
      const downloadUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(downloadUrl)
    } else {
      // For other files, use arrayBuffer
      const arrayBuffer = await response.arrayBuffer()
      const blob = new Blob([arrayBuffer])
      const downloadUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(downloadUrl)
    }
  } catch (error) {
    console.error('Error downloading file:', error)
    throw error
  }
}