'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart3,
  Users,
  FileText,
  Upload,
  LogOut,
  Menu,
  X,
  Database,
  TrendingUp,
  Settings,
  Home
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Halaman utama dashboard'
  },
  {
    name: 'Analyze Now',
    href: '/dashboard/analyze',
    icon: Upload,
    description: 'Analisis data pertumbuhan anak baru'
  },
  {
    name: 'Data Analyze',
    href: '/dashboard/data',
    icon: Database,
    description: 'Kelola data analisis yang sudah ada'
  },
  {
    name: 'Master Table Referensi',
    href: '/dashboard/references',
    icon: FileText,
    description: 'Upload master data referensi WHO'
  }
]

interface DashboardHeaderProps {
  currentPage?: string
}

export function DashboardHeader({ currentPage }: DashboardHeaderProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* Logo */}
              <div className="flex items-center ml-4 lg:ml-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <h1 className="ml-3 text-xl font-bold text-gray-900">
                  Sitracking Stunting
                </h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex ml-10 space-x-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage ? item.href === currentPage : item.href === window?.location?.pathname
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden lg:block">
                <div className="text-sm text-gray-900 font-medium">
                  {user?.full_name}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.username}
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage ? item.href === currentPage : item.href === window?.location?.pathname
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="mr-4 h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  )
}