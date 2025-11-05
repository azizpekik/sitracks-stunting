import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
import logging
from datetime import datetime
import re

logger = logging.getLogger(__name__)


class ExcelParser:
    # Recognized month names (case-insensitive)
    MONTH_NAMES = [
        "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
        "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
    ]

    # Required sub-columns for each month
    REQUIRED_SUBCOLUMNS = ["TANGGALUKUR", "UMUR", "BERAT", "TINGGI", "CARAUKUR"]

    def __init__(self):
        self.growth_reference = {}

    def parse_reference_file(self, file_path: str) -> Dict[str, Dict[int, Tuple[float, float]]]:
        """
        Parse growth reference Excel file
        Returns: {
            'BB_L': {age: (min_weight, max_weight)},
            'PB_L': {age: (min_height, max_height)},
            'BB_P': {age: (min_weight, max_weight)},
            'PB_P': {age: (min_height, max_height)}
        }
        """
        try:
            df = pd.read_excel(file_path)
            logger.info(f"Loaded reference file with {len(df)} rows")

            # Initialize reference dictionary
            reference = {
                'BB_L': {}, 'PB_L': {}, 'BB_P': {}, 'PB_P': {}
            }

            # Expected columns in reference file (flexible matching)
            column_mapping = {}

            # Map age column
            age_col = self._find_column(df, ['Umur', 'Age', 'Bulan', 'usia'])
            if not age_col:
                raise ValueError("Kolom umur/age tidak ditemukan di file referensi. Harap ada kolom 'Umur' atau 'Age'")
            column_mapping['age'] = age_col

            # Map gender-specific columns
            male_weight_col = self._find_column(df, ['BB Ideal (L)', 'BB L', 'Berat Ideal L', 'BB Laki-laki'])
            male_height_col = self._find_column(df, ['PB Ideal (L)', 'TB Ideal (L)', 'PB L', 'Tinggi Ideal L', 'PB Laki-laki'])
            female_weight_col = self._find_column(df, ['BB Ideal (P)', 'BB P', 'Berat Ideal P', 'BB Perempuan'])
            female_height_col = self._find_column(df, ['PB Ideal (P)', 'TB Ideal (P)', 'PB P', 'Tinggi Ideal P', 'PB Perempuan'])

            if not all([male_weight_col, male_height_col, female_weight_col, female_height_col]):
                raise ValueError("Kolom referensi tidak lengkap. Pastikan ada kolom untuk BB/TB ideal Laki-laki dan Perempuan")

            column_mapping.update({
                'male_weight': male_weight_col,
                'male_height': male_height_col,
                'female_weight': female_weight_col,
                'female_height': female_height_col
            })

            logger.info(f"Reference column mapping: {column_mapping}")

            for _, row in df.iterrows():
                age = int(row[column_mapping['age']])

                # Parse weight ranges (Laki-laki)
                weight_l_range = self._parse_range(str(row[column_mapping['male_weight']]))
                if weight_l_range:
                    reference['BB_L'][age] = weight_l_range

                # Parse height ranges (Laki-laki)
                height_l_range = self._parse_range(str(row[column_mapping['male_height']]))
                if height_l_range:
                    reference['PB_L'][age] = height_l_range

                # Parse weight ranges (Perempuan)
                weight_p_range = self._parse_range(str(row[column_mapping['female_weight']]))
                if weight_p_range:
                    reference['BB_P'][age] = weight_p_range

                # Parse height ranges (Perempuan)
                height_p_range = self._parse_range(str(row[column_mapping['female_height']]))
                if height_p_range:
                    reference['PB_P'][age] = height_p_range

            self.growth_reference = reference
            logger.info(f"Parsed reference data for ages 0-{max(reference['BB_L'].keys())} months")
            return reference

        except Exception as e:
            logger.error(f"Error parsing reference file: {str(e)}")
            raise

    def _parse_range(self, range_str: str) -> Optional[Tuple[float, float]]:
        """
        Parse range string like "7.1-9.9" to (7.1, 9.9)
        """
        try:
            if '-' in range_str:
                parts = range_str.split('-')
                if len(parts) == 2:
                    min_val = float(parts[0].strip())
                    max_val = float(parts[1].strip())
                    return (min_val, max_val)
            return None
        except:
            return None

    def parse_field_data(self, file_path: str) -> List[Dict[str, Any]]:
        """
        Parse field data Excel file and convert to long format
        Returns: List of measurement records
        """
        try:
            # Try to read Excel with header detection
            df = pd.read_excel(file_path)
            logger.info(f"Loaded field data with {len(df)} rows and {len(df.columns)} columns")

            # If all columns are 'Unnamed' or contain month names, try skipping rows
            if all('Unnamed' in str(col) or any(month in str(col) for month in self.MONTH_NAMES) for col in df.columns):
                logger.info("Detected potential header issues, trying to find proper header row...")

                # Try reading with different header rows
                for header_row in [1, 2, 3]:
                    try:
                        df_test = pd.read_excel(file_path, header=header_row)
                        if not all('Unnamed' in str(col) for col in df_test.columns):
                            df = df_test
                            logger.info(f"Found proper header at row {header_row}")
                            break
                    except:
                        continue

            # Find header row and normalize column names
            df, column_mapping = self._normalize_column_names(df)

            # Validate required columns (after mapping)
            required_identity_cols = ['nama_anak']
            missing_identity = [col for col in required_identity_cols if col not in column_mapping.values()]
            if missing_identity:
                # Provide helpful error message
                found_cols = list(df.columns)
                raise ValueError(
                    f"Kolom wajib tidak ditemukan: {missing_identity}. "
                    f"Kolom yang ditemukan: {found_cols}. "
                    f"Pastikan ada kolom nama anak (contoh: 'Nama Anak', 'nama_anak', 'NAMA BALITA', dll)."
                )

            # Convert to long format
            long_data = []

            for index, row in df.iterrows():
                child_data = {
                    'nama_anak': str(row['nama_anak']).strip(),
                    'nik': str(row.get('NIK', '')).strip() if pd.notna(row.get('NIK')) else None,
                    'tgl_lahir': self._parse_date(row.get('TANGGAL LAHIR')) if 'TANGGAL LAHIR' in df.columns else None,
                    'measurements': []
                }

                # Process each month
                for month in self.MONTH_NAMES:
                    month_measurements = self._extract_month_measurements(row, month, column_mapping)
                    if month_measurements:
                        child_data['measurements'].extend(month_measurements)

                long_data.append(child_data)

            logger.info(f"Parsed {len(long_data)} children with total measurements: {sum(len(c['measurements']) for c in long_data)}")
            return long_data

        except Exception as e:
            logger.error(f"Error parsing field data: {str(e)}")
            raise

    def _normalize_column_names(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, str]]:
        """
        Normalize column names to standard format
        """
        # Create column mapping
        column_mapping = {}

        # Find and map identity columns
        for col in df.columns:
            col_clean = str(col).strip().upper()

            # Map common variations - more flexible matching
            if 'NAMA' in col_clean and ('ANAK' in col_clean or 'ANAK' in col_clean or 'BALITA' in col_clean or 'BAYI' in col_clean):
                column_mapping[col] = 'nama_anak'
            elif col_clean in ['NIK', 'NO_NIK', 'NOMOR_NIK']:
                column_mapping[col] = 'NIK'
            elif 'TANGGAL' in col_clean and ('LAHIR' in col_clean or 'LHR' in col_clean):
                column_mapping[col] = 'TANGGAL LAHIR'
            elif 'JENIS' in col_clean and ('KELAMIN' in col_clean or 'SEX' in col_clean or 'GENDER' in col_clean):
                column_mapping[col] = 'JENIS_KELAMIN'

        # Debug: print all columns found
        logger.info(f"Columns found in Excel file: {list(df.columns)}")
        logger.info(f"Identity column mapping: {column_mapping}")

        # Find and map month columns
        for month in self.MONTH_NAMES:
            for subcol in self.REQUIRED_SUBCOLUMNS:
                pattern = f"{month}_{subcol}|{month}.*{subcol}|{subcol}.*{month}"

                for col in df.columns:
                    col_clean = str(col).strip().upper()
                    if re.search(pattern, col_clean, re.IGNORECASE):
                        standard_name = f"{month}_{subcol}"
                        column_mapping[col] = standard_name

        # Apply mapping
        df_normalized = df.rename(columns=column_mapping)

        logger.info(f"Column mapping: {column_mapping}")
        return df_normalized, column_mapping

    def _extract_month_measurements(self, row: pd.Series, month: str, column_mapping: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Extract measurements for a specific month
        """
        measurements = []
        prefix = f"{month}_"

        # Check if this month has any data
        has_data = False
        for subcol in self.REQUIRED_SUBCOLUMNS:
            col_name = prefix + subcol
            if col_name in row and pd.notna(row[col_name]):
                has_data = True
                break

        if not has_data:
            return measurements

        measurement = {
            'bulan': month,
            'tgl_ukur': self._parse_date(row.get(prefix + 'TANGGALUKUR')),
            'umur_bulan': self._parse_int(row.get(prefix + 'UMUR')),
            'berat': self._parse_float(row.get(prefix + 'BERAT')),
            'tinggi': self._parse_float(row.get(prefix + 'TINGGI')),
            'cara_ukur': str(row.get(prefix + 'CARAUKUR', '')).strip() if pd.notna(row.get(prefix + 'CARAUKUR')) else None
        }

        measurements.append(measurement)
        return measurements

    def _parse_date(self, date_value) -> Optional[datetime]:
        """
        Parse date from various Excel date formats
        """
        if pd.isna(date_value):
            return None

        try:
            if isinstance(date_value, datetime):
                return date_value
            elif isinstance(date_value, str):
                # Try common date formats
                formats = ['%d/%m/%Y', '%Y-%m-%d', '%d-%m-%Y']
                for fmt in formats:
                    try:
                        return datetime.strptime(date_value.strip(), fmt)
                    except ValueError:
                        continue
            elif isinstance(date_value, (int, float)):
                # Excel numeric date
                return datetime.fromtimestamp(datetime(1899, 12, 30).timestamp() + date_value * 86400)
        except:
            pass

        return None

    def _parse_int(self, value) -> Optional[int]:
        """
        Parse integer value
        """
        if pd.isna(value):
            return None
        try:
            return int(float(value))
        except:
            return None

    def _parse_float(self, value) -> Optional[float]:
        """
        Parse float value
        """
        if pd.isna(value):
            return None
        try:
            return float(value)
        except:
            return None

    def get_reference_range(self, gender: str, measurement_type: str, age: int) -> Optional[Tuple[float, float]]:
        """
        Get reference range for specific gender, measurement type, and age
        """
        key = f"{measurement_type}_{gender}"
        return self.growth_reference.get(key, {}).get(age)

    def validate_growth_data(self, gender: str, age: int, weight: Optional[float], height: Optional[float]) -> Tuple[str, str]:
        """
        Validate weight and height against reference
        Returns: (weight_status, height_status)
        """
        weight_status = "Missing" if weight is None else "Ideal"
        height_status = "Missing" if height is None else "Ideal"

        if weight is not None:
            weight_range = self.get_reference_range(gender, 'BB', age)
            if weight_range and not (weight_range[0] <= weight <= weight_range[1]):
                weight_status = "Tidak Ideal"

        if height is not None:
            height_range = self.get_reference_range(gender, 'PB', age)
            if height_range and not (height_range[0] <= height <= height_range[1]):
                height_status = "Tidak Ideal"

        return weight_status, height_status

    def _find_column(self, df: pd.DataFrame, possible_names: List[str]) -> Optional[str]:
        """
        Find column name from list of possible names (case-insensitive)
        """
        for target in possible_names:
            for col in df.columns:
                if str(col).strip().lower() == target.lower().strip():
                    return col
                # Also check if target is contained in column name
                if target.lower() in str(col).strip().lower():
                    return col
        return None