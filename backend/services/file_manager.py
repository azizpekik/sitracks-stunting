import os
import shutil
import aiofiles
from fastapi import UploadFile
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class FileManager:
    def __init__(self):
        self.base_path = Path("./data")
        self.uploads_path = self.base_path / "uploads"
        self.outputs_path = self.base_path / "outputs"
        self.master_references_path = self.base_path / "master_references"

        # Ensure directories exist
        self.uploads_path.mkdir(parents=True, exist_ok=True)
        self.outputs_path.mkdir(parents=True, exist_ok=True)
        self.master_references_path.mkdir(parents=True, exist_ok=True)

    async def save_upload_file(self, file: UploadFile, job_id: str, file_type: str) -> str:
        """
        Save uploaded file and return the file path
        """
        try:
            # Create job directory
            job_dir = self.uploads_path / job_id
            job_dir.mkdir(exist_ok=True)

            # Generate filename
            file_extension = Path(file.filename).suffix
            filename = f"{file_type}{file_extension}"
            file_path = job_dir / filename

            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)

            logger.info(f"Saved {file_type} file for job {job_id}: {file_path}")
            return str(file_path)

        except Exception as e:
            logger.error(f"Error saving {file_type} file: {str(e)}")
            raise

    def get_upload_path(self, job_id: str, filename: str) -> str:
        """
        Get upload file path
        """
        return str(self.uploads_path / job_id / filename)

    def get_output_path(self, job_id: str, filename: str) -> str:
        """
        Get output file path
        """
        job_dir = self.outputs_path / job_id
        job_dir.mkdir(exist_ok=True)
        return str(job_dir / filename)

    def cleanup_job_files(self, job_id: str):
        """
        Clean up files for a specific job
        """
        try:
            # Remove upload directory
            upload_dir = self.uploads_path / job_id
            if upload_dir.exists():
                shutil.rmtree(upload_dir)

            # Remove output directory
            output_dir = self.outputs_path / job_id
            if output_dir.exists():
                shutil.rmtree(output_dir)

            logger.info(f"Cleaned up files for job {job_id}")

        except Exception as e:
            logger.error(f"Error cleaning up job {job_id}: {str(e)}")

    def file_exists(self, file_path: str) -> bool:
        """
        Check if file exists
        """
        return os.path.exists(file_path)

    def get_file_size(self, file_path: str) -> int:
        """
        Get file size in bytes
        """
        if os.path.exists(file_path):
            return os.path.getsize(file_path)
        return 0

    async def save_master_reference_file(self, file: UploadFile) -> str:
        """
        Save master reference file and return the file path
        """
        try:
            # Generate unique filename with timestamp
            import time
            timestamp = int(time.time())
            file_extension = Path(file.filename).suffix
            filename = f"master_{timestamp}_{file.filename}"
            file_path = self.master_references_path / filename

            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)

            logger.info(f"Saved master reference file: {file_path}")
            return str(file_path)

        except Exception as e:
            logger.error(f"Error saving master reference file: {str(e)}")
            raise

    def get_master_reference_path(self, filename: str) -> str:
        """
        Get master reference file path
        """
        return str(self.master_references_path / filename)