# Fintel Database Design & Schema

Fintel utilizes SQLAlchemy ORM with SQLite for development and PostgreSQL compatibility for production.

```mermaid
erDiagram
    USERS {
        int id PK
        string name
        string email
        string password_hash
        string role
        datetime created_at
    }

    CUSTOMERS {
        string customer_id PK
        string name
        string country
        string occupation
        string risk_level
    }

    ACCOUNTS {
        string account_id PK
        string customer_id FK
        string account_type
        datetime created_at
    }

    TRANSACTIONS {
        string transaction_id PK
        string sender_account FK
        string receiver_account FK
        float amount
        datetime timestamp
        string transaction_type
    }

    CASES {
        string case_id PK
        string account_id FK
        float risk_score
        string risk_level
        string status
        datetime created_at
        datetime updated_at
    }

    DETECTION_RESULTS {
        string detection_id PK
        string case_id FK
        string indicator_name
        float score
        text explanation
    }

    EVIDENCE {
        string evidence_id PK
        string case_id FK
        string evidence_type
        string source_id
        text description
    }

    INVESTIGATIONS {
        string investigation_id PK
        string case_id FK
        text summary
        text suspicious_patterns
        text reasoning
        text uncertainty
        datetime created_at
    }

    REPORTS {
        string report_id PK
        string case_id FK
        text report_content
        string status
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOGS {
        int id PK
        string case_id FK
        string actor_type
        string actor_id
        string action
        text details
        datetime timestamp
    }

    CUSTOMERS ||--o{ ACCOUNTS : owns
    ACCOUNTS ||--o{ TRANSACTIONS : initiates
    ACCOUNTS ||--o{ CASES : flags
    CASES ||--o{ DETECTION_RESULTS : contains
    CASES ||--o{ EVIDENCE : links
    CASES ||--o{ INVESTIGATIONS : has
    CASES ||--o{ REPORTS : compiles
    CASES ||--o{ AUDIT_LOGS : tracks
```

## Schema Entities

1. **`users`**: Platform compliance officers and system administrators.
2. **`customers`**: Synthetic KYC profiles with jurisdictions and occupation metadata.
3. **`accounts`**: Transaction accounts mapped to owning customers.
4. **`transactions`**: Directed financial movements with amounts, timestamps, and payment rails.
5. **`cases`**: Triggered investigations when account composite risk score exceeds the threshold (>= 60).
6. **`detection_results`**: Additive score contributions and explanations for flagged indicators.
7. **`evidence`**: Granular evidence entries mapping findings to specific transactions or graph metrics.
8. **`investigations`**: Structured AI findings, reasoning chains, and uncertainties.
9. **`reports`**: Structured SAR-style drafts with 9 sections.
10. **`audit_logs`**: Immutable chronological record of system and user events.
