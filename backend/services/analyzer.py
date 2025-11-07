import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import pandas as pd
from sqlalchemy.orm import Session

from models import Job, Child, Measurement
from database import SessionLocal
from .excel_parser import ExcelParser
from .report_generator import ReportGenerator
from .file_manager import FileManager
from config import settings

logger = logging.getLogger(__name__)


class GrowthAnalyzer:
    def __init__(self):
        self.parser = ExcelParser()
        self.report_generator = ReportGenerator()
        self.file_manager = FileManager()

    async def run_analysis(self, job_id: str, lapangan_path: str, referensi_path: str, default_gender: str):
        """
        Run complete analysis workflow
        """
        db = SessionLocal()
        try:
            # Update job status
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                raise ValueError(f"Job {job_id} not found")

            logger.info(f"Starting analysis for job {job_id}")

            # Step 1: Parse reference data
            logger.info("Parsing reference data...")
            try:
                reference_data = self.parser.parse_reference_file(referensi_path)
            except Exception as e:
                logger.error(f"Error parsing reference file: {str(e)}")
                error_msg = f"Format file referensi tidak valid: {str(e)}"
                job.update_status("failed", error_msg)
                db.commit()  # Force immediate commit
                raise ValueError(error_msg)

            # Step 2: Parse field data with immediate error handling
            logger.info("Parsing field data...")
            try:
                field_data = self.parser.parse_field_data(lapangan_path)
            except Exception as e:
                logger.error(f"Error parsing field data: {str(e)}")
                # Provide user-friendly error message
                if "Kolom wajib tidak ditemukan" in str(e):
                    error_msg = f"Format Excel tidak sesuai. {str(e)}"
                elif "not found" in str(e).lower():
                    error_msg = f"File Excel tidak ditemukan atau rusak. Silakan upload ulang file yang valid."
                else:
                    error_msg = f"Format file data lapangan tidak valid: {str(e)}"

                job.update_status("failed", error_msg)
                db.commit()  # Force immediate commit
                raise ValueError(error_msg)

            # Check if field data is empty
            if not field_data:
                error_msg = "File data lapangan kosong atau tidak ada data yang valid. Pastikan file memiliki data anak yang akan dianalisis."
                job.update_status("failed", error_msg)
                db.commit()  # Force immediate commit
                raise ValueError(error_msg)

            # Step 3: Validate and save data
            logger.info("Validating and saving data...")
            validation_results = self._validate_and_save_data(
                db, job_id, field_data, reference_data, default_gender
            )

            # Step 4: Generate reports
            logger.info("Generating reports...")
            report_paths = await self._generate_reports(
                job_id, validation_results, default_gender
            )

            # Step 5: Update job with results
            summary = validation_results['summary']
            job.save_results(
                summary=summary,
                excel_path=report_paths['excel'],
                report_path=report_paths['text'],
                context_path=report_paths['context']
            )

            logger.info(f"Analysis completed for job {job_id}")
            logger.info(f"Summary: {summary}")

        except ValueError as e:
            # Re-raise validation errors with user-friendly messages
            logger.error(f"Validation error in analysis for job {job_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error in analysis for job {job_id}: {str(e)}")
            # Try to update job status to failed
            try:
                job = db.query(Job).filter(Job.id == job_id).first()
                if job:
                    job.update_status("failed", f"Terjadi kesalahan saat memproses data: {str(e)}")
                    db.commit()  # Force immediate commit
            except:
                pass
            raise ValueError(f"Terjadi kesalahan saat memproses data: {str(e)}")
        finally:
            db.close()

    def _validate_and_save_data(self, db: Session, job_id: str, field_data: List[Dict],
                              reference_data: Dict, default_gender: str) -> Dict:
        """
        Validate measurements and save to database
        """
        total_records = 0
        valid_count = 0
        warning_count = 0
        error_count = 0
        missing_count = 0

        for child_data in field_data:
            # Save child record
            child = Child(
                job_id=job_id,
                nik=child_data.get('nik'),
                nama=child_data['nama_anak'],
                jenis_kelamin=child_data.get('jenis_kelamin'),
                tgl_lahir=child_data.get('tgl_lahir')
            )
            db.add(child)
            db.flush()  # Get child ID

            # Process measurements for this child
            measurements = child_data.get('measurements', [])

            # Sort measurements by age
            measurements.sort(key=lambda x: x.get('umur_bulan', 0))

            # Use child-specific gender, fallback to default if not provided
            child_gender = child_data.get('jenis_kelamin') or default_gender
            logger.info(f"Processing {child_data['nama_anak']} with gender: {child_gender}")

            # Validate measurements
            validated_measurements = self._validate_child_measurements(
                measurements, reference_data, child_gender
            )

            # Save measurements
            for measurement in validated_measurements:
                measurement_record = Measurement(
                    job_id=job_id,
                    child_id=child.id,
                    bulan=measurement['bulan'],
                    tgl_ukur=measurement.get('tgl_ukur'),
                    umur_bulan=measurement.get('umur_bulan'),
                    berat=measurement.get('berat'),
                    tinggi=measurement.get('tinggi'),
                    cara_ukur=measurement.get('cara_ukur'),
                    status_berat=measurement['status_berat'],
                    status_tinggi=measurement['status_tinggi'],
                    validasi_input=measurement['validasi_input'],
                    keterangan=measurement.get('keterangan', '')
                )
                db.add(measurement_record)

                # Update counters
                total_records += 1
                validation_status = measurement['validasi_input']
                if validation_status == 'OK':
                    valid_count += 1
                elif validation_status == 'ERROR':
                    error_count += 1
                elif validation_status == 'WARNING':
                    warning_count += 1

                if measurement['status_berat'] == 'Missing' or measurement['status_tinggi'] == 'Missing':
                    missing_count += 1

        db.commit()

        summary = {
            'total_anak': len(field_data),
            'total_records': total_records,
            'valid': valid_count,
            'warning': warning_count,
            'error': error_count,
            'missing': missing_count
        }

        return {
            'summary': summary,
            'children_count': len(field_data),
            'total_measurements': total_records
        }

    def _validate_child_measurements(self, measurements: List[Dict],
                                   reference_data: Dict, default_gender: str) -> List[Dict]:
        """
        Validate measurements for a single child using hierarchy rules
        """
        validated_measurements = []
        previous_height = None
        previous_weight = None
        previous_age = None

        for i, measurement in enumerate(measurements):
            validated = measurement.copy()

            # Extract values
            current_age = measurement.get('umur_bulan')
            current_weight = measurement.get('berat')
            current_height = measurement.get('tinggi')

            # Default gender (since we don't have gender info in field data)
            gender = default_gender

            # Initialize validation status
            validation_status = 'OK'
            keterangan = []
            validated['validasi_input'] = 'OK'  # Initialize in the dict

            # Rule 1: Missing Data Check
            if current_weight is None and current_height is None:
                validated['status_berat'] = 'Missing'
                validated['status_tinggi'] = 'Missing'
                validated['validasi_input'] = 'WARNING'
                validated['keterangan'] = 'Data berat dan tinggi kosong'
                validated_measurements.append(validated)
                continue
            elif current_weight is None:
                validated['status_berat'] = 'Missing'
                validated['validasi_input'] = 'WARNING'
                keterangan.append('Data berat kosong')
            elif current_height is None:
                validated['status_tinggi'] = 'Missing'
                validated['validasi_input'] = 'WARNING'
                keterangan.append('Data tinggi kosong')

            # Rule 2: Missing month gap check
            if previous_age is not None and current_age is not None:
                age_gap = current_age - previous_age
                if age_gap > 1:
                    validated['validasi_input'] = 'WARNING'
                    keterangan.append(f'Gap data: tidak ada pengukuran untuk {age_gap-1} bulan')

            # Rule 3: Height consistency check
            if previous_height is not None and current_height is not None:
                if current_height < previous_height:
                    validated['validasi_input'] = 'ERROR'
                    keterangan.append(f'Tinggi menurun: {previous_height}cm → {current_height}cm')
                elif validated['validasi_input'] == 'OK':
                    # Check for unusual height increase (more than 5cm in one month)
                    if current_height - previous_height > 5:
                        validated['validasi_input'] = 'WARNING'
                        keterangan.append(f'Tinggi naik drastis: +{current_height - previous_height:.1f}cm')

            # Rule 4: Weight anomaly check
            if previous_weight is not None and current_weight is not None:
                weight_change = current_weight - previous_weight
                if weight_change < 0:  # Weight loss
                    loss_percentage = abs(weight_change) / previous_weight * 100
                    if loss_percentage > 10:
                        validated['validasi_input'] = 'WARNING'
                        keterangan.append(f'Anomali berat: turun {loss_percentage:.1f}%')

            # Rule 5: Rationality vs reference table
            if current_age is not None:
                # Validate weight
                if current_weight is not None:
                    weight_range = reference_data.get(f'BB_{gender}', {}).get(current_age)
                    if weight_range:
                        if not (weight_range[0] <= current_weight <= weight_range[1]):
                            validated['status_berat'] = 'Tidak Ideal'
                            if validated['validasi_input'] == 'OK':
                                validated['validasi_input'] = 'WARNING'
                                keterangan.append(f'Berat tidak ideal: {current_weight}kg (rentang: {weight_range[0]}-{weight_range[1]}kg)')
                        else:
                            validated['status_berat'] = 'Ideal'
                    else:
                        validated['status_berat'] = 'Ideal'  # No reference data

                # Validate height
                if current_height is not None:
                    height_range = reference_data.get(f'PB_{gender}', {}).get(current_age)
                    if height_range:
                        if not (height_range[0] <= current_height <= height_range[1]):
                            validated['status_tinggi'] = 'Tidak Ideal'
                            if validated['validasi_input'] == 'OK':
                                validated['validasi_input'] = 'WARNING'
                                keterangan.append(f'Tinggi tidak ideal: {current_height}cm (rentang: {height_range[0]}-{height_range[1]}cm)')
                        else:
                            validated['status_tinggi'] = 'Ideal'
                    else:
                        validated['status_tinggi'] = 'Ideal'  # No reference data

            # Set default statuses if not already set
            if 'status_berat' not in validated:
                validated['status_berat'] = 'Ideal' if current_weight is not None else 'Missing'
            if 'status_tinggi' not in validated:
                validated['status_tinggi'] = 'Ideal' if current_height is not None else 'Missing'

            # Final validation status override priority: ERROR > WARNING > OK
            if 'ERROR' in str(validated.get('keterangan', '')):
                validated['validasi_input'] = 'ERROR'
            elif 'Anomali berat' in str(validated.get('keterangan', '')) or 'tidak ideal' in str(validated.get('keterangan', '')).lower():
                if validated['validasi_input'] == 'OK':
                    validated['validasi_input'] = 'WARNING'

            # Set keterangan
            validated['keterangan'] = '; '.join(keterangan) if keterangan else ''

            # Update previous values for next iteration
            if current_height is not None:
                previous_height = current_height
            if current_weight is not None:
                previous_weight = current_weight
            if current_age is not None:
                previous_age = current_age

            validated_measurements.append(validated)

        return validated_measurements

    async def _generate_reports(self, job_id: str, validation_results: Dict, default_gender: str) -> Dict[str, str]:
        """
        Generate Excel, text, and context reports
        """
        # Get data from database
        db = SessionLocal()
        try:
            measurements = db.query(Measurement).join(Child).filter(
                Measurement.job_id == job_id
            ).all()

            # Generate Excel report
            excel_path = self.file_manager.get_output_path(job_id, "hasil_validasi.xlsx")
            await self.report_generator.generate_excel_report(
                excel_path, measurements, default_gender
            )

            # Generate text report (existing report - keep as is)
            text_path = self.file_manager.get_output_path(job_id, "laporan_validasi.txt")
            await self.report_generator.generate_text_report(
                text_path, measurements, validation_results['summary']
            )

            # Generate comprehensive context report for AI
            context_path = self.file_manager.get_output_path(job_id, "konteks_lengkap.txt")
            await self.report_generator.generate_context_report(
                context_path, measurements, validation_results['summary'], default_gender
            )

            return {
                'excel': excel_path,
                'text': text_path,
                'context': context_path
            }

        finally:
            db.close()