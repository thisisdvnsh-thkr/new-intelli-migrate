import sys, os, json
from pprint import pprint

ROOT = os.path.dirname(os.path.dirname(__file__))
sys.path.insert(0, ROOT)

from backend.agents.anomaly_detector import AnomalyDetector

TEST_FILE = os.path.join(ROOT, 'test_data.json')
if not os.path.exists(TEST_FILE):
    TEST_FILE = os.path.join(ROOT, 'test-data.json')

with open(TEST_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Ensure data is a list of records
if isinstance(data, dict):
    records = [data]
else:
    records = data

print(f"Loaded {len(records)} records from {TEST_FILE}")

ad = AnomalyDetector(contamination=0.05)
report = ad.detect_anomalies(records, schema=None)
summary = ad.get_anomaly_summary(report)

print("Anomaly Summary:")
pprint(summary)

print("Top anomalies (first 10):")
for a in report.anomalies[:10]:
    print(vars(a))

print("Quality score:", report.quality_score)