const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Read the actual Excel validation file
const filePath = './backend/data/outputs/f7714352-af24-4d45-90db-168df2f30f98/hasil_validasi.xlsx';

try {
  console.log('=== Reading Excel Validation File ===');
  console.log('File:', filePath);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  // Read the workbook
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet names:', workbook.SheetNames);

  // Read the first sheet
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with raw values
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log('\n=== EXCEL FORMAT ANALYSIS ===');
  console.log('Total rows:', data.length);

  // Show headers
  console.log('\nHeaders (Row 0):');
  const headers = data[0];
  headers.forEach((header, index) => {
    console.log(`Col ${index}: "${header}"`);
  });

  // Show first few data rows
  console.log('\nFirst 5 data rows:');
  for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
    console.log(`\nRow ${i}:`);
    const row = data[i];
    headers.forEach((header, index) => {
      const value = row[index] || '';
      console.log(`  ${header}: "${value}"`);
    });
  }

  // Count total rows with data
  let dataRowCount = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().trim()) {
      dataRowCount++;
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log('Data rows with content:', dataRowCount);
  console.log('Total columns:', headers.length);

} catch (error) {
  console.error('Error reading Excel file:', error);
}