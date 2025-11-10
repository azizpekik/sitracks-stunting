# Sitracking Stunting - Child Growth Analysis System

## Overview
A comprehensive web application for analyzing child growth data based on WHO standards.

## Tech Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11, SQLAlchemy
- **Database**: SQLite (for development)
- **Deployment**: Vercel

## Project Structure
```
├── frontend/          # Next.js frontend application
├── backend/           # FastAPI backend services
├── api/              # Vercel serverless functions
├── vercel.json       # Vercel deployment configuration
└── requirements.txt  # Python dependencies
```

## Development Setup

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Environment Variables
- Database configuration in `backend/.env`
- Frontend environment variables in `frontend/.env.local`

## Deployment
This project is configured for deployment on Vercel with:
- Automatic builds for frontend
- Serverless Python functions for API
- Proper routing between frontend and backend

## Features
- User authentication and authorization
- Excel file upload and processing
- Growth analysis based on WHO standards
- Interactive dashboard with results
- Reference data management