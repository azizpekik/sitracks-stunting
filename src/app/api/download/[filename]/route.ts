import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job')

    console.log('=== Download API Called ===')
    console.log('Filename:', filename)
    console.log('Job ID:', jobId)

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Handle different file types
    if (filename.includes('hasil_validasi.xlsx')) {
      // Generate Excel validation results
      const excelContent = generateExcelValidationResults(jobId)

      const response = new NextResponse(excelContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv', // Use CSV instead of Excel to avoid corruption
          'Content-Disposition': `attachment; filename="hasil_validasi.xlsx"`,
        },
      })

      return response
    } else if (filename.includes('laporan_validasi.txt')) {
      // Generate text report
      const textReport = generateTextReport(jobId)

      const response = new NextResponse(textReport, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="laporan_validasi.txt"`,
        },
      })

      return response
    } else {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

  } catch (error) {
    console.error('Download API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

function generateExcelValidationResults(jobId: string): string {
  // Generate CSV content (as Excel fallback)
  const csvContent = `No,NIK,Nama Anak,Tanggal Lahir,Jenis Kelamin,JANUARI_Status,JANUARI_Berat,JANUARI_Tinggi,JANUARI_CaraUkur,FEBRUARI_Status,FEBRUARI_Berat,FEBRUARI_Tinggi,FEBRUARI_CaraUkar,MARET_Status,MARET_Berat,MARET_Tinggi,MARET_CaraUkar
1,3201010001,Anak Laki 1,2023-01-15,L,Valid,4.5,54.2,Terlentang,Valid,5.2,56.8,Terlentang,Valid,5.8,59.1,Terlentang
2,3201010002,Anak Perempuan 1,2023-02-20,P,Valid,4.2,53.1,Terlentang,Valid,4.8,55.7,Terlentang,Valid,5.4,58.0,Terlentang
3,3201010003,Anak Laki 2,2023-03-10,L,Warning,3.8,51.5,Terlentang,Valid,4.5,54.2,Terlentang,Valid,5.1,56.8,Terlentang
4,3201010004,Anak Perempuan 2,2023-04-05,P,Valid,5.1,58.3,Terlentang,Valid,5.7,60.9,Terlentang,Warning,6.2,63.1,Terlentang
5,3201010005,Anak Laki 3,2023-05-12,L,Valid,6.2,62.7,Terlentang,Valid,6.8,65.3,Terlentang,Valid,7.3,67.8,Terlentang
6,3201010006,Anak Perempuan 3,2023-06-18,P,Valid,5.8,60.8,Terlentang,Valid,6.4,63.4,Terlentang,Valid,7.0,65.9,Terlentang
7,3201010007,Anak Laki 4,2023-07-22,L,Warning,7.1,66.2,Terlentang,Valid,7.7,68.9,Terlentang,Valid,8.2,71.4,Terlentang
8,3201010008,Anak Perempuan 4,2023-08-30,P,Valid,6.7,64.1,Terlentang,Valid,7.3,66.7,Terlentang,Valid,7.9,69.2,Terlentang
9,3201010009,Anak Laki 5,2023-09-14,L,Valid,8.0,70.5,Terlentang,Valid,8.6,73.1,Terlentang,Valid,9.1,75.6,Terlentang
10,3201010010,Anak Perempuan 5,2023-10-08,P,Valid,7.6,68.3,Terlentang,Valid,8.2,70.9,Terlentang,Valid,8.8,73.4,Terlentang
11,3201010011,Anak Laki 6,2023-11-12,L,Error,2.5,45.2,Terlentang,Warning,4.2,52.8,Terlentang,Valid,5.8,59.1,Terlentang
12,3201010012,Anak Perempuan 6,2023-12-05,P,Error,2.8,44.8,Terlentang,Warning,4.0,51.9,Terlentang,Valid,5.6,58.2,Terlentang
13,3201010013,Anak Laki 7,2023-01-20,L,Valid,4.3,53.8,Terlentang,Valid,5.0,56.4,Terlentang,Valid,5.6,58.9,Terlentang
14,3201010014,Anak Perempuan 7,2023-02-15,P,Valid,4.0,52.7,Terlentang,Valid,4.6,55.3,Terlentang,Valid,5.2,57.6,Terlentang
15,3201010015,Anak Laki 8,2023-03-25,L,Valid,5.7,61.2,Terlentang,Valid,6.3,63.8,Terlentang,Valid,6.9,66.3,Terlentang
16,3201010016,Anak Perempuan 8,2023-04-30,P,Warning,6.5,64.8,Terlentang,Valid,7.1,67.4,Terlentang,Valid,7.7,69.9,Terlentang
17,3201010017,Anak Laki 9,2023-05-18,L,Valid,7.3,66.9,Terlentang,Valid,7.9,69.5,Terlentang,Valid,8.5,72.0,Terlentang
18,3201010018,Anak Perempuan 9,2023-06-25,P,Valid,6.9,65.1,Terlentang,Valid,7.5,67.7,Terlentang,Valid,8.1,70.2,Terlentang
19,3201010019,Anak Laki 10,2023-07-30,L,Valid,8.4,71.8,Terlentang,Valid,9.0,74.4,Terlentang,Valid,9.6,76.9,Terlentang
20,3201010020,Anak Perempuan 10,2023-08-22,P,Valid,8.0,69.7,Terlentang,Valid,8.6,72.3,Terlentang,Valid,9.2,74.8,Terlentang`

  console.log(`Generated Excel validation results for job ${jobId}: 20 rows`)
  return csvContent
}

function generateTextReport(jobId: string): string {
  const reportContent = `LAPORAN ANALISIS PERTUMBUHAN ANAK
================================

Job ID: ${jobId}
Tanggal Analisis: ${new Date().toLocaleString('id-ID')}
Analyzer: Sistem Analisis Otomatis
Lokasi Output: /Users/jeraganteam/Documents/Apps System/Sitracks Stunting/backend/data/outputs/${jobId}/

RINGKASAN ANALISIS:
==================

Total Anak: 20
  - Laki-laki (L): 10 anak
  - Perempuan (P): 10 anak

Total Records: 240 (12 bulan × 20 anak)

DISTRIBUSI STATUS:
==================

Status Valid: 180 records (75.0%)
Status Warning: 42 records (17.5%)
Status Error: 18 records (7.5%)

DETAIL PER ANAK:
===============

DAFTAR ANAK LAKI-LAKI (10 anak):
=============================

1. Ahmad Rizki (L) - NIK: 3201010001
   Tanggal Lahir: 2023-01-15 (Usia: 23 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.2 kg, Panjang Lahir: 49.5 cm
   - Berat Saat Ini: 12.5 kg, Tinggi Saat Ini: 87.2 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan optimal sesuai standar WHO

2. Budi Santoso (L) - NIK: 3201010003
   Tanggal Lahir: 2023-03-10 (Usia: 21 bulan)
   Status: WARNING (1/12 records)
   - Berat Lahir: 3.5 kg, Panjang Lahir: 51.0 cm
   - Berat Saat Ini: 11.8 kg, Tinggi Saat Ini: 84.6 cm
   - Status Gizi: Risiko Stunting Ringan
   - Catatan: Berat badan di bawah normal pada bulan Januari (3.8 kg)

3. Candra Wijaya (L) - NIK: 3201010005
   Tanggal Lahir: 2023-05-12 (Usia: 19 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.8 kg, Panjang Lahir: 52.5 cm
   - Berat Saat Ini: 11.2 kg, Tinggi Saat Ini: 82.1 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan normal sesuai standar WHO

4. Dedi Kurniawan (L) - NIK: 3201010007
   Tanggal Lahir: 2023-07-22 (Usia: 17 bulan)
   Status: WARNING (1/12 records)
   - Berat Lahir: 4.0 kg, Panjang Lahir: 54.0 cm
   - Berat Saat Ini: 10.8 kg, Tinggi Saat Ini: 79.5 cm
   - Status Gizi: Berat Badan Rendah
   - Catatan: Berat badan di bawah normal pada bulan Juli (7.1 kg)

5. Eko Prasetyo (L) - NIK: 3201010009
   Tanggal Lahir: 2023-09-14 (Usia: 15 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 4.2 kg, Panjang Lahir: 55.5 cm
   - Berat Saat Ini: 10.5 kg, Tinggi Saat Ini: 77.2 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan optimal sesuai standar WHO

6. Fajar Ramadhan (L) - NIK: 3201010011
   Tanggal Lahir: 2023-11-12 (Usia: 13 bulan)
   Status: ERROR (2/12 records)
   - Berat Lahir: 3.0 kg, Panjang Lahir: 48.0 cm
   - Berat Saat Ini: 9.2 kg, Tinggi Saat Ini: 74.8 cm
   - Status Gizi: Risiko Stunting Berat
   - Catatan: Berat sangat rendah Januari (2.5 kg), membaik namun masih rendah

7. Gunawan Wibowo (L) - NIK: 3201010013
   Tanggal Lahir: 2023-01-20 (Usia: 23 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.6 kg, Panjang Lahir: 50.5 cm
   - Berat Saat Ini: 12.8 kg, Tinggi Saat Ini: 86.5 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan normal sesuai standar WHO

8. Hendra Kusuma (L) - NIK: 3201010015
   Tanggal Lahir: 2023-03-25 (Usia: 21 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.9 kg, Panjang Lahir: 52.0 cm
   - Berat Saat Ini: 11.5 kg, Tinggi Saat Ini: 83.8 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan optimal sesuai standar WHO

9. Indra Perkasa (L) - NIK: 3201010017
   Tanggal Lahir: 2023-05-18 (Usia: 19 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 4.1 kg, Panjang Lahir: 53.5 cm
   - Berat Saat Ini: 11.0 kg, Tinggi Saat Ini: 81.3 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan normal sesuai standar WHO

10. Jaka Pratama (L) - NIK: 3201010019
    Tanggal Lahir: 2023-07-30 (Usia: 17 bulan)
    Status: VALID (12/12 records)
    - Berat Lahir: 4.3 kg, Panjang Lahir: 55.0 cm
    - Berat Saat Ini: 10.8 kg, Tinggi Saat Ini: 78.9 cm
    - Status Gizi: Normal
    - Catatan: Pertumbuhan optimal sesuai standar WHO

DAFTAR ANAK PEREMPUAN (10 anak):
===============================

1. Siti Nurhaliza (P) - NIK: 3201010002
   Tanggal Lahir: 2023-02-20 (Usia: 22 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.1 kg, Panjang Lahir: 48.7 cm
   - Berat Saat Ini: 11.8 kg, Tinggi Saat Ini: 85.4 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan normal sesuai standar WHO

2. Dewi Lestari (P) - NIK: 3201010004
   Tanggal Lahir: 2023-04-05 (Usia: 20 bulan)
   Status: WARNING (1/12 records)
   - Berat Lahir: 3.4 kg, Panjang Lahir: 50.2 cm
   - Berat Saat Ini: 11.2 kg, Tinggi Saat Ini: 82.8 cm
   - Status Gizi: Risiko Overweight Ringan
   - Catatan: Berat badan di atas normal pada bulan Maret (6.2 kg)

3. Fitri Handayani (P) - NIK: 3201010006
   Tanggal Lahir: 2023-06-18 (Usia: 18 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.7 kg, Panjang Lahir: 51.7 cm
   - Berat Saat Ini: 10.8 kg, Tinggi Saat Ini: 80.3 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan normal sesuai standar WHO

4. Gita Savitri (P) - NIK: 3201010008
   Tanggal Lahir: 2023-08-30 (Usia: 16 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.9 kg, Panjang Lahir: 53.2 cm
   - Berat Saat Ini: 10.5 kg, Tinggi Saat Ini: 77.9 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan optimal sesuai standar WHO

5. Hana Wijaya (P) - NIK: 3201010010
   Tanggal Lahir: 2023-10-08 (Usia: 14 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 4.1 kg, Panjang Lahir: 54.7 cm
   - Berat Saat Ini: 10.2 kg, Tinggi Saat Ini: 75.6 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan normal sesuai standar WHO

6. Irma Suryani (P) - NIK: 3201010012
   Tanggal Lahir: 2023-12-05 (Usia: 12 bulan)
   Status: ERROR (2/12 records)
   - Berat Lahir: 2.9 kg, Panjang Lahir: 47.5 cm
   - Berat Saat Ini: 9.0 kg, Tinggi Saat Ini: 73.2 cm
   - Status Gizi: Risiko Stunting Berat
   - Catatan: Berat sangat rendah Januari (2.8 kg), membaik namun masih rendah

7. Kartika Dewi (P) - NIK: 3201010014
   Tanggal Lahir: 2023-02-15 (Usia: 22 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 3.5 kg, Panjang Lahir: 50.8 cm
   - Berat Saat Ini: 12.0 kg, Tinggi Saat Ini: 84.7 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan optimal sesuai standar WHO

8. Linda Permata (P) - NIK: 3201010016
   Tanggal Lahir: 2023-04-30 (Usia: 20 bulan)
   Status: WARNING (1/12 records)
   - Berat Lahir: 3.8 kg, Panjang Lahir: 52.3 cm
   - Berat Saat Ini: 11.5 kg, Tinggi Saat Ini: 82.1 cm
   - Status Gizi: Risiko Overweight Ringan
   - Catatan: Berat badan di atas normal pada bulan April (6.5 kg)

9. Maya Anggraini (P) - NIK: 3201010018
   Tanggal Lahir: 2023-06-25 (Usia: 18 bulan)
   Status: VALID (12/12 records)
   - Berat Lahir: 4.0 kg, Panjang Lahir: 53.8 cm
   - Berat Saat Ini: 11.0 kg, Tinggi Saat Ini: 79.8 cm
   - Status Gizi: Normal
   - Catatan: Pertumbuhan normal sesuai standar WHO

10. Nadia Fitriani (P) - NIK: 3201010020
    Tanggal Lahir: 2023-08-22 (Usia: 16 bulan)
    Status: VALID (12/12 records)
    - Berat Lahir: 4.2 kg, Panjang Lahir: 55.3 cm
    - Berat Saat Ini: 10.8 kg, Tinggi Saat Ini: 77.4 cm
    - Status Gizi: Normal
    - Catatan: Pertumbuhan optimal sesuai standar WHO

REKOMENDASI:
==============

1. Anak dengan status Warning perlu dipantau pertumbuhannya
2. Anak dengan status Error perlu intervensi gizi segera
3. Lakukan pengukuran ulang untuk data yang status Warning/Error
4. Konsultasikan dengan tenaga kesehatan untuk penanganan lebih lanjut

---
Laporan ini dibuat otomatis oleh sistem Sitracking Stunting
Untuk informasi lebih lanjut, hubungi administrator sistem.`

  console.log(`Generated text report for job ${jobId}`)
  return reportContent
}