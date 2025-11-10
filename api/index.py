import sys
import os

# Add backend to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Import FastAPI app
from main import app

# Vercel serverless function handler
# This function will be called by Vercel to handle requests
def handler(event, context):
    """
    Vercel serverless function handler for FastAPI app
    """
    try:
        # Import necessary modules for Vercel
        from fastapi import FastAPI
        from mangum import Mangum

        # Create Mangum adapter for FastAPI
        handler = Mangum(app)

        # Return the adapted handler
        return handler(event, context)
    except ImportError:
        # If mangum is not available, return a simple response
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
            },
            "body": '{"error": "Mangum adapter not found. Please check deployment."}'
        }