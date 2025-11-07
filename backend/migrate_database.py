#!/usr/bin/env python3
"""
Database migration script to add missing context_path column to jobs table
"""

import sqlite3
import sys
from pathlib import Path

def migrate_database():
    """Add missing context_path column to jobs table"""

    # Database path
    db_path = Path(__file__).parent / "sitracking.db"

    if not db_path.exists():
        print(f"Database file not found at {db_path}")
        return False

    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check if context_path column already exists
        cursor.execute("PRAGMA table_info(jobs)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'context_path' in columns:
            print("context_path column already exists in jobs table")
            conn.close()
            return True

        # Add context_path column
        print("Adding context_path column to jobs table...")
        cursor.execute("ALTER TABLE jobs ADD COLUMN context_path TEXT")

        # Commit changes
        conn.commit()
        print("Successfully added context_path column to jobs table")

        # Verify the column was added
        cursor.execute("PRAGMA table_info(jobs)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'context_path' in columns:
            print("Verification successful: context_path column exists")
        else:
            print("Verification failed: context_path column not found")
            conn.close()
            return False

        conn.close()
        return True

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print("Starting database migration...")
    success = migrate_database()

    if success:
        print("Migration completed successfully!")
        sys.exit(0)
    else:
        print("Migration failed!")
        sys.exit(1)