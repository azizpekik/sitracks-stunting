PRD — Sistem Web Analisis Ketelitian Data Pertumbuhan Anak (0–2 Tahun) - Sistracking Stunting

1) Tujuan Produk

Memvalidasi ketelitian & konsistensi data pertumbuhan anak usia 0–24 bulan dari file Excel lapangan (rekap posyandu), menggunakan tabel referensi pertumbuhan ideal (L/P) dan menghasilkan:
	•	File Excel hasil validasi (dengan pewarnaan otomatis).
	•	Laporan deskriptif per anak.
	•	Statistik ringkas (valid, error, missing).

⸻

2) Stack Teknologi (FIX)

Backend (API)
	•	Bahasa: Python 3
	•	Framework: FastAPI (typed, auto OpenAPI docs)
	•	Server: Uvicorn
	•	Data processing: pandas, numpy
	•	Excel I/O + formatting: openpyxl
	•	Schema/Model: Pydantic v2
	•	DB: SQLite (lokal) + SQLAlchemy 2.0 (ORM)
	•	Storage file: lokal /data/uploads & /data/outputs
	•	Logging: Python logging (rotating file handler)

Frontend (Web)
	•	Framework: Next.js 15 (React 18) — TypeScript
	•	Styling: Tailwind CSS
	•	Komponen UI: shadcn/ui
	•	State/data fetching: React Query (TanStack Query)
	•	Build: Vite (via Next build default)

DevOps & Deploy
	•	Container: Docker + Docker Compose
	•	Reverse proxy: Nginx
	•	Environments: .env (backend & frontend)
	•	CI (opsional): GitHub Actions (lint + test + build)

⸻

3) Input & Referensi (FIX)

3.1. File Input Lapangan: Data Test.xlsx

Format wide (rekap). Kolom minimal:
	•	Identitas (fixed di kiri):
No, NIK, nama_anak, TANGGAL LAHIR
	•	Per bulan (JANUARI…DESEMBER), masing-masing 5 subkolom:
TANGGALUKUR, UMUR (bulan, integer), BERAT (kg), TINGGI (cm), CARA UKUR (Telentang/Berdiri).

Contoh nama kolom (hasil normalisasi internal):
JANUARI_TANGGALUKUR, JANUARI_UMUR, JANUARI_BERAT, JANUARI_TINGGI, JANUARI_CARAUKUR, … hingga DESEMBER_*.

Catatan: jika data hanya sampai bulan tertentu (mis. September) sistem tetap jalan.

3.2. Referensi Pertumbuhan: Tabel_Pertumbuhan_Anak_0-2_Tahun.xlsx
	•	Sheet tunggal, kolom:
Umur (bulan), BB Ideal (L), PB Ideal (L), BB Ideal (P), PB Ideal (P)
	•	Nilai rentang string "min-max", contoh: 7.1-9.9 (kg) dan 67.5-74.2 (cm).
	•	Sistem parse ke float min, max.

Jenis Kelamin: jika tidak tersedia di data lapangan, default = Laki-laki (L).

⸻

4) Aturan Validasi (FIX)

4.1. Hierarki Validasi (urutan eksekusi)
	1.	Missing Data Check
	•	Kolom bulan ada tapi berat/tinggi kosong → Missing.
	•	Gap umur antar baris anak > 1 bulan → catat Missing month di rentang.
	2.	Konsistensi Tinggi Badan
	•	Tinggi bulan_n berikut harus ≥ bulan_(n-1).
	•	Jika menurun → Error: “Tinggi menurun (indikasi salah input)”.
	3.	Rasionalitas vs Tabel Ideal
	•	Berat: bandingkan dengan rentang ideal umur & JK → Ideal / Tidak Ideal.
	•	Tinggi: bandingkan dengan rentang ideal umur & JK → Ideal / Tidak Ideal.
	4.	Anomali Berat
	•	Berat boleh naik/turun. Jika turun > 10% dari bulan sebelumnya → Warning: “Anomali berat >10%”.

4.2. Definisi Status Per Baris (bulan anak)
	•	status_berat: Ideal | Tidak Ideal | Missing
	•	status_tinggi: Ideal | Tidak Ideal | Missing
	•	validasi_input (prioritas warna):
	•	Merah (ERROR): Tinggi menurun
	•	Kuning (WARNING): Missing data / Missing month
	•	Oranye (WARNING): Anomali berat >10% atau Berat/Tinggi tidak ideal
	•	Hijau (OK): Semua valid

Prioritas pewarnaan di Excel: Merah > Kuning > Oranye > Hijau.

⸻

5) Fitur & Flow (FIX)

5.1. Fitur Pengguna
	•	Upload 2 file:
	1.	Data Test.xlsx (lapangan)
	2.	Tabel_Pertumbuhan_Anak_0-2_Tahun.xlsx (referensi)
	•	Jalankan analisis (client klik tombol).
	•	Lihat hasil ringkas di web (tabel + badge warna).
	•	Download:
	•	hasil_validasi.xlsx (dengan pewarnaan sel)
	•	laporan_validasi.txt (deskriptif per anak)
	•	Lihat statistik ringkas (kartu angka + bar chart kecil).

5.2. Flow Pengguna
	1.	Buka halaman /analyze → upload 2 file → klik Proses.
	2.	Frontend POST ke API /analyze.
	3.	API:
	•	Parse & normalisasi input.
	•	Transform wide → long per anak—per bulan.
	•	Validasi (hierarki di §4).
	•	Simpan hasil ke DB + generate artifacts (Excel + TXT).
	4.	Frontend polling status job → tampilkan ringkasan + tombol Download.
	5.	Pengguna download hasil.

⸻

6) API (FIX)

6.1. POST /api/analyze
	•	Form-Data:
	•	lapangan: file .xlsx (Data Test.xlsx)
	•	referensi: file .xlsx (Tabel pertumbuhan)
	•	jenis_kelamin_default: "L" atau "P" (optional; default "L")
	•	Response 200 (JSON):

{
  "job_id": "uuid",
  "summary": {
    "total_anak": 120,
    "total_records": 920,
    "valid": 770,
    "warning": 120,
    "error": 30,
    "missing": 100
  },
  "downloads": {
    "excel": "/api/download/hasil_validasi.xlsx?job=uuid",
    "laporan": "/api/download/laporan_validasi.txt?job=uuid"
  },
  "preview": [
    {
      "nama_anak": "HAIBA TIA ADIAHRA",
      "bulan": "JANUARI",
      "umur": 35,
      "berat": 11.3,
      "tinggi": 86.3,
      "status_berat": "Ideal",
      "status_tinggi": "Ideal",
      "validasi_input": "OK",
      "keterangan": ""
    }
  ]
}

6.2. GET /api/download/{filename}
	•	Valid filename: hasil_validasi.xlsx | laporan_validasi.txt.
	•	Query job: uuid.
	•	Return file dengan header Content-Disposition: attachment.

6.3. GET /api/jobs/{job_id}
	•	Mengembalikan status & ringkasan hasil (untuk polling).

⸻

7) Skema Database (FIX — SQLite)

Tabel jobs
	•	id (TEXT, PK, uuid)
	•	created_at (DATETIME)
	•	default_gender (TEXT: L/P)
	•	summary_json (TEXT)
	•	excel_path (TEXT)
	•	report_path (TEXT)

Tabel children
	•	id (INTEGER, PK)
	•	job_id (TEXT, FK → jobs.id)
	•	nik (TEXT, nullable)
	•	nama (TEXT)
	•	tgl_lahir (DATE, nullable)

Tabel measurements
	•	id (INTEGER, PK)
	•	job_id (TEXT, FK)
	•	child_id (INTEGER, FK → children.id)
	•	bulan (TEXT: “JANUARI”… “DESEMBER”)
	•	tgl_ukur (DATE, nullable)
	•	umur_bulan (INTEGER, nullable)
	•	berat (REAL, nullable)
	•	tinggi (REAL, nullable)
	•	cara_ukur (TEXT, nullable)
	•	status_berat (TEXT)
	•	status_tinggi (TEXT)
	•	validasi_input (TEXT)  // OK | ERROR | WARNING
	•	keterangan (TEXT)

Index: (job_id, child_id, umur_bulan)

⸻

8) Algoritma Inti (FIX)
	1.	Load referensi → parse rentang "min-max" ke min, max float per umur & JK:
	•	Map: ref["BB_L"][umur] = (min, max), ref["PB_L"][umur], ref["BB_P"], ref["PB_P"].
	2.	Parse file lapangan:
	•	Deteksi header row (nama kolom) → normalisasi kolom bulan:
	•	Ubah ke format: BULAN_TANGGALUKUR, BULAN_UMUR, BULAN_BERAT, BULAN_TINGGI, BULAN_CARAUKUR.
	•	Untuk setiap anak (baris):
	•	Untuk setiap bulan:
	•	Bentuk baris long:
nama, nik, tgl_lahir, bulan, tgl_ukur, umur, berat, tinggi, cara_ukur.
	3.	Validasi per anak:
	•	Urutkan record anak berdasarkan umur_bulan (fallback tgl_ukur).
	•	Missing month: jika selisih umur > 1 → tulis ke keterangan.
	•	Missing data: berat atau tinggi kosong → status_* = Missing, validasi_input=WARNING.
	•	Tinggi menurun: jika tinggi(n) < tinggi(n-1) → validasi_input=ERROR + keterangan.
	•	Berat anomali: jika berat(n) < 0.9 * berat(n-1) → WARNING.
	•	Rasionalitas: compare ke referensi umur & JK → Ideal/Tidak Ideal per berat/tinggi; jika Tidak Ideal dan bukan Missing → validasi_input=WARNING (kecuali sudah ERROR).
	4.	Pewarnaan Excel (openpyxl):
	•	Kolom validasi_input memicu fill:
	•	ERROR → merah
	•	WARNING → kuning (missing/gap) atau oranye (anomali/tidak ideal)
	•	OK → hijau
	•	Freeze header, auto width, row striping.
	5.	Laporan deskriptif:
	•	Per anak, kumpulkan:
	•	Rentang bulan missing → “Tidak diukur pada: …”
	•	Insiden tinggi menurun → “Tinggi menurun X → Y pada bulan …”
	•	Berat/tinggi di luar ideal → sebut nilai vs rentang.
	•	Tulis ke laporan_validasi.txt.
	6.	Summary:
	•	Hitung agregat untuk response JSON & dashboard.

⸻

9) UI/UX (FIX)

Halaman /analyze
	•	Card Upload (2 input):
	•	Data Lapangan (.xlsx)
	•	Tabel Referensi (.xlsx)
	•	Dropdown Jenis Kelamin Default: L (default), P.
	•	Tombol Proses (disabled saat upload belum lengkap).
	•	Section Hasil:
	•	Stat Cards: total anak, total records, valid, warning, error, missing.
	•	Preview Tabel (paginated): kolom utama + badge warna validasi_input.
	•	Download: dua tombol (Excel & TXT).
	•	Empty/Missing states tertangani.
	•	Toasts untuk sukses/gagal.

Styling Tailwind, komponen shadcn/ui: Card, Button, Badge, Table, Alert.

⸻

10) Non-Fungsional (FIX)
	•	Maks. ukuran file per upload: 10 MB.
	•	Waktu proses untuk 1.000 baris anak (≤ 10.000 records long): < 15 detik pada CPU 2 vCore.
	•	Keandalan: error handling untuk kolom hilang/typo → kembalikan 400 + pesan jelas (kolom yang bermasalah).
	•	Audit: log setiap job (start, end, durasi).
	•	Keamanan: validasi MIME & ekstensi; tidak menyimpan file lebih dari 30 hari (cron cleanup).

⸻

11) Kontrak Kolom & Normalisasi (FIX)
	•	Nama bulan yang dikenali (case-insensitive):
JANUARI, FEBRUARI, MARET, APRIL, MEI, JUNI, JULI, AGUSTUS, SEPTEMBER, OKTOBER, NOVEMBER, DESEMBER
	•	Subkolom Wajib per bulan:
TANGGALUKUR, UMUR, BERAT, TINGGI, CARAUKUR
	•	Kolom identitas wajib: nama_anak.
NIK dan TANGGAL LAHIR opsional (null-safe).
	•	UMUR dipaksa integer (floor jika desimal).
	•	Satuan fix: kg (berat), cm (tinggi).

⸻

12) Acceptance Criteria (FIX)
	•	✅ Sistem menerima 2 file, memproses, dan mengembalikan preview + link unduhan Excel/TXT.
	•	✅ Excel hasil memiliki pewarnaan sesuai prioritas (Merah > Kuning > Oranye > Hijau).
	•	✅ Laporan TXT menyebut nama anak, rentang bulan missing, insiden tinggi menurun, dan nilai di luar ideal lengkap dengan rentang ideal.
	•	✅ Statistik ringkas tampil di dashboard.
	•	✅ Error input (kolom tidak ditemukan) menghasilkan HTTP 400 dengan pesan kolom yang hilang.

⸻

13) Variabel Lingkungan (FIX)

Backend (.env):

APP_ENV=production
FILE_STORE=/data
MAX_UPLOAD_MB=10
DEFAULT_GENDER=L

Frontend (.env):

NEXT_PUBLIC_API_BASE_URL=https://domain/api


⸻

14) Deployment (FIX)
	•	Build Docker image backend & frontend.
	•	Nginx reverse proxy:
	•	/api/* → FastAPI (Uvicorn)
	•	/* → Next.js (standalone output)
	•	Volume: /data untuk uploads/outputs (persisten).