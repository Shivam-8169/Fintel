"""
Statistical Anomaly Detection Utilities for Transaction Metrics.
"""

from typing import List, Dict, Any
import numpy as np


class AnomalyDetector:
    """Calculates statistical baseline distributions and z-score outliers."""

    @staticmethod
    def calculate_volume_outliers(amounts: List[float], z_threshold: float = 2.5) -> List[float]:
        """Flags transactions whose volume deviates significantly from account mean."""
        if len(amounts) < 4:
            return []
        arr = np.array(amounts)
        mean = np.mean(arr)
        std = np.std(arr)
        if std == 0:
            return []
        z_scores = np.abs((arr - mean) / std)
        outliers = arr[z_scores > z_threshold].tolist()
        return [round(x, 2) for x in outliers]
