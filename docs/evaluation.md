# Fintel Benchmark Evaluation Results

## 1. Detection Performance Benchmark
Evaluated against synthetic ground truth labels across 129 accounts and 638 transactions.

```bash
python scripts/evaluate_detection.py
```

### Empirical Results:
- **Accounts Evaluated**: 129
- **Ground Truth Suspicious**: 9
- **System Flagged Cases**: 13
- **True Positives (TP)**: 9 (100% detection of ground truth scenarios)
- **False Positives (FP)**: 4
- **False Negatives (FN)**: 0
- **True Negatives (TN)**: 116
- **Precision**: **69.23%**
- **Recall**: **100.00%**
- **F1 Score**: **0.8182**
- **Evidence Citation Coverage**: **100.0%**

> [!NOTE]
> Following calibrated multi-metric and temporal graph analysis, Fintel achieves 100% recall across all 7 distinct AML typologies with zero false negatives and 100% evidence citation coverage.

---

## 2. Manual vs AI-Assisted Workflow Efficiency
Evaluated across 5 benchmark cases comparing industry manual compliance review times against Fintel's autonomous multi-agent pipeline.

```bash
python scripts/evaluate_workflow.py
```

### Empirical Results:
- **Manual Compliance Baseline per Case**: 80.0 minutes
  - Case Triage & Transaction Sifting: 25.0 min
  - Graph / Counterparty Correlation: 20.0 min
  - SAR Narrative Drafting & Section Assembly: 35.0 min
- **Autonomous Agent Runtime**: **0.04 seconds**
- **Assisted Review (Agent Draft + Human Sign-off)**: ~8.1 minutes
- **Average Time Saved**: **90.0%**
