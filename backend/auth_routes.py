from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List, Optional

from models import User, MasterReference, Job
from schemas_auth import (
    LoginRequest, LoginResponse, UserInfo,
    MasterReferenceCreate, MasterReferenceResponse,
    JobCreateRequest, JobListResponse, JobStatusExtended
)
from dependencies import get_current_active_user
from services.auth_service import auth_service
from services.file_manager import FileManager
from database import SessionLocal

router = APIRouter(prefix="/auth", tags=["authentication"])
file_manager = FileManager()


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Login endpoint"""
    user = auth_service.authenticate_user(login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Update last login
    user.update_last_login()

    # Create access token
    access_token_expires = timedelta(minutes=auth_service.access_token_expire_minutes)
    access_token = auth_service.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    # Convert user to dict for response
    user_info = UserInfo(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        is_active=user.is_active,
        created_at=user.created_at
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info
    }


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return UserInfo(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at
    )


@router.post("/master-references", response_model=MasterReferenceResponse)
async def create_master_reference(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new master reference"""
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel file (.xlsx, .xls)"
        )

    try:
        # Save uploaded file
        file_path = await file_manager.save_master_reference_file(file)

        # Create master reference record
        master_ref = MasterReference.create(
            name=name,
            file_path=file_path,
            file_name=file.filename,
            description=description,
            created_by=current_user.id
        )

        # Get creator info
        creator_info = UserInfo(
            id=current_user.id,
            username=current_user.username,
            full_name=current_user.full_name,
            is_active=current_user.is_active,
            created_at=current_user.created_at
        )

        return MasterReferenceResponse(
            id=master_ref.id,
            name=master_ref.name,
            description=master_ref.description,
            file_name=master_ref.file_name,
            is_active=master_ref.is_active,
            created_at=master_ref.created_at,
            creator=creator_info
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create master reference: {str(e)}"
        )


@router.get("/master-references", response_model=List[MasterReferenceResponse])
async def get_master_references(current_user: User = Depends(get_current_active_user)):
    """Get all active master references"""
    try:
        master_refs = MasterReference.get_all_active()

        result = []
        for ref in master_refs:
            creator_info = None
            if ref.creator:
                creator_info = UserInfo(
                    id=ref.creator.id,
                    username=ref.creator.username,
                    full_name=ref.creator.full_name,
                    is_active=ref.creator.is_active,
                    created_at=ref.creator.created_at
                )

            result.append(MasterReferenceResponse(
                id=ref.id,
                name=ref.name,
                description=ref.description,
                file_name=ref.file_name,
                is_active=ref.is_active,
                created_at=ref.created_at,
                creator=creator_info
            ))

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get master references: {str(e)}"
        )


@router.put("/master-references/{reference_id}", response_model=MasterReferenceResponse)
async def update_master_reference(
    reference_id: int,
    update_data: dict,
    current_user: User = Depends(get_current_active_user)
):
    """Update a master reference"""
    from database import SessionLocal
    from sqlalchemy.orm import joinedload

    db = SessionLocal()
    try:
        # Get master reference with creator relationship
        master_ref = db.query(MasterReference).options(
            joinedload(MasterReference.creator)
        ).filter(MasterReference.id == reference_id).first()

        if not master_ref:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Master reference not found"
            )

        # Update the reference
        if 'name' in update_data:
            master_ref.name = update_data['name']
        if 'description' in update_data:
            master_ref.description = update_data['description']

        db.commit()
        db.refresh(master_ref)

        # Get creator info
        creator_info = None
        if master_ref.creator:
            creator_info = UserInfo(
                id=master_ref.creator.id,
                username=master_ref.creator.username,
                full_name=master_ref.creator.full_name,
                is_active=master_ref.creator.is_active,
                created_at=master_ref.creator.created_at
            )

        return MasterReferenceResponse(
            id=master_ref.id,
            name=master_ref.name,
            description=master_ref.description,
            file_name=master_ref.file_name,
            is_active=master_ref.is_active,
            created_at=master_ref.created_at,
            creator=creator_info
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update master reference: {str(e)}"
        )
    finally:
        db.close()


@router.get("/master-references/{reference_id}/download")
async def download_master_reference(
    reference_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Download master reference file"""
    try:
        master_ref = MasterReference.get_by_id(reference_id)
        if not master_ref:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Master reference not found"
            )

        import os
        if not os.path.exists(master_ref.file_path):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )

        from fastapi.responses import FileResponse
        return FileResponse(
            path=master_ref.file_path,
            filename=master_ref.file_name,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download master reference: {str(e)}"
        )


@router.delete("/master-references/{reference_id}")
async def delete_master_reference(
    reference_id: int,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a master reference"""
    try:
        master_ref = MasterReference.get_by_id(reference_id)
        if not master_ref:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Master reference not found"
            )

        # Delete the reference (this will also delete the file if implemented)
        master_ref.delete()

        return {"message": "Master reference deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete master reference: {str(e)}"
        )


@router.get("/jobs", response_model=List[JobListResponse])
async def get_jobs(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_active_user)
):
    """Get all jobs with pagination"""
    try:
        jobs = Job.get_all_with_relations(limit=limit, offset=offset)

        result = []
        for job in jobs:
            # Get summary
            summary = job.get_summary()

            # Get master reference info
            master_ref_info = None
            if job.master_reference:
                master_ref_info = MasterReferenceResponse(
                    id=job.master_reference.id,
                    name=job.master_reference.name,
                    description=job.master_reference.description,
                    file_name=job.master_reference.file_name,
                    is_active=job.master_reference.is_active,
                    created_at=job.master_reference.created_at
                )

            # Get creator info
            creator_info = None
            if job.creator:
                creator_info = UserInfo(
                    id=job.creator.id,
                    username=job.creator.username,
                    full_name=job.creator.full_name,
                    is_active=job.creator.is_active,
                    created_at=job.creator.created_at
                )

            result.append(JobListResponse(
                id=job.id,
                analyzer_name=job.analyzer_name,
                analyzer_institution=job.analyzer_institution,
                status=job.status,
                created_at=job.created_at,
                updated_at=job.updated_at,
                summary=summary,
                master_reference=master_ref_info,
                creator=creator_info
            ))

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get jobs: {str(e)}"
        )


@router.get("/jobs/{job_id}", response_model=JobStatusExtended)
async def get_job_extended(job_id: str, current_user: User = Depends(get_current_active_user)):
    """Get detailed job information"""
    try:
        job = Job.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

        # Get summary
        summary = job.get_summary()

        # Get master reference info
        master_ref_info = None
        if job.master_reference:
            master_ref_info = MasterReferenceResponse(
                id=job.master_reference.id,
                name=job.master_reference.name,
                description=job.master_reference.description,
                file_name=job.master_reference.file_name,
                is_active=job.master_reference.is_active,
                created_at=job.master_reference.created_at
            )

        # Get creator info
        creator_info = None
        if job.creator:
            creator_info = UserInfo(
                id=job.creator.id,
                username=job.creator.username,
                full_name=job.creator.full_name,
                is_active=job.creator.is_active,
                created_at=job.creator.created_at
            )

        # Get preview data (you might want to implement this in the analyzer service)
        preview = None  # Implement preview logic if needed

        return JobStatusExtended(
            job_id=job.id,
            status=job.status,
            created_at=job.created_at,
            updated_at=job.updated_at,
            analyzer_name=job.analyzer_name,
            analyzer_institution=job.analyzer_institution,
            summary=summary,
            master_reference=master_ref_info,
            creator=creator_info,
            excel_path=job.excel_path,
            report_path=job.report_path,
            preview=preview
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job: {str(e)}"
        )


@router.delete("/jobs/{job_id}")
async def delete_job(
    job_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete a job and its associated files"""
    import os
    from database import SessionLocal

    db = SessionLocal()
    try:
        # Get the job with all its relationships
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found"
            )

        # Delete associated files if they exist
        files_deleted = []

        if job.excel_path and os.path.exists(job.excel_path):
            try:
                os.remove(job.excel_path)
                files_deleted.append("Excel report")
            except Exception as e:
                print(f"Warning: Could not delete Excel file {job.excel_path}: {e}")

        if job.report_path and os.path.exists(job.report_path):
            try:
                os.remove(job.report_path)
                files_deleted.append("Text report")
            except Exception as e:
                print(f"Warning: Could not delete text report file {job.report_path}: {e}")

        # Delete the uploaded lapangan file
        if job.lapangan_path and os.path.exists(job.lapangan_path):
            try:
                os.remove(job.lapangan_path)
                files_deleted.append("Lapangan file")
            except Exception as e:
                print(f"Warning: Could not delete lapangan file {job.lapangan_path}: {e}")

        # Check if the referensi file can be deleted
        # Only delete if it's not a master reference (not used by other jobs)
        if job.referensi_path and os.path.exists(job.referensi_path):
            # Check if this referensi file is used by other jobs
            other_jobs_using_same_ref = db.query(Job).filter(
                Job.referensi_path == job.referensi_path,
                Job.id != job_id
            ).count()

            if other_jobs_using_same_ref == 0:
                # Check if this is not a master reference file
                master_ref_using_this_file = db.query(MasterReference).filter(
                    MasterReference.file_path == job.referensi_path
                ).count()

                if master_ref_using_this_file == 0:
                    try:
                        os.remove(job.referensi_path)
                        files_deleted.append("Referensi file")
                    except Exception as e:
                        print(f"Warning: Could not delete referensi file {job.referensi_path}: {e}")

        # Delete the job record (this will cascade delete children and measurements)
        db.delete(job)
        db.commit()

        return {
            "message": "Job deleted successfully",
            "files_deleted": files_deleted
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job: {str(e)}"
        )
    finally:
        db.close()