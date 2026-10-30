"""XGBoost model loading and prediction logic."""

import json
import math
import struct
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ─────────────────────────────────────────────────────────────────────────────
# FEATURE SCHEMA
# ─────────────────────────────────────────────────────────────────────────────

MAKE_CHOICES = ["Audi", "BMW", "Chevrolet", "Ford", "Honda", "Hyundai", "Kia",
                "Mercedes", "Nissan", "Subaru", "Tesla", "Toyota", "Volkswagen"]

MODEL_CHOICES = ["3 Series", "A4", "Accord", "Altima", "C-Class", "CR-V", "Camry",
                 "Civic", "Corolla", "Elantra", "Equinox", "Escape", "F-150", "Focus",
                 "Forester", "Forte", "GLC", "Golf", "Malibu", "Model 3", "Model S",
                 "Model Y", "Outback", "Passat", "Q5", "RAV4", "Rogue", "Silverado",
                 "Sportage", "Tiguan", "Tucson", "X3"]

FUEL_TYPE_CHOICES = ["Diesel", "Electric", "Gasoline", "Hybrid"]

DTC_CODE_CHOICES = ["", "P0100", "P0101", "P0102", "P0103", "P0104",
                    "P0130", "P0131", "P0132", "P0133", "P0134", "P0135",
                    "P0171", "P0172", "P0217",
                    "P0300", "P0301", "P0302", "P0303", "P0304",
                    "P0420", "P0562", "P0A1F", "P0A80"]

RAW_FEATURE_SCHEMA: List[Dict] = [
    {"name": "make", "kind": "categorical", "choices": MAKE_CHOICES, "default": "Toyota"},
    {"name": "model", "kind": "categorical", "choices": MODEL_CHOICES, "default": "Camry"},
    {"name": "fuel_type", "kind": "categorical", "choices": FUEL_TYPE_CHOICES, "default": "Gasoline"},
    {"name": "dtc_codes", "kind": "dtc", "choices": DTC_CODE_CHOICES, "default": []},
    {"name": "model_year", "kind": "numeric", "default": 2018, "min": 2005, "max": 2025},
    {"name": "odometer_km", "kind": "numeric", "default": 80000, "min": 0, "max": 350000},
    {"name": "engine_displacement_l", "kind": "numeric", "default": 2.5, "min": 0.0, "max": 7.0},
    {"name": "ambient_temp_c", "kind": "numeric", "default": 20.0, "min": -20, "max": 45},
    {"name": "coolant_temp_c", "kind": "numeric", "default": 90.0, "min": 20, "max": 125},
    {"name": "rpm", "kind": "numeric", "default": 2000, "min": 0, "max": 16000},
    {"name": "vehicle_speed_kph", "kind": "numeric", "default": 80, "min": 0, "max": 250},
    {"name": "engine_load_pct", "kind": "numeric", "default": 50.0, "min": 0, "max": 100},
    {"name": "throttle_pos_pct", "kind": "numeric", "default": 30.0, "min": 0, "max": 100},
    {"name": "maf_g_s", "kind": "numeric", "default": 25.0, "min": 0, "max": 300},
    {"name": "map_kpa", "kind": "numeric", "default": 100.0, "min": 20, "max": 250},
    {"name": "intake_air_temp_c", "kind": "numeric", "default": 30.0, "min": -20, "max": 70},
    {"name": "short_term_fuel_trim_pct", "kind": "numeric", "default": 0.0, "min": -25, "max": 25},
    {"name": "long_term_fuel_trim_pct", "kind": "numeric", "default": 0.0, "min": -25, "max": 25},
    {"name": "o2_sensor_v_b1s1", "kind": "numeric", "default": 0.45, "min": 0.0, "max": 1.0},
    {"name": "o2_sensor_v_b1s2", "kind": "numeric", "default": 0.45, "min": 0.0, "max": 1.0},
    {"name": "battery_voltage_v", "kind": "numeric", "default": 13.8, "min": 10.0, "max": 450.0},
]

EXPECTED_COLUMNS = [
    'model_year', 'odometer_km', 'engine_displacement_l', 'ambient_temp_c',
    'coolant_temp_c', 'rpm', 'vehicle_speed_kph', 'engine_load_pct',
    'throttle_pos_pct', 'maf_g_s', 'map_kpa', 'intake_air_temp_c',
    'short_term_fuel_trim_pct', 'long_term_fuel_trim_pct', 'o2_sensor_v_b1s1',
    'o2_sensor_v_b1s2', 'battery_voltage_v',
    'make_BMW', 'make_Chevrolet', 'make_Ford', 'make_Honda', 'make_Hyundai',
    'make_Kia', 'make_Mercedes', 'make_Nissan', 'make_Subaru', 'make_Tesla',
    'make_Toyota', 'make_Volkswagen',
    'model_A4', 'model_Accord', 'model_Altima', 'model_C-Class', 'model_CR-V',
    'model_Camry', 'model_Civic', 'model_Corolla', 'model_Elantra', 'model_Equinox',
    'model_Escape', 'model_F-150', 'model_Focus', 'model_Forester', 'model_Forte',
    'model_GLC', 'model_Golf', 'model_Malibu', 'model_Model 3', 'model_Model S',
    'model_Model Y', 'model_Outback', 'model_Passat', 'model_Q5', 'model_RAV4',
    'model_Rogue', 'model_Silverado', 'model_Sportage', 'model_Tiguan',
    'model_Tucson', 'model_X3',
    'fuel_type_Electric', 'fuel_type_Gasoline', 'fuel_type_Hybrid',
    'dtc_codes_P0100', 'dtc_codes_P0101', 'dtc_codes_P0102', 'dtc_codes_P0103',
    'dtc_codes_P0104', 'dtc_codes_P0130', 'dtc_codes_P0131', 'dtc_codes_P0132',
    'dtc_codes_P0133', 'dtc_codes_P0134', 'dtc_codes_P0135', 'dtc_codes_P0171',
    'dtc_codes_P0172', 'dtc_codes_P0217', 'dtc_codes_P0300', 'dtc_codes_P0301',
    'dtc_codes_P0302', 'dtc_codes_P0303', 'dtc_codes_P0304', 'dtc_codes_P0420',
    'dtc_codes_P0562', 'dtc_codes_P0A1F', 'dtc_codes_P0A80',
]

# ─────────────────────────────────────────────────────────────────────────────
# MODEL LOADING
# ─────────────────────────────────────────────────────────────────────────────

def _f32(x: float) -> float:
    """Round to float32, as XGBoost does before comparing against split values."""
    return struct.unpack("f", struct.pack("f", x))[0]


class _Tree:
    __slots__ = ("left", "right", "feature", "threshold", "default_left")

    def __init__(self, t: Dict[str, Any]):
        self.left = t["left_children"]
        self.right = t["right_children"]
        self.feature = t["split_indices"]
        self.threshold = t["split_conditions"]  # leaf value on leaf nodes
        self.default_left = t["default_left"]

    def leaf_value(self, x: List[Optional[float]]) -> float:
        node = 0
        while self.left[node] != -1:
            v = x[self.feature[node]]
            if v is None:
                go_left = bool(self.default_left[node])
            else:
                go_left = v < self.threshold[node]
            node = self.left[node] if go_left else self.right[node]
        return self.threshold[node]


class OBDIIModel:
    """Pure-Python evaluator for the exported XGBoost model (JSON, gbtree, binary:logistic).

    Avoids shipping xgboost/numpy, which keeps the serverless bundle small.
    """

    def __init__(self, model_path: Path):
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        learner = json.loads(model_path.read_text("utf-8"))["learner"]
        if learner["objective"]["name"] != "binary:logistic":
            raise ValueError("Only binary:logistic models are supported")
        booster = learner["gradient_booster"]
        if booster["name"] != "gbtree":
            raise ValueError("Only gbtree models are supported")
        self.trees = [_Tree(t) for t in booster["model"]["trees"]]
        self.features = learner.get("feature_names") or EXPECTED_COLUMNS
        base_score = float(learner["learner_model_param"]["base_score"].strip("[]"))
        self.base_margin = math.log(base_score / (1 - base_score))

    def preprocess(self, raw: Dict[str, Any]) -> List[Optional[float]]:
        """Convert raw user inputs to the one-hot encoded feature vector."""
        row = {col: 0.0 for col in EXPECTED_COLUMNS}

        # Numeric features
        numeric_cols = [
            'model_year', 'odometer_km', 'engine_displacement_l', 'ambient_temp_c',
            'coolant_temp_c', 'rpm', 'vehicle_speed_kph', 'engine_load_pct',
            'throttle_pos_pct', 'maf_g_s', 'map_kpa', 'intake_air_temp_c',
            'short_term_fuel_trim_pct', 'long_term_fuel_trim_pct', 'o2_sensor_v_b1s1',
            'o2_sensor_v_b1s2', 'battery_voltage_v',
        ]
        for col in numeric_cols:
            if col in raw:
                row[col] = float(raw[col]) if raw[col] is not None else 0.0

        # One-hot encode 'make' (Audi is baseline)
        make_val = raw.get("make", "")
        if make_val and make_val != "Audi":
            col_name = f"make_{make_val}"
            if col_name in row:
                row[col_name] = 1.0

        # One-hot encode 'model' (3 Series is baseline)
        model_val = raw.get("model", "")
        if model_val and model_val != "3 Series":
            col_name = f"model_{model_val}"
            if col_name in row:
                row[col_name] = 1.0

        # One-hot encode 'fuel_type' (Diesel is baseline)
        fuel_val = raw.get("fuel_type", "")
        if fuel_val and fuel_val != "Diesel":
            col_name = f"fuel_type_{fuel_val}"
            if col_name in row:
                row[col_name] = 1.0

        # Multi-hot encode 'dtc_codes'
        dtc_codes = raw.get("dtc_codes", [])
        if isinstance(dtc_codes, str):
            dtc_codes = [c.strip() for c in dtc_codes.split(";") if c.strip()]
        for code in dtc_codes:
            col_name = f"dtc_codes_{code}"
            if col_name in row:
                row[col_name] = 1.0

        return [_f32(row[c]) for c in self.features]

    def predict_proba(self, x: List[Optional[float]]) -> float:
        """Probability of a problem for a preprocessed feature vector."""
        margin = self.base_margin + sum(t.leaf_value(x) for t in self.trees)
        return 1.0 / (1.0 + math.exp(-margin))

    def predict(self, raw: Dict[str, Any]) -> Tuple[str, int, float]:
        """Predict from raw input data. Returns (label, class, probability of a problem)."""
        probability = self.predict_proba(self.preprocess(raw))
        pred_class = int(probability > 0.5)
        label = "Has Problem" if pred_class == 1 else "Normal"
        return label, pred_class, probability


# Global model instance
_model: OBDIIModel = None


def get_model() -> OBDIIModel:
    """Get or create the model instance."""
    global _model
    if _model is None:
        model_path = Path(__file__).parent / "xgboost_obdii_model.json"
        _model = OBDIIModel(model_path)
    return _model


def get_schema() -> Dict[str, Any]:
    """Get the form field schema."""
    numeric_fields = [
        {
            "name": f["name"],
            "label": f["name"].replace("_", " ").title(),
            "default": f["default"],
            "min": f["min"],
            "max": f["max"],
        }
        for f in RAW_FEATURE_SCHEMA if f["kind"] == "numeric"
    ]
    
    return {
        "make_choices": MAKE_CHOICES,
        "model_choices": MODEL_CHOICES,
        "fuel_type_choices": FUEL_TYPE_CHOICES,
        "dtc_code_choices": [c for c in DTC_CODE_CHOICES if c],  # Remove empty
        "numeric_fields": numeric_fields,
    }
