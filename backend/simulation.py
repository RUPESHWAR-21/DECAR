"""Stateless live vehicle simulation.

Each reading is a pure function of (vehicle, engine start time, current second), so any
server instance - including short-lived serverless functions - produces the same smooth
stream without background threads or shared memory.
"""

import math
import random
import time
from datetime import datetime, timezone
from typing import Any, Dict, Tuple

from model import RAW_FEATURE_SCHEMA, get_model

_BASE_DEFAULTS = {meta["name"]: meta.get("default") for meta in RAW_FEATURE_SCHEMA}
_LIMITS = {m["name"]: (m["min"], m["max"]) for m in RAW_FEATURE_SCHEMA if m["kind"] == "numeric"}

# A repeating 3-minute drive: (phase end second, mode, target speed at phase end).
_CYCLE = [
    (15, "idle", 0),
    (35, "accelerating", 62),
    (80, "cruising", 66),
    (98, "decelerating", 18),
    (118, "accelerating", 95),
    (155, "cruising", 98),
    (180, "decelerating", 0),
]
_CYCLE_LEN = _CYCLE[-1][0]
_DTC_POOL = ["P0171", "P0300", "P0420", "P0562"]


def _clamp(name: str, value: float) -> float:
    lo, hi = _LIMITS.get(name, (value, value))
    return max(lo, min(hi, value))


def _noise(key: str, t: float, scale: float) -> float:
    """Smooth pseudo-random noise in [-scale, scale], interpolated between whole seconds."""
    i = math.floor(t)
    a = random.Random(f"{key}:{i}").uniform(-1, 1)
    b = random.Random(f"{key}:{i + 1}").uniform(-1, 1)
    f = t - i
    f = f * f * (3 - 2 * f)
    return (a + (b - a) * f) * scale


def _drive_state(t: float) -> Tuple[str, float]:
    """Driving mode and speed (km/h) at second t of the cycle."""
    pos = t % _CYCLE_LEN
    start, prev_speed = 0, 0.0
    for end, mode, target in _CYCLE:
        if pos < end:
            f = (pos - start) / (end - start)
            if mode in ("accelerating", "decelerating"):
                f = 0.5 - 0.5 * math.cos(math.pi * f)
            return mode, prev_speed + (target - prev_speed) * f
        start, prev_speed = end, float(target)
    return "idle", 0.0


def simulate_reading(vehicle: Dict[str, Any], started_at: float, now: float) -> Tuple[Dict[str, Any], str]:
    """Build a full model input for the vehicle at time `now` (unix seconds)."""
    key = f"{vehicle.get('make')}-{vehicle.get('model')}-{int(started_at)}"
    run = max(0.0, now - started_at)
    mode, speed = _drive_state(run)
    speed = max(0.0, speed + _noise(key + "spd", now, 1.5)) if speed > 1 else 0.0

    ambient = _BASE_DEFAULTS["ambient_temp_c"]
    warm = 1 - math.exp(-run / 150)  # ~5 minutes to operating temperature

    if mode == "idle":
        rpm = 780 + _noise(key + "rpm", now, 40)
        throttle, load = 2.5, 18.0
    elif mode == "accelerating":
        rpm = 1600 + speed * 28
        throttle, load = 55.0, 68.0
    elif mode == "cruising":
        rpm = 1150 + speed * 18
        throttle, load = 24.0, 36.0
    else:
        rpm = 950 + speed * 14
        throttle, load = 4.0, 16.0
    rpm += _noise(key + "rpm2", now, 90)
    throttle += _noise(key + "thr", now, 4)
    load += _noise(key + "load", now, 5)

    maf = 2.5 + rpm * load / 4200
    map_kpa = 30 + load * 0.75 + _noise(key + "map", now, 3)
    coolant = ambient + (91 - ambient) * warm + _noise(key + "cool", now, 0.8)
    iat = ambient + 8 + warm * 6 + _noise(key + "iat", now, 1.5)
    stft = _noise(key + "stft", now * 1.7, 4)
    ltft = 1.2 + _noise(key + "ltft", now / 40, 1.5)
    if warm > 0.35:
        o2_up = 0.45 + 0.38 * math.sin(now * 2.3) + _noise(key + "o2a", now, 0.05)
        o2_down = 0.62 + _noise(key + "o2b", now / 3, 0.06)
    else:
        o2_up = 0.2 + _noise(key + "o2a", now, 0.08)
        o2_down = 0.2 + _noise(key + "o2b", now, 0.08)
    battery = (13.9 if rpm > 600 else 12.6) + _noise(key + "bat", now / 2, 0.25)
    if vehicle.get("fuel_type") == "Electric":
        battery = 395 + _noise(key + "bat", now / 2, 3)

    # Occasionally raise a fault code for a 60 s window.
    window = int(now // 60)
    rng = random.Random(f"{key}:dtc:{window}")
    dtc_codes = [rng.choice(_DTC_POOL)] if rng.random() < 0.12 else []

    reading = {
        **_BASE_DEFAULTS,
        **vehicle,
        "dtc_codes": dtc_codes,
        "rpm": rpm,
        "vehicle_speed_kph": speed,
        "engine_load_pct": load,
        "throttle_pos_pct": throttle,
        "maf_g_s": maf,
        "map_kpa": map_kpa,
        "coolant_temp_c": coolant,
        "intake_air_temp_c": iat,
        "short_term_fuel_trim_pct": stft,
        "long_term_fuel_trim_pct": ltft,
        "o2_sensor_v_b1s1": o2_up,
        "o2_sensor_v_b1s2": o2_down,
        "battery_voltage_v": battery,
    }
    for name in _LIMITS:
        if name not in vehicle and isinstance(reading.get(name), (int, float)):
            reading[name] = _clamp(name, float(reading[name]))
    return reading, mode


def get_live_prediction(vehicle: Dict[str, Any], started_at: float, now: float = None) -> Dict[str, Any]:
    """Live reading for the vehicle plus the model's verdict."""
    now = time.time() if now is None else now
    reading, mode = simulate_reading(vehicle, started_at, now)
    label, pred_class, probability = get_model().predict(reading)
    return {
        "timestamp": datetime.fromtimestamp(now, timezone.utc).isoformat(),
        "prediction": label,
        "prediction_class": pred_class,
        "probability": probability,
        "vehicle_data": reading,
        "driving_mode": mode,
    }
