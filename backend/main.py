"""
Intelli-Migrate: AI-Powered Data Migration SaaS
Main FastAPI Application - Orchestrates all 5 AI Agents
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks, Depends, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import os
import json
import uuid
from datetime import datetime, timedelta
import shutil
import logging
import smtplib
from email.message import EmailMessage
from email.utils import parseaddr
from urllib.parse import urlencode, quote_plus

# Database and auth
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext
from jose import JWTError, jwt
from dotenv import load_dotenv

load_dotenv()

import logging, traceback
from urllib.parse import urlparse, urljoin, urlencode, quote_plus

# Logger for deployment and admin actions
logger = logging.getLogger('intelli_migrate')
if not logger.handlers:
    ch = logging.StreamHandler()
    ch.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(message)s"))
    logger.addHandler(ch)
logger.setLevel(logging.INFO)

# Optional external ML worker (set ML_WORKER_URL to enable)
import requests

ML_WORKER_URL = os.getenv('ML_WORKER_URL') or os.getenv('ML_WORKER') or os.getenv('ML_WORKER_BASE_URL')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://new-intelli-migrate.pages.dev')
BACKEND_PUBLIC_URL = os.getenv('BACKEND_PUBLIC_URL', 'https://new-intelli-migrate.onrender.com')
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID')
GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET')
SMTP_HOST = os.getenv('SMTP_HOST')
SMTP_HOST = SMTP_HOST or os.getenv('SMTP_SERVER') or os.getenv('MAIL_SERVER')
SMTP_PORT = int(os.getenv('SMTP_PORT') or os.getenv('MAIL_PORT') or '587')
SMTP_USER = os.getenv('SMTP_USER') or os.getenv('SMTP_USERNAME') or os.getenv('MAIL_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD') or os.getenv('SMTP_PASS') or os.getenv('MAIL_PASSWORD')
SMTP_FROM = os.getenv('SMTP_FROM') or os.getenv('MAIL_FROM') or SMTP_USER
SMTP_USE_TLS = (os.getenv('SMTP_USE_TLS', 'true').lower() in ('1', 'true', 'yes'))
SMTP_USE_SSL = (os.getenv('SMTP_USE_SSL', 'false').lower() in ('1', 'true', 'yes'))
SMTP_TIMEOUT = int(os.getenv('SMTP_TIMEOUT', '5'))
BREVO_API_KEY = os.getenv('BREVO_API_KEY') or os.getenv('SENDINBLUE_API_KEY') or os.getenv('BREVO_KEY')
BREVO_FROM = os.getenv('BREVO_FROM') or SMTP_FROM
BREVO_TIMEOUT = int(os.getenv('BREVO_TIMEOUT', '20'))
SUPPORT_GITHUB_URL = os.getenv('SUPPORT_GITHUB_URL', 'https://github.com/thisisdvnsh-thkr/new-intelli-migrate/issues')
SUPPORT_AI_MODEL = os.getenv('SUPPORT_AI_MODEL', 'gpt-4o-mini')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')


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
# Database setup
# ============================================
# Ensure tables are created immediately after engine definition
DATABASE_URL = os.getenv('DATABASE_URL') or f"sqlite:///" + os.path.join(os.path.dirname(__file__), '..', 'temp', 'intelli.db')
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith('sqlite') else {}
)

# Create tables now (important for fresh DBs)
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ============================================
# Initialize AI Agents (if available)
# ============================================

# Lazy-initialize heavy agents to avoid slow startup or blocking during deployment
parser_engine = None
nlp_mapper = None
anomaly_detector = None
normalizer = None
sql_generator = None

# Worker proxy classes (call ML worker service if configured)
WORKER_URL = os.getenv('WORKER_URL')
USE_ML_WORKER = os.getenv('USE_ML_WORKER', '0') == '1'

class NLPMapperProxy:
    def __init__(self, base):
        self.base = base.rstrip('/')
    def map_schema(self, source_fields, domain='ecommerce'):
        resp = requests.post(f"{self.base}/nlp/map", json={'source_fields': source_fields, 'domain': domain}, timeout=60)
        resp.raise_for_status()
        return resp.json()

class AnomalyDetectorProxy:
    def __init__(self, base):
        self.base = base.rstrip('/')
    def detect_anomalies(self, records, schema=None):
        resp = requests.post(f"{self.base}/anomaly/detect", json={'records': records, 'schema': schema}, timeout=120)
        resp.raise_for_status()
        return resp.json()

class NormalizerProxy:
    def __init__(self, base):
        self.base = base.rstrip('/')
    def normalize(self, records, table_name='main'):
        resp = requests.post(f"{self.base}/normalize", json={'records': records, 'table_name': table_name}, timeout=120)
        resp.raise_for_status()
        return resp.json()

class SQLGeneratorProxy:
    def __init__(self, base):
        self.base = base.rstrip('/')
    def generate_sql(self, normalized_tables):
        resp = requests.post(f"{self.base}/generate-sql", json={'normalized_tables': normalized_tables}, timeout=120)
        resp.raise_for_status()
        return resp.json()


def get_parser_engine():
    global parser_engine
    if parser_engine is None and ParserEngine:
        try:
            parser_engine = ParserEngine()
        except Exception as e:
            logger.error(f"ParserEngine init failed: {e}")
            parser_engine = None
    return parser_engine

def get_nlp_mapper():
    global nlp_mapper
    if nlp_mapper is None:
        if USE_ML_WORKER and WORKER_URL:
            try:
                nlp_mapper = NLPMapperProxy(WORKER_URL)
                return nlp_mapper
            except Exception as e:
                logger.error(f"NLP worker proxy init failed: {e}")
                nlp_mapper = None
        if NLPMapper:
            try:
                nlp_mapper = NLPMapper(confidence_threshold=0.85)
            except Exception as e:
                logger.error(f"NLPMapper init failed: {e}")
                nlp_mapper = None
    return nlp_mapper

def get_anomaly_detector():
    global anomaly_detector
    if anomaly_detector is None:
        if USE_ML_WORKER and WORKER_URL:
            try:
                anomaly_detector = AnomalyDetectorProxy(WORKER_URL)
                return anomaly_detector
            except Exception as e:
                logger.error(f"Anomaly worker proxy init failed: {e}")
                anomaly_detector = None
        if AnomalyDetector:
            try:
                anomaly_detector = AnomalyDetector(contamination=0.1)
            except Exception as e:
                logger.error(f"AnomalyDetector init failed: {e}")
                anomaly_detector = None
    return anomaly_detector

def get_normalizer():
    global normalizer
    if normalizer is None:
        if USE_ML_WORKER and WORKER_URL:
            try:
                normalizer = NormalizerProxy(WORKER_URL)
                return normalizer
            except Exception as e:
                logger.error(f"Normalizer worker proxy init failed: {e}")
                normalizer = None
        if Normalizer:
            try:
                normalizer = Normalizer()
            except Exception as e:
                logger.error(f"Normalizer init failed: {e}")
                normalizer = None
    return normalizer

def get_sql_generator():
    global sql_generator
    if sql_generator is None:
        if USE_ML_WORKER and WORKER_URL:
            try:
                sql_generator = SQLGeneratorProxy(WORKER_URL)
                return sql_generator
            except Exception as e:
                logger.error(f"SQLGenerator worker proxy init failed: {e}")
                sql_generator = None
        if SQLGenerator:
            try:
                # Infer dialect from DATABASE_URL
                dialect = 'postgresql'
                if DATABASE_URL.startswith('sqlite'):
                    dialect = 'sqlite'
                sql_generator = SQLGenerator(dialect=dialect)
            except Exception as e:
                logger.error(f"SQLGenerator init failed: {e}")
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
    name: str
    target_database: str
    provider_api_key: Optional[str] = None
    provider_project_id: Optional[str] = None
    database_url: Optional[str] = None

class LoginIn(BaseModel):
    email: str
    password: str

class ForgotPasswordIn(BaseModel):
    email: str

class ResetPasswordIn(BaseModel):
    token: str
    new_password: str

class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    name: Optional[str] = None
    profile_picture_url: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SettingsIn(BaseModel):
    settings: Dict[str, Any]

class SupportChatIn(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    current_path: Optional[str] = None

# --- Database helpers ---
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
    user = User(email=user_in.email, hashed_password=hashed, full_name=user_in.name)
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

async def get_optional_user(authorization: Optional[str] = Header(None), db: Session = Depends(lambda: next(get_db()))):
    if not authorization:
        return None
    try:
        scheme, _, token = authorization.partition(' ')
        if scheme.lower() != 'bearer' or not token:
            return None
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub')
        if not user_id:
            return None
        return db.query(User).filter(User.id == int(user_id)).first()
    except Exception:
        return None

# ============================================
# API Endpoints – Updated with error handling
# ============================================

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...), current_user: Optional[User] = Depends(get_optional_user)):
    """
    Step 1: Upload and parse data file
    Supported formats: JSON, XML, CSV
    """
    session_id = str(uuid.uuid4())
    file_path = os.path.join(TEMP_DIR, f"{session_id}_{file.filename}")

    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # Parse file – wrap in try/except to capture agent failures
        try:
            engine = get_parser_engine()
            if engine:
                result = engine.parse(file_path)
                if not result.success:
                    raise HTTPException(status_code=400, detail=f"Parse error: {result.errors}")
            else:
                # Fallback lightweight parser (same as original)
                from types import SimpleNamespace
                with open(file_path, 'r', encoding='utf-8') as fh:
                    text = fh.read()
                try:
                    data = json.loads(text)
                    records = data if isinstance(data, list) else [data]
                    schema = {}
                    first = records[0] if records else {}
                    for k, v in first.items():
                        schema[k] = SimpleNamespace(data_type=type(v).__name__, nullable=(v is None))
                    result = SimpleNamespace(success=True, file_type='json', record_count=len(records),
                                            schema=schema, schema_drift_detected=False,
                                            drift_details=[], records=records)
                except Exception:
                    import csv
                    reader = csv.DictReader(text.splitlines())
                    records = [r for r in reader]
                    first = records[0] if records else {}
                    schema = {k: SimpleNamespace(data_type='string', nullable=True) for k in first.keys()}
                    result = SimpleNamespace(success=True, file_type='csv', record_count=len(records),
                                            schema=schema, schema_drift_detected=False,
                                            drift_details=[], records=records)

                class _DP:
                    def get_schema_summary(self, s):
                        out = {}
                        for key, val in s.items():
                            out[key] = {'data_type': getattr(val, 'data_type', 'string'), 'nullable': getattr(val, 'nullable', True)}
                        return out
                parser_engine = _DP()
        except Exception as e:
            logger.error(f"ParserEngine failed for session {session_id}: {e}")
            raise HTTPException(status_code=500, detail=f"Parsing failed: {e}")

        # Store session data
        session_data = {
            "created_at": datetime.now().isoformat(),
            "file_path": file_path,
            "file_name": file.filename,
            "user_email": current_user.email if current_user else None,
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

        # Immediate schema mapping – also wrapped in try/except
        try:
            mapper = get_nlp_mapper()
            if mapper:
                mapping_result = mapper.map_schema(list(result.schema.keys()))
                mapping_report = mapper.get_mapping_report(mapping_result)
                mapped_records = mapper.apply_mappings(result.records, mapping_result.mappings)
            else:
                raise RuntimeError("NLP mapper unavailable")
        except Exception as e:
            logger.error(f"Mapping failed for session {session_id}: {e}")
            # Fallback simple mapping (same logic as original fallback)
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
            from difflib import SequenceMatcher
            def normalize(name: str):
                n = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
                n = re.sub(r'_+', '_', n).strip('_')
                return n
            def expand(name: str):
                parts = name.split('_')
                return '_'.join([abbrev.get(p, p) for p in parts])
            def score_candidate(source_name: str, candidate_name: str) -> float:
                source_expanded = expand(source_name)
                cand_expanded = expand(candidate_name)
                source_tokens = set(source_expanded.split('_'))
                cand_tokens = set(cand_expanded.split('_'))
                token_overlap = len(source_tokens & cand_tokens) / max(1, len(source_tokens | cand_tokens))
                seq_ratio = SequenceMatcher(None, source_expanded, cand_expanded).ratio()
                return (0.7 * token_overlap) + (0.3 * seq_ratio)
            for f in list(result.schema.keys()):
                n = normalize(f)
                mapped = None
                confidence = 0.5
                mtype = 'fallback'
                best_standard = None
                best_score = 0.0
                for standard, variants in std.items():
                    standard_norm = normalize(standard)
                    variant_norms = [normalize(v) for v in variants]
                    if n == standard_norm or n in variant_norms:
                        mapped = standard
                        confidence = 0.98
                        mtype = 'exact'
                        break
                    expanded_n = expand(n)
                    expanded_variants = [expand(v) for v in variant_norms]
                    if expanded_n == standard_norm or expanded_n in expanded_variants:
                        mapped = standard
                        confidence = 0.92
                        mtype = 'pattern'
                        break
                    candidate_score = max(
                        [score_candidate(n, standard_norm)] + [score_candidate(n, v) for v in variant_norms]
                    )
                    if candidate_score > best_score:
                        best_score = candidate_score
                        best_standard = standard
                if mapped is None and best_standard and best_score >= 0.62:
                    mapped = best_standard
                    confidence = round(min(0.96, max(0.62, best_score)), 3)
                    mtype = 'semantic'
                if mapped is None:
                    mapped = re.sub(r'[^a-z0-9_]', '_', n)
                    if mapped == '':
                        mapped = 'col_' + str(abs(hash(f)) % 10000)
                    confidence = round(0.45 + ((abs(hash(n)) % 18) / 100.0), 3)
                    unmapped.append(f)
                mappings.append(SimpleNamespace(original_name=f, mapped_name=mapped,
                                               confidence=confidence, mapping_type=mtype))
            avg_conf = sum(m.confidence for m in mappings) / len(mappings) if mappings else 0.0
            mapping_result = SimpleNamespace(success=len(unmapped) < len(list(result.schema.keys())) * 0.3,
                                            mappings=mappings, unmapped_fields=unmapped,
                                            average_confidence=avg_conf,
                                            table_name=("ecommerce_data"))
            mapping_report = {
                'success': mapping_result.success,
                'table_name': mapping_result.table_name,
                'total_fields': len(mapping_result.mappings),
                'high_confidence': len([m for m in mapping_result.mappings if m.confidence >= 0.9]),
                'medium_confidence': len([m for m in mapping_result.mappings if 0.7 <= m.confidence < 0.9]),
                'low_confidence': len([m for m in mapping_result.mappings if m.confidence < 0.7]),
                'average_confidence': round(mapping_result.average_confidence * 100, 1),
                'mappings': [
                    {'from': m.original_name, 'to': m.mapped_name,
                     'confidence': round(m.confidence * 100, 1), 'type': m.mapping_type}
                    for m in mapping_result.mappings
                ]
            }
            mapping_dict = {m.original_name: m.mapped_name for m in mapping_result.mappings}
            mapped_records = []
            for record in result.records