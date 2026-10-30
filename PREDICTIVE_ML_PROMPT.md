# 🔮 PREDICTIVE ML SYSTEM - IMPLEMENTATION GUIDE
## OBD-II Problem Detector with XGBoost & Live Simulation

**Date:** December 18, 2025  
**Status:** Production Ready  
**Stack:** FastAPI (Backend) + React/Vite (Frontend) + XGBoost (ML Model)  

---

## 📋 PROJECT OVERVIEW

### Core Innovation
**Real-time vehicle diagnostics using XGBoost ML model with live WebSocket simulation of OBD-II sensor data.**

**Key Features:**
- **Manual Analysis:** Input vehicle parameters and get instant predictions
- **Live Simulation:** Real-time vehicle sensor simulation with WebSocket updates
- **XGBoost Model:** Pre-trained classifier predicting vehicle problems
- **Modern UI:** React with glassmorphism dark theme

---

## 🎯 HOW IT WORKS

### Manual Analysis Flow
```
User Input → FastAPI Endpoint → XGBoost Model → Prediction Result
     ↓              ↓                  ↓              ↓
  21 Features   /api/predict      Preprocessed    "Normal" or
  (dropdowns,   (POST request)    to 86 one-hot   "Has Problem"
   numbers)                        columns        + probability
```

### Live Simulation Flow
```
Simulator Thread → WebSocket → React Dashboard → Real-time Display
       ↓               ↓              ↓                 ↓
   Generate fake   ws://localhost   useWebSocket     Speed, RPM,
   sensor data     :8000/ws/live    React hook       Gauges, Status
   every 1 second
```

---

## 💻 BACKEND IMPLEMENTATION (FastAPI)

### File Structure
```
backend/
├── main.py           # FastAPI app with endpoints
├── model.py          # XGBoost model loading & prediction
├── simulation.py     # Live vehicle simulation engine
├── schemas.py        # Pydantic request/response models
├── requirements.txt  # Python dependencies
└── xgboost_obdii_model.joblib  # Pre-trained model
```

### API Endpoints

**1. Health Check**
```bash
GET /api/health
Response: {"status": "healthy"}
```

**2. Get Form Schema**
```bash
GET /api/schema
Response: {
  "make_choices": ["Audi", "BMW", "Toyota", ...],
  "model_choices": ["Camry", "Civic", "F-150", ...],
  "fuel_type_choices": ["Gasoline", "Diesel", "Electric", "Hybrid"],
  "dtc_code_choices": ["P0100", "P0171", "P0300", ...],
  "numeric_fields": [
    {"name": "model_year", "min": 2005, "max": 2025, "default": 2018},
    {"name": "odometer_km", "min": 0, "max": 350000, "default": 80000},
    ...
  ]
}
```

**3. Predict Vehicle Status**
```bash
POST /api/predict
Content-Type: application/json

{
  "make": "Toyota",
  "model": "Camry",
  "fuel_type": "Gasoline",
  "dtc_codes": [],
  "model_year": 2020,
  "odometer_km": 50000,
  "rpm": 2000,
  "vehicle_speed_kph": 80,
  "coolant_temp_c": 90,
  ...
}

Response: {
  "prediction": "Normal",       # or "Has Problem"
  "prediction_class": 0,        # 0 = Normal, 1 = Problem
  "probability": 0.15,          # Probability of having a problem
  "input_summary": {...}        # Echo of input data
}
```

**4. Get Live Simulation Data**
```bash
GET /api/live
Response: {
  "timestamp": "14:30:45",
  "prediction": "Normal",
  "probability": 0.12,
  "driving_mode": "cruising",
  "vehicle_data": {
    "vehicle_speed_kph": 85.3,
    "rpm": 2450,
    "coolant_temp_c": 92.1,
    ...
  }
}
```

**5. WebSocket for Real-time Updates**
```javascript
ws://localhost:8000/ws/live

// Receives JSON every 1 second:
{
  "timestamp": "14:30:46",
  "prediction": "Normal",
  "probability": 0.14,
  "driving_mode": "accelerating",
  "vehicle_data": {...}
}
```

---

## 🎨 FRONTEND IMPLEMENTATION (React + Vite)

### File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── VehicleForm.jsx      # 21-field input form
│   │   ├── VehicleForm.css
│   │   ├── ResultsPanel.jsx     # Prediction display
│   │   ├── ResultsPanel.css
│   │   ├── LiveDashboard.jsx    # Real-time gauges
│   │   ├── LiveDashboard.css
│   │   ├── VehicleLog.jsx       # Prediction history
│   │   └── VehicleLog.css
│   ├── hooks/
│   │   └── useWebSocket.js      # WebSocket hook
│   ├── api.js                   # API client functions
│   ├── App.jsx                  # Main app with tabs
│   ├── App.css
│   ├── main.jsx
│   └── index.css                # Global dark theme
├── index.html
├── package.json
└── vite.config.js
```

### Key Components

**VehicleForm.jsx** - Dynamic form with:
- 3 dropdowns (Make, Model, Fuel Type)
- Multi-select DTC codes
- 17 numeric inputs (Year, Odometer, RPM, Speed, Temps, etc.)
- Schema loaded from `/api/schema`

**ResultsPanel.jsx** - Shows:
- Prediction status (Normal/Problem)
- Probability gauge with color coding
- Vehicle summary (Year, Make, Model)
- Active DTC codes

**LiveDashboard.jsx** - Displays:
- Connection status indicator
- Current driving mode
- Speed, RPM, Load, Temp gauges
- Secondary metrics (MAF, MAP, O2 sensors)
- Live probability gauge

---

## 📊 ML MODEL DETAILS

### Input Features (21 raw → 86 one-hot encoded)

| Category | Features |
|----------|----------|
| **Categorical** | make, model, fuel_type, dtc_codes |
| **Vehicle Info** | model_year, odometer_km, engine_displacement_l |
| **Temperatures** | ambient_temp_c, coolant_temp_c, intake_air_temp_c |
| **Engine** | rpm, vehicle_speed_kph, engine_load_pct, throttle_pos_pct |
| **Airflow** | maf_g_s, map_kpa |
| **Fuel System** | short_term_fuel_trim_pct, long_term_fuel_trim_pct |
| **Sensors** | o2_sensor_v_b1s1, o2_sensor_v_b1s2, battery_voltage_v |

### One-Hot Encoding
- **Make:** 12 dummies (Audi is baseline)
- **Model:** 31 dummies (3 Series is baseline)
- **Fuel Type:** 3 dummies (Diesel is baseline)
- **DTC Codes:** 23 binary flags

### Prediction Output
```python
prediction = "Normal" if class == 0 else "Has Problem"
probability = model.predict_proba(X)[0][1]  # P(Has Problem)
```

---

## 🚀 QUICK START

### Terminal 1: Backend
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```
> Server at: http://localhost:8000

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
> App at: http://localhost:5173

---

## 🎬 DEMO FLOW (5 Minutes)

### 0:00-1:00 | Introduction
"This system predicts vehicle problems using an XGBoost classifier trained on OBD-II sensor data."

### 1:00-2:00 | Manual Analysis
1. Select Make: Toyota, Model: Camry, Year: 2018
2. Adjust sensor values or use defaults
3. Click "Analyze Vehicle"
4. Show prediction result and probability

### 2:00-3:30 | Live Dashboard
1. Click "Live Dashboard" tab
2. Show real-time WebSocket connection
3. Watch driving mode changes (Idle → Accelerating → Cruising)
4. Point out live gauges updating every second
5. Show prediction changing in real-time

### 3:30-4:30 | Technical Deep Dive
- "21 input features preprocessed to 86 one-hot columns"
- "XGBoost model provides probability scores"
- "WebSocket enables 1-second update intervals"
- "React frontend with modern glassmorphism design"

### 4:30-5:00 | Conclusion
"Real-time vehicle diagnostics with machine learning - scalable to fleet management."

---

## 🧪 TESTING CHECKLIST

### Backend Tests
```bash
# Health check
curl http://localhost:8000/api/health

# Schema endpoint
curl http://localhost:8000/api/schema

# Prediction
curl -X POST http://localhost:8000/api/predict \
  -H "Content-Type: application/json" \
  -d '{"make":"Toyota","model":"Camry","fuel_type":"Gasoline"}'

# Live data
curl http://localhost:8000/api/live
```

### Frontend Tests
- [ ] Form loads with dropdowns populated
- [ ] Submit returns prediction
- [ ] Results panel shows status and probability
- [ ] Live Dashboard connects via WebSocket
- [ ] Gauges update every second
- [ ] Prediction log accumulates entries
- [ ] Mobile responsive layout works

---

## 🔧 TROUBLESHOOTING

### CORS Error
Ensure `main.py` has correct origins:
```python
allow_origins=["http://localhost:5173", "http://localhost:5174"]
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### WebSocket Not Connecting
- Check backend is running on port 8000
- Verify no firewall blocking WebSocket
- Check browser console for errors

---

## 📞 FILES REFERENCE

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI endpoints |
| `backend/model.py` | XGBoost model wrapper |
| `backend/simulation.py` | Live data simulation |
| `backend/schemas.py` | Pydantic models |
| `frontend/src/App.jsx` | Main React app |
| `frontend/src/components/*.jsx` | UI components |
| `frontend/src/hooks/useWebSocket.js` | WebSocket hook |

---

**Good luck with your presentation! 🚀**