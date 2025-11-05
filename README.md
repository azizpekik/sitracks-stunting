# Sitracking Stunting - Sistem Analisis Data Pertumbuhan Anak

Aplikasi web berbasis untuk memvalidasi dan menganalisis data pertumbuhan anak (0-2 tahun) dari file Excel menggunakan standar pertumbuhan WHO.

## ✨ Fitur Utama

- 📊 **Upload Excel Files** - Upload file data lapangan dan tabel referensi pertumbuhan
- 🔍 **Validasi Otomatis** - Validasi data dengan aturan hierarkis (missing data, konsistensi, rasionalitas)
- 📈 **Laporan Berwarna** - Generate laporan Excel dengan pewarnaan otomatis dan laporan deskriptif
- 📱 **Real-time Analysis** - Analisis real-time dengan statistik ringkasan
- 💾 **Multiple Formats** - Download hasil dalam format Excel dan teks

## 🛠 Teknologi

### Backend
- **Python 3** dengan FastAPI
- **SQLAlchemy 2.0** dengan SQLite
- **pandas, numpy** untuk data processing
- **openpyxl** untuk Excel manipulation
- **Pydantic v2** untuk data validation

### Frontend
- **Next.js 15** dengan React 18 dan TypeScript
- **Tailwind CSS** untuk styling
- **shadcn/ui** components
- **React Query (TanStack Query)** untuk data fetching

### Deployment
- **Docker & Docker Compose**
- **Nginx** reverse proxy

## 🚀 Quick Start

### Dengan Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd sitracking-stunting

# Setup environment
cp backend/.env.example backend/.env
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > frontend/.env.local

# Jalankan dengan Docker Compose
docker-compose up --build

# Aplikasi akan tersedia di:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Manual Setup

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload

# Frontend (dibuka terminal baru)
cd frontend
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000" > .env.local
npm run dev
```

## 📁 Struktur Project

```
├── backend/                 # FastAPI application
│   ├── main.py             # Main application
│   ├── models.py           # Database models
│   ├── schemas.py          # Pydantic schemas
│   ├── services/           # Business logic
│   │   ├── analyzer.py     # Growth analysis engine
│   │   ├── excel_parser.py # Excel file parser
│   │   └── report_generator.py # Report generator
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js application
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   └── lib/          # Utilities & API client
│   └── package.json       # Node.js dependencies
├── docker-compose/         # Deployment configuration
│   └── nginx/             # Nginx configuration
├── docker-compose.yml      # Docker services
└── prd.md                 # Product Requirements Document
```

## 📋 Cara Penggunaan

### 1. Upload File
- **Data Lapangan**: File Excel dengan format wide data pengukuran per anak per bulan
- **Tabel Referensi**: File Excel dengan rentang pertumbuhan ideal (BB/PB untuk L/P)

### 2. Proses Analisis
- Sistem memvalidasi data dengan hierarki:
  1. **Missing Data Check** - Data kosong/gap pengukuran
  2. **Konsistensi Tinggi** - Deteksi penurunan tinggi badan
  3. **Rasionalitas** - Bandingkan dengan tabel ideal WHO
  4. **Anomali Berat** - Deteksi penurunan berat >10%

### 3. Download Hasil
- **Excel Report**: Hasil validasi dengan pewarnaan (Merah=Error, Kuning/Oranye=Warning, Hijau=OK)
- **Text Report**: Laporan deskriptif detail per anak

## 🎨 Aturan Validasi

| Status | Warna | Kondisi |
|--------|-------|---------|
| **ERROR** | 🔴 Merah | Tinggi menurun dari bulan sebelumnya |
| **WARNING** | 🟡 Kuning | Missing data, gap umur >1 bulan |
| **WARNING** | 🟠 Oranye | Data di luar rentang ideal, anomali berat >10% |
| **OK** | 🟢 Hijau | Semua validasi terpenuhi |

## 📊 API Endpoints

### `POST /api/analyze`
- Upload dan proses analisis data
- Content-Type: `multipart/form-data`
- Response: `job_id` untuk tracking

### `GET /api/jobs/{job_id}`
- Cek status dan hasil analisis
- Auto-refresh saat status = `processing`

### `GET /api/download/{filename}`
- Download file hasil (Excel/TXT)
- Query parameter: `?job={job_id}`

## 🔧 Konfigurasi

### Backend Environment (.env)
```bash
APP_ENV=development
FILE_STORE=./data
MAX_UPLOAD_MB=10
DEFAULT_GENDER=L
DATABASE_URL=sqlite:///./sitracking.db
```

### Frontend Environment (.env.local)
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## 📚 Dokumentasi Lengkap

- **Product Requirements**: [prd.md](./prd.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Documentation**: `http://localhost:8000/docs` (setelah dijalankan)

## 🐛 Troubleshooting

### File Format Issues
- Pastikan file Excel memiliki format sesuai PRD
- Kolom wajib: `nama_anak`, bulanan (JANUARI-DESEMBER) dengan subkolom `TANGGALUKUR`, `UMUR`, `BERAT`, `TINGGI`, `CARAUKUR`
- Kolom `JENIS_KELAMIN` wajib diisi dengan "L" atau "P" (jika tidak ada, gunakan dropdown Jenis Kelamin Default)

### Performance Issues
- Maksimum file size: 10MB per upload
- Processing time: <15 detik untuk 1.000 baris anak
- Auto-cleanup: File otomatis dihapus setelah 30 hari

## 🤝 Kontribusi

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For questions and support:
- Create issue di repository
- Email: support@sitracking.id