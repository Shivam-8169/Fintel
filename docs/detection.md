# Detection Engine & Risk Scoring Methodology

Fintel combines transparent, explainable rule-based triggers with NetworkX graph topology analysis to compute a bounded composite risk score (0 to 100).

---

## 1. Controlled Typology Rules

| Typology Name | Mechanism | Evidence Captured | Score Weight |
| :--- | :--- | :--- | :--- |
| `high_value_transfers` | Single transaction amount >= threshold ($50,000) | Originating TX ID, amount, timestamp | 15 - 35 pts |
| `rapid_fund_movement` | Inflow followed by >= 70% outflow within 24 hours | Inflow TX ID, Outflow TX ID, time delta | 20 - 30 pts |
| `structuring_smurfing` | 3+ transactions between $8,000 and $9,999 within 72h | Structured TX IDs | 15 - 30 pts |
| `many_to_one_aggregation` | In-degree counterparties >= 4 funneling funds | Source account IDs, cumulative volume | 12 - 25 pts |
| `one_to_many_dispersion` | Out-degree counterparties >= 4 dispersing funds | Destination account IDs, total volume | 12 - 25 pts |
| `high_velocity_burst` | 5+ transactions clustered within a 12-hour window | Clustered TX IDs, interval length | 20 pts |
| `circular_chain_movement` | Closed transaction cycle (e.g. `A -> B -> C -> A`) | Cycle nodes path | 35 pts |

---

## 2. Composite Risk Scoring Formula

```
Composite Score = min(100.0, sum(Indicator Scores) * Baseline KYC Factor)
```

- Baseline KYC Factor:
  - Low Risk: 1.0x
  - Medium Risk: 1.05x
  - High Risk: 1.15x

Risk Classifications:
- `0 - 39`: **LOW**
- `40 - 59`: **MEDIUM**
- `60 - 79`: **HIGH** (Case Created)
- `80 - 100`: **CRITICAL** (Priority Triage)
