"""Supabase persistence for predictions (REST API via httpx)."""

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

log = logging.getLogger("db")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

TABLE = "predictions"
_client: Optional[httpx.Client] = None
_last_error: Optional[str] = None


def is_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_ANON_KEY)


def _get_client() -> httpx.Client:
    global _client
    if _client is None:
        _client = httpx.Client(
            base_url=f"{SUPABASE_URL}/rest/v1",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                "Content-Type": "application/json",
            },
            timeout=8.0,
        )
    return _client


def _record_error(message: str) -> None:
    global _last_error
    if message != _last_error:
        log.warning("Supabase: %s", message)
    _last_error = message


def _error_message(resp: httpx.Response) -> str:
    if resp.status_code == 404:
        return "Table 'predictions' not found. Run supabase/schema.sql in the Supabase SQL editor."
    try:
        return resp.json().get("message", resp.text)
    except ValueError:
        return resp.text


def save_prediction(
    source: str,
    raw: Dict[str, Any],
    label: str,
    pred_class: int,
    probability: float,
    driving_mode: Optional[str] = None,
) -> bool:
    """Insert one prediction row. Never raises; returns success."""
    global _last_error
    if not is_configured():
        return False
    row = {
        "source": source,
        "make": raw.get("make"),
        "model": raw.get("model"),
        "model_year": raw.get("model_year"),
        "fuel_type": raw.get("fuel_type"),
        "dtc_codes": list(raw.get("dtc_codes") or []),
        "prediction": label,
        "prediction_class": pred_class,
        "probability": probability,
        "driving_mode": driving_mode,
        "readings": raw,
    }
    try:
        resp = _get_client().post(f"/{TABLE}", json=row, headers={"Prefer": "return=minimal"})
    except httpx.HTTPError as exc:
        _record_error(str(exc))
        return False
    if resp.is_success:
        _last_error = None
        return True
    _record_error(_error_message(resp))
    return False


def list_predictions(source: Optional[str] = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Newest-first prediction rows. Raises RuntimeError with a readable message."""
    global _last_error
    if not is_configured():
        raise RuntimeError("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (backend/.env locally, Environment Variables on Vercel).")
    params = {"select": "*", "order": "created_at.desc", "limit": str(limit)}
    if source in ("manual", "live"):
        params["source"] = f"eq.{source}"
    try:
        resp = _get_client().get(f"/{TABLE}", params=params)
    except httpx.HTTPError as exc:
        _record_error(str(exc))
        raise RuntimeError(str(exc)) from exc
    if not resp.is_success:
        message = _error_message(resp)
        _record_error(message)
        raise RuntimeError(message)
    _last_error = None
    return resp.json()


def status() -> Dict[str, Any]:
    """Check the connection by reading one row."""
    if not is_configured():
        return {"configured": False, "connected": False, "error": "Missing SUPABASE_URL / SUPABASE_ANON_KEY (backend/.env locally, Environment Variables on Vercel)"}
    try:
        list_predictions(limit=1)
        return {"configured": True, "connected": True, "error": None}
    except RuntimeError as exc:
        return {"configured": True, "connected": False, "error": str(exc)}
