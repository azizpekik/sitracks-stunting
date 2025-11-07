#!/usr/bin/env python3
"""
Database migration script to add error_message column to jobs table
"""

from database import SessionLocal, engine
from models import Job
from sqlalchemy import text

def add_error_message_column():
    """Add error_message column to jobs table if it doesn't exist"""
    db = SessionLocal()
    try:
        # Check if column already exists
        result = db.execute(text("""
            SELECT COUNT(*) as count
            FROM pragma_table_info('jobs')
            WHERE name = 'error_message'
        """))
        column_exists = result.fetchone()[0] > 0

        if not column_exists:
            print("Adding error_message column to jobs table...")
            db.execute(text("""
                ALTER TABLE jobs
                ADD COLUMN error_message TEXT
            """))
            db.commit()
            print("✅ error_message column added successfully")
        else:
            print("✅ error_message column already exists")

    except Exception as e:
        print(f"❌ Error adding column: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_error_message_column()