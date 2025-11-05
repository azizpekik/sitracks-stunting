import logging
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
# from passlib.context import CryptContext  # Temporarily disabled
from fastapi import HTTPException, status
from models import User

# Configure logging
logger = logging.getLogger(__name__)

# Configuration
SECRET_KEY = "sitracking_stunting_secret_key_2024"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing - temporarily using simple hash for testing
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self):
        self.secret_key = SECRET_KEY
        self.algorithm = ALGORITHM
        self.access_token_expire_minutes = ACCESS_TOKEN_EXPIRE_MINUTES

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        # Using simple SHA-256 hash for testing (replace with bcrypt in production)
        return hashlib.sha256(plain_password.encode()).hexdigest() == hashed_password

    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        # Using simple SHA-256 hash for testing (replace with bcrypt in production)
        return hashlib.sha256(password.encode()).hexdigest()

    def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Authenticate user credentials"""
        user = User.get_by_username(username)
        if not user:
            return None
        if not self.verify_password(password, user.password_hash):
            return None
        if not user.is_active:
            return None
        return user

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)

        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            username: str = payload.get("sub")
            if username is None:
                return None
            return payload
        except JWTError:
            return None

    def get_current_user(self, token: str) -> Optional[User]:
        """Get current user from token"""
        payload = self.verify_token(token)
        if payload is None:
            return None

        username = payload.get("sub")
        user = User.get_by_username(username)
        if user is None:
            return None

        return user

    def create_default_admin(self):
        """Create default admin user if not exists"""
        existing_admin = User.get_by_username("admin")
        if not existing_admin:
            logger.info("Creating default admin user...")
            admin_password_hash = self.get_password_hash("admin")
            User.create(
                username="admin",
                password_hash=admin_password_hash,
                full_name="Administrator"
            )
            logger.info("Default admin user created successfully")
        else:
            logger.info("Admin user already exists")


# Global instance
auth_service = AuthService()