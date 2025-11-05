from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class ValidationStatus(str, Enum):
    OK = "OK"
    ERROR = "ERROR"
    WARNING = "WARNING"


class GrowthStatus(str, Enum):
    IDEAL = "Ideal"
    TIDAK_IDEAL = "Tidak Ideal"
    MISSING = "Missing"


class AnalysisRequest(BaseModel):
    jenis_kelamin_default: str = Field(default="L", pattern="^[LP]$")


class MeasurementPreview(BaseModel):
    nama_anak: str
    bulan: str
    umur: Optional[int]
    berat: Optional[float]
    tinggi: Optional[float]
    status_berat: GrowthStatus
    status_tinggi: GrowthStatus
    validasi_input: ValidationStatus
    keterangan: str = ""


class AnalysisSummary(BaseModel):
    total_anak: int
    total_records: int
    valid: int
    warning: int
    error: int
    missing: int


class Downloads(BaseModel):
    excel: str
    laporan: str


class AnalysisResponse(BaseModel):
    job_id: str
    status: str
    message: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    created_at: datetime
    summary: Optional[AnalysisSummary] = None
    downloads: Optional[Downloads] = None
    preview: Optional[List[MeasurementPreview]] = None
    error_message: Optional[str] = None

    @classmethod
    def from_job(cls, job):
        from database import SessionLocal
        from models import Measurement, Child
        import json

        db = SessionLocal()
        try:
            summary_data = None
            downloads_data = None
            preview_data = None

            if job.status == "completed" and job.summary_json:
                summary_data = json.loads(job.summary_json)
                summary_data = AnalysisSummary(**summary_data)

                downloads_data = Downloads(
                    excel=f"/api/download/hasil_validasi.xlsx?job={job.id}",
                    laporan=f"/api/download/laporan_validasi.txt?job={job.id}"
                )

                # Get preview data (first 10 records)
                measurements = db.query(Measurement).join(Child).filter(
                    Measurement.job_id == job.id
                ).limit(10).all()

                preview_data = []
                for m in measurements:
                    preview_data.append(MeasurementPreview(
                        nama_anak=m.child.nama,
                        bulan=m.bulan,
                        umur=m.umur_bulan,
                        berat=m.berat,
                        tinggi=m.tinggi,
                        status_berat=m.status_berat,
                        status_tinggi=m.status_tinggi,
                        validasi_input=m.validasi_input,
                        keterangan=m.keterangan or ""
                    ))

            return cls(
                job_id=job.id,
                status=job.status,
                created_at=job.created_at,
                summary=summary_data,
                downloads=downloads_data,
                preview=preview_data,
                error_message=None
            )
        finally:
            db.close()