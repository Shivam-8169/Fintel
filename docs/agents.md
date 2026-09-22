# Multi-Agent Architecture

Fintel organizes autonomous workflows into specialized, decoupled agents:

---

## 1. Data Ingestion Agent
- **File**: `backend/app/agents/ingestion_agent.py`
- **Role**: Validates schema compliance, normalizes currencies and timestamps, identifies duplicates, and flags referential mismatches.
- **Resilience**: Catches row-level parsing errors without crashing the pipeline, returning structured statistical diagnostics.

---

## 2. Detection & Scoring Agent
- **File**: `backend/app/detection/rules.py` & `backend/app/detection/scoring.py`
- **Role**: Combines statistical outliers and directed graph indicators. Generates verified `Evidence` records and persists new `Case` entities.

---

## 3. Investigation Agent
- **File**: `backend/app/agents/investigation_agent.py`
- **Role**: Contextualizes flagged entities using local k-hop subgraphs and evidence records.
- **Operational Modes**:
  1. **Live LLM Mode**: Calls OpenAI/Gemini compatible API using evidence-grounded prompt templates.
  2. **Deterministic Demo Mode**: Active out-of-the-box when `LLM_API_KEY` is omitted. Generates robust, deterministic evidence-grounded findings.
- **Guardrails**:
  - Hallucination prevention: Cross-references generated evidence IDs against database evidence records.
  - Separation of observed facts vs analytical interpretation vs uncertainties.

---

## 4. Reporting Agent
- **File**: `backend/app/agents/reporting_agent.py`
- **Role**: Transforms investigative findings into an institutional SAR-style report with 9 standard sections.
- **Watermark**: Enforces `DRAFT — REQUIRES HUMAN REVIEW` across every generated draft.

---

## 5. Human-in-the-Loop Review
- **Role**: Retains sole authoritative power to approve, reject, or edit SAR reports.
- **Audit Logging**: Every action taken by human or agent writes an immutable audit record.
