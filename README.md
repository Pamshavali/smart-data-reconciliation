# Smart Data Reconciliation & Validation System

An enterprise-grade, full-stack automated data reconciliation, validation, exception management, and executive auditing platform built with **Python FastAPI**, **React.js**, **SQL Database (PostgreSQL / SQLite)**, **Pandas**, and **Chart.js**.

---

## 📌 Executive Summary

Modern enterprise financial systems, ERPs, and operational ledgers frequently face data drift, timing differences, split entries, missing records, and non-standard identifiers. 

The **Smart Data Reconciliation & Validation System** solves this by implementing an automated **8-Point Validation & Cross-System Reconciliation Engine** that reconciles authoritative transactional records (**System A**) against operational ledger entries (**System B**) mapped to master organizational locations (**locations.csv**).

---

## 🏗️ Architecture & Technology Stack

```
   ┌────────────────────────────────────────────────────────────┐
   │                  React.js + Tailwind CSS                   │
   │      (Interactive Dashboard, Charts, Review Workspace)      │
   └─────────────────────────────┬──────────────────────────────┘
                                 │ REST API (JSON / FormData)
                                 ▼
   ┌────────────────────────────────────────────────────────────┐
   │                   Python FastAPI Backend                   │
   │  ┌───────────────────┐               ┌──────────────────┐  │
   │  │ Cleaning Service  │               │ Reconcile Engine │  │
   │  │ - REC-* Standard  │               │ - 8 Audit Rules  │  │
   │  │ - Num Sanitizer   │               │ - Tolerance Pct  │  │
   │  └─────────┬─────────┘               └────────┬─────────┘  │
   └────────────┼──────────────────────────────────┼────────────┘
                ▼                                  ▼
   ┌────────────────────────────────────────────────────────────┐
   │                Relational Database (SQL)                   │
   │   (PostgreSQL / SQLite with SQLAlchemy ORM & Audit Trail)  │
   └────────────────────────────────────────────────────────────┘
```

### **Frontend**
- **React.js 18** (SPA architecture)
- **Tailwind CSS 3.4** (Enterprise slate/blue theme, responsive layout)
- **Lucide Icons** (Consistent iconography)
- **Chart.js & React-Chartjs-2** (Interactive data visualization)
- **Vite 6** (Blazing fast build system & development server)

### **Backend**
- **Python 3.11**
- **FastAPI** (High-performance asynchronous REST API)
- **SQLAlchemy 2.0** (Relational ORM supporting SQLite and PostgreSQL)
- **Pandas 2.2** (CSV ingestion, high-speed dataset profiling & cleaning)
- **OpenPyXL** (Multi-sheet executive Excel reporting)
- **Pydantic v2** (Strict data schema validation)
- **PBKDF2-HMAC-SHA256** (Salted enterprise security & token sessions)

### **Database Design**
Relational SQL schema featuring primary keys, foreign keys, status indexing, and audit history:
- `users`: User authentication, roles (`admin`, `analyst`), salted password hashes.
- `organizations`: Enterprise entities (`ORG-A`, `ORG-B`).
- `locations`: Location master directory (`LOC-101`, `LOC-102`, `LOC-103`, `LOC-201`, `LOC-202`).
- `system_a_records`: Authoritative source records with raw and normalized identifiers.
- `system_b_records`: Target ledger entries with raw strings and cleaned numeric values.
- `reconciliation_runs`: Track run executions, completion percentage, financial totals.
- `reconciliation_results`: Granular record-level comparison results.
- `exceptions`: Rule breaches, severity rating, suggested actions, reviewer comments.
- `audit_logs`: Full audit trail of uploads, runs, and sign-offs.

---

## 📊 Source Datasets Analysis

The system was developed and validated against three real-world production datasets:

### 1. `locations.csv`
- Master reference table containing **5 locations** spanning **2 organizations**:
  - `ORG-A`: `LOC-101`, `LOC-102`, `LOC-103`
  - `ORG-B`: `LOC-201`, `LOC-202`

### 2. `system_a.csv` (120 Records)
- Fields: `record_id`, `location_id`, `event_date`, `category_code`, `actor_id`, `base_value`, `adjustment`, `total_value`, `state`.
- **Discrepancies identified**:
  - **Data Quality Anomaly**: Row 49 (`REC-1050`) has `actor_id` as NULL/NaN.
  - **Transaction State Anomaly**: Row 18 (`REC-1019`) has `state = VOIDED` ($57,092.35).
  - **Orphaned Records**: `REC-1015` and `REC-1061` exist in System A but are missing in System B.

### 3. `system_b.csv` (121 Entries)
- Fields: `entry_id`, `record_ref`, `location_id`, `recorded_on`, `value`, `label`.
- **Discrepancies identified**:
  - **Malformed Identifiers**:
    - `rec1034` &rarr; Casing and missing hyphen (Row 32)
    - `' REC - 1070 '` &rarr; Whitespace padding and space around hyphen (Row 67)
    - `1112` &rarr; Pure numeric string missing `REC-` prefix (Row 109)
  - **Numeric & Formatted Strings**:
    - `'1,25,400.00'` &rarr; Indian comma formatted string (Row 61).
    - `NaN / NULL` &rarr; Missing value for `REC-1050` (Row 48).
  - **Duplicate & Multipart Split Entries**:
    - `REC-1042`: Duplicated ledger entry (`ENT/2026/4042` and `ENT/2026/4902`, each $112,837.06).
    - `REC-1055`: Split transaction across `ENT/2026/4055` ($71,950.93) and `ENT/2026/4903` ($107,926.39 labeled "Entry part 2 of 2"). Their sum matches System A's total ($179,877.32).
  - **Location Conflict**:
    - `REC-1077`: System A recorded `LOC-102` (`ORG-A`), but System B booked to `LOC-201` (`ORG-B`).
  - **Date Variance**:
    - `REC-1009`: System A date is `2026-03-31`, System B date is `2026-04-02` (2 days timing variance).
  - **Amount Variances (Missing Adjustments)**:
    - `REC-1003`: System B recorded only base value ($94,834.38), omitting adjustment ($26,553.63).
    - `REC-1027`: System B recorded base value ($61,921.12), omitting adjustment ($17,337.91).
    - `REC-1088`: System B recorded base value ($108,553.36), omitting adjustment ($30,394.94).
  - **Orphaned Ledger Entry**:
    - `REC-1999` (`ENT/2026/4901`, $41,250.00) exists in System B but is completely absent from System A.

---

## ⚙️ Reconciliation Rules Engine

The system strictly executes the **8 Core Reconciliation Rules**:

| Rule | Name | Description & Treatment |
|---|---|---|
| **Rule 1** | **Record Matching** | Matches System A `record_id` with System B `record_ref`. Preserves original raw strings and standardizes safely to `REC-XXXX`. |
| **Rule 2** | **Amount Validation** | Compares `total_value` (A) with `value` (B). Discrepancy flagged if `abs(A - B) > 0.01`. Identifies omitted adjustments and currency formatting. |
| **Rule 3** | **Location Validation** | Validates locations against `locations.csv`. Flags cross-location discrepancies (e.g., `REC-1077`). |
| **Rule 4** | **Date Validation** | Compares `event_date` (A) with `recorded_on` (B). Calculates exact timing variance in days. |
| **Rule 5** | **Missing Records** | Segregates into: 1) Present in A but missing from B, 2) Present in B but missing from A. |
| **Rule 6** | **Duplicate Detection** | Flags multi-entry postings (e.g., `REC-1042`) and multipart split entries (e.g., `REC-1055`). |
| **Rule 7** | **Data Quality** | Identifies null `actor_id`, null values, and malformed identifier patterns. |
| **Rule 8** | **Transaction State** | **Explicit VOIDED Handling**: Record `REC-1019` is flagged and isolated so voided revenue is not counted as verified. |

---

## 📈 System Metrics & Verified Results

When running against the 3 supplied datasets:
- **Total System A Records**: `120`
- **Total System B Records**: `121`
- **Matched Records**: `107`
- **Mismatched Records**: `13`
- **Missing Records**: `3` (2 missing in B, 1 missing in A)
- **Duplicate Records**: `2`
- **Data Quality Issues**: `7`
- **Voided Transactions**: `1` (`REC-1019`)
- **Clean Match Completion Rate**: `89.17%`
- **System A Total Financial Value**: `$12,796,258.82`
- **System B Total Financial Value**: `$12,789,849.00`

---

## 🖥️ Application Modules & Pages

1. **Login Page (`/login`)**
   - Professional login interface with secure salted password verification.
   - One-click demo login buttons for **Admin** (`admin / admin123`) and **Analyst** (`analyst / analyst123`).

2. **Dashboard (`/dashboard`)**
   - 8 dynamic summary metric cards.
   - Real-time monetary exposure strip ($A Value, $B Value, Net Difference).
   - 6 Interactive Charts (Doughnut, Bar, Grouped Bar, Line).
   - "Run Reconciliation" trigger button with instant UI updates.
   - Recent activity & audit trail feed.

3. **File Upload (`/upload`)**
   - Drag & drop / file picker for `locations.csv`, `system_a.csv`, `system_b.csv`.
   - Structural validation of headers and row counts.
   - **One-Click Ingest Sample Datasets** button to immediately load bundled datasets.
   - Detailed cleaning & normalization explanations.

4. **Data Preview (`/preview`)**
   - Tab switcher for System A, System B, and Locations.
   - Search across IDs, categories, actors, and labels.
   - Location, state, and data quality filters.
   - Side-by-side display of original raw strings vs cleaned values.
   - Server-side pagination.

5. **Reconciliation Workspace (`/reconciliation`)**
   - Detailed comparison grid displaying matching status, amount differences, date variances, location conflicts, and diagnosis.
   - Filter by status (`MATCHED`, `AMOUNT_MISMATCH`, `DATE_MISMATCH`, `LOCATION_MISMATCH`, `MISSING_IN_B`, `MISSING_IN_A`, `VOIDED_TRANSACTION`, `QUALITY_ISSUE`).
   - Deep inspection modal for examining full attribute comparisons for any record.

6. **Exception Management (`/exceptions`)**
   - Comprehensive exception queue with severity levels (`HIGH`, `MEDIUM`, `LOW`).
   - Interactive review modal to **Approve**, **Reject**, or **Resolve** exceptions.
   - Auditor comment attribution and permanent audit log updates.

7. **Reports & Export (`/reports`)**
   - Executive reconciliation summary certificate.
   - **One-click Download CSV report**.
   - **One-click Download multi-tab Excel (.xlsx) report** (Executive Summary, Details, Exceptions, Location Breakdown).
   - Print-optimized view for auditing sign-offs.

---

## 🚀 Installation & Local Execution

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** & **npm**

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/smart-data-reconciliation.git
cd smart-data-reconciliation
```

### 2. Backend Setup & Execution
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- The backend will start on: **`http://127.0.0.1:8000`**
- Interactive Swagger API Documentation: **`http://127.0.0.1:8000/docs`**
- Alternative Redoc API Documentation: **`http://127.0.0.1:8000/redoc`**

### 3. Frontend Setup & Execution
Open a second terminal window:
```bash
cd frontend

# Install npm packages
npm install

# Start the Vite development server
npm run dev
```
- The frontend will open at: **`http://localhost:5173`**
- All API calls are automatically proxied to `http://127.0.0.1:8000`.

### 4. Single-Command Production Serving (Optional)
FastAPI is pre-configured to serve the compiled React SPA:
```bash
cd frontend
npm run build
cd ..
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```
Open **`http://127.0.0.1:8000`** in your browser to access the complete application!

---

## 🧪 Testing Instructions

The project includes unit test suites covering data cleaning, normalization, reconciliation rules, and API endpoints:

```bash
# Run all unit tests
python -m unittest backend.tests.test_reconciliation
python -m unittest backend.tests.test_api

# Run entire test suite together
python -m unittest discover -s backend/tests
```

**Verified Test Cases:**
- Standard and malformed identifier normalization (`REC-1001`, `rec1034`, ` REC - 1070 `, `1112`).
- Comma-formatted numeric sanitization (`1,25,400.00`).
- Null and NaN handling.
- Full reconciliation pipeline matching against actual CSV files.
- Completion percentage calculation.
- Authentication, dashboard endpoints, exception reviews, and report generation.

---

## 🗄️ Relational Database Setup

By default, the application runs on **SQLite** (`reconciliation.db`) for zero-configuration local execution.

To switch to **PostgreSQL** in production:
1. Set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql://username:password@localhost:5432/reconciliation_db"
   ```
2. Install `psycopg2-binary`:
   ```bash
   pip install psycopg2-binary
   ```
3. Run the application; SQLAlchemy will automatically provision the tables on PostgreSQL.

---

## 🌐 API Reference (FastAPI)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user & return token |
| `GET` | `/api/auth/me` | Current session information |
| `GET` | `/api/dashboard/summary` | Live summary cards metrics |
| `GET` | `/api/dashboard/charts` | Chart.js visualization data |
| `GET` | `/api/dashboard/recent-activity` | Audit log trail |
| `POST` | `/api/upload/locations` | Upload and clean locations.csv |
| `POST` | `/api/upload/system-a` | Upload and clean system_a.csv |
| `POST` | `/api/upload/system-b` | Upload and clean system_b.csv |
| `POST` | `/api/upload/load-sample-datasets`| One-click ingest bundled datasets |
| `GET` | `/api/records/system-a` | Paginated System A records with search/filter |
| `GET` | `/api/records/system-b` | Paginated System B records with search/filter |
| `GET` | `/api/records/locations` | Master locations directory |
| `POST` | `/api/reconciliation/run` | Execute 8-rule reconciliation pipeline |
| `GET` | `/api/reconciliation/results` | Filterable reconciliation comparison results |
| `GET` | `/api/reconciliation/runs` | Past reconciliation run history |
| `GET` | `/api/exceptions` | Filterable exceptions list |
| `POST` | `/api/exceptions/{id}/review` | Auditor sign-off (Approve / Reject / Resolve) |
| `GET` | `/api/reports/export/csv` | Download reconciliation results CSV |
| `GET` | `/api/reports/export/excel` | Download multi-sheet executive Excel workbook |

---

## 📦 Project Structure

```
smart-data-reconciliation/
│
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application & startup event
│   │   ├── database.py                 # SQLAlchemy engine, session, & SQLite/PostgreSQL config
│   │   ├── models/                     # Relational database models
│   │   │   ├── __init__.py
│   │   │   ├── user.py                 # Users & roles
│   │   │   ├── organization.py         # Organizations
│   │   │   ├── location.py             # Locations
│   │   │   ├── record.py               # System A & System B tables
│   │   │   ├── reconciliation.py       # Runs, Results, & Exceptions
│   │   │   └── audit.py                # Audit trail
│   │   ├── schemas/                    # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── record.py
│   │   │   ├── reconciliation.py
│   │   │   ├── exception.py
│   │   │   └── report.py
│   │   ├── routes/                     # REST API route controllers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── upload.py
│   │   │   ├── records.py
│   │   │   ├── reconciliation.py
│   │   │   ├── exceptions.py
│   │   │   ├── dashboard.py
│   │   │   └── reports.py
│   │   ├── services/                   # Business logic services
│   │   │   ├── __init__.py
│   │   │   ├── cleaner.py              # Ingestion cleaning & identifier normalizer
│   │   │   ├── reconciler.py           # 8-point reconciliation engine
│   │   │   ├── reporter.py             # Multi-sheet Excel & CSV exports
│   │   │   └── audit_service.py        # Audit logging service
│   │   └── utils/                      # Utilities & validators
│   │       ├── __init__.py
│   │       ├── security.py             # Salted hashing & token auth
│   │       └── validators.py           # Regex & data parser functions
│   ├── tests/
│   │   ├── test_reconciliation.py      # Core reconciliation unit tests
│   │   └── test_api.py                 # API endpoints test suite
│   └── requirements.txt                # Python backend dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/                 # Reusable enterprise UI components
│   │   │   ├── Navbar.jsx              # Navigation header & user status
│   │   │   ├── Sidebar.jsx             # Left sidebar with dynamic badges
│   │   │   ├── StatCard.jsx            # KPI metric card
│   │   │   ├── StatusBadge.jsx         # Color-coded status pills
│   │   │   ├── Charts.jsx              # 6 Chart.js components
│   │   │   └── Modal.jsx               # Inspection & review dialog
│   │   ├── pages/                      # Application view pages
│   │   │   ├── LoginPage.jsx           # Authentication with demo switcher
│   │   │   ├── DashboardPage.jsx       # 8 cards, 6 charts, financial strip
│   │   │   ├── UploadPage.jsx          # Drag-and-drop & one-click loader
│   │   │   ├── DataPreviewPage.jsx     # Side-by-side raw vs cleaned data
│   │   │   ├── ReconciliationPage.jsx  # Discrepancy comparison grid
│   │   │   ├── ExceptionsPage.jsx      # Manual review & approval workflow
│   │   │   └── ReportsPage.jsx         # CSV & Excel downloads, certificate
│   │   ├── services/
│   │   │   └── api.js                  # Frontend API service layer
│   │   ├── App.jsx                     # Top-level state & routing
│   │   ├── main.jsx                    # React entry point
│   │   └── index.css                   # Tailwind CSS styling
│   ├── package.json                    # Frontend package dependencies
│   ├── vite.config.js                  # Vite configuration & API proxy
│   └── tailwind.config.js              # Tailwind styling configuration
│
├── data/
│   ├── locations.csv                   # Master locations dataset
│   ├── system_a.csv                    # Source transactions dataset
│   └── system_b.csv                    # Target ledger dataset
│
├── reconciliation.db                   # SQLite relational database
└── README.md                           # Documentation
```

---

## 🔒 Security & Data Reliability Highlights

- **Zero Data Loss**: Raw identifiers (`raw_record_id`, `raw_record_ref`, `raw_value`) are preserved alongside standardized fields.
- **Salted Password Hashing**: Passwords use PBKDF2-HMAC-SHA256 with cryptographically random salts.
- **Protection Against Duplicate Ingests**: Ingestion handles re-uploads idempotently.
- **Audit Logging**: Every upload, reconciliation run, and exception review is permanently timestamped with reviewer identity.
- **Transaction State Integrity**: Prevents voided transactions from silently counting toward reconciled balances.

---

## 📄 License
This project is licensed under the MIT License.

