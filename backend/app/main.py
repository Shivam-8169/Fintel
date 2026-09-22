"""
Fintel - Explainable Multi-Agent AML/CFT System.
FastAPI Main Application Entry Point.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config.settings import settings
from app.database.database import engine, Base, get_db
from app.api import auth, data, cases, graph, investigation, reports, audit, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is initialized on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Explainable Multi-Agent System for Autonomous Financial Crime Investigation and SAR Drafting",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev frontends
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(data.router, prefix=settings.API_V1_STR)
app.include_router(cases.router, prefix=settings.API_V1_STR)
app.include_router(graph.router, prefix=settings.API_V1_STR)
app.include_router(investigation.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)


@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check validating API, database connectivity, and engine states."""
    db_status = "DOWN"
    try:
        db.execute(text("SELECT 1"))
        db_status = "UP"
    except Exception as e:
        db_status = f"ERROR: {str(e)}"

    return {
        "status": "HEALTHY",
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "services": {
            "api": "UP",
            "database": db_status,
            "llm_mode": "DEMO/MOCK (Deterministic Grounded)" if settings.DEMO_MODE or not settings.LLM_API_KEY else f"ACTIVE ({settings.LLM_MODEL})",
            "graph_engine": "NetworkX MultiDiGraph (UP)",
            "rules_engine": "Active (7 typologies)",
            "human_in_the_loop_approval": "ENFORCED"
        }
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "project": "Fintel Autonomous AML/CFT Platform",
        "docs_url": "/docs",
        "health_url": f"{settings.API_V1_STR}/health"
    }
