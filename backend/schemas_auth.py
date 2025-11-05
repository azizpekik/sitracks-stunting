from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    username: str = Field(..., description="Username for login")
    password: str = Field(..., description="Password for login")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserInfo"


class UserInfo(BaseModel):
    id: int
    username: str
    full_name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class MasterReferenceCreate(BaseModel):
    name: str = Field(..., description="Name of the master reference")
    description: Optional[str] = Field(None, description="Description of the master reference")


class MasterReferenceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    file_name: str
    is_active: bool
    created_at: datetime
    creator: Optional[UserInfo] = None

    class Config:
        from_attributes = True


class JobCreateRequest(BaseModel):
    analyzer_name: str = Field(..., description="Name of the analyzer")
    analyzer_institution: str = Field(..., description="Institution of the analyzer")
    master_reference_id: Optional[int] = Field(None, description="Master reference ID to use")


class JobListResponse(BaseModel):
    id: str
    analyzer_name: str
    analyzer_institution: str
    status: str
    created_at: datetime
    updated_at: datetime
    summary: Optional[dict] = None
    master_reference: Optional[MasterReferenceResponse] = None
    creator: Optional[UserInfo] = None

    class Config:
        from_attributes = True


class JobStatusExtended(BaseModel):
    job_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    analyzer_name: str
    analyzer_institution: str
    summary: Optional[dict] = None
    master_reference: Optional[MasterReferenceResponse] = None
    creator: Optional[UserInfo] = None
    excel_path: Optional[str] = None
    report_path: Optional[str] = None
    preview: Optional[List[dict]] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True