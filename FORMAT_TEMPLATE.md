# 📋 Format Template Excel untuk Sitracking Stunting

## 📊 Template Data Lapangan (Data Test.xlsx)

### 🏷️ Format Kolom:

```
No | NIK | nama_anak | TANGGAL LAHIR | JENIS_KELAMIN | JANUARI_TANGGALUKUR | JANUARI_UMUR | JANUARI_BERAT | JANUARI_TINGGI | JANUARI_CARAUKUR | FEBRUARI_TANGGALUKUR | FEBRUARI_UMUR | FEBRUARI_BERAT | FEBRUARI_TINGGI | FEBRUARI_CARAUKUR | ... | DESEMBER_TANGGALUKUR | DESEMBER_UMUR | DESEMBER_BERAT | DESEMBER_TINGGI | DESEMBER_CARAUKUR
```

### 📝 Contoh Data:

```
No | NIK | nama_anak | TANGGAL LAHIR | JENIS_KELAMIN | JANUARI_UMUR | JANUARI_BERAT | JANUARI_TINGGI | JANUARI_CARAUKUR
1 | 3201011234567890 | AHMADI BUDIMAN | 2023-01-15 | L | 1 | 3.5 | 51.2 | Telentang
2 | 3201011234567891 | SITI AISYAH | 2023-02-20 | P | 1 | 3.8 | 52.1 | Telentang
3 | 3201011234567892 | BUDI SANTOSO | 2023-03-10 | L | 2 | 5.2 | 58.5 | Berdiri
```

## 📈 Template Tabel Referensi (Tabel_Pertumbuhan_Anak_0-2_Tahun.xlsx)

### 🏷️ Format Kolom:

```
Umur | BB Ideal (L) | PB Ideal (L) | BB Ideal (P) | PB Ideal (P)
```

** atau variasi nama kolom yang diterima:**
- **Umur**: `Umur`, `Age`, `Bulan`, `usia`
- **BB Ideal (L)**: `BB Ideal (L)`, `BB L`, `Berat Ideal L`, `BB Laki-laki`
- **PB Ideal (L)**: `PB Ideal (L)`, `TB Ideal (L)`, `PB L`, `Tinggi Ideal L`, `PB Laki-laki`
- **BB Ideal (P)**: `BB Ideal (P)`, `BB P`, `Berat Ideal P`, `BB Perempuan`
- **PB Ideal (P)**: `PB Ideal (P)`, `TB Ideal (P)`, `PB P`, `Tinggi Ideal P`, `PB Perempuan`

### 📝 Contoh Data:

```
Umur | BB Ideal (L) | PB Ideal (L) | BB Ideal (P) | PB Ideal (P)
0 | 3.3-5.0 | 49.0-54.7 | 3.2-4.8 | 48.4-53.5
1 | 4.4-6.0 | 53.7-59.5 | 4.0-5.7 | 52.0-58.0
2 | 5.1-6.9 | 58.4-64.1 | 4.7-6.4 | 56.8-62.7
3 | 5.7-7.6 | 61.4-67.1 | 5.3-7.1 | 59.9-65.9
...
24 | 10.4-13.0 | 81.5-88.0 | 9.8-12.2 | 80.3-86.5
```

## 📌 Catatan Penting:

### 🎯 **Kolom Wajib:**
- **Data Lapangan**: `nama_anak` (wajib), `JENIS_KELAMIN` (wajib "L" atau "P")
- **Tabel Referensi**: Semua kolom dengan format rentang "min-max"

### 🔄 **Dua Opsi Jenis Kelamin:**

**Opsi 1: Kolom JENIS_KELAMIN di Data Lapangan**
```
JENIS_KELAMIN
L
P
L
```

**Opsi 2: Gunakan Dropdown Jenis Kelamin Default (jika kolom JENIS_KELAMIN tidak ada)**
- Pilih "Laki-laki (L)" atau "Perempuan (P)" di dropdown aplikasi
- Sistem akan menggunakan nilai ini untuk semua anak

### 📊 **Format Per Bulan:**
Untuk setiap bulan (JANUARI s/d DESEMBER):
- `BULAN_TANGGALUKUR`: Tanggal pengukuran (format: DD/MM/YYYY)
- `BULAN_UMUR`: Umur dalam bulan (angka integer)
- `BULAN_BERAT`: Berat badan dalam kg (desimal)
- `BULAN_TINGGI`: Tinggi badan dalam cm (desimal)
- `BULAN_CARAUKUR`: "Telentang" atau "Berdiri"

### ❌ **Contoh Format yang SALAH:**
```
# SALAH - kolom terpisah
JANUARI | TANGGAL UKUR | UMUR | BERAT | TINGGI

# SALAH - tidak ada JENIS_KELAMIN
No | NIK | nama_anak | TANGGAL LAHIR | JANUARI_UMUR | JANUARI_BERAT

# SALAH - jenis kelamin tidak standar
No | NIK | nama_anak | TANGGAL LAHIR | GENDER | JANUARI_UMUR | JANUARI_BERAT
```

### ✅ **Contoh Format yang BENAR:**
```
# BENAR - dengan JENIS_KELAMIN
No | NIK | nama_anak | TANGGAL LAHIR | JENIS_KELAMIN | JANUARI_UMUR | JANUARI_BERAT | JANUARI_TINGGI | JANUARI_CARAUKUR

# BENAR - tanpa JENIS_KELAMIN (gunakan dropdown)
No | NIK | nama_anak | TANGGAL LAHIR | JANUARI_UMUR | JANUARI_BERAT | JANUARI_TINGGI | JANUARI_CARAUKUR
```

## 🚀 **Quick Start Template:**

1. **Copy template di atas** ke file Excel baru
2. **Isi dengan data Anda** sesuai format
3. **Pastikan JENIS_KELAMIN** terisi "L" atau "P"
4. **Upload file** ke aplikasi Sitracking Stunting

## 💡 **Tips:**
- Gunakan format `L` untuk Laki-laki dan `P` untuk Perempuan (case-sensitive)
- Pastikan semua nilai numerik valid (tidak ada teks di kolom angka)
- Simpan file sebagai `.xlsx` untuk kompatibilitas terbaik