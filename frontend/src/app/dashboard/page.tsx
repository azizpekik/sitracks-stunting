'use client'

import { useAuth } from '@/contexts/AuthContext'
import { DashboardHeader } from '@/components/DashboardHeader'
import Link from 'next/link'
import {
  Users,
  FileText,
  Upload,
  Database,
  TrendingUp
} from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader currentPage="/dashboard" />

      {/* Main content */}
      <main className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Selamat Datang, {user?.full_name}!
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Dashboard Sistem Analisis Data Pertumbuhan Anak (0-2 Tahun)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Analisis
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Data Valid
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Database className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Master Referensi
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Status Sistem
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      Aktif
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Aksi Cepat
              </h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard/analyze"
                  className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Upload className="h-5 w-5" />
                    <span>Analyze Data Baru</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/references"
                  className="block w-full text-center px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Upload Master Referensi</span>
                  </div>
                </Link>

                <Link
                  href="/dashboard/data"
                  className="block w-full text-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Lihat Data Analisis</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Informasi Sistem
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Versi Sistem</span>
                  <span className="text-sm font-medium text-gray-900">v1.0.0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">User Login</span>
                  <span className="text-sm font-medium text-gray-900">{user?.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status Backend</span>
                  <span className="text-sm font-medium text-green-600">Online</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-sm font-medium text-gray-900">2024</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}