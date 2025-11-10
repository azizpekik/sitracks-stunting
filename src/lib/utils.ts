import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num)
}

export function getValidationStatusColor(status: string): string {
  switch (status) {
    case 'OK':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'ERROR':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'WARNING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function getGrowthStatusColor(status: string): string {
  switch (status) {
    case 'Ideal':
      return 'bg-green-100 text-green-800'
    case 'Tidak Ideal':
      return 'bg-orange-100 text-orange-800'
    case 'Missing':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}