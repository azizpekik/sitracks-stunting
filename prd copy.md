PRD — Sistem Web Analisis Ketelitian Data Pertumbuhan Anak (0–2 Tahun) - Sistracking Stunting

1) Input & Referensi (FIX)

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
