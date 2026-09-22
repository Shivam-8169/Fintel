# Fintel Synthetic Data Dictionary

This document defines the schema, field descriptions, constraints, and typologies contained within the Fintel synthetic AML/CFT datasets.

> [!IMPORTANT]
> All records are purely synthetic and generated algorithmically for academic research and educational demonstration. No real customer PII or commercial banking data is used.

---

## 1. Customers (`customers.csv`)

| Field Name | Type | Description | Allowed Values / Constraints |
| :--- | :--- | :--- | :--- |
| `customer_id` | String (PK) | Unique synthetic customer identifier | Format: `CUST-NORM-XXX` or `CUST-SUSP-XX` |
| `name` | String | Synthetic full personal or business name | e.g. "Rajesh Kumar", "Apex Bullion Ltd" |
| `country` | String (ISO-3) | Origin or residence jurisdiction | `IND`, `UAE`, `SGP`, `GBR`, `USA`, `HKG`, `MUS` |
| `occupation` | String | Customer stated economic vocation | e.g. "Merchant Exporter", "Consultant", "Student" |
| `risk_level` | String | Initial KYC baseline risk rating | `LOW`, `MEDIUM`, `HIGH` |

---

## 2. Accounts (`accounts.csv`)

| Field Name | Type | Description | Allowed Values / Constraints |
| :--- | :--- | :--- | :--- |
| `account_id` | String (PK) | Unique synthetic bank account identifier | Format: `ACC-NORM-XXX` or `ACC-SUSP-XXXXX` |
| `customer_id` | String (FK) | Reference to owning customer | References `customers.customer_id` |
| `account_type` | String | Banking account classification | `SAVINGS`, `CURRENT`, `BUSINESS` |
| `created_at` | DateTime | Synthetic account origination timestamp | Format: `YYYY-MM-DD HH:MM:SS` |

---

## 3. Transactions (`transactions.csv`)

| Field Name | Type | Description | Allowed Values / Constraints |
| :--- | :--- | :--- | :--- |
| `transaction_id` | String (PK) | Unique synthetic transaction identifier | Format: `TX-XXXXX` |
| `sender_account` | String (FK) | Originating account ID | References `accounts.account_id` |
| `receiver_account` | String (FK) | Beneficiary account ID | References `accounts.account_id` |
| `amount` | Float | Transaction monetary volume (INR/USD equivalent) | Positive numeric, 2 decimal places |
| `timestamp` | DateTime | Execution timestamp of transaction | Format: `YYYY-MM-DD HH:MM:SS` |
| `transaction_type` | String | Rail or settlement mechanism | `WIRE_TRANSFER`, `NEFT`, `RTGS`, `UPI`, `ACH` |

---

## 4. Investigator Notes (`investigator_notes.csv`)

| Field Name | Type | Description | Allowed Values / Constraints |
| :--- | :--- | :--- | :--- |
| `note_id` | String (PK) | Unique note identifier | Format: `NOTE-XXXX` |
| `case_id` | String | Assigned case reference or placeholder | Format: `CASE-AUTO-XXX` |
| `target_account` | String | Subject account of investigation | References `accounts.account_id` |
| `note_text` | Text | Human investigator qualitative observations | Free-text observations |
| `created_at` | DateTime | Timestamp note was logged | Format: `YYYY-MM-DD HH:MM:SS` |

---

## 5. Controlled Suspicious Typologies (Ground Truth)

The generator implants 7 benchmark AML typologies:

1. **Rapid Fund Movement (Pass-Through)**: Account receives large sum and routes >95% out within a narrow time window (<3 hours).
2. **High-Value Outliers**: Significant single transaction amounts exceeding institutional risk threshold ($50,000+).
3. **Structuring / Smurfing**: Successive incoming payments calibrated just beneath regulatory thresholds ($8,000–$9,900) to evade CTR triggers.
4. **Many-to-One Mule Aggregation**: Multiple distinct entities funneling small-to-medium transfers into a central collector account, followed by consolidated exit.
5. **One-to-Many Dispersion / Layering**: Single high deposit immediately split into numerous outbound transfers to disperse funds.
6. **High Velocity Bursts**: Abnormal burst frequency of transactions (>8 transfers within a 2-hour window).
7. **Circular Layering Chain**: Closed loop of funds across intermediary shell accounts (`A -> B -> C -> A`) to conceal audit trail.
