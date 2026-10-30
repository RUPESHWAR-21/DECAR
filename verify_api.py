import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"
FRONTEND_URL = "http://127.0.0.1:5173"

def test_backend_health():
    print("Testing Backend Health...")
    try:
        resp = requests.get(f"{BASE_URL}/api/health")
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.json()}")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"
        print("✅ Backend Health OK")
    except Exception as e:
        print(f"❌ Backend Health Failed: {e}")

def test_backend_schema():
    print("\nTesting Schema Endpoint...")
    try:
        resp = requests.get(f"{BASE_URL}/api/schema")
        assert resp.status_code == 200
        data = resp.json()
        assert "make_choices" in data
        assert "numeric_fields" in data
        print("✅ Schema Endpoint OK")
    except Exception as e:
        print(f"❌ Schema Endpoint Failed: {e}")

def test_prediction():
    print("\nTesting Prediction...")
    data = {
        "make": "Toyota",
        "model": "Camry",
        "fuel_type": "Gasoline",
        "model_year": 2020,
        "odometer_km": 50000,
        "engine_displacement_l": 2.5
    }
    try:
        resp = requests.post(f"{BASE_URL}/api/predict", json=data)
        print(f"Status: {resp.status_code}")
        result = resp.json()
        print(f"Prediction: {result.get('prediction')}")
        print(f"Probability: {result.get('probability')}")
        assert resp.status_code == 200
        assert "prediction" in result
        print("✅ Prediction OK")
    except Exception as e:
        print(f"❌ Prediction Failed: {e}")

def test_frontend():
    print("\nTesting Frontend Access...")
    try:
        resp = requests.get(FRONTEND_URL)
        print(f"Status: {resp.status_code}")
        assert resp.status_code == 200
        assert "<div id=\"root\"></div>" in resp.text or "vite" in resp.text.lower()
        print("✅ Frontend OK")
    except Exception as e:
        print(f"❌ Frontend Access Failed: {e}")

if __name__ == "__main__":
    print("Starting Verification...")
    test_backend_health()
    test_backend_schema()
    test_prediction()
    test_frontend()
