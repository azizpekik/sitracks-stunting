import Link from 'next/link'
import { ArrowRight, BarChart3, FileText, Upload, Shield, LogIn } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Login Button */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Sitracking Stunting
              </h1>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <LogIn className="h-4 w-4" />
              <span>Login Admin</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Sistem Analisis Data Pertumbuhan Anak
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Sistem Web Analisis Ketelitian Data Pertumbuhan Anak (0–2 Tahun) yang
            memvalidasi data dari file Excel dengan tabel referensi pertumbuhan ideal WHO.
          </p>
          <Link
            href="/analyze"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <span>Mulai Analisis</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Mudah</h3>
            <p className="text-gray-600 text-sm">
              Upload file Excel data lapangan dan tabel referensi pertumbuhan dengan antarmuka yang intuitif.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Validasi Otomatis</h3>
            <p className="text-gray-600 text-sm">
              Analisis hierarkis data pertumbuhan dengan deteksi missing data, konsistensi, dan rasionalitas.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4">
              <FileText className="h-6 w-6 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Laporan Detail</h3>
            <p className="text-gray-600 text-sm">
              Generate laporan deskriptif per anak dan file Excel hasil validasi dengan pewarnaan otomatis.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Statistik Real-time</h3>
            <p className="text-gray-600 text-sm">
              Monitoring hasil analisis dengan statistik ringkas dan preview data langsung di dashboard.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Cara Kerja Sistem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4 mx-auto">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload File</h3>
              <p className="text-gray-600">
                Upload 2 file Excel: Data Test.xlsx (lapangan) dan Tabel_Pertumbuhan_Anak_0-2_Tahun.xlsx (referensi)
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4 mx-auto">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Proses Analisis</h3>
              <p className="text-gray-600">
                Sistem memvalidasi data dengan hierarki aturan: Missing Data → Konsistensi Tinggi → Rasionalitas → Anomali Berat
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4 mx-auto">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Download Hasil</h3>
              <p className="text-gray-600">
                Download file Excel hasil validasi (dengan pewarnaan) dan laporan deskriptif dalam format teks
              </p>
            </div>
          </div>
        </div>

        {/* Validation Rules */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Aturan Validasi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">ERROR (Merah)</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Tinggi badan menurun dari bulan sebelumnya</li>
                <li>• Indikasi kesalahan input yang signifikan</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-yellow-600">WARNING (Kuning/Oranye)</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Missing data (berat/tinggi kosong) - Kuning</li>
                <li>• Gap umur &gt; 1 bulan - Kuning</li>
                <li>• Berat/tinggi di luar rentang ideal - Oranye</li>
                <li>• Anomali berat turun &gt; 10% - Oranye</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-green-600">OK (Hijau)</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Semua validasi terpenuhi</li>
                <li>• Data konsisten dan rasional</li>
                <li>• Berat dan tinggi dalam rentang ideal</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 text-gray-600">MISSING</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Data berat atau tinggi kosong</li>
                <li>• Bulan pengukuran terlewat</li>
                <li>• Kolom wajib tidak terisi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}