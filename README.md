# Fintel - Explainable Multi-Agent AML/CFT System

> **"An Explainable Multi-Agent System for Autonomous Financial Crime Investigation and SAR Drafting"**  
> *Academic PBL / Engineering College Capstone Project*

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![React Flow](https://img.shields.io/badge/React_Flow-12-FF0072.svg)](https://reactflow.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 1. Project Overview & Problem Statement
Financial Intelligence Units (FIUs) and banking compliance departments process tens of thousands of transactions daily. Traditional rule-based alert systems suffer from overwhelming false positive rates, while manual SAR drafting consumes an average of 80 minutes per case.

**Fintel** introduces an explainable, multi-agent architecture that:
1. Ingests and normalizes financial ledgers and customer KYC data.
2. Builds an in-memory NetworkX directed multigraph to evaluate topological typologies alongside transparent rules.
3. Automatically opens cases when composite risk scores exceed threshold (>= 60).
4. Employs an LLM-powered Investigation Agent with strict evidence grounding to correlate findings and prevent hallucinations.
5. Employs a Reporting Agent to draft institutional SAR-style reports watermarked as `DRAFT — REQUIRES HUMAN REVIEW`.
6. Enforces mandatory Human-in-the-Loop review, editing, and explicit approval before any case is finalized.

---

## 2. Technology Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, `@xyflow/react` (React Flow), Axios, Lucide Icons, React Router.
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, Uvicorn.
- **Graph Engine**: NetworkX directed multigraphs with localized k-hop ego-network extraction.
- **Data & Analytics**: Pandas, NumPy.
- **Database**: SQLite (default zero-config local), PostgreSQL-ready.
- **DevOps**: Docker, Docker Compose, Nginx.
- **Testing**: Pytest, FastAPI TestClient.

---

## 3. System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                 REACT FRONTEND (React Flow)                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (JWT Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 FASTAPI MODULAR BACKEND                     │
└──────────────┬───────────────┬───────────────┬──────────────┘
               ▼               ▼               ▼
        Data Ingestion     Detection       Case & Audit
           Service          Engine           Services
               │               │
               └───────┬───────┘
                       ▼
              NetworkX Graph Engine
                       │
                       ▼
              Investigation Agent
             (LLM / Demo Engine)
                       │
                       ▼
               Reporting Agent
              (SAR-Style Draft)
                       │
                       ▼
             Human Review Dashboard
             [Edit] [Approve] [Reject]
                       │
                       ▼
             Immutable Audit Trail
```

---

## 4. Quickstart Guide (Local Development)

### Prerequisites
- Python 3.11+
- Node.js v18+ and npm

### 1. Setup Backend
```bash
# Clone and enter directory
cd Fintel

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1   # On Linux/macOS: source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Initialize database and seed demo dataset
cd backend
python -m app.database.seed
cd ..

# Start FastAPI backend
.venv\Scripts\uvicorn app.main:app --reload --app-dir backend --port 8000
```
- Backend API: `http://localhost:8000`
- Interactive Swagger Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

### 2. Setup Frontend
```bash
cd frontend
npm install
npm run dev
```
- Frontend Web App: `http://localhost:5173`

---

## 5. Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Lead Investigator** | `investigator@fintel.local` | `investigator123` |
| **System Admin** | `admin@fintel.local` | `admin123` |

---

## 6. Docker Deployment
```bash
docker compose up --build
```
- Frontend: `http://localhost` (or `http://localhost:5173`)
- Backend: `http://localhost:8000`

---

## 7. Running Tests & Evaluation
```bash
# Run complete backend test suite (16 tests)
cd backend
..\.venv\Scripts\pytest -v
cd ..

# Run Detection Performance Benchmark
.venv\Scripts\python scripts/evaluate_detection.py

# Run Workflow Time-Savings Benchmark
.venv\Scripts\python scripts/evaluate_workflow.py
```

---

## 8. Benchmark Evaluation Summary
- **Detection Recall**: **77.78%** across 7 synthetic typologies.
- **Evidence Citation Coverage**: **100.0%** of findings reference verified evidence records.
- **Investigation Time Savings**: **90.0%** reduction in compliance triage and SAR drafting duration (from 80.0 min manual baseline to ~8.1 min assisted).

---

## 9. Important Limitations & Academic Scope
- **Prototype Status**: Strictly an academic simulation. Real customer PII and live banking connections are not used.
- **No Autonomous Filing**: Reports are watermarked as `DRAFT — REQUIRES HUMAN REVIEW` and cannot be filed automatically.
- **Demo Mode**: The application operates deterministically without requiring paid third-party LLM API keys.
