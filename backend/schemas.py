"""Pydantic schemas for API request/response validation."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class VehicleInput(BaseModel):
    """Raw vehicle input data from the user."""
    # Categorical
    make: str = Field(default="Toyota", description="Vehicle manufacturer")
    model: str = Field(default="Camry", description="Vehicle model")
    fuel_type: str = Field(default="Gasoline", description="Fuel type")
    dtc_codes: List[str] = Field(default=[], description="Diagnostic Trouble Codes")
    
    # Numeric
    model_year: int = Field(default=2018, ge=2005, le=2025)
    odometer_km: float = Field(default=80000, ge=0, le=350000)
    engine_displacement_l: float = Field(default=2.5, ge=0.0, le=7.0)
    ambient_temp_c: float = Field(default=20.0, ge=-20, le=45)
    coolant_temp_c: float = Field(default=90.0, ge=20, le=125)
    rpm: float = Field(default=2000, ge=0, le=16000)
    vehicle_speed_kph: float = Field(default=80, ge=0, le=250)
    engine_load_pct: float = Field(default=50.0, ge=0, le=100)
    throttle_pos_pct: float = Field(default=30.0, ge=0, le=100)
    maf_g_s: float = Field(default=25.0, ge=0, le=300)
    map_kpa: float = Field(default=100.0, ge=20, le=250)
    intake_air_temp_c: float = Field(default=30.0, ge=-20, le=70)
    short_term_fuel_trim_pct: float = Field(default=0.0, ge=-25, le=25)
    long_term_fuel_trim_pct: float = Field(default=0.0, ge=-25, le=25)
    o2_sensor_v_b1s1: float = Field(default=0.45, ge=0.0, le=1.0)
    o2_sensor_v_b1s2: float = Field(default=0.45, ge=0.0, le=1.0)
    battery_voltage_v: float = Field(default=13.8, ge=10.0, le=450.0)


class LiveVehicle(BaseModel):
    """Identity of the vehicle running in the live simulation."""
    make: str = Field(default="Toyota")
    model: str = Field(default="Camry")
    model_year: int = Field(default=2018, ge=2005, le=2025)
    fuel_type: str = Field(default="Gasoline")
    odometer_km: float = Field(default=80000, ge=0, le=350000)
    engine_displacement_l: float = Field(default=2.5, ge=0.0, le=7.0)


class LiveRequest(BaseModel):
    """Live reading request: which vehicle, when its engine started, and whether to store it."""
    vehicle: LiveVehicle = Field(default_factory=LiveVehicle)
    started_at: float = Field(description="Unix seconds when the engine was started")
    save: bool = False


class PredictionResponse(BaseModel):
    """Response from prediction endpoint."""
    prediction: str  # "Normal" or "Has Problem"
    prediction_class: int  # 0 or 1
    probability: float  # Probability of having a problem
    input_summary: Dict[str, Any]  # Echo of input data
    saved: bool = False  # Whether the row was stored in Supabase


class LiveDataResponse(BaseModel):
    """Response for live simulation data."""
    timestamp: str
    prediction: str
    prediction_class: int
    probability: float
    vehicle_data: Dict[str, Any]
    driving_mode: str


class SchemaResponse(BaseModel):
    """Response containing form field schema."""
    make_choices: List[str]
    model_choices: List[str]
    fuel_type_choices: List[str]
    dtc_code_choices: List[str]
    numeric_fields: List[Dict[str, Any]]
