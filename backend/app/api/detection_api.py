"""
Detection API Router.
Provides endpoints for detection engine indicators, rule configurations, and manual execution.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import Case, DetectionResult, Account, Customer
from app.services.detection_service import DetectionService
from app.config.settings import settings

router = APIRouter(prefix="/detection", tags=["Detection Engine & Rules"])


@router.get("/results")
def get_detection_results(db: Session = Depends(get_db)):
    """
    Returns explainable detection results across all cases,
    including indicator attributions, typologies, and engine thresholds.
    """
    results = db.query(DetectionResult).all()
    cases = db.query(Case).all()

    typology_counts = {}
    items = []
    for r in results:
        typology_counts[r.indicator_name] = typology_counts.get(r.indicator_name, 0) + 1
        case = db.query(Case).filter(Case.case_id == r.case_id).first()
        items.append({
            "detection_id": r.detection_id,
            "case_id": r.case_id,
            "account_id": case.account_id if case else "Unknown",
            "indicator_name": r.indicator_name,
            "score": r.score,
            "explanation": r.explanation
        })

    return {
        "total_indicators_flagged": len(results),
        "total_flagged_cases": len(cases),
        "typology_breakdown": typology_counts,
        "engine_parameters": {
            "detection_threshold": settings.DETECTION_THRESHOLD,
            "high_value_threshold": settings.HIGH_VALUE_THRESHOLD,
            "structuring_threshold": settings.STRUCTURING_THRESHOLD,
            "structuring_lower_bound": settings.STRUCTURING_LOWER_BOUND,
            "rapid_movement_window_hours": settings.RAPID_MOVEMENT_WINDOW_HOURS,
            "fan_out_in_threshold": settings.FAN_OUT_IN_DEGREE_THRESHOLD,
            "temporal_proximity_window_hours": 72
        },
        "indicators": items
    }


@router.post("/run")
def trigger_detection_run(db: Session = Depends(get_db)):
    """Executes the full NetworkX graph builder and rule evaluator across all accounts."""
    service = DetectionService(db)
    results = service.run_detection_pipeline()
    flagged = [r for r in results if r.case_created or (r.risk_score >= settings.DETECTION_THRESHOLD)]

    return {
        "message": f"Detection executed across {len(results)} accounts.",
        "accounts_evaluated": len(results),
        "suspicious_cases_flagged": len(flagged),
        "threshold": settings.DETECTION_THRESHOLD
    }
