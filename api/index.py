import sys
import os

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Debug logging
print("=== API Handler Debug Info ===")
print(f"Python path: {sys.path}")
print(f"Current directory: {os.getcwd()}")
print(f"API directory: {os.path.dirname(__file__)}")
print("=== End Debug Info ===")

# Import FastAPI app
try:
    from main import app
    print("✓ Successfully imported FastAPI app")
except ImportError as e:
    print(f"✗ Failed to import FastAPI app: {e}")
    # Create a minimal app for testing
    from fastapi import FastAPI
    app = FastAPI()

    @app.post("/auth/login")
    async def login_test():
        return {"error": f"Import error: {e}"}

# Initialize Mangum adapter once at module level
try:
    from mangum import Mangum
    handler = Mangum(app)
    print("✓ Successfully initialized Mangum handler")
except ImportError as e:
    print(f"✗ Failed to import Mangum: {e}")
    # If mangum is not available, create a fallback handler
    def handler(event, context):
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": f'{{"error": "Mangum adapter not found. Import error: {e}"}}'
        }