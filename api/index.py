import sys
import os

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import FastAPI app
from main import app

# Initialize Mangum adapter once at module level
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    # If mangum is not available, create a fallback handler
    def handler(event, context):
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": '{"error": "Mangum adapter not found. Please check deployment."}'
        }