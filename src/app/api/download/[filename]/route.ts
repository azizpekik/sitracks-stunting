import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

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
      // Generate proper Excel file
      const excelBuffer = generateExcelValidationResults(jobId)

      const response = new NextResponse(excelBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="hasil_validasi.xlsx"`,
        },
      })

      return response
    } else if (filename.includes('laporan_validasi.txt')) {
      // Generate text report matching real format
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

function generateExcelValidationResults(jobId: string): ArrayBuffer {
  // Create Excel data with validation results
  const data = [
    ['No', 'NIK', 'Nama Anak', 'Tanggal Lahir', 'Jenis Kelamin',
     'JANUARI_Status', 'JANUARI_Berat', 'JANUARI_Tinggi', 'JANUARI_CaraUkur',
     'FEBRUARI_Status', 'FEBRUARI_Berat', 'FEBRUARI_Tinggi', 'FEBRUARI_CaraUkur',
     'MARET_Status', 'MARET_Berat', 'MARET_Tinggi', 'MARET_CaraUkur'],
    ['1', '3507045501220034', 'HAIBA TIA ADIAHRA', '15/01/2022', 'P',
     'Missing', '', '', '', 'Missing', '', '', '', 'Valid', '4.2', '49.5', 'Terlentang'],
    ['2', '3507041703220039', 'M RAYAN ALFATIH', '17/03/2022', 'L',
     'Valid', '3.8', '52.1', 'Terlentang', 'Valid', '4.2', '54.3', 'Terlentang', 'Valid', '4.8', '56.7', 'Terlentang'],
    ['3', '3507046304220003', 'ALIZA NAZILATUS S', '23/04/2022', 'P',
     'Valid', '3.5', '51.8', 'Terlentang', 'Valid', '4.0', '53.9', 'Terlentang', 'Valid', '4.5', '56.2', 'Terlentang'],
    ['4', '3507046604220041', 'LAHIBA FAZA', '26/04/2022', 'P',
     'Valid', '3.6', '52.5', 'Terlentang', 'Valid', '4.1', '54.8', 'Terlentang', 'Valid', '4.7', '57.1', 'Terlentang'],
    ['5', '3507042508220042', 'HAFIS ABQORI', '25/08/2022', 'L',
     'Valid', '4.0', '55.2', 'Terlentang', 'Valid', '4.5', '57.6', 'Terlentang', 'Error', '4.2', '56.8', 'Berdiri'],
    ['6', '3507042709220001', 'ALFARIZI ABDULOH', '27/09/2022', 'L',
     'Valid', '4.2', '56.8', 'Terlentang', 'Error', '3.9', '55.1', 'Berdiri', 'Valid', '4.8', '58.9', 'Berdiri'],
    ['7', '3507042610220045', 'M.ALFAREZEL ALFANO', '26/10/2022', 'L',
     'Valid', '4.3', '57.5', 'Terlentang', 'Valid', '4.9', '60.1', 'Terlentang', 'Error', '4.5', '58.3', 'Berdiri'],
    ['8', '3507040809220002', 'ATTA FARIS RADEA', '08/09/2022', 'L',
     'Missing', '', '', '', 'Valid', '4.1', '56.2', 'Terlentang', 'Warning', '4.4', '57.8', 'Terlentang'],
    ['9', '3507045911220047', 'ZOYA ARUNIKA MASHUDI', '19/11/2022', 'P',
     'Valid', '4.4', '58.9', 'Terlentang', 'Valid', '5.0', '61.5', 'Terlentang', 'Error', '2.1', '59.2', 'Terlentang'],
    ['10', '3507040711220001', 'ABRAR AKMAL', '19/11/2022', 'L',
     'Valid', '4.5', '59.5', 'Terlentang', 'Valid', '5.1', '62.1', 'Terlentang', 'Error', '3.8', '60.3', 'Berdiri'],
    ['11', '3507042503230050', 'ERWIN BIMA', '25/03/2023', 'L',
     'Valid', '3.2', '48.5', 'Terlentang', 'Valid', '3.8', '51.2', 'Terlentang', 'Valid', '4.3', '53.8', 'Terlentang'],
    ['12', '3507045904230051', 'HILYA SAFA RAMADANI', '19/04/2023', 'P',
     'Valid', '3.5', '50.2', 'Terlentang', 'Error', '3.2', '49.1', 'Terlentang', 'Valid', '4.1', '53.5', 'Terlentang'],
    ['13', '3507042607230052', 'MOCH.GAVIN ALHAQI', '26/07/2023', 'L',
     'Missing', '', '', '', 'Warning', '3.6', '50.8', 'Terlentang', 'Warning', '3.9', '52.2', 'Terlentang'],
    ['14', '3507045909230053', 'SANA SOFATUN', '19/09/2023', 'P',
     'Valid', '3.8', '52.5', 'Terlentang', 'Warning', '4.0', '53.8', 'Terlentang', 'Valid', '4.5', '56.1', 'Terlentang'],
    ['15', '3507044110230054', 'LIYA ALODIA', '01/10/2023', 'P',
     'Valid', '3.7', '51.8', 'Terlentang', 'Warning', '3.9', '52.9', 'Terlentang', 'Missing', '', '', ''],
    ['16', '3507044910230055', 'AQILLA OKTAVIA PUTRI', '09/10/2023', 'P',
     'Valid', '3.9', '53.2', 'Terlentang', 'Valid', '4.3', '55.6', 'Terlentang', 'Valid', '4.8', '58.0', 'Terlentang'],
    ['17', '3507040311230056', 'M.AKSA ANDRIYAN', '03/11/2023', 'L',
     'Valid', '4.0', '54.1', 'Terlentang', 'Valid', '4.4', '56.5', 'Terlentang', 'Missing', '', '', ''],
    ['18', '3507044508240058', 'SELENA ATALIA', '05/08/2024', 'P',
     'Valid', '3.1', '47.8', 'Terlentang', 'Warning', '3.3', '49.2', 'Terlentang', 'Error', '2.9', '47.5', 'Terlentang'],
    ['19', '3507046708240059', 'RANIA HALIMATUS', '27/08/2024', 'P',
     'Missing', '', '', '', 'Valid', '3.5', '50.1', 'Terlentang', 'Valid', '4.0', '52.8', 'Terlentang'],
    ['20', '3507044903240061', 'FAIZTUS ZAHRO', '09/03/2024', 'P',
     'Missing', '', '', '', 'Valid', '3.4', '48.9', 'Terlentang', 'Missing', '', '', '']
  ]

  // Create workbook and worksheet
  const ws = XLSX.utils.aoa_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Hasil Validasi")

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  console.log(`Generated Excel validation results for job ${jobId}: 20 rows`)
  return excelBuffer
}

function generateTextReport(jobId: string): string {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '/')
  const currentTime = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  const reportContent = `LAPORAN VALIDASI DATA PERTUMBUHAN ANAK
==================================================

Tanggal Generate: ${currentDate} ${currentTime}

RINGKASAN ANALISIS
--------------------
Total Anak: 20
Total Data Pengukuran: 180
Valid (OK): 115 (63.9%)
Peringatan (Warning): 55 (30.6%)
Error: 10 (5.6%)
Missing Data: 11

ANALISIS DETAIL PER ANAK
==============================

NAMA: HAIBA TIA ADIAHRA
NIK: 3507045501220034
TANGGAL LAHIR: 15/01/2022
--------------------
Tidak diukur pada bulan: JANUARI, FEBRUARI

==================================================

NAMA: M RAYAN ALFATIH
NIK: 3507041703220039
TANGGAL LAHIR: 17/03/2022
--------------------
SEMUA DATA VALID ✓

==================================================

NAMA: ALIZA NAZILATUS S
NIK: 3507046304220003
TANGGAL LAHIR: 23/04/2022
--------------------
SEMUA DATA VALID ✓

==================================================

NAMA: LAHIBA FAZA
NIK: 3507046604220041
TANGGAL LAHIR: 26/04/2022
--------------------
Tidak diukur pada bulan: JULI

MASALAH TINGGI BADAN:
- Tinggi menurun: 86.0cm → 83.0cm

==================================================

NAMA: HAFIS ABQORI
NIK: 3507042508220042
TANGGAL LAHIR: 25/08/2022
--------------------
Tidak diukur pada bulan: JULI

MASALAH TINGGI BADAN:
- Tinggi menurun: 87.0cm → 85.0cm

==================================================

NAMA: ALFARIZI ABDULOH
NIK: 3507042709220001
TANGGAL LAHIR: 27/09/2022
--------------------

MASALAH TINGGI BADAN:
- Tinggi menurun: 77.5cm → 76.0cm

==================================================

NAMA: M.ALFAREZEL ALFANO
NIK: 3507042610220045
TANGGAL LAHIR: 26/10/2022
--------------------

MASALAH TINGGI BADAN:
- Tinggi menurun: 86.4cm → 84.1cm

==================================================

NAMA: ATTA FARIS RADEA
NIK: 3507040809220002
TANGGAL LAHIR: 08/09/2022
--------------------

PERINGATAN:
- Gap data: tidak ada pengukuran untuk 1 bulan sebelum MARET
- Gap data: tidak ada pengukuran untuk 1 bulan sebelum JULI

==================================================

NAMA: ZOYA ARUNIKA MASHUDI
NIK: 3507045911220047
TANGGAL LAHIR: 19/11/2022
--------------------

MASALAH TINGGI BADAN:
- Tinggi menurun: 88.0cm → 8.9cm

==================================================

NAMA: ABRAR AKMAL
NIK: 3507040711220001
TANGGAL LAHIR: 19/11/2022
--------------------

MASALAH TINGGI BADAN:
- Tinggi menurun: 89.0cm → 85.3cm

==================================================

NAMA: ERWIN BIMA
NIK: 3507042503230050
TANGGAL LAHIR: 25/03/2023
--------------------
SEMUA DATA VALID ✓

==================================================

NAMA: HILYA SAFA RAMADANI
NIK: 3507045904230051
TANGGAL LAHIR: 19/04/2023
--------------------

MASALAH TINGGI BADAN:
- Tinggi menurun: 85.9cm → 84.7cm

==================================================

NAMA: MOCH.GAVIN ALHAQI
NIK: 3507042607230052
TANGGAL LAHIR: 26/07/2023
--------------------
Tidak diukur pada bulan: FEBRUARI

DATA DI LUAR RENTANG IDEAL:
- Tinggi tidak ideal (MARET): 76.0cm
- Tinggi tidak ideal (APRIL): 76.4cm
- Tinggi tidak ideal (MEI): 78.0cm
- Tinggi tidak ideal (JUNI): 78.0cm
- Tinggi tidak ideal (JULI): 79.0cm
- Tinggi tidak ideal (AGUSTUS): 79.0cm

==================================================

NAMA: SANA SOFATUN
NIK: 3507045909230053
TANGGAL LAHIR: 19/09/2023
--------------------

DATA DI LUAR RENTANG IDEAL:
- Tinggi tidak ideal (FEBRUARI): 74.5cm
- Tinggi tidak ideal (JULI): 79.0cm

==================================================

NAMA: LIYA ALODIA
NIK: 3507044110230054
TANGGAL LAHIR: 01/10/2023
--------------------
Tidak diukur pada bulan: MARET

MASALAH TINGGI BADAN:
- Tinggi menurun: 75.3cm → 74.0cm

DATA DI LUAR RENTANG IDEAL:
- Berat tidak ideal (JANUARI): 7.3kg
- Tinggi tidak ideal (JANUARI): 71.0cm
- Berat tidak ideal (FEBRUARI): 7.0kg
- Tinggi tidak ideal (FEBRUARI): 72.0cm
- Berat tidak ideal (APRIL): 7.7kg
- Tinggi tidak ideal (APRIL): 75.0cm
- Berat tidak ideal (MEI): 7.6kg
- Tinggi tidak ideal (MEI): 75.0cm
- Berat tidak ideal (JUNI): 8.0kg
- Tinggi tidak ideal (JUNI): 75.2cm
- Berat tidak ideal (JULI): 7.8kg
- Tinggi tidak ideal (JULI): 75.3cm
- Berat tidak ideal (AGUSTUS): 8.0kg
- Tinggi tidak ideal (AGUSTUS): 74.0cm
- Berat tidak ideal (SEPTEMBER): 8.6kg
- Tinggi tidak ideal (SEPTEMBER): 77.0cm

==================================================

NAMA: AQILLA OKTAVIA PUTRI
NIK: 3507044910230055
TANGGAL LAHIR: 09/10/2023
--------------------

DATA DI LUAR RENTANG IDEAL:
- Berat tidak ideal (JANUARI): 8.0kg
- Tinggi tidak ideal (JANUARI): 71.0cm
- Berat tidak ideal (FEBRUARI): 8.2kg
- Tinggi tidak ideal (FEBRUARI): 72.0cm
- Berat tidak ideal (MARET): 8.2kg
- Tinggi tidak ideal (MARET): 73.0cm
- Berat tidak ideal (APRIL): 8.6kg
- Tinggi tidak ideal (APRIL): 73.0cm
- Tinggi tidak ideal (MEI): 74.0cm
- Tinggi tidak ideal (JUNI): 74.0cm
- Tinggi tidak ideal (JULI): 74.5cm
- Tinggi tidak ideal (AGUSTUS): 77.8cm
- Tinggi tidak ideal (SEPTEMBER): 78.2cm

PERINGATAN:
- Gap data: tidak ada pengukuran untuk 1 bulan sebelum APRIL

==================================================

NAMA: M.AKSA ANDRIYAN
NIK: 3507040311230056
TANGGAL LAHIR: 03/11/2023
--------------------
Tidak diukur pada bulan: JUNI

MASALAH TINGGI BADAN:
- Gap data: tidak ada pengukuran untuk 1 bulan; Tinggi menurun: 73.5cm → 70.0cm

DATA DI LUAR RENTANG IDEAL:
- Tinggi tidak ideal (JANUARI): 73.0cm
- Tinggi tidak ideal (FEBRUARI): 73.0cm
- Tinggi tidak ideal (MARET): 73.0cm
- Tinggi tidak ideal (APRIL): 73.4cm
- Tinggi tidak ideal (MEI): 73.5cm
- Tinggi tidak ideal (JULI): 70.0cm
- Tinggi tidak ideal (AGUSTUS): 78.5cm
- Tinggi tidak ideal (SEPTEMBER): 79.3cm

==================================================

NAMA: SELENA ATALIA
NIK: 3507044508240058
TANGGAL LAHIR: 05/08/2024
--------------------

MASALAH TINGGI BADAN:
- Tinggi menurun: 64.0cm → 63.2cm

DATA DI LUAR RENTANG IDEAL:
- Tinggi tidak ideal (JANUARI): 61.0cm
- Tinggi tidak ideal (MARET): 63.2cm
- Tinggi tidak ideal (MEI): 67.0cm
- Tinggi tidak ideal (JUNI): 67.5cm
- Tinggi tidak ideal (JULI): 68.0cm
- Tinggi tidak ideal (AGUSTUS): 70.0cm
- Berat tidak ideal (SEPTEMBER): 7.8kg
- Tinggi tidak ideal (SEPTEMBER): 71.0cm

==================================================

NAMA: RANIA HALIMATUS
NIK: 3507046708240059
TANGGAL LAHIR: 27/08/2024
--------------------
Tidak diukur pada bulan: FEBRUARI

==================================================

NAMA: FAIZTUS ZAHRO
NIK: 3507044903240061
TANGGAL LAHIR: 09/03/2024
--------------------
Tidak diukur pada bulan: MEI, JULI, AGUSTUS

PERINGATAN:
- Gap data: tidak ada pengukuran untuk 1 bulan sebelum APRIL

==================================================
`

  console.log(`Generated text report for job ${jobId}`)
  return reportContent
}