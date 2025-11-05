from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import json
from database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    default_gender = Column(String(1), nullable=False)
    status = Column(String(20), default="processing")  # processing, completed, failed
    summary_json = Column(Text)
    excel_path = Column(Text)
    report_path = Column(Text)
    lapangan_path = Column(Text)
    referensi_path = Column(Text)

    # Relationships
    children = relationship("Child", back_populates="job", cascade="all, delete-orphan")
    measurements = relationship("Measurement", back_populates="job", cascade="all, delete-orphan")

    @classmethod
    def create(cls, job_id: str, default_gender: str, lapangan_path: str, referensi_path: str):
        from database import SessionLocal
        db = SessionLocal()
        try:
            job = cls(
                id=job_id,
                default_gender=default_gender,
                lapangan_path=lapangan_path,
                referensi_path=referensi_path
            )
            db.add(job)
            db.commit()
            db.refresh(job)  # Refresh to get the committed data
            return job
        finally:
            db.close()

    @classmethod
    def get_by_id(cls, job_id: str):
        from database import SessionLocal
        db = SessionLocal()
        try:
            return db.query(cls).filter(cls.id == job_id).first()
        finally:
            db.close()

    def update_status(self, status: str):
        self.status = status
        self.updated_at = datetime.utcnow()
        from database import SessionLocal
        db = SessionLocal()
        try:
            db.commit()
        finally:
            db.close()

    def save_results(self, summary: dict, excel_path: str, report_path: str):
        self.status = "completed"
        self.summary_json = json.dumps(summary)
        self.excel_path = excel_path
        self.report_path = report_path
        self.updated_at = datetime.utcnow()
        from database import SessionLocal
        db = SessionLocal()
        try:
            db.merge(self)  # Merge the object into session before committing
            db.commit()
        finally:
            db.close()

    def get_summary(self):
        if self.summary_json:
            return json.loads(self.summary_json)
        return None


class Child(Base):
    __tablename__ = "children"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    nik = Column(String(50), nullable=True)
    nama = Column(String(255), nullable=False)
    tgl_lahir = Column(Date, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="children")
    measurements = relationship("Measurement", back_populates="child", cascade="all, delete-orphan")


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    child_id = Column(Integer, ForeignKey("children.id"), nullable=False)
    bulan = Column(String(20), nullable=False)  # "JANUARI", "FEBRUARI", etc.
    tgl_ukur = Column(Date, nullable=True)
    umur_bulan = Column(Integer, nullable=True)
    berat = Column(Float, nullable=True)
    tinggi = Column(Float, nullable=True)
    cara_ukur = Column(String(50), nullable=True)
    status_berat = Column(String(20), nullable=True)  # Ideal, Tidak Ideal, Missing
    status_tinggi = Column(String(20), nullable=True)  # Ideal, Tidak Ideal, Missing
    validasi_input = Column(String(20), nullable=True)  # OK, ERROR, WARNING
    keterangan = Column(Text, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="measurements")
    child = relationship("Child", back_populates="measurements")