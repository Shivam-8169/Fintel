# Fintel System Architecture

## 1. Overview
Fintel is an explainable multi-agent system designed for autonomous financial crime investigation, transaction graph reasoning, and SAR drafting. It implements a five-stage pipeline that bridges raw synthetic banking data with human-in-the-loop review.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          REACT FRONTEND (Vite + TS)                         │
│  - Dashboard KPIs           - Interactive React Flow Graph                  │
│  - Filterable Case Ledger   - Evidence Catalog & Audit Timeline             │
│  - Interactive SAR Editor   - Mandatory Human Approval Gate                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON / JWT Auth)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI MODULAR BACKEND                             │
│  - Auth Router (/api/auth)              - Case Management (/api/cases)     │
│  - Ingestion Router (/api/data)         - Graph Engine (/api/graph)         │
│  - Investigation Router                 - SAR Reporting (/api/reports)      │
└──────────────┬───────────────────────┬───────────────────────┬──────────────┘
               │                       │                       │
               ▼                       ▼                       ▼
    ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
    │ Data Ingestion Svc  │ │ Detection Engine    │ │ Case & Audit Svc    │
    │ CSV validation,     │ │ Additive scoring    │ │ SQLAlchemy ORM      │
    │ normalization, type │ │ Rules + Anomaly     │ │ SQLite / Postgres   │
    │ integrity checks    │ │ Network metrics     │ │ Chronological audit │
    └──────────┬──────────┘ └──────────┬──────────┘ └─────────────────────┘
               │                       │
               └───────────┬───────────┘
                           ▼
              ┌─────────────────────────┐
              │ NetworkX Graph Engine   │
              │ Account = Node          │
              │ Transaction = MultiEdge │
              │ Ego-network extraction  │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │ Investigation Agent     │
              │ Context-window packing  │
              │ LLM / Deterministic Demo│
              │ Evidence citations      │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │ Reporting Agent         │
              │ 9 Standard SAR Sections │
              │ Watermark: "DRAFT —     │
              │ REQUIRES HUMAN REVIEW"  │
              └────────────┬────────────┘
                           ▼
              ┌─────────────────────────┐
              │ Human Review Dashboard  │
              │ Approve / Reject / Edit │
              └─────────────────────────┘
```

## 2. Multi-Agent Pipeline

### A. Data Ingestion Agent
- Validates columns, dates, amounts, and deduplicates records.
- Provides row-level error isolation so that invalid records do not halt ingestion.

### B. Detection & Scoring Agent
- Evaluates 7 distinct AML typologies (high value, rapid fund movement, structuring, fan-in, fan-out, velocity bursts, circular chains).
- Maps each trigger directly to persistent `Evidence` records.
- Calculates an explainable composite risk score (0-100).

### C. Investigation Agent
- Gathers relevant evidence items, customer KYC details, and topological graph features.
- Employs strict evidence grounding: no hallucinations, mandatory evidence IDs citations, explicit separation of observation vs interpretation vs uncertainty.
- Falls back to a deterministic demo engine when no LLM API key is present.

### D. Reporting Agent
- Assembles structured SAR-style drafts with 9 standardized sections.
- Watermarked with `DRAFT — REQUIRES HUMAN REVIEW`.

### E. Human-in-the-Loop Review
- Provides explicit human approval and rejection actions.
- Automatically records every investigator action in the immutable audit trail.
