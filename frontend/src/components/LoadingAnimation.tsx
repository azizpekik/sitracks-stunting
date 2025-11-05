'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, Circle, Loader2, FileText, Search, AlertTriangle, TrendingUp, Download, Shield } from 'lucide-react'

interface LoadingStep {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  duration: number // in milliseconds
}

const loadingSteps: LoadingStep[] = [
  {
    id: 'upload',
    label: 'Mengupload file...',
    icon: FileText,
    duration: 800
  },
  {
    id: 'validate',
    label: 'Memvalidasi format file...',
    icon: Shield,
    duration: 1200
  },
  {
    id: 'read',
    label: 'Membaca data lapangan...',
    icon: Search,
    duration: 1500
  },
  {
    id: 'template',
    label: 'Checking error template...',
    icon: AlertTriangle,
    duration: 1000
  },
  {
    id: 'parse',
    label: 'Parsing data referensi WHO...',
    icon: FileText,
    duration: 1300
  },
  {
    id: 'gender',
    label: 'Mendeteksi jenis kelamin...',
    icon: Search,
    duration: 800
  },
  {
    id: 'analyze',
    label: 'Menganalisis pertumbuhan...',
    icon: TrendingUp,
    duration: 2000
  },
  {
    id: 'validate',
    label: 'Validasi hierarki data...',
    icon: Shield,
    duration: 1500
  },
  {
    id: 'report',
    label: 'Membuat laporan analisis...',
    icon: FileText,
    duration: 1200
  },
  {
    id: 'generate',
    label: 'Generate file Excel...',
    icon: Download,
    duration: 1000
  }
]

interface LoadingAnimationProps {
  isComplete: boolean
  onComplete?: () => void
}

export function LoadingAnimation({ isComplete, onComplete }: LoadingAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isComplete) {
      // Mark all steps as complete
      const allSteps = new Set(loadingSteps.map(step => step.id))
      setCompletedSteps(allSteps)
      setCurrentStepIndex(loadingSteps.length)
      setTimeout(() => {
        onComplete?.()
      }, 500)
      return
    }

    const timer = setTimeout(() => {
      if (currentStepIndex < loadingSteps.length) {
        const currentStep = loadingSteps[currentStepIndex]
        setCompletedSteps(prev => new Set(prev).add(currentStep.id))
        setCurrentStepIndex(prev => prev + 1)
      }
    }, loadingSteps[currentStepIndex]?.duration || 1000)

    return () => clearTimeout(timer)
  }, [currentStepIndex, isComplete, onComplete])

  if (isComplete && completedSteps.size === loadingSteps.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-green-500 mb-4">
            <CheckCircle className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-green-700 mb-2">
            Analisis Selesai!
          </h3>
          <p className="text-sm text-green-600">
            Memuat hasil...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Sedang Menganalisis Data
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Sistem sedang melakukan validasi dan analisis data pertumbuhan anak
        </p>
      </div>

      {/* Progress Steps */}
      <div className="space-y-3">
        {loadingSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = index === currentStepIndex && !isComplete
          const Icon = step.icon

          return (
            <div
              key={step.id}
              className={`
                flex items-center space-x-3 p-3 rounded-lg transition-all duration-500
                ${isCompleted ? 'bg-green-50 border border-green-200' :
                  isCurrent ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'}
              `}
            >
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : isCurrent ? (
                  <div className="relative">
                    <Icon className="h-5 w-5 text-blue-500" />
                    <div className="absolute -inset-1">
                      <Icon className="h-5 w-5 text-blue-300 animate-ping" />
                    </div>
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className={`
                    text-sm font-medium
                    ${isCompleted ? 'text-green-700' :
                      isCurrent ? 'text-blue-700' :
                      'text-gray-500'}
                  `}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  )}
                </div>
              </div>

              {/* Progress indicator for current step */}
              {isCurrent && (
                <div className="flex-shrink-0">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Overall Progress Bar */}
      <div className="mt-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(completedSteps.size / loadingSteps.length) * 100}%`
            }}
          />
        </div>
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-600">
            {Math.round((completedSteps.size / loadingSteps.length) * 100)}% Complete
          </p>
        </div>
      </div>

      {/* Processing Details */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">Sedang Diproses:</p>
            <ul className="space-y-1">
              <li>• Validasi data menggunakan standar pertumbuhan WHO</li>
              <li>• Deteksi otomatis jenis kelamin dari Excel</li>
              <li>• Analisis hierarki: Missing Data → Konsistensi → Rasionalitas → Anomali</li>
              <li>• Generate laporan Excel dengan warna validasi</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}