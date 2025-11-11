
1) Teknik Analisis (End-to-End Pipeline)

A. Pra-proses & Normalisasi
	•	Standarisasi tanggal: tanggal_lahir, tanggal_ukur → tipe tanggal; turunkan usia_bulan = floor((tanggal_ukur - tanggal_lahir)/30.44).
	•	Normalisasi nama & NIK: trim spasi, kapitalisasi seperlunya; NIK sebagai string (hindari notasi ilmiah).
	•	Satuan: berat (kg, 1 desimal), tinggi (cm, 1 desimal).
	•	Derivasi kolom waktu: tahun, bulan_label (JAN, FEB, …) untuk laporan naratif seperti di TXT (“Tidak diukur pada bulan: …”) .

B. Validasi Konsistensi & Kelengkapan
	1.	Urutan waktu: pastikan tiap anak punya urutan tanggal_ukur menaik; flag jika out-of-order.
	2.	Kelengkapan per bulan: deteksi bulan tanpa data (missing) per anak—ditulis ringkas per anak (“Tidak diukur pada bulan: …”) .
	3.	Gap data: jika selisih antar pengukuran > 1 bulan → Warning “Gap data: tidak ada pengukuran untuk 1 bulan sebelum ” (format ini sudah muncul di laporan saat ini) .

C. Aturan Biologis & Tren
	1.	Monotonisitas tinggi: tinggi badan tidak semestinya turun; jika Δtinggi < 0 (contoh: “Tinggi menurun: 86.0cm → 83.0cm”) → Error dan dituliskan eksplisit di laporan per anak .
	2.	Penurunan berat: turunnya berat bisa terjadi, tapi:
	•	Warning jika Δberat ≤ −3% antar bulan,
	•	Error jika Δberat ≤ −7% atau Δberat ≤ −1.0 kg (mana yang tercapai lebih dulu).

D. Rentang Ideal WHO (Z-score)
	•	Hitung z-score berdasarkan standar WHO sesuai usia (bulan) dan jenis kelamin:
z_berat_usia (WFA), z_tinggi_usia (HFA), dan opsional z_BB_TB (WFH).
	•	Klasifikasi:
	•	|z| ≤ 2 → OK
	•	2 < |z| ≤ 3 → Warning (di luar rentang ideal)
	•	|z| > 3 → Error (anomali kuat/kemungkinan input salah)
	•	Laporan sekarang sudah menyebut “Tinggi/ Berat tidak ideal (BULAN): …” → tetap dipakai untuk menarasikan deviasi ini per bulan  .

E. Deteksi Outlier Teknis (Data Entry)
	•	Batas wajar absolut (plausibilitas):
40–130 cm (0–5 th), 2–30 kg. Di luar ini → Error (contoh “88.0cm → 8.9cm” jelas salah ketik, tandai Error + perbaikan yang disarankan) .
	•	Z-score teknis: nilai z di luar ±4 → Error meski lulus batas absolut.
	•	Lonjakan ekstrem: Δtinggi ≥ 3.5 cm/bulan atau Δberat ≥ 2.5 kg/bulan → Warning (cek alat/entry).

F. Skoring Status per Baris & Agregasi per Anak
	•	Prioritas status (dari tertinggi): Error > Missing > Warning > OK.
	•	Per anak: simpulkan ringkas—“SEMUA DATA VALID ✓” bila tidak ada flag; jika ada, tulis daftar ringkas per kategori seperti di TXT yang sudah ada  .

⸻

2) Spesifikasi Output

A. File Excel: hasil_validasi.xlsx

Sheet & kolom:
	1.	Raw_with_Flags (sumber utama untuk audit)
Kolom minimal:
	•	NIK, Nama, Tanggal_Lahir, Tanggal_Ukur, Usia_Bulan,
Berat_kg, Tinggi_cm,
ΔBerat_kg, ΔTinggi_cm, Z_WFA, Z_HFA, Z_WFH,
Status (OK/WARNING/ERROR/MISSING),
Flag_Detail (array teks: “tinggi menurun 86.0→83.0”, “gap data ≤-”, “z_HFA=+2.6”).
	•	Conditional Formatting (warna latar baris penuh):
	•	Hijau (#E6F4EA) → Status="OK"
	•	Kuning (#FFF7CC) → Status="WARNING"
	•	Merah (#FDECEA) → Status="ERROR"
	•	Abu-abu (#EEEEEE) → Status="MISSING" (mis. bulan tak diukur)
	•	Ikon (kolom Status_Icon):
	•	✅ OK, ⚠️ Warning, ⛔ Error, ◻️ Missing
	2.	Per_Anak_Summary (1 baris per NIK)
Kolom:
	•	NIK, Nama, Tgl_Lahir, Periode_Mulai, Periode_Akhir,
Jml_Pengukuran, OK, Warning, Error, Missing,
Bulan_Tidak_Diukur (list “JAN, FEB, …”),
Catatan_Utama (mis. “tinggi menurun”, “gap data”, “nilai di luar ideal”).
	•	Bilah status: gunakan Data Bars untuk proporsi OK/Warning/Error.
	•	Sparklines: 2 kolom terakhir berisi sparkline tinggi dan sparkline berat per urutan waktu (memberi visual tren cepat per anak).
	3.	Dashboard (rekap global seperti di TXT)
	•	Kartu KPI:
	•	Total Anak, Total Pengukuran
	•	Valid (%), Warning (%), Error (%), Missing
(angka-angka ini matching dengan ringkasan yang saat ini muncul di TXT: “Valid (OK): 115 (63.9%), Warning: 55 (30.6%), Error: 10 (5.6%), Missing: 11”) .
	•	Donut/Bar chart: distribusi status.
	•	Top 10 Anomali: tabel kecil menampilkan baris “Error” terbaru/terberat.
	•	Legend Warna (wajib, lihat bagian 3).
	4.	WHO_Reference (opsional, cache)
	•	Tabel z-score referensi agar proses bisa offline.

Aturan format angka & tampilan:
	•	Tanggal → DD/MM/YYYY, berat/tinggi → 1 desimal.
	•	Z-score → 1 desimal (tapi simpan presisi 2 di sel tersembunyi bila perlu).
	•	Kolom teks detail dipisah koma/semicolon supaya mudah di-filter.

B. File TXT: laporan_validasi.txt

Struktur & gaya (dipertahankan seperti sekarang):
	•	Header rekap (tanggal generate, ringkasan KPI) — sudah ada dan dipertahankan .
	•	Blok per anak:

NAMA: <Nama>
NIK: <NIK>
TANGGAL LAHIR: <DD/MM/YYYY>
--------------------
<Baris-baris poin>


	•	Jenis poin yang ditulis (urut prioritas):
	1.	ERROR
	•	“Tinggi menurun: x→y” (wajib muncul bila ada)
	•	“Z-score di luar ±3: z_HFA=…/z_WFA=…”
	•	“Nilai tidak masuk akal: … (cek entri)” (contoh 8.9 cm)
	2.	WARNING
	•	“Gap data: tidak ada pengukuran untuk 1 bulan sebelum ”
	•	“Berat/tinggi tidak ideal (BULAN): ” (deviasi ±2–3 SD)
	3.	MISSING
	•	“Tidak diukur pada bulan: …” (list)
	4.	OK
	•	“SEMUA DATA VALID ✓” jika tidak ada poin lain (contoh sudah ada) .

Catatan gaya penulisan:
	•	Satu baris = satu temuan, tanpa paragraf panjang.
	•	Angka selalu dengan satuan (kg, cm).
	•	Gunakan kapitalisasi bulan konsisten (JANUARI, FEBRUARI, …) seperti sekarang.

C. (Opsional) File PDF: laporan_validasi.pdf
	•	Layout 2 bagian: Dashboard (1 halaman) + Lampiran per Anak (multi-halaman).
	•	Warna status sama seperti Excel. Gunakan ikon kecil ✅ ⚠️ ⛔ ◻️ di judul tiap anak.

⸻

3) Aturan Pewarnaan & Ikon (Standar Visual)

Status	Latar sel/baris	Teks	Ikon	Kapan dipakai
OK	Hijau muda #E6F4EA	Hijau tua #0B8043	✅	Semua cek lolos (z dalam ±2, tidak ada penurunan tinggi, tidak ada gap/missing)
WARNING	Kuning muda #FFF7CC	Kuning tua #A07900	⚠️	z dalam (2,3], gap = 1+ bulan, penurunan berat moderat, lonjakan ekstrem, data hampir hilang
ERROR	Merah muda #FDECEA	Merah tua #C00	⛔	Δtinggi<0, z>3, nilai tidak masuk akal, tanggal kacau
MISSING	Abu-abu #EEEEEE	Abu #5F6368	◻️	Bulan tanpa pengukuran untuk anak tsb
INFO (opsional)	Biru muda #E8F0FE	Biru #174EA6	ℹ️	Catatan teknis (mis. “entry dibulatkan”, “alat diganti”)

Prioritas visual: jika 1 baris punya beberapa flag, warna mengikuti prioritas status (Error > Missing > Warning > Info > OK).

⸻

4) Logika Penentuan Status (Rule Machine)

Urutan evaluasi per baris (short-circuit):
	1.	Hard Error
	•	Tinggi turun (Δtinggi < 0).
	•	Nilai di luar batas absolut biologis.
	•	Z-score |z| > 3.
→ Status = ERROR + tulis alasan spesifik.
	2.	Missing
	•	Bulan yang seharusnya ada tapi kosong (di-generate dari grid bulan).
→ Status = MISSING + catat bulan.
	3.	Warning
	•	Gap antar pengukuran >1 bulan.
	•	Z-score 2 < |z| ≤ 3.
	•	Δberat ≤ −3% (moderate) atau lonjakan ekstrem.
→ Status = WARNING + alasan.
	4.	OK → sisanya.

⸻

5) Ringkasan Global (Sinkron dengan TXT)
	•	Di Dashboard Excel dan header TXT tampilkan:
	•	Total Anak, Total Pengukuran, Valid, Warning, Error, Missing, lengkap dengan persentase—meniru pola rekap di file TXT yang sudah ada (“Valid (OK): 115 (63.9%) …”) .
	•	Tampilkan 5–10 anak dengan risiko tertinggi (banyak Error/Warning beruntun).
	•	Tambahkan badge kecil untuk anak yang “SEMUA DATA VALID ✓” agar tim cepat melihat mana yang aman .

⸻

6) Contoh Baris (konsep)

NIK: 3507…0041 | Nama: LAHIBA FAZA | Bulan: JULI | Tinggi: 83.0 | ΔTinggi: -3.0 | Z_HFA: -2.4 | Status: ERROR | Flag_Detail: ["Tinggi menurun 86.0→83.0", "di luar ideal"]

— Baris diwarnai merah muda, ikon ⛔, dan di TXT muncul kalimat “Tinggi menurun: 86.0cm → 83.0cm” seperti yang sudah ada sekarang .

⸻

7) Jaminan Konsistensi Output
	•	Penamaan file: hasil_validasi_YYYYMMDD.xlsx, laporan_validasi_YYYYMMDD.txt + opsional laporan_validasi_YYYYMMDD.pdf.
	•	Versi & jejak audit: catat Tanggal Generate, versi aturan, dan jumlah record dianalisis (sudah tampil di TXT saat ini) .
	•	Deterministik: aturan dan ambang batas tersimpan di satu modul konfigurasi (mudah direvisi tanpa ubah kode inti).

⸻

Kalau Mas setuju, aku bisa langsung:
	1.	Menambahkan sheet Dashboard & Per_Anak_Summary ke hasil_validasi.xlsx dengan aturan warna/ikon di atas, dan
	2.	Merapikan redaksi TXT (tetap singkat per poin, tapi menambahkan z-score bila tersedia).