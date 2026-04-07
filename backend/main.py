"""
Intelli-Migrate: AI-Powered Data Migration SaaS
Main FastAPI Application - Orchestrates all 5 AI Agents
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import uuid
from datetime import datetime
import shutil

# Import AI Agents
from agents.parser_engine import ParserEngine, ParseResult
from agents.nlp_mapper import NLPMapper, SchemaMappingResult
from agents.anomaly_detector import AnomalyDetector, AnomalyReport
from agents.normalizer import Normalizer, NormalizationResult
from agents.sql_generator import SQLGenerator, SQLScript


# ============================================
# FastAPI Application
# ============================================

app = FastAPI(
    title="Intelli-Migrate API",
    description="AI-Powered Data Migration with 5 Intelligent Agents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration - Allow all origins for SaaS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Must be False when using "*" origins
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Cache preflight for 24 hours
)

# ============================================
# Initialize AI Agents
# ============================================

parser_engine = ParserEngine()
nlp_mapper = NLPMapper(confidence_threshold=0.85)
anomaly_detector = AnomalyDetector(contamination=0.1)
normalizer = Normalizer()
sql_generator = SQLGenerator(dialect='postgresql')

# Session storage (use Redis/DB in production)
sessions: Dict[str, Dict] = {}

# Temp directory for uploads
TEMP_DIR = os.path.join(os.path.dirname(__file__), '..', 'temp')
os.makedirs(TEMP_DIR, exist_ok=True)


# ============================================
# Pydantic Models
# ============================================

class SessionStatus(BaseModel):
    session_id: str
    status: str
    current_step: int
    steps_completed: List[str]
    created_at: str


class MappingOverride(BaseModel):
    original_name: str
    new_name: str


class DeployConfig(BaseModel):
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    db_password: Optional[str] = None
    use_sqlite: bool = False
    sqlite_path: Optional[str] = None


# ============================================
# API Endpoints
# ============================================

@app.get("/")
async def root():
    """Root endpoint with API info"""
    return {
        "name": "Intelli-Migrate API",
        "version": "1.0.0",
        "agents": [
            "Parser Engine (JSON/XML/CSV)",
            "NLP Schema Mapper",
            "Anomaly Detector",
            "3NF Normalizer",
            "SQL Generator"
        ],
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agents": {
            "parser": "ready",
            "nlp_mapper": "ready" if nlp_mapper.model is not None else "fallback_mode",
            "anomaly_detector": "ready" if anomaly_detector.isolation_forest is not None else "rule_based_only",
            "normalizer": "ready",
            "sql_generator": "ready"
        }
    }


@app.get("/api/agents/status")
async def agents_status():
    """Get detailed status of all agents"""
    return {
        "agents": [
            {
                "name": "Parser Engine",
                "id": "parser",
                "status": "active",
                "capabilities": ["JSON", "XML", "CSV", "Schema Detection", "Drift Handling"]
            },
            {
                "name": "NLP Schema Mapper",
                "id": "nlp_mapper",
                "status": "active" if nlp_mapper.model is not None else "limited",
                "model": "all-MiniLM-L6-v2" if nlp_mapper.model is not None else "pattern-matching",
                "confidence_threshold": nlp_mapper.confidence_threshold
            },
            {
                "name": "Anomaly Detector",
                "id": "anomaly_detector",
                "status": "active" if anomaly_detector.isolation_forest is not None else "limited",
                "ml_enabled": anomaly_detector.isolation_forest is not None
            },
            {
                "name": "Normalizer",
                "id": "normalizer",
                "status": "active",
                "target_form": "3NF"
            },
            {
                "name": "SQL Generator",
                "id": "sql_generator",
                "status": "active",
                "dialect": sql_generator.dialect
            }
        ]
    }


# ============================================
# Step 1: File Upload & Parsing
# ============================================

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """
    Step 1: Upload and parse data file
    Supported formats: JSON, XML, CSV
    """
    # Generate session ID
    session_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_path = os.path.join(TEMP_DIR, f"{session_id}_{file.filename}")
    
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Parse file using Agent 1
        result = parser_engine.parse(file_path)
        
        if not result.success:
            raise HTTPException(status_code=400, detail=f"Parse error: {result.errors}")
        
        # Store session data
        sessions[session_id] = {
            "created_at": datetime.now().isoformat(),
            "file_path": file_path,
            "file_name": file.filename,
            "file_type": result.file_type,
            "current_step": 1,
            "steps_completed": ["upload"],
            "parse_result": {
                "record_count": result.record_count,
                "schema": parser_engine.get_schema_summary(result.schema),
                "drift_detected": result.schema_drift_detected,
                "drift_details": result.drift_details
            },
            "records": result.records,
            "schema": {name: {"data_type": field.data_type, "nullable": field.nullable} 
                      for name, field in result.schema.items()}
        }
        
        return {
            "session_id": session_id,
            "status": "success",
            "step": 1,
            "step_name": "File Parsing",
            "data": {
                "file_name": file.filename,
                "file_type": result.file_type,
                "record_count": result.record_count,
                "columns": list(result.schema.keys()),
                "schema": parser_engine.get_schema_summary(result.schema),
                "schema_drift": result.schema_drift_detected,
                "drift_details": result.drift_details[:5] if result.drift_details else []
            }
        }
    
    except Exception as e:
        # Clean up on error
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# Step 2: NLP Schema Mapping
# ============================================

@app.post("/api/map-schema/{session_id}")
async def map_schema(session_id: str, domain: str = "ecommerce"):
    """
    Step 2: Map source columns to standardized names using NLP
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    # Get source columns
    source_columns = list(session["schema"].keys())
    
    # Run NLP Mapper (Agent 2)
    mapping_result = nlp_mapper.map_schema(source_columns, domain)
    
    # Update session
    session["current_step"] = 2
    session["steps_completed"].append("schema_mapping")
    session["mapping_result"] = nlp_mapper.get_mapping_report(mapping_result)
    session["table_name"] = mapping_result.table_name
    
    # Apply mappings to records
    session["mapped_records"] = nlp_mapper.apply_mappings(
        session["records"], 
        mapping_result.mappings
    )
    
    return {
        "session_id": session_id,
        "status": "success",
        "step": 2,
        "step_name": "Schema Mapping",
        "data": session["mapping_result"]
    }


# ============================================
# Step 3: Anomaly Detection
# ============================================

@app.post("/api/detect-anomalies/{session_id}")
async def detect_anomalies(session_id: str):
    """
    Step 3: Detect data quality issues and anomalies
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    records = session.get("mapped_records", session["records"])
    
    # Run Anomaly Detector (Agent 3)
    report = anomaly_detector.detect_anomalies(records, session.get("schema"))
    
    # Update session
    session["current_step"] = 3
    session["steps_completed"].append("anomaly_detection")
    session["anomaly_report"] = anomaly_detector.get_anomaly_summary(report)
    session["cleaned_records"] = report.cleaned_records
    
    return {
        "session_id": session_id,
        "status": "success",
        "step": 3,
        "step_name": "Anomaly Detection",
        "data": session["anomaly_report"]
    }


# ============================================
# Step 4: Normalization
# ============================================

@app.post("/api/normalize/{session_id}")
async def normalize_data(session_id: str):
    """
    Step 4: Normalize data to 3NF
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    records = session.get("cleaned_records", session.get("mapped_records", session["records"]))
    table_name = session.get("table_name", "data")
    
    # Run Normalizer (Agent 4)
    result = normalizer.normalize(records, table_name)
    
    # Update session
    session["current_step"] = 4
    session["steps_completed"].append("normalization")
    session["normalization_result"] = normalizer.get_normalization_summary(result)
    session["normalized_tables"] = [
        {
            "name": t.name,
            "columns": [{"name": c.name, "data_type": c.data_type, "primary_key": c.primary_key,
                        "foreign_key": c.foreign_key, "nullable": c.nullable} for c in t.columns],
            "primary_key": t.primary_key,
            "foreign_keys": t.foreign_keys,
            "records": t.records
        }
        for t in result.tables
    ]
    session["relationships"] = result.relationships
    session["erd_diagram"] = result.erd_diagram
    
    return {
        "session_id": session_id,
        "status": "success",
        "step": 4,
        "step_name": "Normalization",
        "data": {
            **session["normalization_result"],
            "erd_diagram": result.erd_diagram
        }
    }


# ============================================
# Step 5: SQL Generation
# ============================================

@app.post("/api/generate-sql/{session_id}")
async def generate_sql(session_id: str, dialect: str = "postgresql"):
    """
    Step 5: Generate SQL DDL/DML scripts
    """
    import traceback
    
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if "normalized_tables" not in session:
        raise HTTPException(status_code=400, detail="Run normalization first")
    
    try:
        # Update SQL generator dialect
        sql_generator.dialect = dialect
        
        # Generate SQL (Agent 5)
        script = sql_generator.generate_sql(
            session["normalized_tables"],
            session.get("relationships", [])
        )
        
        # Save SQL to file
        sql_path = os.path.join(TEMP_DIR, f"{session_id}_script.sql")
        with open(sql_path, 'w', encoding='utf-8') as f:
            f.write(script.full_script)
        
        # Update session
        session["current_step"] = 5
        session["steps_completed"].append("sql_generation")
        session["sql_script_path"] = sql_path
        session["sql_summary"] = sql_generator.get_sql_summary(script)
        
        return {
            "session_id": session_id,
            "status": "success",
            "step": 5,
            "step_name": "SQL Generation",
            "data": {
                **session["sql_summary"],
                "preview": script.full_script[:2000] + "..." if len(script.full_script) > 2000 else script.full_script
            }
        }
    except Exception as e:
        print(f"SQL Generation Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download-sql/{session_id}")
async def download_sql(session_id: str):
    """Download generated SQL script"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if "sql_script_path" not in session:
        raise HTTPException(status_code=400, detail="Generate SQL first")
    
    return FileResponse(
        session["sql_script_path"],
        media_type="application/sql",
        filename=f"intelli_migrate_{session_id[:8]}.sql"
    )


# ============================================
# Step 6: Deployment
# ============================================

@app.post("/api/deploy/{session_id}")
async def deploy_database(session_id: str, config: DeployConfig):
    """
    Step 6: Deploy to database (Supabase or SQLite)
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if "sql_script_path" not in session:
        raise HTTPException(status_code=400, detail="Generate SQL first")
    
    # Read SQL script
    with open(session["sql_script_path"], 'r') as f:
        sql_content = f.read()
    
    script = SQLScript(
        ddl="",  # We'll use full_script
        dml="",
        full_script=sql_content,
        dialect=sql_generator.dialect,
        table_count=session["sql_summary"]["table_count"],
        record_count=session["sql_summary"]["record_count"]
    )
    
    if config.use_sqlite:
        # Deploy to SQLite
        db_path = config.sqlite_path or os.path.join(TEMP_DIR, f"{session_id}.db")
        result = sql_generator.deploy_to_sqlite(script, db_path)
    elif config.supabase_url and config.supabase_key:
        # Deploy to Supabase
        result = sql_generator.deploy_to_supabase(
            script, config.supabase_url, config.supabase_key, config.db_password
        )
    else:
        raise HTTPException(
            status_code=400, 
            detail="Provide Supabase credentials or enable SQLite"
        )
    
    # Update session
    session["current_step"] = 6
    session["steps_completed"].append("deployment")
    session["deployment_result"] = {
        "success": result.success,
        "message": result.message,
        "tables_created": result.tables_created,
        "records_inserted": result.records_inserted,
        "errors": result.errors
    }
    
    return {
        "session_id": session_id,
        "status": "success" if result.success else "error",
        "step": 6,
        "step_name": "Deployment",
        "data": session["deployment_result"]
    }


# ============================================
# Session Management
# ============================================

@app.get("/api/session/{session_id}")
async def get_session(session_id: str):
    """Get session status and data"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    return {
        "session_id": session_id,
        "created_at": session["created_at"],
        "file_name": session.get("file_name"),
        "current_step": session["current_step"],
        "steps_completed": session["steps_completed"],
        "record_count": session.get("parse_result", {}).get("record_count", 0),
        "results": {
            "parsing": session.get("parse_result"),
            "mapping": session.get("mapping_result"),
            "anomalies": session.get("anomaly_report"),
            "normalization": session.get("normalization_result"),
            "sql": session.get("sql_summary"),
            "deployment": session.get("deployment_result")
        }
    }


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete session and cleanup files"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    # Cleanup files
    for path_key in ["file_path", "sql_script_path"]:
        if path_key in session and os.path.exists(session[path_key]):
            os.remove(session[path_key])
    
    # Check for SQLite DB
    db_path = os.path.join(TEMP_DIR, f"{session_id}.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    
    del sessions[session_id]
    
    return {"status": "deleted", "session_id": session_id}


# ============================================
# Full Pipeline (One-Shot)
# ============================================

@app.post("/api/migrate")
async def full_migration(
    file: UploadFile = File(...),
    domain: str = "ecommerce",
    dialect: str = "postgresql",
    deploy_sqlite: bool = False
):
    """
    Run complete migration pipeline in one request
    """
    # Step 1: Upload
    session_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{session_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    try:
        # Parse
        parse_result = parser_engine.parse(file_path)
        if not parse_result.success:
            raise HTTPException(status_code=400, detail=parse_result.errors)
        
        # Step 2: Map Schema
        columns = list(parse_result.schema.keys())
        mapping_result = nlp_mapper.map_schema(columns, domain)
        mapped_records = nlp_mapper.apply_mappings(parse_result.records, mapping_result.mappings)
        
        # Step 3: Detect Anomalies
        anomaly_report = anomaly_detector.detect_anomalies(mapped_records)
        
        # Step 4: Normalize
        norm_result = normalizer.normalize(anomaly_report.cleaned_records, mapping_result.table_name)
        
        # Step 5: Generate SQL
        sql_generator.dialect = dialect
        tables_data = [
            {
                "name": t.name,
                "columns": [{"name": c.name, "data_type": c.data_type, "primary_key": c.primary_key,
                            "foreign_key": c.foreign_key, "nullable": c.nullable} for c in t.columns],
                "primary_key": t.primary_key,
                "foreign_keys": t.foreign_keys,
                "records": t.records
            }
            for t in norm_result.tables
        ]
        script = sql_generator.generate_sql(tables_data, norm_result.relationships)
        
        # Save SQL
        sql_path = os.path.join(TEMP_DIR, f"{session_id}_script.sql")
        with open(sql_path, 'w') as f:
            f.write(script.full_script)
        
        # Step 6: Deploy (optional)
        deployment_result = None
        if deploy_sqlite:
            db_path = os.path.join(TEMP_DIR, f"{session_id}.db")
            deployment_result = sql_generator.deploy_to_sqlite(script, db_path)
        
        return {
            "session_id": session_id,
            "status": "success",
            "pipeline_complete": True,
            "results": {
                "parsing": {
                    "record_count": parse_result.record_count,
                    "file_type": parse_result.file_type,
                    "columns": columns
                },
                "mapping": nlp_mapper.get_mapping_report(mapping_result),
                "anomalies": anomaly_detector.get_anomaly_summary(anomaly_report),
                "normalization": normalizer.get_normalization_summary(norm_result),
                "sql": sql_generator.get_sql_summary(script),
                "deployment": {
                    "success": deployment_result.success if deployment_result else None,
                    "message": deployment_result.message if deployment_result else "Not deployed"
                } if deployment_result else None
            },
            "download_sql": f"/api/download-sql/{session_id}"
        }
    
    finally:
        # Cleanup uploaded file
        if os.path.exists(file_path):
            os.remove(file_path)


# ============================================
# Run Server
# ============================================

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("🚀 Intelli-Migrate API Server")
    print("="*50)
    print("📍 API Docs: http://localhost:8000/docs")
    print("📍 Health Check: http://localhost:8000/api/health")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# Reload trigger