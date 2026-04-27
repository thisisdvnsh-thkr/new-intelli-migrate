"""
Intelli-Migrate: AI-Powered Data Migration SaaS
Main FastAPI Application - Orchestrates all 5 AI Agents
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Depends, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import uuid
from datetime import datetime, timedelta
import shutil

# Database and auth
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

import logging, traceback
from urllib.parse import urlparse

# Logger for deployment and admin actions
logger = logging.getLogger('intelli_migrate')
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(ch)
logger.setLevel(logging.INFO)

# Optional external ML worker (set ML_WORKER_URL to enable)
import requests
from urllib.parse import urljoin

ML_WORKER_URL = os.getenv('ML_WORKER_URL') or os.getenv('ML_WORKER') or os.getenv('ML_WORKER_BASE_URL')


def ml_worker_available(timeout: int = 3) -> bool:
    """Check if an external ML worker is reachable"""
    if not ML_WORKER_URL:
        return False
    try:
        r = requests.get(ML_WORKER_URL.rstrip('/') + '/health', timeout=timeout)
        return r.status_code == 200
    except Exception as e:
        print(f"ML worker health check failed: {e}")
        return False


def call_ml_worker(path: str, payload: dict, timeout: int = 60):
    """Call external ML worker and return parsed JSON (or None on error)"""
    if not ML_WORKER_URL:
        return None
    url = ML_WORKER_URL.rstrip('/') + '/' + path.lstrip('/')
    try:
        r = requests.post(url, json=payload, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"ML worker call failed {url}: {e}")
        return None


# Import AI Agents (optional — guarded to speed up smoke tests)
try:
    from agents.parser_engine import ParserEngine, ParseResult
    from agents.nlp_mapper import NLPMapper, SchemaMappingResult
    from agents.anomaly_detector import AnomalyDetector, AnomalyReport
    from agents.normalizer import Normalizer, NormalizationResult
    from agents.sql_generator import SQLGenerator, SQLScript
except Exception as e:
    ParserEngine = None
    ParseResult = None
    NLPMapper = None
    SchemaMappingResult = None
    AnomalyDetector = None
    AnomalyReport = None
    Normalizer = None
    NormalizationResult = None
    SQLGenerator = None
    SQLScript = None
    print(f"Warning: agents not available: {e}")

# Import models
from models import Base, User, Settings


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
# Initialize AI Agents (if available)
# ============================================

# Lazy-initialize heavy agents to avoid slow startup or blocking during deployment
parser_engine = None
nlp_mapper = None
anomaly_detector = None
normalizer = None
sql_generator = None

# Getter factories that instantiate agents on first use
def get_parser_engine():
    global parser_engine
    if parser_engine is None and ParserEngine:
        try:
            parser_engine = ParserEngine()
        except Exception as e:
            print(f"ParserEngine init failed: {e}")
            parser_engine = None
    return parser_engine

def get_nlp_mapper():
    global nlp_mapper
    if nlp_mapper is None and NLPMapper:
        try:
            nlp_mapper = NLPMapper(confidence_threshold=0.85)
        except Exception as e:
            print(f"NLPMapper init failed: {e}")
            nlp_mapper = None
    return nlp_mapper

def get_anomaly_detector():
    global anomaly_detector
    if anomaly_detector is None and AnomalyDetector:
        try:
            anomaly_detector = AnomalyDetector(contamination=0.1)
        except Exception as e:
            print(f"AnomalyDetector init failed: {e}")
            anomaly_detector = None
    return anomaly_detector

def get_normalizer():
    global normalizer
    if normalizer is None and Normalizer:
        try:
            normalizer = Normalizer()
        except Exception as e:
            print(f"Normalizer init failed: {e}")
            normalizer = None
    return normalizer

def get_sql_generator():
    global sql_generator
    if sql_generator is None and SQLGenerator:
        try:
            sql_generator = SQLGenerator(dialect='postgresql')
        except Exception as e:
            print(f"SQLGenerator init failed: {e}")
            sql_generator = None
    return sql_generator

# Persistent session storage using files (survives Render restarts)
SESSIONS_DIR = os.path.join(os.path.dirname(__file__), '..', 'sessions')
os.makedirs(SESSIONS_DIR, exist_ok=True)

# Temp directory for uploads
TEMP_DIR = os.path.join(os.path.dirname(__file__), '..', 'temp')
os.makedirs(TEMP_DIR, exist_ok=True)

# Jobs dir for background tasks (stores job metadata/logs if needed)
JOBS_DIR = os.path.join(os.path.dirname(__file__), '..', 'jobs')
os.makedirs(JOBS_DIR, exist_ok=True)

def save_session(session_id: str, data: Dict):
    """Save session to file for persistence"""
    filepath = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    with open(filepath, 'w') as f:
        json.dump(data, f)

def load_session(session_id: str) -> Optional[Dict]:
    """Load session from file"""
    filepath = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if os.path.exists(filepath):
        with open(filepath, 'r') as f:
            return json.load(f)
    return None

def session_exists(session_id: str) -> bool:
    """Check if session exists"""
    filepath = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    return os.path.exists(filepath)


# ============================================
# Pydantic Models + Auth
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
    database_url: Optional[str] = None
    supabase_url: Optional[str] = None
    supabase_key: Optional[str] = None
    db_password: Optional[str] = None
    use_sqlite: bool = False
    sqlite_path: Optional[str] = None


# --- Auth / User models ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SettingsIn(BaseModel):
    settings: Dict[str, Any]

# --- Database setup ---
DATABASE_URL = os.getenv('DATABASE_URL') or f"sqlite:///" + os.path.join(os.path.dirname(__file__), '..', 'temp', 'intelli.db')
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith('sqlite') else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables on startup
Base.metadata.create_all(bind=engine)

# Password & JWT config
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")  # use pbkdf2 to avoid bcrypt platform issues during local smoke tests
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-this')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- DB helpers ---

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from sqlalchemy.orm import Session
from fastapi import Depends

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user_in: UserCreate):
    hashed = get_password_hash(user_in.password)
    user = User(email=user_in.email, hashed_password=hashed, full_name=user_in.full_name)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

# --- Auth dependency ---
async def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(lambda: next(get_db()))):
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing authorization')
    scheme, _, token = authorization.partition(' ')
    if scheme.lower() != 'bearer' or not token:
        raise HTTPException(status_code=401, detail='Invalid auth scheme')
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub')
        if user_id is None:
            raise HTTPException(status_code=401, detail='Invalid token payload')
    except JWTError:
        raise HTTPException(status_code=401, detail='Could not validate token')
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(status_code=401, detail='User not found')
    return user

# --- Auth routes ---
@app.post('/auth/signup', response_model=Token)
def signup(user_in: UserCreate, db: Session = Depends(lambda: next(get_db()))):
    existing = get_user_by_email(db, user_in.email)
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    user = create_user(db, user_in)
    token = create_access_token({'sub': str(user.id)})
    return {'access_token': token, 'token_type': 'bearer'}

@app.post('/auth/login', response_model=Token)
def login(user_in: UserCreate, db: Session = Depends(lambda: next(get_db()))):
    user = get_user_by_email(db, user_in.email)
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid credentials')
    token = create_access_token({'sub': str(user.id)})
    return {'access_token': token, 'token_type': 'bearer'}


@app.get('/auth/me', response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return {'id': current_user.id, 'email': current_user.email, 'full_name': current_user.full_name}


# Change password endpoint
class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str

@app.post('/auth/change-password')
async def change_password(payload: ChangePasswordIn, current_user: User = Depends(get_current_user), db: Session = Depends(lambda: next(get_db()))):
    # Verify old password
    if not verify_password(payload.old_password, current_user.hashed_password):
        raise HTTPException(status_code=401, detail='Invalid current password')
    # Update password
    current_user.hashed_password = get_password_hash(payload.new_password)
    db.add(current_user)
    db.commit()
    return {'status': 'ok', 'message': 'Password changed'}


# Delete account endpoint
@app.delete('/auth/delete')
async def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(lambda: next(get_db()))):
    # Delete related settings
    db.query(Settings).filter(Settings.user_id == current_user.id).delete()
    # Delete user
    db.delete(current_user)
    db.commit()
    return {'status': 'deleted'}


# --- User settings endpoints ---
@app.get('/api/user/settings')
def get_settings(current_user: User = Depends(get_current_user), db: Session = Depends(lambda: next(get_db()))):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    if not settings:
        return {'settings': {}}
    try:
        data = json.loads(settings.settings_json) if settings.settings_json else {}
    except Exception:
        data = {}
    return {'settings': data}


@app.put('/api/user/settings')
def put_settings(payload: SettingsIn, current_user: User = Depends(get_current_user), db: Session = Depends(lambda: next(get_db()))):
    settings = db.query(Settings).filter(Settings.user_id == current_user.id).first()
    sjson = json.dumps(payload.settings)
    if not settings:
        settings = Settings(user_id=current_user.id, settings_json=sjson)
        db.add(settings)
    else:
        settings.settings_json = sjson
    db.commit()
    return {'settings': payload.settings}


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


@app.get("/api/diag")
async def diagnostic():
    """Lightweight diagnostic endpoint to report installed libraries and agent init status.
    Useful for remote debugging without triggering heavy model loads.
    """
    info = {
        'env': {
            'python_version': None,
            'cwd': os.getcwd()
        },
        'modules': {},
        'agents': {}
    }

    try:
        import sys
        info['env']['python_version'] = sys.version
    except Exception:
        info['env']['python_version'] = 'unknown'

    # Check optional libraries
    libs = ['sentence_transformers', 'sklearn', 'numpy', 'torch']
    for lib in libs:
        try:
            __import__(lib)
            info['modules'][lib] = 'installed'
        except Exception as e:
            info['modules'][lib] = f'missing: {str(e)[:200]}'

    # Check agent classes without initializing heavy models
    info['agents']['ParserEngine'] = 'available' if ParserEngine is not None else 'missing'
    info['agents']['NLPMapper'] = 'available' if NLPMapper is not None else 'missing'
    info['agents']['AnomalyDetector'] = 'available' if AnomalyDetector is not None else 'missing'
    info['agents']['Normalizer'] = 'available' if Normalizer is not None else 'missing'
    info['agents']['SQLGenerator'] = 'available' if SQLGenerator is not None else 'missing'

    # Try lazy init but catch exceptions
    try:
        pe = get_parser_engine()
        info['agents']['parser_instance'] = 'ok' if pe is not None else 'init_failed_or_none'
    except Exception as e:
        info['agents']['parser_instance'] = f'error: {str(e)[:200]}'

    try:
        nm = get_nlp_mapper()
        info['agents']['nlp_instance'] = 'ok' if nm is not None else 'init_failed_or_none'
    except Exception as e:
        info['agents']['nlp_instance'] = f'error: {str(e)[:200]}'

    try:
        ad = get_anomaly_detector()
        info['agents']['anomaly_instance'] = 'ok' if ad is not None else 'init_failed_or_none'
    except Exception as e:
        info['agents']['anomaly_instance'] = f'error: {str(e)[:200]}'

    return JSONResponse(content=info)



@app.get("/api/health")
async def health_check():
    """Health check endpoint (non-invasive)"""
    # Use getters to avoid initializing heavy models unexpectedly and to reflect lazy-init state
    try:
        parser_available = ParserEngine is not None
    except NameError:
        parser_available = False

    try:
        mapper = get_nlp_mapper()
        nlp_available = bool(mapper and getattr(mapper, '_model_loaded', False) and getattr(mapper, 'model', None) is not None)
    except Exception:
        nlp_available = False

    try:
        detector = get_anomaly_detector()
        anomaly_ml = bool(detector and getattr(detector, '_ml_loaded', False) and getattr(detector, 'isolation_forest', None) is not None)
    except Exception:
        anomaly_ml = False

    try:
        normalizer_ok = True if get_normalizer() is not None else False
    except Exception:
        normalizer_ok = False

    try:
        sql_ok = True if get_sql_generator() is not None else False
    except Exception:
        sql_ok = False

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "agents": {
            "parser": "available" if parser_available else "unavailable",
            "nlp_mapper": "ready" if nlp_available else "fallback_mode",
            "anomaly_detector": "ml_ready" if anomaly_ml else "rule_based_only",
            "normalizer": "available" if normalizer_ok else "limited",
            "sql_generator": "available" if sql_ok else "limited"
        },
        "ml_worker": "available" if ml_worker_available() else "unavailable"
    }


@app.get("/api/agents/status")
async def agents_status():
    """Get detailed status of all agents"""
    # Safe inspection using getters
    parser = get_parser_engine()
    mapper = get_nlp_mapper()
    detector = get_anomaly_detector()
    normalizer_local = get_normalizer()
    sqlg = get_sql_generator()

    mapper_model = getattr(mapper, 'model', None) if mapper else None
    mapper_conf = getattr(mapper, 'confidence_threshold', None) if mapper else None
    detector_ml = getattr(detector, 'isolation_forest', None) if detector else None

    return {
        "agents": [
            {
                "name": "Parser Engine",
                "id": "parser",
                "status": "active" if parser is not None else "unavailable",
                "capabilities": ["JSON", "XML", "CSV", "Schema Detection", "Drift Handling"]
            },
            {
                "name": "NLP Schema Mapper",
                "id": "nlp_mapper",
                "status": "active" if mapper_model is not None else "limited",
                "model": "all-MiniLM-L6-v2" if mapper_model is not None else "pattern-matching",
                "confidence_threshold": mapper_conf
            },
            {
                "name": "Anomaly Detector",
                "id": "anomaly_detector",
                "status": "active" if detector_ml is not None else "limited",
                "ml_enabled": bool(detector_ml)
            },
            {
                "name": "Normalizer",
                "id": "normalizer",
                "status": "active" if normalizer_local is not None else "limited",
                "target_form": "3NF"
            },
            {
                "name": "SQL Generator",
                "id": "sql_generator",
                "status": "active",
                "dialect": (get_sql_generator().dialect if get_sql_generator() is not None else None)
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
        
        # Parse file using Agent 1 (lazy-init). If ParserEngine unavailable, use lightweight fallback parser
        global parser_engine
        engine = get_parser_engine()
        if engine:
            result = engine.parse(file_path)
            if not result.success:
                raise HTTPException(status_code=400, detail=f"Parse error: {result.errors}")
        else:
            # Lightweight fallback: attempt JSON, then CSV
            from types import SimpleNamespace
            try:
                with open(file_path, 'r', encoding='utf-8') as fh:
                    text = fh.read()
                try:
                    data = json.loads(text)
                    records = data if isinstance(data, list) else [data]
                    # build schema as simple field descriptors
                    schema = {}
                    first = records[0] if records else {}
                    for k, v in first.items():
                        schema[k] = SimpleNamespace(data_type=type(v).__name__, nullable=(v is None))
                    result = SimpleNamespace(success=True, file_type='json', record_count=len(records), schema=schema, schema_drift_detected=False, drift_details=[], records=records)
                except Exception:
                    import csv
                    reader = csv.DictReader(text.splitlines())
                    records = [r for r in reader]
                    first = records[0] if records else {}
                    schema = {k: SimpleNamespace(data_type='string', nullable=True) for k in first.keys()}
                    result = SimpleNamespace(success=True, file_type='csv', record_count=len(records), schema=schema, schema_drift_detected=False, drift_details=[], records=records)
                # Provide a minimal parser_engine with get_schema_summary used later
                class _DP:
                    def get_schema_summary(self, s):
                        out = {}
                        for key, val in s.items():
                            out[key] = {'data_type': getattr(val, 'data_type', 'string'), 'nullable': getattr(val, 'nullable', True)}
                        return out
                parser_engine = _DP()
            except Exception as e:
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(status_code=400, detail=f"Fallback parse failed: {e}")
        
        # Store session data (file-based for persistence)
        session_data = {
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
        # Perform immediate schema mapping (lazy init with fallback) to provide mapping in upload response
        try:
            mapper = get_nlp_mapper()
            if mapper:
                mapping_result = mapper.map_schema(list(result.schema.keys()))
                mapping_report = mapper.get_mapping_report(mapping_result)
                mapped_records = mapper.apply_mappings(result.records, mapping_result.mappings)
            else:
                # simple fallback mapping
                from types import SimpleNamespace
                mappings = []
                unmapped = []
                try:
                    from agents.nlp_mapper import NLPMapper as _N
                    std = _N.STANDARD_COLUMNS
                    abbrev = _N.ABBREVIATIONS
                except Exception:
                    std = {}
                    abbrev = {}
                import re
                def normalize(name: str):
                    n = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
                    n = re.sub(r'_+', '_', n).strip('_')
                    return n
                def expand(name: str):
                    parts = name.split('_')
                    return '_'.join([abbrev.get(p, p) for p in parts])
                for f in list(result.schema.keys()):
                    n = normalize(f)
                    mapped = None
                    confidence = 0.5
                    mtype = 'fallback'
                    for standard, variants in std.items():
                        if n == standard or n in variants:
                            mapped = standard; confidence = 1.0; mtype = 'exact'; break
                        if expand(n) == standard or expand(n) in [expand(v) for v in variants]:
                            mapped = standard; confidence = 0.95; mtype = 'pattern'; break
                    if mapped is None:
                        mapped = re.sub(r'[^a-z0-9_]', '_', n)
                        if mapped == '': mapped = 'col_' + str(abs(hash(f)) % 10000)
                        unmapped.append(f)
                    mappings.append(SimpleNamespace(original_name=f, mapped_name=mapped, confidence=confidence, mapping_type=mtype))
                avg_conf = sum(m.confidence for m in mappings) / len(mappings) if mappings else 0.0
                mapping_result = SimpleNamespace(success=len(unmapped) < len(list(result.schema.keys())) * 0.3, mappings=mappings, unmapped_fields=unmapped, average_confidence=avg_conf, table_name=("ecommerce_data"))
                mapping_report = {
                    'success': mapping_result.success,
                    'table_name': mapping_result.table_name,
                    'total_fields': len(mapping_result.mappings),
                    'high_confidence': len([m for m in mapping_result.mappings if m.confidence >= 0.9]),
                    'medium_confidence': len([m for m in mapping_result.mappings if 0.7 <= m.confidence < 0.9]),
                    'low_confidence': len([m for m in mapping_result.mappings if m.confidence < 0.7]),
                    'average_confidence': round(mapping_result.average_confidence * 100, 1),
                    'mappings': [
                        {'from': m.original_name, 'to': m.mapped_name, 'confidence': round(m.confidence * 100, 1), 'type': m.mapping_type}
                        for m in mapping_result.mappings
                    ]
                }
                mapping_dict = {m.original_name: m.mapped_name for m in mapping_result.mappings}
                mapped_records = []
                for record in result.records:
                    new_rec = {}
                    for k, v in record.items():
                        new_rec[mapping_dict.get(k, k)] = v
                    mapped_records.append(new_rec)
            # attach mapping to session_data
            session_data['mapping'] = mapping_report
            session_data['mapped_records'] = mapped_records
        except Exception as e:
            session_data['mapping_error'] = str(e)
        save_session(session_id, session_data)
        
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
async def map_schema(session_id: str, domain: str = "ecommerce", payload: dict = Body(None)):
    """
    Step 2: Map source columns to standardized names using NLP
    Accepts an optional JSON body; if omitted, an empty dict is used.
    """
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = load_session(session_id)
    
    # Get source columns
    source_columns = list(session.get("schema", {}).keys())
    
    # Try local mapper first
    mapper = get_nlp_mapper()
    mapping_report = None
    mapped_records = []

    if mapper:
        try:
            mapping_result = mapper.map_schema(source_columns, domain)
            mapping_report = mapper.get_mapping_report(mapping_result)
            mapped_records = mapper.apply_mappings(session.get("records", []), mapping_result.mappings)
        except Exception as e:
            print(f"Local mapper error: {e}")
            mapper = None

    # If no local mapper, try external ML worker
    if (mapper is None) and ML_WORKER_URL:
        try:
            worker_res = call_ml_worker('nlp/map', {'source_fields': source_columns, 'domain': domain}, timeout=60)
            if worker_res:
                mappings = worker_res.get('mappings', [])
                total_fields = len(mappings)
                high = sum(1 for m in mappings if m.get('confidence', 0) >= 0.9)
                medium = sum(1 for m in mappings if 0.7 <= m.get('confidence', 0) < 0.9)
                low = sum(1 for m in mappings if m.get('confidence', 0) < 0.7)
                avg_conf = (sum(m.get('confidence', 0) for m in mappings) / total_fields) if total_fields else 0.0
                mapping_report = {
                    'success': worker_res.get('success', True),
                    'table_name': worker_res.get('table_name', domain + '_data'),
                    'total_fields': total_fields,
                    'high_confidence': high,
                    'medium_confidence': medium,
                    'low_confidence': low,
                    'average_confidence': round(avg_conf * 100, 1),
                    'mappings': [
                        {
                            'from': m.get('original_name') or m.get('from') or m.get('source'),
                            'to': m.get('mapped_name') or m.get('to') or m.get('mapped'),
                            'confidence': round(m.get('confidence', 0) * 100, 1),
                            'type': m.get('mapping_type', 'semantic' if m.get('confidence', 0) >= 0.85 else 'fallback')
                        }
                        for m in mappings
                    ]
                }
                mapping_dict = {item['from']: item['to'] for item in mapping_report['mappings']}
                mapped_records = []
                for record in session.get('records', []):
                    new_rec = {}
                    for k, v in record.items():
                        new_rec[mapping_dict.get(k, k)] = v
                    mapped_records.append(new_rec)
        except Exception as e:
            print(f"ML worker mapping call failed: {e}")

    # If still no mapping_report, use fallback mapping (pattern-based)
    if not mapping_report or not mapped_records:
        from types import SimpleNamespace
        mappings = []
        unmapped = []
        std = {}
        try:
            from agents.nlp_mapper import NLPMapper as _N
            std = _N.STANDARD_COLUMNS
            abbrev = _N.ABBREVIATIONS
        except Exception:
            std = {}
            abbrev = {}
        import re
        def normalize(name: str):
            n = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
            n = re.sub(r'_+', '_', n).strip('_')
            return n
        def expand(name: str):
            parts = name.split('_')
            return '_'.join([abbrev.get(p, p) for p in parts])
        for f in source_columns:
            n = normalize(f)
            mapped = None
            confidence = 0.5
            mtype = 'fallback'
            for standard, variants in std.items():
                if n == standard or n in variants:
                    mapped = standard; confidence = 1.0; mtype = 'exact'; break
                if expand(n) == standard or expand(n) in [expand(v) for v in variants]:
                    mapped = standard; confidence = 0.95; mtype = 'pattern'; break
            if mapped is None:
                mapped = re.sub(r'[^a-z0-9_]', '_', n)
                if mapped == '': mapped = 'col_' + str(abs(hash(f)) % 10000)
                unmapped.append(f)
            mappings.append(SimpleNamespace(original_name=f, mapped_name=mapped, confidence=confidence, mapping_type=mtype))
        avg_conf = sum(m.confidence for m in mappings) / len(mappings) if mappings else 0.0
        table_name = (domain + "_data")
        mapping_result = SimpleNamespace(success=len(unmapped) < len(source_columns) * 0.3, mappings=mappings, unmapped_fields=unmapped, average_confidence=avg_conf, table_name=table_name)
        mapping_report = {
            'success': mapping_result.success,
            'table_name': mapping_result.table_name,
            'total_fields': len(mapping_result.mappings),
            'high_confidence': len([m for m in mapping_result.mappings if m.confidence >= 0.9]),
            'medium_confidence': len([m for m in mapping_result.mappings if 0.7 <= m.confidence < 0.9]),
            'low_confidence': len([m for m in mapping_result.mappings if m.confidence < 0.7]),
            'average_confidence': round(mapping_result.average_confidence * 100, 1),
            'mappings': [
                {'from': m.original_name, 'to': m.mapped_name, 'confidence': round(m.confidence * 100, 1), 'type': m.mapping_type}
                for m in mapping_result.mappings
            ]
        }
        mapping_dict = {m['from']: m['to'] for m in mapping_report['mappings']}
        mapped_records = []
        for record in session.get('records', []):
            new_rec = {}
            for k, v in record.items():
                new_rec[mapping_dict.get(k, k)] = v
            mapped_records.append(new_rec)

    # Update session
    session["current_step"] = 2
    session.setdefault("steps_completed", []).append("schema_mapping")
    session["mapping_result"] = mapping_report
    session["table_name"] = mapping_report.get('table_name', domain + '_data')
    
    # Apply mapped records
    session["mapped_records"] = mapped_records
    
    save_session(session_id, session)
    
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
async def detect_anomalies(session_id: str, payload: dict = Body(None)):
    """
    Step 3: Detect data quality issues and anomalies
    Accepts an optional JSON body.
    """
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = load_session(session_id)
    records = session.get("mapped_records", session.get("records", []))
    
    # Run Anomaly Detector (Agent 3) - ensure lazy init and fallback
    detector = get_anomaly_detector()
    if detector:
        try:
            report = detector.detect_anomalies(records, session.get("schema"))
            session["anomaly_report"] = detector.get_anomaly_summary(report)
            session["cleaned_records"] = getattr(report, 'cleaned_records', records)
        except Exception as e:
            print(f"Anomaly detection endpoint error: {e}")
            session["anomaly_report"] = {'quality_score': 0, 'total_records': len(records), 'clean_records': 0, 'removed_records': 0, 'anomaly_breakdown': {}, 'field_quality': {}, 'top_issues': []}
            session["cleaned_records"] = records
    else:
        # ML unavailable: simple default
        session["anomaly_report"] = {'quality_score': 100.0, 'total_records': len(records), 'clean_records': len(records), 'removed_records': 0, 'anomaly_breakdown': {}, 'field_quality': {}, 'top_issues': []}
        session["cleaned_records"] = records
    
    # Update session
    session["current_step"] = 3
    session.setdefault("steps_completed", []).append("anomaly_detection")
    save_session(session_id, session)
    
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
async def normalize_data(session_id: str, payload: dict = Body(None)):
    """
    Step 4: Normalize data to 3NF
    Accepts optional JSON body.
    """
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    session = load_session(session_id)
    records = session.get("cleaned_records", session.get("mapped_records", session.get("records", [])))
    table_name = session.get("table_name", "data")

    # Use lazy getter for normalizer
    normalizer_local = get_normalizer()
    if not normalizer_local:
        # Mark session and return service unavailable
        session.setdefault('error', 'Normalizer not available')
        save_session(session_id, session)
        raise HTTPException(status_code=503, detail="Normalization service unavailable")

    # Quick path: if only 0-1 records, create a trivial main table to avoid heavy normalization
    if not records or len(records) <= 1:
        sample = records[0] if records else {}
        cols = []
        for k, v in sample.items():
            dtype = 'TEXT'
            if isinstance(v, int):
                dtype = 'INTEGER'
            elif isinstance(v, float):
                dtype = 'DECIMAL(10,2)'
            elif isinstance(v, bool):
                dtype = 'BOOLEAN'
            elif isinstance(v, str) and len(v) <= 50:
                dtype = 'VARCHAR(50)'
            cols.append({
                'name': k,
                'data_type': dtype,
                'primary_key': False,
                'foreign_key': None,
                'nullable': True
            })
        main_table = {
            'name': table_name,
            'columns': [{'name': 'id', 'data_type': 'INTEGER', 'primary_key': True, 'foreign_key': None, 'nullable': False}] + cols,
            'primary_key': 'id',
            'foreign_keys': [],
            'records': [{**{'id': i+1}, **r} for i, r in enumerate(records)]
        }
        session['current_step'] = 4
        session.setdefault('steps_completed', []).append('normalization')
        session['normalization_result'] = {
            'success': True,
            'normalization_level': 'fallback_small_set',
            'original_columns': len(sample.keys()) if sample else 0,
            'total_tables': 1,
            'total_columns': len(cols) + 1,
            'relationships': 0,
            'tables': [
                {
                    'name': main_table['name'],
                    'columns': [c['name'] for c in main_table['columns']],
                    'primary_key': main_table['primary_key'],
                    'foreign_keys': main_table['foreign_keys'],
                    'record_count': len(main_table['records'])
                }
            ],
            'erd_diagram': f"erDiagram\n    {main_table['name']} {{\n        INTEGER id PK\n        " + "\n        ".join([f"{c['data_type']} {c['name']}" for c in cols]) + "\n    }"
        }
        session['normalized_tables'] = [main_table]
        session['relationships'] = []
        session['erd_diagram'] = session['normalization_result']['erd_diagram']
        save_session(session_id, session)
        return {
            'session_id': session_id,
            'status': 'success',
            'step': 4,
            'step_name': 'Normalization',
            'data': session['normalization_result']
        }

    # Heavy normalization path: use normalizer if available
    try:
        norm_result = normalizer_local.normalize(session.get('cleaned_records', session.get('mapped_records', session.get('records', []))), table_name)
        session['normalization_result'] = normalizer_local.get_normalization_summary(norm_result)
        session['normalized_tables'] = [
            {
                'name': t.name,
                'columns': [{'name': c.name, 'data_type': c.data_type, 'primary_key': c.primary_key, 'foreign_key': c.foreign_key, 'nullable': c.nullable} for c in t.columns],
                'primary_key': t.primary_key,
                'foreign_keys': t.foreign_keys,
                'records': t.records
            }
            for t in getattr(norm_result, 'tables', [])
        ]
        session['relationships'] = getattr(norm_result, 'relationships', [])
        session['erd_diagram'] = getattr(norm_result, 'erd_diagram', None)
        session['current_step'] = 4
        session.setdefault('steps_completed', []).append('normalization')
        save_session(session_id, session)
        return {
            'session_id': session_id,
            'status': 'success',
            'step': 4,
            'step_name': 'Normalization',
            'data': session['normalization_result']
        }
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        print(f"Normalization error for session {session_id}: {e}\n{tb}")
        # Save error to session
        session.setdefault('error', str(e))
        session.setdefault('error_traceback', tb)
        session['current_step'] = -1

        # Fallback: create a simple main table from records so SQL generation can proceed
        try:
            cols = []
            sample = records[0] if records else {}
            for k, v in sample.items():
                dtype = 'TEXT'
                if isinstance(v, int):
                    dtype = 'INTEGER'
                elif isinstance(v, float):
                    dtype = 'DECIMAL(10,2)'
                elif isinstance(v, bool):
                    dtype = 'BOOLEAN'
                elif isinstance(v, str) and len(v) <= 50:
                    dtype = 'VARCHAR(50)'
                cols.append({
                    'name': k,
                    'data_type': dtype,
                    'primary_key': False,
                    'foreign_key': None,
                    'nullable': True
                })
            main_table = {
                'name': table_name,
                'columns': [{'name': 'id', 'data_type': 'INTEGER', 'primary_key': True, 'foreign_key': None, 'nullable': False}] + cols,
                'primary_key': 'id',
                'foreign_keys': [],
                'records': [{**{'id': i+1}, **r} for i, r in enumerate(records)]
            }
            session['normalization_result'] = {
                'success': False,
                'normalization_level': 'fallback',
                'original_columns': len(sample.keys()) if sample else 0,
                'total_tables': 1,
                'total_columns': len(cols) + 1,
                'relationships': 0,
                'tables': [
                    {
                        'name': main_table['name'],
                        'columns': [c['name'] for c in main_table['columns']],
                        'primary_key': main_table['primary_key'],
                        'foreign_keys': main_table['foreign_keys'],
                        'record_count': len(main_table['records'])
                    }
                ],
                'erd_diagram': f"erDiagram\n    {main_table['name']} {{\n        INTEGER id PK\n        " + "\n        ".join([f"{c['data_type']} {c['name']}" for c in cols]) + "\n    }"
            }
            session['normalized_tables'] = [main_table]
            session['relationships'] = []
            session['erd_diagram'] = session['normalization_result']['erd_diagram']
        except Exception as ee:
            print(f"Fallback normalization also failed: {ee}")

        save_session(session_id, session)
        # Return fallback response to allow pipeline continuation
        return {
            "session_id": session_id,
            "status": "warning",
            "step": 4,
            "step_name": "Normalization",
            "data": {
                "message": "Normalization failed; fallback main table created",
                "error": str(e),
                "erd_diagram": session.get('erd_diagram')
            }
        }


# ============================================
# Step 5: SQL Generation
# ============================================

@app.post("/api/generate-sql/{session_id}")
async def generate_sql(session_id: str, dialect: str = "postgresql", payload: dict = Body(None)):
    """
    Step 5: Generate SQL DDL/DML scripts
    Accepts optional JSON body.
    """
    import traceback
    
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = load_session(session_id)
    
    if "normalized_tables" not in session:
        raise HTTPException(status_code=400, detail="Run normalization first")
    
    try:
        # Use lazy getter for sql generator
        sqlg = get_sql_generator()
        if not sqlg:
            raise RuntimeError('SQLGenerator unavailable')

        # Update SQL generator dialect
        sqlg.dialect = dialect
        
        # Generate SQL (Agent 5)
        script = sqlg.generate_sql(
            session["normalized_tables"],
            session.get("relationships", [])
        )
        
        # Save SQL to file
        sql_path = os.path.join(TEMP_DIR, f"{session_id}_script.sql")
        with open(sql_path, 'w', encoding='utf-8') as f:
            f.write(script.full_script)
        
        # Update session
        session["current_step"] = 5
        session.setdefault("steps_completed", []).append("sql_generation")
        session["sql_script_path"] = sql_path
        session["sql_summary"] = sqlg.get_sql_summary(script)
        
        save_session(session_id, session)
        
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
        import traceback
        tb = traceback.format_exc()
        print(f"SQL Generation Error for session {session_id}: {e}\n{tb}")
        session = load_session(session_id) or {}
        session.setdefault('error', str(e))
        session.setdefault('error_traceback', tb)
        session['current_step'] = -1
        save_session(session_id, session)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/download-sql/{session_id}")
async def download_sql(session_id: str):
    """Download generated SQL script"""
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = load_session(session_id)
    
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


def _perform_deploy(session_id: str, script: SQLScript, sqlg_instance, database_url: str, db_password: Optional[str] = None):
    """Internal helper to perform deployment with detailed logging."""
    try:
        host = None
        try:
            parsed = urlparse(database_url)
            host = parsed.hostname
        except Exception:
            pass
        logger.info(f"DEPLOY_START session={session_id} target_host={host} dialect={getattr(script,'dialect',None)} size_bytes={len(script.full_script)}")
        res = sqlg_instance.deploy_to_postgres(script, database_url, db_password)
        logger.info(f"DEPLOY_FINISHED session={session_id} success={getattr(res,'success',False)} tables={getattr(res,'tables_created',None)} records={getattr(res,'records_inserted',None)} errors={getattr(res,'errors',None)}")
        return res
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"DEPLOY_EXCEPTION session={session_id} error={e}\n{tb}")
        class _Fail:
            success = False
            message = str(e)
            tables_created = []
            records_inserted = 0
            errors = [str(e)]
        return _Fail()


@app.post("/api/deploy-env/{session_id}")
async def deploy_env(session_id: str, config: DeployConfig = Body(None), x_admin_key: Optional[str] = Header(None)):
    """
    Admin endpoint: deploy using server's DATABASE_URL environment variable.
    If ADMIN_KEY env var is set, request must include header 'X-ADMIN-KEY' with that value.
    Accepts optional JSON body with 'db_password' to pass to the DB driver.
    """
    admin_key_env = os.getenv('ADMIN_KEY')
    if admin_key_env:
        if not x_admin_key or x_admin_key != admin_key_env:
            raise HTTPException(status_code=401, detail='Invalid admin key')

    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")

    session = load_session(session_id)
    if "sql_script_path" not in session:
        raise HTTPException(status_code=400, detail="Generate SQL first")

    # Read SQL script
    with open(session["sql_script_path"], 'r', encoding='utf-8') as f:
        sql_content = f.read()

    sqlg_inst = get_sql_generator()
    if not sqlg_inst:
        raise HTTPException(status_code=503, detail="SQL generator unavailable")

    script = SQLScript(
        ddl="",
        dml="",
        full_script=sql_content,
        dialect=getattr(sqlg_inst, 'dialect', session.get("sql_summary", {}).get('dialect', 'postgresql')),
        table_count=session.get("sql_summary", {}).get("table_count", 0),
        record_count=session.get("sql_summary", {}).get("record_count", 0)
    )

    env_db = os.getenv('DATABASE_URL') or os.getenv('DATABASE')
    if not env_db:
        raise HTTPException(status_code=400, detail="Environment DATABASE_URL not set on server")

    db_pw = None
    if config:
        db_pw = config.db_password

    # perform deploy
    result = _perform_deploy(session_id, script, sqlg_inst, env_db, db_pw)

    # Update session
    session["current_step"] = 6
    session.setdefault("steps_completed", []).append("deployment")
    session["deployment_result"] = {
        "success": getattr(result, 'success', False),
        "message": getattr(result, 'message', None),
        "tables_created": getattr(result, 'tables_created', None),
        "records_inserted": getattr(result, 'records_inserted', 0),
        "errors": getattr(result, 'errors', None)
    }
    save_session(session_id, session)

    return {
        "session_id": session_id,
        "status": "success" if session["deployment_result"]["success"] else "error",
        "step": 6,
        "step_name": "Deployment (env)",
        "data": session["deployment_result"]
    }

@app.post("/api/deploy/{session_id}")
async def deploy_database(session_id: str, config: DeployConfig):
    """
    Step 6: Deploy to database (Postgres or SQLite)
    """
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = load_session(session_id)
    
    if "sql_script_path" not in session:
        raise HTTPException(status_code=400, detail="Generate SQL first")
    
    # Read SQL script
    with open(session["sql_script_path"], 'r') as f:
        sql_content = f.read()
    
    # Ensure we use the SQLGenerator instance
    sqlg = get_sql_generator()
    if not sqlg:
        raise HTTPException(status_code=503, detail="SQL generator unavailable")

    script = SQLScript(
        ddl="",  # We'll use full_script
        dml="",
        full_script=sql_content,
        dialect=getattr(sqlg, 'dialect', session.get("sql_summary", {}).get('dialect', 'postgresql')),
        table_count=session.get("sql_summary", {}).get("table_count", 0),
        record_count=session.get("sql_summary", {}).get("record_count", 0)
    )
    
    if config.use_sqlite:
        # Deploy to SQLite
        db_path = config.sqlite_path or os.path.join(TEMP_DIR, f"{session_id}.db")
        result = sqlg.deploy_to_sqlite(script, db_path)
    elif config.database_url:
        # Deploy to Postgres using a DATABASE_URL provided in the request
        result = sqlg.deploy_to_postgres(script, config.database_url, config.db_password)
    elif config.supabase_url and config.supabase_key:
        # Legacy: Deploy to Supabase-specific endpoint (kept for backwards compatibility)
        result = sqlg.deploy_to_supabase(
            script, config.supabase_url, config.supabase_key, config.db_password
        )
    else:
        # If caller did not provide DB credentials, fall back to environment DATABASE_URL (e.g., Render)
        env_db = os.getenv('DATABASE_URL') or os.getenv('DATABASE')
        if env_db:
            result = sqlg.deploy_to_postgres(script, env_db, config.db_password)
        else:
            raise HTTPException(
                status_code=400,
                detail="Provide database credentials (database_url) or enable SQLite"
            )
    
    # Update session
    session["current_step"] = 6
    session.setdefault("steps_completed", []).append("deployment")
    session["deployment_result"] = {
        "success": getattr(result, 'success', False),
        "message": getattr(result, 'message', None),
        "tables_created": getattr(result, 'tables_created', 0),
        "records_inserted": getattr(result, 'records_inserted', 0),
        "errors": getattr(result, 'errors', None)
    }
    
    save_session(session_id, session)
    
    return {
        "session_id": session_id,
        "status": "success" if session["deployment_result"]["success"] else "error",
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
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = load_session(session_id)
    
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

@app.post("/api/session/{session_id}/run")
async def run_session(session_id: str, background: BackgroundTasks, domain: str = "ecommerce", dialect: str = "postgresql", deploy_sqlite: bool = False):
    """Schedule background pipeline run for an existing uploaded session."""
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    session = load_session(session_id)
    file_path = session.get("file_path") or session.get("file_path")
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="Uploaded file missing for this session. Re-upload via /api/upload")
    # Schedule background pipeline
    background.add_task(_run_pipeline_background, session_id, file_path, domain, dialect, deploy_sqlite)
    return JSONResponse(status_code=202, content={"session_id": session_id, "status": "scheduled", "poll": f"/api/session/{session_id}"})


@app.delete("/api/session/{session_id}")
async def delete_session(session_id: str):
    """Delete session and cleanup files"""
    if not session_exists(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = load_session(session_id)
    
    # Cleanup files
    for path_key in ["file_path", "sql_script_path"]:
        if path_key in session and os.path.exists(session[path_key]):
            os.remove(session[path_key])
    
    # Check for SQLite DB
    db_path = os.path.join(TEMP_DIR, f"{session_id}.db")
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Delete session file
    session_file = os.path.join(SESSIONS_DIR, f"{session_id}.json")
    if os.path.exists(session_file):
        os.remove(session_file)
    
    return {"status": "deleted", "session_id": session_id}


# ============================================
# Full Pipeline (One-Shot)
# ============================================

def _run_pipeline_background(session_id, file_path, domain, dialect, deploy_sqlite):
    """Background pipeline runner: parses, maps, detects anomalies, normalizes, generates SQL, and optionally deploys.
    Saves progress to the session file so the API can poll /api/session/{session_id}.
    """
    try:
        # Initialize agents (lazy): parser, mapper, detector, normalizer, sql generator
        parser = get_parser_engine()
        mapper = get_nlp_mapper()
        detector = get_anomaly_detector()
        normalizer_local = get_normalizer()
        sql_gen = get_sql_generator()

        # Parse file (use parser if available, otherwise fallback simple JSON/CSV parser)
        if parser:
            parse_result = parser.parse(file_path)
        else:
            try:
                # Try JSON, then CSV
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                try:
                    records = json.loads(content)
                    if isinstance(records, dict):
                        # wrap single object into list
                        records = [records]
                except Exception:
                    # fallback to CSV
                    import csv
                    with open(file_path, 'r', encoding='utf-8') as f:
                        reader = csv.DictReader(f)
                        records = [r for r in reader]

                PR = type('ParseResult', (), {})
                parse_result = PR()
                setattr(parse_result, 'records', records)
                setattr(parse_result, 'record_count', len(records))
                setattr(parse_result, 'file_type', 'json_or_csv')
                schema = {}
                if records:
                    for k in records[0].keys():
                        schema[k] = 'string'
                setattr(parse_result, 'schema', schema)
            except Exception as e:
                print(f"Fallback parse failed: {e}")
                PR = type('ParseResult', (), {})
                parse_result = PR()
                setattr(parse_result, 'records', [])
                setattr(parse_result, 'record_count', 0)
                setattr(parse_result, 'file_type', 'unknown')
                setattr(parse_result, 'schema', {})

        # Initialize session if missing
        session = load_session(session_id) or {}
        session.setdefault('created_at', datetime.now().isoformat())
        session.setdefault('file_name', os.path.basename(file_path))
        session.setdefault('current_step', 1)
        session.setdefault('steps_completed', ['upload'])
        session['parse_result'] = {
            'record_count': getattr(parse_result, 'record_count', 0),
            'file_type': getattr(parse_result, 'file_type', 'unknown'),
            'schema': getattr(parse_result, 'schema', {})
        }
        save_session(session_id, session)

        # Step 2: mapping
        columns = list(getattr(parse_result, 'schema', {}).keys())
        if mapper:
            mapping_result = mapper.map_schema(columns, domain)
            session['current_step'] = 2
            session.setdefault('steps_completed', []).append('schema_mapping')
            session['mapping_result'] = mapper.get_mapping_report(mapping_result)
            session['table_name'] = mapping_result.table_name
            session['mapped_records'] = mapper.apply_mappings(getattr(parse_result, 'records', []), mapping_result.mappings)
        else:
            # Fallback: identity mapping
            session['current_step'] = 2
            session.setdefault('steps_completed', []).append('schema_mapping')
            session['mapping_result'] = {'success': True, 'table_name': f"{domain}_data", 'mappings': []}
            session['table_name'] = f"{domain}_data"
            session['mapped_records'] = getattr(parse_result, 'records', [])
        save_session(session_id, session)

        # Step 3: anomalies
        if detector:
            try:
                report = detector.detect_anomalies(session.get('mapped_records', []), session.get('parse_result', {}).get('schema'))
                session['anomaly_report'] = detector.get_anomaly_summary(report)
                session['cleaned_records'] = getattr(report, 'cleaned_records', session.get('mapped_records', []))
            except Exception as e:
                print(f"Anomaly detection failed during pipeline: {e}")
                session['anomaly_report'] = {'quality_score': 0, 'total_records': len(session.get('mapped_records', [])), 'clean_records': 0, 'removed_records': 0, 'anomaly_breakdown': {}, 'field_quality': {}, 'top_issues': []}
                session['cleaned_records'] = session.get('mapped_records', [])
        else:
            # ML not available: provide basic empty report
            session['anomaly_report'] = {'quality_score': 100.0, 'total_records': len(session.get('mapped_records', [])), 'clean_records': len(session.get('mapped_records', [])), 'removed_records': 0, 'anomaly_breakdown': {}, 'field_quality': {}, 'top_issues': []}
            session['cleaned_records'] = session.get('mapped_records', [])
        session['current_step'] = 3
        session.setdefault('steps_completed', []).append('anomaly_detection')
        save_session(session_id, session)

        # Step 4: normalization
        if normalizer_local:
            try:
                norm_result = normalizer_local.normalize(session.get('cleaned_records', []), session.get('table_name', 'data'))
                session['normalization_result'] = normalizer_local.get_normalization_summary(norm_result)
                session['normalized_tables'] = [
                    {
                        'name': t.name,
                        'columns': [{'name': c.name, 'data_type': c.data_type, 'primary_key': c.primary_key, 'foreign_key': c.foreign_key, 'nullable': c.nullable} for c in t.columns],
                        'primary_key': t.primary_key,
                        'foreign_keys': t.foreign_keys,
                        'records': t.records
                    }
                    for t in getattr(norm_result, 'tables', [])
                ]
            except Exception as e:
                print(f"Normalization failed: {e}")
                session['normalization_result'] = {}
                session['normalized_tables'] = []
        else:
            session['normalization_result'] = {}
            session['normalized_tables'] = []
        session['current_step'] = 4
        session.setdefault('steps_completed', []).append('normalization')
        # Attach relationships and ERD if normalization produced them
        session['relationships'] = getattr(norm_result, 'relationships', []) if 'norm_result' in locals() else []
        session['erd_diagram'] = getattr(norm_result, 'erd_diagram', None) if 'norm_result' in locals() else None
        save_session(session_id, session)

        # Step 5: generate SQL
        if sql_gen:
            try:
                sql_gen.dialect = dialect
                script = sql_gen.generate_sql(session['normalized_tables'], session.get('relationships', []))
                sql_path = os.path.join(TEMP_DIR, f"{session_id}_script.sql")
                with open(sql_path, 'w', encoding='utf-8') as f:
                    f.write(script.full_script)
                session['current_step'] = 5
                session.setdefault('steps_completed', []).append('sql_generation')
                session['sql_script_path'] = sql_path
                session['sql_summary'] = sql_gen.get_sql_summary(script)
                save_session(session_id, session)
            except Exception as e:
                print(f"SQL generation failed: {e}")
                session['sql_summary'] = {}
                save_session(session_id, session)
        else:
            session['sql_summary'] = {}
            save_session(session_id, session)

        # Step 6: optional deploy
        if deploy_sqlite and sql_gen and 'script' in locals():
            try:
                db_path = os.path.join(TEMP_DIR, f"{session_id}.db")
                deploy_res = sql_gen.deploy_to_sqlite(script, db_path)
                session['current_step'] = 6
                session.setdefault('steps_completed', []).append('deployment')
                session['deployment_result'] = {
                    'success': getattr(deploy_res, 'success', False),
                    'message': getattr(deploy_res, 'message', None)
                }
                save_session(session_id, session)
            except Exception as e:
                print(f"Deployment failed: {e}")
                session['deployment_result'] = {'success': False, 'message': str(e)}
                save_session(session_id, session)

    except Exception as e:
        session = load_session(session_id) or {}
        session['error'] = str(e)
        session['current_step'] = -1
        save_session(session_id, session)


@app.post("/api/migrate")
async def full_migration(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    domain: str = "ecommerce",
    dialect: str = "postgresql",
    deploy_sqlite: bool = False
):
    """
    Run complete migration pipeline in one request
    """
    # Step 1: Upload and schedule background run
    session_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{session_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Initialize session metadata and schedule background processing
    session_data = {
        "created_at": datetime.now().isoformat(),
        "file_name": file.filename,
        "current_step": 0,
        "steps_completed": ["upload"]
    }
    save_session(session_id, session_data)
    background.add_task(_run_pipeline_background, session_id, file_path, domain, dialect, deploy_sqlite)
    return JSONResponse(status_code=202, content={"session_id": session_id, "status": "scheduled", "poll": f"/api/session/{session_id}"})



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

