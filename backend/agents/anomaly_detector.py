"""
Agent 3: Anomaly Detector
Detects data quality issues, outliers, invalid formats, and business rule violations.
Uses Isolation Forest for statistical anomalies + rule-based validation.
"""

import re
from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, field
from datetime import datetime
import json


@dataclass
class Anomaly:
    """Represents a detected anomaly"""
    record_index: int
    field_name: str
    anomaly_type: str
    severity: str  # 'critical', 'warning', 'info'
    description: str
    original_value: Any
    suggested_fix: Optional[str] = None


@dataclass
class AnomalyReport:
    """Complete anomaly detection report"""
    total_records: int
    clean_records: int
    anomalous_records: int
    anomalies: List[Anomaly]
    quality_score: float  # 0-100
    field_quality: Dict[str, float]
    records_to_remove: List[int]
    cleaned_records: List[Dict]


class AnomalyDetector:
    """
    Agent 3: Data Quality & Anomaly Detection
    
    Capabilities:
    - Statistical anomaly detection using Isolation Forest
    - Pattern validation (email, phone, date formats)
    - Business rule validation
    - Null/missing value analysis
    - Duplicate detection
    - Outlier detection for numeric fields
    - Data type consistency checking
    """
    
    # Validation patterns
    PATTERNS = {
        'email': r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        'phone': r'^[\d\s\-\+\(\)]{7,20}$',
        'date_iso': r'^\d{4}-\d{2}-\d{2}$',
        'date_us': r'^\d{2}/\d{2}/\d{4}$',
        'zip_us': r'^\d{5}(-\d{4})?$',
        'url': r'^https?://[^\s]+$',
        'currency': r'^\$?[\d,]+\.?\d{0,2}$',
    }
    
    # Field type hints based on name patterns
    FIELD_TYPE_HINTS = {
        'email': ['email', 'e_mail', 'mail'],
        'phone': ['phone', 'tel', 'mobile', 'cell', 'contact'],
        'date': ['date', 'dt', 'created', 'updated', 'modified', 'timestamp'],
        'zip': ['zip', 'postal', 'postcode', 'pin'],
        'url': ['url', 'link', 'website', 'href'],
        'currency': ['price', 'amount', 'cost', 'total', 'salary', 'payment'],
    }
    
    def __init__(self, contamination: float = 0.1):
        """
        Args:
            contamination: Expected proportion of outliers (0.0 to 0.5)
        """
        self.contamination = contamination
        self.isolation_forest = None
        self._ml_loaded = False
    
    def _load_ml_model(self):
        """Load Isolation Forest model (lazy loading)"""
        if self._ml_loaded:
            return
        try:
            from sklearn.ensemble import IsolationForest
            self.isolation_forest = IsolationForest(
                contamination=self.contamination,
                random_state=42,
                n_estimators=100
            )
            print("Anomaly Detection Model loaded: IsolationForest")
            self._ml_loaded = True
        except ImportError:
            print("scikit-learn not installed. Using rule-based detection only.")
            self.isolation_forest = None
            self._ml_loaded = True
    
    def detect_anomalies(self, records: List[Dict], schema: Dict = None) -> AnomalyReport:
        """
        Main anomaly detection pipeline
        """
        if not records:
            return AnomalyReport(
                total_records=0, clean_records=0, anomalous_records=0,
                anomalies=[], quality_score=100.0, field_quality={},
                records_to_remove=[], cleaned_records=[]
            )
        
        anomalies = []
        
        try:
            # 1. Null/missing value detection
            anomalies.extend(self._detect_null_values(records))
            
            # 2. Data type consistency
            anomalies.extend(self._detect_type_inconsistencies(records, schema))
            
            # 3. Pattern validation
            anomalies.extend(self._detect_pattern_violations(records))
            
            # 4. Statistical outliers (if ML available) - lazy load
            if not self._ml_loaded:
                self._load_ml_model()
            if self.isolation_forest:
                try:
                    anomalies.extend(self._detect_statistical_outliers(records))
                except Exception as e:
                    print(f"Statistical outlier detection skipped: {e}")
            
            # 5. Duplicate detection
            anomalies.extend(self._detect_duplicates(records))
            
            # 6. Business rule violations
            anomalies.extend(self._detect_business_rule_violations(records))
        except Exception as e:
            print(f"⚠️ Anomaly detection error: {e}")
        
        # Calculate quality metrics
        anomalous_indices = set(a.record_index for a in anomalies if a.severity == 'critical')
        critical_indices = list(anomalous_indices)
        
        # Calculate field quality scores
        field_quality = self._calculate_field_quality(records, anomalies)
        
        # Overall quality score
        quality_score = self._calculate_quality_score(records, anomalies)
        
        # Clean records (remove critical anomalies)
        cleaned_records = [
            record for i, record in enumerate(records)
            if i not in anomalous_indices
        ]
        
        return AnomalyReport(
            total_records=len(records),
            clean_records=len(cleaned_records),
            anomalous_records=len(anomalous_indices),
            anomalies=anomalies,
            quality_score=quality_score,
            field_quality=field_quality,
            records_to_remove=critical_indices,
            cleaned_records=cleaned_records
        )
    
    def _detect_null_values(self, records: List[Dict]) -> List[Anomaly]:
        """Detect null, empty, or missing values"""
        anomalies = []
        all_fields = set()
        
        for record in records:
            all_fields.update(record.keys())
        
        for i, record in enumerate(records):
            # Missing fields
            for field in all_fields:
                if field not in record:
                    anomalies.append(Anomaly(
                        record_index=i,
                        field_name=field,
                        anomaly_type='missing_field',
                        severity='warning',
                        description=f"Field '{field}' is missing from record",
                        original_value=None,
                        suggested_fix='Add field with NULL or default value'
                    ))
            
            # Null/empty values
            for field, value in record.items():
                if value is None or value == '' or (isinstance(value, str) and value.strip() == ''):
                    anomalies.append(Anomaly(
                        record_index=i,
                        field_name=field,
                        anomaly_type='null_value',
                        severity='info',
                        description=f"Field '{field}' has null/empty value",
                        original_value=value
                    ))
        
        return anomalies
    
    def _detect_type_inconsistencies(self, records: List[Dict], schema: Dict = None) -> List[Anomaly]:
        """Detect type inconsistencies across records"""
        anomalies = []
        field_types = {}
        
        # Build expected types from first 10 records
        for record in records[:10]:
            for field, value in record.items():
                if value is not None and value != '':
                    detected_type = type(value).__name__
                    if field not in field_types:
                        field_types[field] = detected_type
        
        # Check all records
        for i, record in enumerate(records):
            for field, value in record.items():
                if value is None or value == '':
                    continue
                
                detected_type = type(value).__name__
                expected_type = field_types.get(field, detected_type)
                
                if detected_type != expected_type:
                    anomalies.append(Anomaly(
                        record_index=i,
                        field_name=field,
                        anomaly_type='type_mismatch',
                        severity='warning',
                        description=f"Expected {expected_type}, got {detected_type}",
                        original_value=value,
                        suggested_fix=f"Convert to {expected_type}"
                    ))
        
        return anomalies
    
    def _detect_pattern_violations(self, records: List[Dict]) -> List[Anomaly]:
        """Detect pattern violations (invalid emails, phones, etc.)"""
        anomalies = []
        
        for i, record in enumerate(records):
            for field, value in record.items():
                if value is None or value == '':
                    continue
                
                str_value = str(value).strip()
                field_lower = field.lower()
                
                # Detect field type and validate
                for pattern_type, field_hints in self.FIELD_TYPE_HINTS.items():
                    if any(hint in field_lower for hint in field_hints):
                        if pattern_type == 'email':
                            if not re.match(self.PATTERNS['email'], str_value):
                                anomalies.append(Anomaly(
                                    record_index=i,
                                    field_name=field,
                                    anomaly_type='invalid_email',
                                    severity='critical',
                                    description='Invalid email format',
                                    original_value=value,
                                    suggested_fix='Remove or fix email format'
                                ))
                        
                        elif pattern_type == 'phone':
                            if not re.match(self.PATTERNS['phone'], str_value):
                                anomalies.append(Anomaly(
                                    record_index=i,
                                    field_name=field,
                                    anomaly_type='invalid_phone',
                                    severity='warning',
                                    description='Invalid phone format',
                                    original_value=value
                                ))
                        
                        elif pattern_type == 'date':
                            if not (re.match(self.PATTERNS['date_iso'], str_value) or 
                                    re.match(self.PATTERNS['date_us'], str_value)):
                                # Try to parse as date
                                try:
                                    datetime.fromisoformat(str_value.replace('Z', '+00:00'))
                                except:
                                    anomalies.append(Anomaly(
                                        record_index=i,
                                        field_name=field,
                                        anomaly_type='invalid_date',
                                        severity='warning',
                                        description='Invalid date format',
                                        original_value=value,
                                        suggested_fix='Use ISO format: YYYY-MM-DD'
                                    ))
        
        return anomalies
    
    def _detect_statistical_outliers(self, records: List[Dict]) -> List[Anomaly]:
        """Detect statistical outliers using Isolation Forest"""
        anomalies = []
        
        if not self.isolation_forest:
            return anomalies
        
        # Extract numeric fields
        numeric_fields = []
        for field in records[0].keys():
            values = [self._to_numeric(r.get(field)) for r in records]
            if any(v is not None for v in values):
                numeric_fields.append(field)
        
        if not numeric_fields:
            return anomalies
        
        # Build feature matrix
        import numpy as np
        
        feature_matrix = []
        for record in records:
            row = []
            for field in numeric_fields:
                value = self._to_numeric(record.get(field))
                row.append(value if value is not None else 0)
            feature_matrix.append(row)
        
        feature_matrix = np.array(feature_matrix)
        
        # Handle all-zero columns
        valid_cols = feature_matrix.std(axis=0) > 0
        if not any(valid_cols):
            return anomalies
        
        feature_matrix = feature_matrix[:, valid_cols]
        valid_fields = [f for i, f in enumerate(numeric_fields) if valid_cols[i]]
        
        try:
            # Fit and predict
            predictions = self.isolation_forest.fit_predict(feature_matrix)
            
            for i, pred in enumerate(predictions):
                if pred == -1:  # Outlier
                    anomalies.append(Anomaly(
                        record_index=i,
                        field_name='_record',
                        anomaly_type='statistical_outlier',
                        severity='warning',
                        description='Record is a statistical outlier',
                        original_value=str(records[i])[:100]
                    ))
        except Exception as e:
            print(f"⚠️ Statistical outlier detection failed: {e}")
        
        return anomalies
    
    def _to_numeric(self, value) -> Optional[float]:
        """Convert value to numeric if possible"""
        if value is None or value == '':
            return None
        
        if isinstance(value, (int, float)):
            return float(value)
        
        try:
            # Remove currency symbols and commas
            str_val = str(value).replace('$', '').replace(',', '').strip()
            return float(str_val)
        except:
            return None
    
    def _detect_duplicates(self, records: List[Dict]) -> List[Anomaly]:
        """Detect duplicate records"""
        anomalies = []
        seen = {}
        
        for i, record in enumerate(records):
            # Create a hashable key from record
            key = json.dumps(record, sort_keys=True, default=str)
            
            if key in seen:
                anomalies.append(Anomaly(
                    record_index=i,
                    field_name='_record',
                    anomaly_type='duplicate',
                    severity='warning',
                    description=f'Duplicate of record {seen[key]}',
                    original_value=None,
                    suggested_fix='Remove duplicate record'
                ))
            else:
                seen[key] = i
        
        return anomalies
    
    def _detect_business_rule_violations(self, records: List[Dict]) -> List[Anomaly]:
        """Detect business rule violations"""
        anomalies = []
        
        for i, record in enumerate(records):
            # Negative amounts/quantities
            for field, value in record.items():
                field_lower = field.lower()
                numeric_val = self._to_numeric(value)
                
                if numeric_val is not None:
                    # Negative prices/amounts
                    if any(kw in field_lower for kw in ['price', 'amount', 'total', 'cost', 'quantity', 'qty']):
                        if numeric_val < 0:
                            anomalies.append(Anomaly(
                                record_index=i,
                                field_name=field,
                                anomaly_type='negative_value',
                                severity='critical',
                                description=f'{field} should not be negative',
                                original_value=value,
                                suggested_fix='Use absolute value or remove record'
                            ))
                    
                    # Zero quantity with non-zero amount
                    if 'quantity' in field_lower or 'qty' in field_lower:
                        if numeric_val == 0:
                            # Check if there's an amount field that's non-zero
                            for other_field in record:
                                if 'amount' in other_field.lower() or 'total' in other_field.lower():
                                    other_val = self._to_numeric(record[other_field])
                                    if other_val and other_val > 0:
                                        anomalies.append(Anomaly(
                                            record_index=i,
                                            field_name=field,
                                            anomaly_type='zero_quantity_with_amount',
                                            severity='warning',
                                            description='Zero quantity but non-zero amount',
                                            original_value=value
                                        ))
        
        return anomalies
    
    def _calculate_field_quality(self, records: List[Dict], anomalies: List[Anomaly]) -> Dict[str, float]:
        """Calculate quality score per field"""
        if not records:
            return {}
        
        all_fields = set()
        for record in records:
            all_fields.update(record.keys())
        
        field_anomaly_counts = {field: 0 for field in all_fields}
        for anomaly in anomalies:
            if anomaly.field_name in field_anomaly_counts:
                field_anomaly_counts[anomaly.field_name] += 1
        
        field_quality = {}
        for field in all_fields:
            anomaly_rate = field_anomaly_counts[field] / len(records)
            field_quality[field] = round(max(0, (1 - anomaly_rate)) * 100, 1)
        
        return field_quality
    
    def _calculate_quality_score(self, records: List[Dict], anomalies: List[Anomaly]) -> float:
        """Calculate overall data quality score (0-100)"""
        if not records:
            return 100.0
        
        # Weight by severity
        severity_weights = {'critical': 3, 'warning': 1, 'info': 0.5}
        
        total_weight = sum(severity_weights.get(a.severity, 1) for a in anomalies)
        max_weight = len(records) * 3  # Assume worst case: 1 critical per record
        
        if max_weight == 0:
            return 100.0
        
        quality = max(0, (1 - total_weight / max_weight)) * 100
        return round(quality, 1)
    
    def get_anomaly_summary(self, report: AnomalyReport) -> Dict:
        """Get human-readable anomaly summary"""
        anomaly_types = {}
        for a in report.anomalies:
            key = a.anomaly_type
            if key not in anomaly_types:
                anomaly_types[key] = {'count': 0, 'severity': a.severity}
            anomaly_types[key]['count'] += 1
        
        return {
            'quality_score': report.quality_score,
            'total_records': report.total_records,
            'clean_records': report.clean_records,
            'removed_records': report.anomalous_records,
            'anomaly_breakdown': anomaly_types,
            'field_quality': report.field_quality,
            'top_issues': [
                {
                    'type': a.anomaly_type,
                    'field': a.field_name,
                    'description': a.description,
                    'severity': a.severity
                }
                for a in report.anomalies[:10]
            ]
        }
