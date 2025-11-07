from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks, Depends
from typing import Optional
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from pathlib import Path
import logging
from contextlib import asynccontextmanager

from database import engine, Base
from models import Job, User, MasterReference
from schemas import AnalysisRequest, AnalysisResponse, JobStatus
from schemas_auth import JobCreateRequest
from services.analyzer import GrowthAnalyzer
from services.file_manager import FileManager
from services.auth_service import auth_service
from dependencies import get_current_active_user
from config import settings
from auth_routes import router as auth_router
from models import User

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

    # Create default admin user
    auth_service.create_default_admin()

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

# Include auth routes
app.include_router(auth_router)


@app.get("/")
async def root():
    return {"message": "Sitracking Stunting API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_data(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user),
    lapangan: UploadFile = File(...),
    referensi: Optional[UploadFile] = File(None),
    analyzer_name: str = Form(...),
    analyzer_institution: str = Form(...),
    master_reference_id: Optional[int] = Form(default=None),
    jenis_kelamin_default: Optional[str] = Form(default=None)
):
    """
    Analyze child growth data from uploaded Excel files
    """
    logger.info(f"=== DEBUG: Analyze API called ===")
    logger.info(f"User: {current_user.username} ({current_user.full_name})")
    logger.info(f"Analyzer: {analyzer_name} - {analyzer_institution}")
    logger.info(f"Master Reference ID: {master_reference_id}")
    logger.info(f"jenis_kelamin_default: '{jenis_kelamin_default}'")
    logger.info(f"lapangan.filename: {lapangan.filename}")
    logger.info(f"referensi.filename: {referensi.filename if referensi else 'None'}")

    try:
        # Validate file types
        if not lapangan.filename.endswith(('.xlsx', '.xls')):
            logger.error(f"Invalid lapangan file type: {lapangan.filename}")
            raise HTTPException(status_code=400, detail="File lapangan harus berformat Excel (.xlsx/.xls)")

        if referensi and not referensi.filename.endswith(('.xlsx', '.xls')):
            logger.error(f"Invalid referensi file type: {referensi.filename}")
            raise HTTPException(status_code=400, detail="File referensi harus berformat Excel (.xlsx/.xls)")

        # Validate file sizes
        if lapangan.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
            logger.error(f"Lapangan file too large: {lapangan.size} bytes")
            raise HTTPException(
                status_code=400,
                detail=f"File lapangan terlalu besar (max {settings.MAX_UPLOAD_MB}MB)"
            )

        if referensi and referensi.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
            logger.error(f"Referensi file too large: {referensi.size} bytes")
            raise HTTPException(
                status_code=400,
                detail=f"File referensi terlalu besar (max {settings.MAX_UPLOAD_MB}MB)"
            )

        # Handle empty string as default "A" for auto-detect
        if jenis_kelamin_default == '':
            jenis_kelamin_default = 'A'  # 'A' = Auto-detect gender from Excel

        # Validate gender (only if provided)
        if jenis_kelamin_default and jenis_kelamin_default not in ["L", "P", "A"]:
            logger.error(f"Invalid gender value: '{jenis_kelamin_default}' - must be 'L', 'P', or 'A' (auto-detect)")
            raise HTTPException(status_code=400, detail="Jenis kelamin default harus 'L', 'P', atau 'A' (auto-detect)")

        logger.info(f"=== All validations passed ===")
        if jenis_kelamin_default == 'A':
            logger.info("Auto-detecting gender from Excel file")
        else:
            logger.info(f"Using default gender: '{jenis_kelamin_default}'")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during validation: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Validation error: {str(e)}")

    try:
        # Generate job ID
        job_id = str(uuid.uuid4())

        # Determine referensi path
        referensi_path = None
        if master_reference_id:
            # Use master reference file
            master_ref = MasterReference.get_by_id(master_reference_id)
            if master_ref:
                referensi_path = master_ref.file_path
                logger.info(f"Using master reference: {master_ref.name}")
            else:
                logger.error(f"Master reference not found: {master_reference_id}")
                raise HTTPException(
                    status_code=400,
                    detail="Master reference not found"
                )
        else:
            # Use uploaded referensi file
            if referensi:
                referensi_path = await file_manager.save_upload_file(referensi, job_id, "referensi")
                logger.info(f"Using uploaded referensi file: {referensi.filename}")
            else:
                logger.error("No referensi file or master reference provided")
                raise HTTPException(
                    status_code=400,
                    detail="Referensi file or master reference is required"
                )

        # Save lapangan file
        lapangan_path = await file_manager.save_upload_file(lapangan, job_id, "lapangan")

        logger.info(f"Files saved: lapangan={lapangan_path}, referensi={referensi_path}")

        # Create job record
        job = Job.create(
            job_id=job_id,
            default_gender=jenis_kelamin_default,
            lapangan_path=lapangan_path,
            referensi_path=referensi_path,
            analyzer_name=analyzer_name,
            analyzer_institution=analyzer_institution,
            master_reference_id=master_reference_id,
            created_by=current_user.id
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
    if filename not in ["hasil_validasi.xlsx", "laporan_validasi.txt", "konteks_lengkap.txt"]:
        raise HTTPException(status_code=400, detail="Filename tidak valid")

    try:
        job_record = Job.get_by_id(job)
        if not job_record:
            raise HTTPException(status_code=404, detail="Job tidak ditemukan")

        if filename == "hasil_validasi.xlsx":
            file_path = job_record.excel_path
        elif filename == "konteks_lengkap.txt":
            file_path = job_record.context_path
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