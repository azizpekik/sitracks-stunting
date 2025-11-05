from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from typing import Optional
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path
import logging
from contextlib import asynccontextmanager

from database import engine, Base
from models import Job
from schemas import AnalysisRequest, AnalysisResponse, JobStatus
from services.analyzer import GrowthAnalyzer
from services.file_manager import FileManager
from config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('sitracking.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Create data directory
os.makedirs(settings.FILE_STORE, exist_ok=True)
os.makedirs(f"{settings.FILE_STORE}/uploads", exist_ok=True)
os.makedirs(f"{settings.FILE_STORE}/outputs", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    logger.info("Application startup completed")
    yield
    # Shutdown
    logger.info("Application shutdown")


app = FastAPI(
    title="Sitracking Stunting API",
    description="API for analyzing child growth data",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services
file_manager = FileManager()
analyzer = GrowthAnalyzer()


@app.get("/")
async def root():
    return {"message": "Sitracking Stunting API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_data(
    background_tasks: BackgroundTasks,
    lapangan: UploadFile = File(...),
    referensi: UploadFile = File(...),
    jenis_kelamin_default: Optional[str] = Form(default="L")
):
    """
    Analyze child growth data from uploaded Excel files
    """
    logger.info(f"=== DEBUG: Analyze API called ===")
    logger.info(f"jenis_kelamin_default: '{jenis_kelamin_default}'")
    logger.info(f"lapangan.filename: {lapangan.filename}")
    logger.info(f"referensi.filename: {referensi.filename}")

    # Validate file types
    if not lapangan.filename.endswith(('.xlsx', '.xls')):
        logger.error(f"Invalid lapangan file type: {lapangan.filename}")
        raise HTTPException(status_code=400, detail="File lapangan harus berformat Excel (.xlsx/.xls)")

    if not referensi.filename.endswith(('.xlsx', '.xls')):
        logger.error(f"Invalid referensi file type: {referensi.filename}")
        raise HTTPException(status_code=400, detail="File referensi harus berformat Excel (.xlsx/.xls)")

    # Validate file sizes
    if lapangan.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
        logger.error(f"Lapangan file too large: {lapangan.size} bytes")
        raise HTTPException(
            status_code=400,
            detail=f"File lapangan terlalu besar (max {settings.MAX_UPLOAD_MB}MB)"
        )

    if referensi.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
        logger.error(f"Referensi file too large: {referensi.size} bytes")
        raise HTTPException(
            status_code=400,
            detail=f"File referensi terlalu besar (max {settings.MAX_UPLOAD_MB}MB)"
        )

      # Validate gender (only if provided)
    if jenis_kelamin_default and jenis_kelamin_default not in ["L", "P"]:
        logger.error(f"Invalid gender value: '{jenis_kelamin_default}' - must be 'L' or 'P'")
        raise HTTPException(status_code=400, detail="Jenis kelamin default harus 'L' atau 'P'")

    logger.info(f"=== All validations passed ===")
    if jenis_kelamin_default:
        logger.info(f"Using default gender: '{jenis_kelamin_default}'")
    else:
        logger.info("Auto-detecting gender from Excel file")

    try:
        # Generate job ID
        job_id = str(uuid.uuid4())

        # Save uploaded files
        lapangan_path = await file_manager.save_upload_file(lapangan, job_id, "lapangan")
        referensi_path = await file_manager.save_upload_file(referensi, job_id, "referensi")

        logger.info(f"Files saved: lapangan={lapangan_path}, referensi={referensi_path}")

        # Create job record
        job = Job.create(
            job_id=job_id,
            default_gender=jenis_kelamin_default,
            lapangan_path=lapangan_path,
            referensi_path=referensi_path
        )

        # Run analysis in background
        background_tasks.add_task(
            analyzer.run_analysis,
            job_id=job_id,
            lapangan_path=lapangan_path,
            referensi_path=referensi_path,
            default_gender=jenis_kelamin_default
        )

        logger.info(f"Started analysis job {job_id}")

        return AnalysisResponse(
            job_id=job_id,
            status="processing",
            message="Analisis dimulai. Gunakan job_id untuk mengecek status."
        )

    except Exception as e:
        logger.error(f"Error starting analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gagal memulai analisis: {str(e)}")


@app.get("/api/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get job status and results
    """
    try:
        job = Job.get_by_id(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job tidak ditemukan")

        return JobStatus.from_job(job)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal mengambil status job")


@app.get("/api/download/{filename}")
async def download_file(filename: str, job: str):
    """
    Download analysis results
    """
    if filename not in ["hasil_validasi.xlsx", "laporan_validasi.txt"]:
        raise HTTPException(status_code=400, detail="Filename tidak valid")

    try:
        job_record = Job.get_by_id(job)
        if not job_record:
            raise HTTPException(status_code=404, detail="Job tidak ditemukan")

        if filename == "hasil_validasi.xlsx":
            file_path = job_record.excel_path
        else:
            file_path = job_record.report_path

        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File tidak ditemukan")

        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' if filename.endswith('.xlsx') else 'text/plain'
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Gagal mengunduh file")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)