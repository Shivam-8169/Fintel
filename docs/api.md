# Fintel REST API Documentation

The Fintel backend exposes a REST API powered by FastAPI. Interactive OpenAPI/Swagger documentation is accessible at `http://localhost:8000/docs`.

---

## 1. Authentication
- `POST /api/auth/login`: Authenticate with email/password; returns JWT bearer token.
- `GET /api/auth/me`: Retrieve current investigator profile.

## 2. Data Ingestion
- `POST /api/data/upload`: Multipart CSV upload (supports `customers`, `accounts`, `transactions`).
- `GET /api/data/status`: Current count of loaded entities.

## 3. Case Management
- `GET /api/cases`: Filterable case list (`risk_level`, `status`, `search`, `min_score`).
- `GET /api/cases/{case_id}`: Comprehensive case detail with indicators, evidence, and notes.
- `POST /api/cases/{case_id}/notes`: Add qualitative investigator note.
- `PUT /api/cases/{case_id}/status`: Update case lifecycle status.

## 4. Transaction Graph
- `GET /api/graph/case/{case_id}`: k-hop subgraph around case entity formatted for React Flow.
- `GET /api/graph/account/{account_id}`: k-hop subgraph around any account ID.
- `GET /api/graph/account/{account_id}/features`: Topological features (in/out degree, flow, counterparties).

## 5. Investigation Agent
- `POST /api/cases/{case_id}/investigate`: Run autonomous evidence-grounded investigation.
- `GET /api/cases/{case_id}/investigation`: Retrieve existing investigation findings.

## 6. SAR Reports & Human Review
- `POST /api/cases/{case_id}/generate-report`: Synthesize 9-section SAR draft.
- `GET /api/cases/{case_id}/report`: Retrieve SAR draft report.
- `PUT /api/cases/{case_id}/report`: Save investigator edits to draft report.
- `POST /api/cases/{case_id}/approve`: Mandatory explicit human approval.
- `POST /api/cases/{case_id}/reject`: Explicit human rejection / return of report.

## 7. Audit Trail & Dashboard
- `GET /api/cases/{case_id}/audit`: Chronological event trail for a specific case.
- `GET /api/audit`: System-wide forensic event log.
- `GET /api/dashboard/summary`: High-level metrics and KPI counters.
- `GET /api/health`: Health status of API, database, and services.
