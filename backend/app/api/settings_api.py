"""
Settings API Router.
Provides platform configurations, model governance, and environment status.
Never exposes secret keys or sensitive tokens.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database.database import get_db
from app.config.settings import settings

router = APIRouter(prefix="/settings", tags=["Platform Settings"])


@router.get("/status")
def get_settings_status(db: Session = Depends(get_db)):
    """Returns platform configurations, AI governance, and database connectivity."""
    db_ok = True
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_ok = False

    has_gemini_key = bool(settings.LLM_API_KEY and len(settings.LLM_API_KEY.strip()) > 5)

    return {
        "platform_name": "Fintel",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "academic_notice": "ACADEMIC PBL PROTOTYPE — SIMULATED DEMO DATA ONLY",
        "governance": {
            "human_in_the_loop_mandatory": True,
            "draft_watermark": "DRAFT — REQUIRES HUMAN REVIEW",
            "autonomous_regulatory_filing": "DISABLED (Prohibited in Academic Simulation)"
        },
        "llm_configuration": {
            "provider": "Google Gemini",
            "model": settings.LLM_MODEL,
            "gemini_api_status": "Configured" if has_gemini_key else "Not Configured (Using Deterministic Grounded Mock LLM)",
            "mock_llm_mode": settings.DEMO_MODE or not has_gemini_key,
            "api_key_masked": "Configured (Hidden)" if has_gemini_key else "None"
        },
        "database_configuration": {
            "engine": "SQLite 3",
            "uri": "sqlite:///./fintel.db (Local Persistent Storage)",
            "connection_status": "HEALTHY" if db_ok else "DISCONNECTED",
            "migration_ready": "PostgreSQL Compatible SQLAlchemy Models"
        },
        "detection_thresholds": {
            "case_creation_score_threshold": settings.DETECTION_THRESHOLD,
            "high_value_wire_threshold_usd": settings.HIGH_VALUE_THRESHOLD,
            "structuring_upper_bound_usd": settings.STRUCTURING_THRESHOLD,
            "structuring_lower_bound_usd": settings.STRUCTURING_LOWER_BOUND,
            "rapid_fund_pass_through_hours": settings.RAPID_MOVEMENT_WINDOW_HOURS,
            "mule_fan_in_out_degree": settings.FAN_OUT_IN_DEGREE_THRESHOLD,
            "velocity_burst_count": settings.HIGH_VELOCITY_TX_COUNT,
            "temporal_proximity_window_hours": 72
        },
        "security": {
            "jwt_algorithm": settings.JWT_ALGORITHM,
            "token_expiration_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "cors_origins": settings.cors_origins_list
        }
    }
