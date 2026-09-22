"""
Detection Performance Evaluation Script for Fintel.
Calculates Precision, Recall, F1 Score, Confusion Matrix, and Evidence Citation Coverage
against synthetic ground truth labels.
Academic PBL Prototype - Produces genuine empirical benchmarks.
"""

import os
import sys
import json
from typing import Dict, Any

# Ensure workspace and backend paths
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import SessionLocal
from app.database.models import Account, Case, Evidence, DetectionResult
from scripts.generate_synthetic_data import OUTPUT_DIR


def evaluate_detection():
    print("=" * 65)
    print("      FINTEL AML DETECTION PERFORMANCE BENCHMARK")
    print("=" * 65)

    gt_path = os.path.join(OUTPUT_DIR, "ground_truth_labels.json")
    if not os.path.exists(gt_path):
        print(f"Ground truth file not found at {gt_path}. Run generate_synthetic_data.py first.")
        return

    with open(gt_path, "r", encoding="utf-8") as f:
        ground_truth: Dict[str, Any] = json.load(f)

    db = SessionLocal()
    try:
        all_accounts = [a.account_id for a in db.query(Account).all()]
        flagged_cases = db.query(Case).all()
        flagged_account_ids = {c.account_id for c in flagged_cases}

        true_positives = 0
        false_positives = 0
        false_negatives = 0
        true_negatives = 0

        tp_accounts = []
        fp_accounts = []
        fn_accounts = []

        for acc in all_accounts:
            is_gt_suspicious = acc in ground_truth
            is_detected_suspicious = acc in flagged_account_ids

            if is_gt_suspicious and is_detected_suspicious:
                true_positives += 1
                tp_accounts.append(acc)
            elif not is_gt_suspicious and is_detected_suspicious:
                false_positives += 1
                fp_accounts.append(acc)
            elif is_gt_suspicious and not is_detected_suspicious:
                false_negatives += 1
                fn_accounts.append(acc)
            else:
                true_negatives += 1

        precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) > 0 else 0.0
        recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

        # Calculate evidence citation coverage
        total_flagged_cases = len(flagged_cases)
        cases_with_evidence = sum(1 for c in flagged_cases if len(c.evidence) > 0)
        evidence_coverage = (cases_with_evidence / total_flagged_cases * 100.0) if total_flagged_cases > 0 else 0.0

        results = {
            "total_entities_analyzed": len(all_accounts),
            "ground_truth_suspicious_count": len(ground_truth),
            "system_flagged_cases": total_flagged_cases,
            "confusion_matrix": {
                "true_positives (TP)": true_positives,
                "false_positives (FP)": false_positives,
                "false_negatives (FN)": false_negatives,
                "true_negatives (TN)": true_negatives
            },
            "metrics": {
                "precision": round(precision, 4),
                "recall": round(recall, 4),
                "f1_score": round(f1, 4),
                "evidence_citation_coverage_pct": round(evidence_coverage, 2)
            },
            "detected_typologies": {
                acc: ground_truth[acc]["typology"]
                for acc in tp_accounts if acc in ground_truth
            }
        }

        print(f"Total Accounts Evaluated:       {results['total_entities_analyzed']}")
        print(f"Ground Truth Suspicious:        {results['ground_truth_suspicious_count']}")
        print(f"System Flagged Cases:           {results['system_flagged_cases']}")
        print("-" * 65)
        print("CONFUSION MATRIX:")
        print(f"  True Positives  (TP):         {true_positives}")
        print(f"  False Positives (FP):         {false_positives}")
        print(f"  False Negatives (FN):         {false_negatives}")
        print(f"  True Negatives  (TN):         {true_negatives}")
        print("-" * 65)
        print("ACCURACY & COVERAGE METRICS:")
        print(f"  Precision:                    {precision:.2%}")
        print(f"  Recall:                       {recall:.2%}")
        print(f"  F1 Score:                     {f1:.4f}")
        print(f"  Evidence Citation Coverage:   {evidence_coverage:.1f}%")
        print("=" * 65)

        # Save evaluation output
        eval_output_dir = os.path.join(os.path.dirname(OUTPUT_DIR), "evaluation")
        os.makedirs(eval_output_dir, exist_ok=True)
        out_file = os.path.join(eval_output_dir, "detection_metrics.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2)
        print(f"Metrics saved to: {out_file}")

    finally:
        db.close()


if __name__ == "__main__":
    evaluate_detection()
