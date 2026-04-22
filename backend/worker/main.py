"""ML Worker service for heavy ML agents.
Exposes simple HTTP endpoints the web service can call to run NLP, anomaly detection,
normalization and SQL generation. Agents are lazy-loaded inside this worker.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import os
import json
from typing import List, Dict, Any, Optional

# Ensure parent 'backend' is on path to import agents
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from agents.nlp_mapper import NLPMapper, SchemaMappingResult
    from agents.anomaly_detector import AnomalyDetector, AnomalyReport
    from agents.normalizer import Normalizer, NormalizationResult
    from agents.sql_generator import SQLGenerator, SQLScript
except Exception as e:
    # If imports fail, we still run and return clear errors
    NLPMapper = None
    AnomalyDetector = None
    Normalizer = None
    SQLGenerator = None
    print(f"Worker import warning: {e}")

app = FastAPI(title='Intelli-Migrate ML Worker')

# Lazy instances
_nlp = None
_anom = None
_norm = None
_sqlg = None

@app.post('/health')
def health():
    return {"status": "healthy", "ml": bool(NLPMapper and AnomalyDetector and Normalizer and SQLGenerator)}

class MapRequest(BaseModel):
    source_fields: List[str]
    domain: Optional[str] = 'ecommerce'

@app.post('/nlp/map')
def nlp_map(req: MapRequest):
    global _nlp
    if NLPMapper is None:
        raise HTTPException(status_code=500, detail='NLPMapper not available on worker')
    try:
        if _nlp is None:
            _nlp = NLPMapper(confidence_threshold=0.85)
        res = _nlp.map_schema(req.source_fields, req.domain)
        # Return as dict
        return json.loads(json.dumps(res, default=lambda o: o.__dict__))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AnomRequest(BaseModel):
    records: List[Dict[str, Any]]
    schema: Optional[Dict[str, Any]] = None

@app.post('/anomaly/detect')
def anomaly_detect(req: AnomRequest):
    global _anom
    if AnomalyDetector is None:
        raise HTTPException(status_code=500, detail='AnomalyDetector not available on worker')
    try:
        if _anom is None:
            _anom = AnomalyDetector(contamination=0.1)
        report = _anom.detect_anomalies(req.records, req.schema)
        return json.loads(json.dumps(report, default=lambda o: o.__dict__))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class NormRequest(BaseModel):
    records: List[Dict[str, Any]]
    table_name: Optional[str] = 'main'

@app.post('/normalize')
def normalize(req: NormRequest):
    global _norm
    if Normalizer is None:
        raise HTTPException(status_code=500, detail='Normalizer not available on worker')
    try:
        if _norm is None:
            _norm = Normalizer()
        result = _norm.normalize(req.records, req.table_name)
        return json.loads(json.dumps(result, default=lambda o: o.__dict__))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SQLRequest(BaseModel):
    normalized_tables: List[Dict[str, Any]]

@app.post('/generate-sql')
def generate_sql(req: SQLRequest):
    global _sqlg
    if SQLGenerator is None:
        raise HTTPException(status_code=500, detail='SQLGenerator not available on worker')
    try:
        if _sqlg is None:
            _sqlg = SQLGenerator(dialect='postgresql')
        script = _sqlg.generate_sql(req.normalized_tables)
        return json.loads(json.dumps(script, default=lambda o: o.__dict__))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
