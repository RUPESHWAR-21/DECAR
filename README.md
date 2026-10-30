# OBD Diagnostics Center

A vehicle diagnostics dashboard. An XGBoost model scores OBD-II sensor readings as **Normal** or **Has Problem**, both for a simulated live vehicle and for readings entered by hand. Every check is stored in Supabase.

- **Frontend:** React + Vite (`frontend/`)
- **API:** FastAPI (`backend/`), deployed on Vercel as a Python serverless function (`api/index.py`)
- **Database:** Supabase (`supabase/schema.sql`)

## Run locally (Windows)

1. Create the Python environment once:

   ```bash
   python -m venv .venv
   .venv\Scripts\pip install -r backend\requirements.txt
   ```

2. Copy `backend/.env.example` to `backend/.env` and fill in your Supabase URL and anon key.
3. Start both servers with `run_app.bat`, then open http://localhost:5173.

## Database setup (once)

In the Supabase dashboard, open **SQL Editor**, paste `supabase/schema.sql`, and click **Run**.

## Deploy to Vercel

1. Import this GitHub repository in Vercel (**Add New → Project**). Leave **Root Directory** as the repository root. `vercel.json` already sets the build command, output folder and API function.
2. Under **Settings → Environment Variables**, add:
   - `SUPABASE_URL`: your project URL
   - `SUPABASE_ANON_KEY`: your anon key
3. Deploy. The site and the API (`/api/...`) are served from the same domain.

## How it works

- **No server state.** Each live reading is calculated from the chosen vehicle, the time its engine was started, and the current time. The browser remembers the vehicle and polls `POST /api/live` once a second. Every tenth reading is saved to Supabase.
- **Small, fast function.** The model runs in plain Python from `backend/xgboost_obdii_model.json` (the trees exported from the original XGBoost model). Its output matches XGBoost.
- **Car photos.** Pictures come from Wikimedia Commons with the background removed (`tools/fetch_car_photos.py`). Credits are kept in `frontend/src/carPhotos.json` and shown under each photo. To use your own image, put `<make>-<model>.png` in `frontend/public/cars/`.
