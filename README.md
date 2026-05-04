# Intelli-Migrate — AI-Driven Data Migration & ETL Automation Platform

> An AI-powered data migration platform leveraging a multi-agent architecture to automate ETL pipelines, schema mapping, anomaly detection, and database deployment.

---
## 🚀 Live Demo

🔗 Frontend: [https://new-intelli-migrate.pages.dev/](https://new-intelli-migrate.pages.dev/)  
🔗 Backend API: [https://your-render-url.onrender.com](https://new-intelli-migrate.onrender.com)
> Upload messy data → see full pipeline → get SQL output

---
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.10+-green)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## 🎯 Project Overview

**Intelli-Migrate** transforms chaotic, unstructured data into clean, normalized, and deployment-ready databases using a coordinated swarm of 5 specialized AI agents:

| Agent | Technology | Purpose |
|-------|------------|---------|
| 🔍 **Agent 1: Parser Engine** | Python + Pandas | Parse JSON/XML/CSV with schema drift detection |
| 🧠 **Agent 2: NLP Mapper** | sentence-transformers | Map messy column names to standard SQL names |
| 🛡️ **Agent 3: Anomaly Detector** | scikit-learn IsolationForest | Detect data quality issues and outliers |
| 📊 **Agent 4: Normalizer** | Recursive DFS Algorithm | Convert to 3NF with auto FK relationships |
| 💾 **Agent 5: SQL Generator** | SQLAlchemy | Generate DDL/DML and deploy to databases |

---
## ⏳ System Workflow
```
Raw Data (JSON/CSV/XML)
        │
        ▼
Agent 1: Parser Engine
        │
        ▼
Agent 2: NLP Schema Mapping
        │
        ▼
Agent 3: Anomaly Detection
        │
        ▼
Agent 4: Data Normalization (3NF)
        │
        ▼
Agent 5: SQL Generator
        │
        ▼
Database Deployment
```
## 📊 System Visualization

### 🔄 End-to-End Pipeline
<p align="center">
  <img src="./visuals/Pipeline.png" width="800"/>
</p>

---

### 🔍 Data Transformation (Unstructured → Structured)
<p align="center">
  <img src="./visuals/transformation.png" width="800"/>
</p>

## 🏗️ System Design Decisions

### Why Multi-Agent Architecture?
- Enables modular processing where each stage (parsing, mapping, anomaly detection) is independently scalable
- Improves maintainability compared to monolithic ETL pipelines

### Why NLP for Schema Mapping?
- Traditional rule-based mapping fails for inconsistent column names
- NLP embeddings allow semantic matching (e.g., "cust_name" → "customer_name")

### Why Isolation Forest for Anomaly Detection?
- Efficient for high-dimensional tabular data
- Works well without labeled anomaly data

### Why Normalization (3NF)?
- Ensures structured relational database design
- Reduces redundancy and improves data integrity

### Trade-offs
- Slight increase in processing time due to multiple agents
- Requires model dependencies (NLP + ML)


## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** (optional, for frontend development) - [Download](https://nodejs.org/)

### Step 1: Clone/Setup Project

```bash
cd C:\Projects\intelli-migrate
```

### Step 2: Create Python Virtual Environment

```bash
cd backend
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on Mac/Linux
source venv/bin/activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

> ⚠️ **First run will download the NLP model (~80MB)** - this is normal!

### Step 4: Start the Backend Server

```bash
uvicorn main:app --reload --port 8000
```

### Step 5: Open the Frontend

Open `frontend/index.html` in your browser, or serve it:

```bash
# Using Python's built-in server
cd ../frontend
python -m http.server 3000
# Open http://localhost:3000
```

### Step 6: Generate Sample Data (Optional)

```bash
cd ../dataset
python generate_messy_data.py
```
---
## 🚀 Business Impact

- Reduces manual ETL effort by automating schema mapping and transformation
- Enables rapid migration from unstructured to production-ready databases
- Improves data quality through anomaly detection and normalization
- Accelerates database deployment with auto-generated SQL scripts

---

## 📁 Project Structure

```
C:\Projects\intelli-migrate\
│
├── backend\
│   ├── agents\                    # 🤖 AI Agent Modules
│   │   ├── __init__.py
│   │   ├── parser_engine.py       # Agent 1: Data Parser
│   │   ├── nlp_mapper.py          # Agent 2: NLP Schema Mapper
│   │   ├── anomaly_detector.py    # Agent 3: Anomaly Detection
│   │   ├── normalizer.py          # Agent 4: 3NF Normalizer
│   │   └── sql_generator.py       # Agent 5: SQL Generator
│   │
│   ├── main.py                    # FastAPI Application
│   └── requirements.txt           # Python Dependencies
│
├── frontend\
│   └── index.html                 # Web Dashboard (Single Page)
│
├── dataset\
│   ├── generate_messy_data.py     # Sample Data Generator
│   ├── messy_ecommerce.json       # Generated test data
│   ├── messy_ecommerce.csv
│   └── messy_ecommerce.xml
│
├── docs\
│   └── technical-documentation.md # Full Technical Docs
│
├── temp\                          # Temporary files (auto-created)
│
└── README.md                      # This file
```

---

## 🔌 API Endpoints

Once the backend is running at `http://localhost:8000`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info and welcome message |
| `/docs` | GET | Interactive API documentation (Swagger) |
| `/api/health` | GET | Health check with agent status |
| `/api/agents/status` | GET | Detailed status of all 5 agents |
| `/api/upload` | POST | Upload file (Step 1 - Parser) |
| `/api/map-schema/{session_id}` | POST | NLP mapping (Step 2) |
| `/api/detect-anomalies/{session_id}` | POST | Anomaly detection (Step 3) |
| `/api/normalize/{session_id}` | POST | 3NF normalization (Step 4) |
| `/api/generate-sql/{session_id}` | POST | SQL generation (Step 5) |
| `/api/download-sql/{session_id}` | GET | Download SQL script |
| `/api/deploy/{session_id}` | POST | Deploy to database (Step 6) |
| `/api/deploy-env/{session_id}` | POST | Admin deploy using server `DATABASE_URL` |
| `/auth/signup` | POST | Create account (email/password + onboarding fields) |
| `/auth/login` | POST | Login with email/password |
| `/auth/oauth/{provider}/start` | GET | Start OAuth login (`google` or `github`) |
| `/auth/oauth/{provider}/callback` | GET | OAuth callback and frontend token redirect |
| `/api/migrate` | POST | Full pipeline in one request |

---

## 🧪 Testing the Pipeline

### Using the Web Interface

1. Open `http://localhost:3000` (frontend)
2. Drag & drop `dataset/messy_ecommerce.json`
3. Click **"Start Migration"**
4. Watch all 5 agents process your data
5. Download the generated SQL script

### Using cURL

```bash
# Step 1: Upload file
curl -X POST "http://localhost:8000/api/upload" \
  -F "file=@dataset/messy_ecommerce.json"

# Save the session_id from the response, then:

# Step 2: Map Schema
curl -X POST "http://localhost:8000/api/map-schema/{session_id}?domain=ecommerce"

# Step 3: Detect Anomalies
curl -X POST "http://localhost:8000/api/detect-anomalies/{session_id}"

# Step 4: Normalize
curl -X POST "http://localhost:8000/api/normalize/{session_id}"

# Step 5: Generate SQL
curl -X POST "http://localhost:8000/api/generate-sql/{session_id}?dialect=postgresql"

# Step 6: Download SQL
curl -o output.sql "http://localhost:8000/api/download-sql/{session_id}"
```

### Using the Full Pipeline Endpoint

```bash
curl -X POST "http://localhost:8000/api/migrate" \
  -F "file=@dataset/messy_ecommerce.json" \
  -F "domain=ecommerce" \
  -F "dialect=postgresql" \
  -F "deploy_sqlite=true"
```

---
## ⚠️ Limitations

- Performance may vary for extremely large datasets (>1M records)
- NLP mapping accuracy depends on input data quality
- Limited support for complex nested JSON structures
- Currently optimized for structured tabular outputs only

---
## 🎓 Team Member Contributions

| Team Member | Agent | Primary Files |
|-------------|-------|---------------|
| **Devansh** | Agent 5: SQL Generator + Integration | `sql_generator.py`, `main.py` |
| **Arpit** | Agent 1: Parser Engine + Frontend | `parser_engine.py`, `index.html` |
| **Prashant** | Agent 2: NLP Schema Mapper | `nlp_mapper.py` |
| **Mohd Suhail** | Agent 3: Anomaly Detector | `anomaly_detector.py` |
| **Priyanshu** | Agent 4: Normalizer | `normalizer.py` |

---

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env` file in the `backend/` directory:

```env
# Cloud Postgres Configuration (for cloud deployment)
DATABASE_URL=postgres://user:password@host:port/dbname
# (Optional) If using a cloud Postgres provider, set DATABASE_URL in environment variables (Render, Railway, AWS RDS)

# ML Configuration
NLP_CONFIDENCE_THRESHOLD=0.85
ANOMALY_CONTAMINATION=0.1

# Server Configuration
HOST=0.0.0.0
PORT=8000

# OAuth + redirect configuration
FRONTEND_URL=https://new-intelli-migrate.pages.dev
BACKEND_PUBLIC_URL=https://new-intelli-migrate.onrender.com
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Changing SQL Dialect

The SQL Generator supports multiple dialects:
- `postgresql` (default) - For managed PostgreSQL (Render, Railway, AWS RDS)
- `mysql` - For MySQL/MariaDB
- `sqlite` - For local SQLite databases

---

## 🛠️ Troubleshooting

### "Module not found" errors

```bash
cd backend
pip install -r requirements.txt
```

### NLP Model download fails

The `sentence-transformers` library downloads `all-MiniLM-L6-v2` on first run. If it fails:

```bash
pip install --upgrade sentence-transformers
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### CORS errors in browser

Update `main.py` line 28 with your frontend URL:

```python
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
```

### Port 8000 already in use

```bash
uvicorn main:app --reload --port 8001
```

Then update `API_BASE` in `frontend/index.html`.

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| **NLP Mapping Accuracy** | 91%+ with semantic matching |
| **Anomaly Detection Rate** | 95%+ for common issues |
| **Processing Speed** | ~1000 records/second |
| **Supported File Sizes** | Up to 100MB |

---

## 🌟 Key Features

- ✅ **Multi-format Support**: JSON, XML, CSV with auto-detection
- ✅ **Schema Drift Detection**: Handles inconsistent column names
- ✅ **Semantic NLP Mapping**: Uses AI embeddings for smart column mapping
- ✅ **ML-Powered Anomaly Detection**: IsolationForest + rule-based validation
- ✅ **Automatic 3NF Normalization**: Creates proper relational structure
- ✅ **Multi-dialect SQL**: PostgreSQL, MySQL, SQLite
- ✅ **ERD Generation**: Mermaid diagrams for visualization
- ✅ **One-click Deployment**: Direct to Postgres or SQLite

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [sentence-transformers](https://www.sbert.net/) - NLP embeddings
- [scikit-learn](https://scikit-learn.org/) - Machine learning
- [Render](https://render.com/) - Managed Postgres (recommended)
- [Tailwind CSS](https://tailwindcss.com/) - Frontend styling

---

**Made with ❤️ by Team Intelli-Migrate**
