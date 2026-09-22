"""
Explainable Composite Risk Scoring and Threshold Evaluation for Fintel.
Calculates bounded 0-100 score with indicator attributions.
"""

from typing import List, Dict, Any, Tuple
from app.schemas.detection import IndicatorResult, DetectionAnalysisResponse, EvidenceItemSchema
from app.config.settings import settings


class RiskScorer:
    """Calculates explainable risk scores and levels from evaluated indicators."""

    @staticmethod
    def calculate_composite_score(indicators: List[IndicatorResult], base_risk_level: str = "LOW") -> Tuple[float, str]:
        """
        Combines indicator scores using an additive model with diminishing returns,
        adjusting slightly for baseline customer KYC risk.
        Bapped strictly between 0 and 100.
        """
        if not indicators:
            return 5.0 if base_risk_level == "LOW" else 15.0, "LOW"

        raw_sum = sum(ind.score for ind in indicators)

        # Baseline KYC bump
        kyc_factor = 1.0
        if base_risk_level == "HIGH":
            kyc_factor = 1.15
        elif base_risk_level == "MEDIUM":
            kyc_factor = 1.05

        composite = raw_sum * kyc_factor
        # Soft cap to 100
        final_score = min(100.0, max(0.0, composite))
        final_score = round(final_score, 1)

        if final_score >= 80.0:
            level = "CRITICAL"
        elif final_score >= 60.0:
            level = "HIGH"
        elif final_score >= 40.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        return final_score, level
