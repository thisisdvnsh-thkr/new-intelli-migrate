# Intelli-Migrate: Technical Documentation

> Complete technical documentation for the AI-Powered Data Migration SaaS Platform

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Agent Swarm Design](#2-agent-swarm-design)
3. [Agent 1: Parser Engine](#3-agent-1-parser-engine)
4. [Agent 2: NLP Schema Mapper](#4-agent-2-nlp-schema-mapper)
5. [Agent 3: Anomaly Detector](#5-agent-3-anomaly-detector)
6. [Agent 4: Normalizer](#6-agent-4-normalizer)
7. [Agent 5: SQL Generator](#7-agent-5-sql-generator)
8. [API Reference](#8-api-reference)
9. [Data Flow](#9-data-flow)
10. [Deployment Guide](#10-deployment-guide)

---

## 1. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │   Web Dashboard  │  │   REST Client    │  │   CLI Tool    │  │
│  │   (HTML/JS)      │  │   (Postman/curl) │  │   (Future)    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘  │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            │                     │                    │
            └──────────┬──────────┴────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    FastAPI Application                      │ │
│  │  • CORS Middleware    • Session Management                  │ │
│  │  • File Upload        • Error Handling                      │ │
│  │  • Request Routing    • Response Serialization              │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      AGENT ORCHESTRATION LAYER                   │
│                                                                  │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────────┐
│  │ Agent 1 │──▶│ Agent 2 │──▶│ Agent 3 │──▶│ Agent 4 │──▶│ Agent 5│
│  │ Parser  │   │ NLP Map │   │ Anomaly │   │ Normal. │   │ SQL Gen│
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └────────┘
│                                                                  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      DATA & STORAGE LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Temp Files   │  │   SQLite     │  │     Supabase         │   │
│  │ (Uploads)    │  │   (Local)    │  │   (PostgreSQL)       │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | HTML5, Tailwind CSS, JavaScript | User Interface |
| API | FastAPI (Python 3.10+) | REST API, Async Processing |
| NLP | sentence-transformers (all-MiniLM-L6-v2) | Semantic Embeddings |
| ML | scikit-learn (IsolationForest) | Anomaly Detection |
| Database | SQLite / PostgreSQL (Render or Supabase) | Data Storage |

---

## 2. Agent Swarm Design

### Agent Communication Pattern

The agents follow a **sequential pipeline pattern** where each agent:
1. Receives input from the previous agent (or user for Agent 1)
2. Processes the data using its specialized capabilities
3. Produces output for the next agent
4. Reports status to the orchestrator

```
User Input ──▶ [Agent 1] ──▶ [Agent 2] ──▶ [Agent 3] ──▶ [Agent 4] ──▶ [Agent 5] ──▶ Output
                  │            │            │            │            │
                  ▼            ▼            ▼            ▼            ▼
              ParseResult  MappingResult  AnomalyReport  NormResult  SQLScript
```

### Session Management

Each migration creates a session with:
- **session_id**: UUID for tracking
- **current_step**: Pipeline progress (1-6)
- **steps_completed**: List of completed steps
- **data**: Accumulated results from each agent

---

## 3. Agent 1: Parser Engine

### Purpose
Parse raw data files (JSON, XML, CSV) and detect schema with drift handling.

### Capabilities
- Auto-detect file format from extension and content
- Parse nested JSON structures (up to 10 levels)
- Handle XML with namespaces and attributes
- Detect CSV delimiters automatically
- Flatten nested structures for relational mapping
- Detect schema drift across records

### Key Classes

```python
@dataclass
class SchemaField:
    name: str
    data_type: str  # INTEGER, FLOAT, VARCHAR(n), TEXT, DATE, etc.
    nullable: bool
    sample_values: List[Any]
    nested_schema: Optional[Dict]

@dataclass
class ParseResult:
    success: bool
    records: List[Dict]
    schema: Dict[str, SchemaField]
    file_type: str
    record_count: int
    errors: List[str]
    schema_drift_detected: bool
    drift_details: List[str]
```

### Algorithm: Type Inference

```
1. For each field value:
   a. Check Python type (bool, int, float)
   b. Try parsing as integer
   c. Try parsing as float
   d. Match against date patterns (ISO, US, EU)
   e. Match against email pattern
   f. Check for JSON array/object
   g. Default to VARCHAR(n) based on length

2. Handle type conflicts:
   - INTEGER + FLOAT → FLOAT
   - Different VARCHAR sizes → larger size
   - Incompatible types → TEXT
```

---

## 4. Agent 2: NLP Schema Mapper

### Purpose
Map messy, inconsistent column names to standardized SQL column names using semantic similarity.

### Capabilities
- Exact match against known patterns
- Abbreviation expansion (e.g., "cust_nm" → "customer_name")
- Semantic similarity using sentence embeddings
- Domain-aware naming (e-commerce, healthcare, etc.)
- Confidence scoring for each mapping

### NLP Model

**Model**: `all-MiniLM-L6-v2`
- Size: ~80MB
- Embedding dimension: 384
- Speed: ~14,000 sentences/second

### Mapping Algorithm

```
1. EXACT MATCH (confidence: 1.0)
   - Compare normalized name against known variants
   - Example: "cust_id" matches ["custid", "c_id", "customerid"]

2. PATTERN MATCH (confidence: 0.95)
   - Expand abbreviations using dictionary
   - Example: "cust_nm" → "customer_name"

3. SEMANTIC MATCH (confidence: variable)
   - Convert field name to readable text
   - Generate embedding using sentence-transformers
   - Calculate cosine similarity with standard columns
   - Accept if similarity >= 0.85

4. FALLBACK (confidence: 0.5)
   - Clean and standardize the original name
   - Convert camelCase to snake_case
   - Remove special characters
```

### Standard Column Dictionary

```python
STANDARD_COLUMNS = {
    'customer_id': ['cust_id', 'custid', 'c_id', ...],
    'customer_name': ['cust_nm', 'cust_name', ...],
    'email': ['email_address', 'e_mail', 'mail', ...],
    'phone': ['phone_number', 'tel', 'mobile', ...],
    'order_id': ['orderid', 'order_num', ...],
    # ... 30+ standard columns
}
```

---

## 5. Agent 3: Anomaly Detector

### Purpose
Identify data quality issues, outliers, and business rule violations.

### Detection Methods

#### 5.1 Rule-Based Detection
- **Null/Missing Values**: Fields that are None or empty
- **Pattern Violations**: Invalid emails, phones, dates
- **Type Inconsistencies**: String where number expected
- **Duplicate Records**: Exact matches across all fields

#### 5.2 ML-Based Detection (IsolationForest)
- Detects statistical outliers in numeric fields
- Contamination rate: 10% (configurable)
- Uses ensemble of 100 trees

### Anomaly Severity Levels

| Severity | Action | Examples |
|----------|--------|----------|
| **Critical** | Remove record | Invalid email, negative price |
| **Warning** | Flag for review | Missing optional field |
| **Info** | Log only | Empty string |

### Quality Score Calculation

```
Quality Score = (1 - weighted_anomaly_rate) × 100

Where:
  weighted_anomaly_rate = Σ(severity_weight × count) / max_possible_weight
  
Weights:
  - Critical: 3
  - Warning: 1
  - Info: 0.5
```

---

## 6. Agent 4: Normalizer

### Purpose
Transform flat data into Third Normal Form (3NF) with proper relational structure.

### Normalization Process

#### Step 1: Entity Detection
Analyze column names to identify entity groupings:

```python
ENTITY_PATTERNS = {
    'customer': ['customer', 'cust', 'client', 'buyer'],
    'product': ['product', 'prod', 'item', 'sku'],
    'order': ['order', 'ord', 'purchase', 'transaction'],
    'address': ['address', 'addr', 'street', 'city', 'state'],
    ...
}
```

#### Step 2: Table Creation
For each detected entity:
1. Create new table with entity name
2. Add auto-increment primary key
3. Add foreign key to parent table
4. Move relevant columns to new table

#### Step 3: Relationship Establishment
- One-to-Many: Orders → Order Items
- Many-to-One: Products ← Orders

### ERD Generation (Mermaid Format)

```
erDiagram
    customers {
        INTEGER customer_id PK
        VARCHAR customer_name
        VARCHAR email
    }
    orders {
        INTEGER order_id PK
        INTEGER customer_id FK
        TIMESTAMP order_date
        DECIMAL total_amount
    }
    customers ||--o{ orders : has
```

---

## 7. Agent 5: SQL Generator

### Purpose
Generate DDL/DML SQL scripts and deploy to databases.

### Supported Dialects

| Dialect | CREATE TABLE | AUTO INCREMENT | BOOLEAN |
|---------|-------------|----------------|---------|
| PostgreSQL | Standard | SERIAL | BOOLEAN |
| MySQL | Standard | AUTO_INCREMENT | TINYINT(1) |
| SQLite | Standard | AUTOINCREMENT | INTEGER |

### Type Mapping

```python
TYPE_MAPPINGS = {
    'postgresql': {
        'INTEGER': 'INTEGER',
        'FLOAT': 'DOUBLE PRECISION',
        'BOOLEAN': 'BOOLEAN',
        'JSON': 'JSONB',
        ...
    },
    'mysql': {
        'INTEGER': 'INT',
        'FLOAT': 'DOUBLE',
        'BOOLEAN': 'TINYINT(1)',
        'JSON': 'JSON',
        ...
    }
}
```

### SQL Generation Features
- DROP TABLE IF EXISTS (with CASCADE for PostgreSQL)
- Primary key constraints
- Foreign key constraints with ON DELETE CASCADE
- Batch INSERT optimization (100 records per statement)
- Proper value escaping (SQL injection prevention)

---

## 8. API Reference

### Authentication
Currently no authentication (add JWT for production).

### Endpoints

#### POST /api/upload
Upload and parse a data file.

**Request:**
```
Content-Type: multipart/form-data
file: <binary file data>
```

**Response:**
```json
{
    "session_id": "uuid",
    "status": "success",
    "step": 1,
    "data": {
        "file_name": "data.json",
        "file_type": "json",
        "record_count": 100,
        "columns": ["col1", "col2"],
        "schema": {...}
    }
}
```

#### POST /api/map-schema/{session_id}
Map columns using NLP.

**Query Parameters:**
- `domain`: ecommerce | healthcare | finance | hr

**Response:**
```json
{
    "session_id": "uuid",
    "data": {
        "table_name": "customer_orders",
        "average_confidence": 91.5,
        "mappings": [
            {"from": "cust_nm", "to": "customer_name", "confidence": 95.0}
        ]
    }
}
```

#### POST /api/detect-anomalies/{session_id}
Run anomaly detection.

**Response:**
```json
{
    "data": {
        "quality_score": 87.5,
        "total_records": 100,
        "clean_records": 92,
        "removed_records": 8,
        "top_issues": [...]
    }
}
```

#### POST /api/normalize/{session_id}
Normalize to 3NF.

**Response:**
```json
{
    "data": {
        "normalization_level": "3NF",
        "total_tables": 3,
        "tables": [...],
        "erd_diagram": "erDiagram..."
    }
}
```

#### POST /api/generate-sql/{session_id}
Generate SQL script.

**Query Parameters:**
- `dialect`: postgresql | mysql | sqlite

**Response:**
```json
{
    "data": {
        "dialect": "postgresql",
        "table_count": 3,
        "record_count": 92,
        "preview": "CREATE TABLE..."
    }
}
```

#### GET /api/download-sql/{session_id}
Download SQL file.

**Response:** File download (`application/sql`)

---

## 9. Data Flow

### Complete Pipeline Flow

```
┌──────────────┐
│  Raw File    │
│  (JSON/XML)  │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────┐
│  AGENT 1: Parser Engine              │
│  • Detect format                     │
│  • Parse content                     │
│  • Flatten nested structures         │
│  • Infer data types                  │
│  • Detect schema drift               │
└──────────────┬───────────────────────┘
               │ ParseResult
               ▼
┌──────────────────────────────────────┐
│  AGENT 2: NLP Schema Mapper          │
│  • Normalize column names            │
│  • Match against standards           │
│  • Calculate semantic similarity     │
│  • Apply mappings to records         │
└──────────────┬───────────────────────┘
               │ SchemaMappingResult
               ▼
┌──────────────────────────────────────┐
│  AGENT 3: Anomaly Detector           │
│  • Validate patterns (email, phone)  │
│  • Check type consistency            │
│  • Run IsolationForest               │
│  • Calculate quality score           │
│  • Filter anomalous records          │
└──────────────┬───────────────────────┘
               │ AnomalyReport
               ▼
┌──────────────────────────────────────┐
│  AGENT 4: Normalizer                 │
│  • Detect entity groupings           │
│  • Create normalized tables          │
│  • Establish foreign keys            │
│  • Generate ERD diagram              │
└──────────────┬───────────────────────┘
               │ NormalizationResult
               ▼
┌──────────────────────────────────────┐
│  AGENT 5: SQL Generator              │
│  • Map types to dialect              │
│  • Generate CREATE TABLE             │
│  • Generate INSERT statements        │
│  • Deploy to database (optional)     │
└──────────────┬───────────────────────┘
               │ SQLScript
               ▼
┌──────────────────────────────────────┐
│  OUTPUT                              │
│  • SQL file download                 │
│  • Deployed database                 │
│  • Migration report                  │
└──────────────────────────────────────┘
```

---

## 10. Deployment Guide

### Local Development

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
python -m http.server 3000
```

### Production Deployment

#### Option 1: Docker

```dockerfile
# Dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY backend/ .
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t intelli-migrate .
docker run -p 8000:8000 intelli-migrate
```

#### Option 2: Cloud Platforms

**Render.com:**
1. Push code to GitHub
2. Connect repo to Render
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Railway:**
1. Connect GitHub repo
2. Auto-detects Python
3. Add `PORT` environment variable

### Environment Variables

```env
# Required for cloud Postgres deployment (Render or Supabase)
DATABASE_URL=postgres://user:password@host:port/dbname
# SUPABASE_KEY (if using Supabase): your_supabase_key_here

# Optional configuration
NLP_MODEL=all-MiniLM-L6-v2
CONFIDENCE_THRESHOLD=0.85
CONTAMINATION_RATE=0.1
```

---

## Appendix A: Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Parse error | Check file format |
| 404 | Session not found | Start new upload |
| 500 | Internal error | Check server logs |

---

## Appendix B: Performance Benchmarks

| Dataset Size | Parse | Map | Detect | Normalize | Generate |
|--------------|-------|-----|--------|-----------|----------|
| 100 records | 0.1s | 0.3s | 0.2s | 0.1s | 0.1s |
| 1,000 records | 0.3s | 0.5s | 0.8s | 0.3s | 0.4s |
| 10,000 records | 2.1s | 1.2s | 3.5s | 1.8s | 2.3s |
| 100,000 records | 18s | 8s | 25s | 12s | 15s |

---

**Document Version:** 1.0.0  
**Last Updated:** April 2026  
**Authors:** Team Intelli-Migrate
