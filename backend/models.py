from sqlalchemy import Column, Integer, String, DateTime, Float, Text, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship, joinedload
from sqlalchemy.sql import func
from datetime import datetime
import json
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    last_login = Column(DateTime, nullable=True)

    @classmethod
    def create(cls, username: str, password_hash: str, full_name: str):
        from database import SessionLocal
        db = SessionLocal()
        try:
            user = cls(
                username=username,
                password_hash=password_hash,
                full_name=full_name
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user
        finally:
            db.close()

    @classmethod
    def get_by_username(cls, username: str):
        from database import SessionLocal
        db = SessionLocal()
        try:
            return db.query(cls).filter(cls.username == username).first()
        finally:
            db.close()

    def update_last_login(self):
        self.last_login = datetime.utcnow()
        from database import SessionLocal
        db = SessionLocal()
        try:
            db.commit()
        finally:
            db.close()


class MasterReference(Base):
    __tablename__ = "master_references"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)  # e.g., "Standar WHO Januari 2024"
    description = Column(Text, nullable=True)
    file_path = Column(Text, nullable=False)
    file_name = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])

    @classmethod
    def create(cls, name: str, file_path: str, file_name: str, description: str = None, created_by: int = None):
        from database import SessionLocal
        db = SessionLocal()
        try:
            master_ref = cls(
                name=name,
                file_path=file_path,
                file_name=file_name,
                description=description,
                created_by=created_by
            )
            db.add(master_ref)
            db.commit()
            db.refresh(master_ref)
            return master_ref
        finally:
            db.close()

    @classmethod
    def get_all_active(cls):
        from database import SessionLocal
        db = SessionLocal()
        try:
            return db.query(cls).options(
                joinedload(cls.creator)
            ).filter(cls.is_active == True).order_by(cls.created_at.desc()).all()
        finally:
            db.close()

    @classmethod
    def get_by_id(cls, master_id: int):
        from database import SessionLocal
        db = SessionLocal()
        try:
            return db.query(cls).filter(cls.id == master_id).first()
        finally:
            db.close()

    def update(self, name: str = None, description: str = None):
        """Update master reference data"""
        from database import SessionLocal
        db = SessionLocal()
        try:
            # Get the object in the current session with all required relationships
            master_ref = db.query(MasterReference).options(
                joinedload(MasterReference.creator)
            ).filter(MasterReference.id == self.id).first()
            if master_ref:
                if name is not None:
                    master_ref.name = name
                if description is not None:
                    master_ref.description = description
                db.commit()
                # Update self object
                self.name = master_ref.name
                self.description = master_ref.description
        finally:
            db.close()

    def delete(self):
        """Delete master reference and its file"""
        import os
        from database import SessionLocal
        db = SessionLocal()
        try:
            # Get the object in the current session
            master_ref = db.query(MasterReference).filter(MasterReference.id == self.id).first()
            if master_ref:
                # Delete the file if it exists
                if master_ref.file_path and os.path.exists(master_ref.file_path):
                    try:
                        os.remove(master_ref.file_path)
                    except Exception as e:
                        print(f"Warning: Could not delete file {master_ref.file_path}: {e}")

                # Delete the database record
                db.delete(master_ref)
                db.commit()
        finally:
            db.close()


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

    # New fields for user and institution tracking
    analyzer_name = Column(String(100), nullable=False)  # e.g., "Nur Azis"
    analyzer_institution = Column(String(200), nullable=False)  # e.g., "Posyandu Dampit"
    master_reference_id = Column(Integer, ForeignKey("master_references.id"), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    children = relationship("Child", back_populates="job", cascade="all, delete-orphan")
    measurements = relationship("Measurement", back_populates="job", cascade="all, delete-orphan")
    master_reference = relationship("MasterReference", foreign_keys=[master_reference_id])
    creator = relationship("User", foreign_keys=[created_by])

    @classmethod
    def create(cls, job_id: str, default_gender: str, lapangan_path: str, referensi_path: str,
               analyzer_name: str, analyzer_institution: str, master_reference_id: int = None, created_by: int = None):
        from database import SessionLocal
        db = SessionLocal()
        try:
            job = cls(
                id=job_id,
                default_gender=default_gender,
                lapangan_path=lapangan_path,
                referensi_path=referensi_path,
                analyzer_name=analyzer_name,
                analyzer_institution=analyzer_institution,
                master_reference_id=master_reference_id,
                created_by=created_by
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

    @classmethod
    def get_all(cls, limit: int = 50, offset: int = 0):
        from database import SessionLocal
        db = SessionLocal()
        try:
            return db.query(cls).order_by(cls.created_at.desc()).offset(offset).limit(limit).all()
        finally:
            db.close()

    @classmethod
    def get_all_with_relations(cls, limit: int = 50, offset: int = 0):
        from database import SessionLocal
        db = SessionLocal()
        try:
            return db.query(cls).options(
                joinedload(cls.master_reference),
                joinedload(cls.creator)
            ).order_by(cls.created_at.desc()).offset(offset).limit(limit).all()
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
    jenis_kelamin = Column(String(10), nullable=True)  # L, P, or NULL

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