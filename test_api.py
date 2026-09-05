import urllib.request
import json

endpoints = [
    "http://127.0.0.1:8000/api/v1/health",
    "http://127.0.0.1:8000/api/v1/satellites",
    "http://127.0.0.1:8000/api/v1/conjunctions",
    "http://127.0.0.1:8000/api/v1/analytics",
    "http://127.0.0.1:8000/api/v1/ai/detections",
    "http://127.0.0.1:8000/api/v1/protected-assets",
    "http://127.0.0.1:8000/api/v1/propagate-all",
    "http://127.0.0.1:8000/api/v1/trajectory/25544",
    "http://127.0.0.1:8000/api/v1/forecast?horizon=24h",
    "http://127.0.0.1:8000/api/v1/public-alerts",
    "http://127.0.0.1:8000/api/v1/constellations",
    "http://127.0.0.1:8000/api/v1/space-environment",
    "http://127.0.0.1:8000/api/v1/communication-risk",
    "http://127.0.0.1:8000/api/v1/reentry-risks",
    "http://127.0.0.1:8000/api/v1/neo-warnings"
]

print("=== VERIFYING BACKEND API ENDPOINTS ===")
for url in endpoints:
    try:
        req = urllib.request.Request(url, headers={"Origin": "http://localhost:5173"})
        with urllib.request.urlopen(req) as resp:
            status = resp.getcode()
            data = resp.read()
            cors_header = resp.headers.get("Access-Control-Allow-Origin", "None")
            print(f"[OK {status}] {url} (Bytes: {len(data)}, CORS: {cors_header})")
    except Exception as e:
        print(f"[FAIL] {url}: {e}")
