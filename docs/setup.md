# Fintel Setup & Execution Guide

## Prerequisites
- Python 3.11+
- Node.js v18+ and npm
- Docker & Docker Compose (Optional for containerized run)

---

## Local Development Setup

### 1. Backend Setup
```bash
# Navigate to workspace root
cd Fintel

# Create Python virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r backend/requirements.txt

# Copy environment configuration
copy backend\.env.example backend\.env

# Seed database with synthetic entities and detection pipeline
cd backend
python -m app.database.seed
cd ..

# Start FastAPI backend server
.venv\Scripts\uvicorn app.main:app --reload --app-dir backend --port 8000
```
Backend API will be accessible at: `http://localhost:8000`  
Swagger Documentation: `http://localhost:8000/docs`

---

### 2. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite dev server
npm run dev
```
Frontend will be accessible at: `http://localhost:5173`

---

### 3. Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Lead Investigator** | `investigator@fintel.local` | `investigator123` |
| **System Admin** | `admin@fintel.local` | `admin123` |

---

## Docker Setup
```bash
# Build and run with Docker Compose
docker compose up --build
```
Access points:
- Frontend: `http://localhost` (or `http://localhost:5173`)
- Backend: `http://localhost:8000`
- Health check: `http://localhost:8000/api/health`
