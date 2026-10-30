import { useState } from 'react';
import Icon from './Icon';
import CarFigure from './CarFigure';
import { getLive, predict } from '../api';
import { loadLiveSession } from '../liveVehicle';
import { DTC_DESCRIPTIONS, FIELDS, MODELS_BY_MAKE, formatPct } from '../fields';
import './AnalyzeView.css';

const DEFAULTS = {
  make: 'Toyota',
  model: 'Camry',
  fuel_type: 'Gasoline',
  dtc_codes: [],
  model_year: 2018,
  odometer_km: 80000,
  engine_displacement_l: 2.5,
  ambient_temp_c: 20,
  coolant_temp_c: 90,
  rpm: 2000,
  vehicle_speed_kph: 80,
  engine_load_pct: 50,
  throttle_pos_pct: 30,
  maf_g_s: 25,
  map_kpa: 100,
  intake_air_temp_c: 30,
  short_term_fuel_trim_pct: 0,
  long_term_fuel_trim_pct: 0,
  o2_sensor_v_b1s1: 0.45,
  o2_sensor_v_b1s2: 0.45,
  battery_voltage_v: 13.8,
};

const LIMITS = {
  model_year: [2005, 2025],
  odometer_km: [0, 350000],
  engine_displacement_l: [0, 7],
  ambient_temp_c: [-20, 45],
  coolant_temp_c: [20, 125],
  rpm: [0, 16000],
  vehicle_speed_kph: [0, 250],
  engine_load_pct: [0, 100],
  throttle_pos_pct: [0, 100],
  maf_g_s: [0, 300],
  map_kpa: [20, 250],
  intake_air_temp_c: [-20, 70],
  short_term_fuel_trim_pct: [-25, 25],
  long_term_fuel_trim_pct: [-25, 25],
  o2_sensor_v_b1s1: [0, 1],
  o2_sensor_v_b1s2: [0, 1],
  battery_voltage_v: [10, 450],
};

const SECTIONS = [
  { title: 'Vehicle', fields: ['model_year', 'odometer_km', 'engine_displacement_l'] },
  { title: 'Engine', fields: ['rpm', 'vehicle_speed_kph', 'engine_load_pct', 'throttle_pos_pct', 'coolant_temp_c', 'ambient_temp_c'] },
  { title: 'Air & fuel', fields: ['maf_g_s', 'map_kpa', 'intake_air_temp_c', 'short_term_fuel_trim_pct', 'long_term_fuel_trim_pct'] },
  { title: 'Emissions & electrical', fields: ['o2_sensor_v_b1s1', 'o2_sensor_v_b1s2', 'battery_voltage_v'] },
];

const FUELS = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];

export default function AnalyzeView({ onSaved }) {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  function changeMake(make) {
    const models = MODELS_BY_MAKE[make];
    setForm((f) => ({ ...f, make, model: models.includes(f.model) ? f.model : models[0] }));
  }

  function toggleCode(code) {
    setForm((f) => ({
      ...f,
      dtc_codes: f.dtc_codes.includes(code) ? f.dtc_codes.filter((c) => c !== code) : [...f.dtc_codes, code],
    }));
  }

  async function useLive() {
    setError(null);
    try {
      const live = await getLive(loadLiveSession());
      if (!live.vehicle_data) throw new Error('Live stream is still warming up');
      const next = { ...DEFAULTS };
      for (const key of Object.keys(DEFAULTS)) {
        const val = live.vehicle_data[key];
        if (val === undefined || val === null) continue;
        next[key] = typeof val === 'number' && FIELDS[key] ? Number(val.toFixed(FIELDS[key].decimals)) : val;
      }
      setForm(next);
      setResult(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function run(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = { ...form };
      for (const key of Object.keys(LIMITS)) payload[key] = Number(payload[key]);
      const res = await predict(payload);
      setResult(res);
      if (res.saved) onSaved?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const problem = result?.prediction_class === 1;

  return (
    <form className="analyze" onSubmit={run}>
      <div className="analyze-head">
        <div>
          <h1 className="page-title">Manual analysis</h1>
          <p className="page-sub">Enter a set of OBD-II readings and score them with the XGBoost model.</p>
        </div>
        <div className="analyze-actions">
          <button type="button" className="pill" onClick={useLive}>
            <Icon name="live" size={16} />
            Copy live reading
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => {
              setForm(DEFAULTS);
              setResult(null);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div className="analyze-grid">
        <div className="analyze-form">
          <section className="card form-card">
            <h2 className="form-title">Identity</h2>
            <div className="form-fields three">
              <label className="field">
                <span className="field-label">Make</span>
                <select className="select" value={form.make} onChange={(e) => changeMake(e.target.value)}>
                  {Object.keys(MODELS_BY_MAKE).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Model</span>
                <select className="select" value={form.model} onChange={(e) => set('model', e.target.value)}>
                  {MODELS_BY_MAKE[form.make].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span className="field-label">Fuel</span>
                <select className="select" value={form.fuel_type} onChange={(e) => set('fuel_type', e.target.value)}>
                  {FUELS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {SECTIONS.map((s) => (
            <section key={s.title} className="card form-card">
              <h2 className="form-title">{s.title}</h2>
              <div className="form-fields">
                {s.fields.map((f) => (
                  <label key={f} className="field">
                    <span className="field-label">
                      {FIELDS[f].label}
                      {FIELDS[f].unit && <em>{FIELDS[f].unit}</em>}
                    </span>
                    <input
                      className="field-input"
                      type="number"
                      inputMode="decimal"
                      min={LIMITS[f][0]}
                      max={LIMITS[f][1]}
                      step={FIELDS[f].step}
                      value={form[f]}
                      onChange={(e) => set(f, e.target.value)}
                      required
                    />
                  </label>
                ))}
              </div>
            </section>
          ))}

          <section className="card form-card">
            <h2 className="form-title">
              Fault codes
              <span className="badge neutral">{form.dtc_codes.length} selected</span>
            </h2>
            <div className="codes">
              {Object.entries(DTC_DESCRIPTIONS).map(([code, desc]) => (
                <button
                  type="button"
                  key={code}
                  className={`code-chip ${form.dtc_codes.includes(code) ? 'is-active' : ''}`}
                  aria-pressed={form.dtc_codes.includes(code)}
                  onClick={() => toggleCode(code)}
                  title={desc}
                >
                  <span className="mono">{code}</span>
                  <span className="code-desc">{desc}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <aside className="analyze-side">
          <div className="card side-car">
            <span className="eyebrow">
              {form.model_year} · {form.fuel_type}
            </span>
            <h2 className="side-car-name">
              {form.make} {form.model}
            </h2>
            <CarFigure make={form.make} model={form.model} />
          </div>

          <div className={`card is-ink result ${problem ? 'is-problem' : ''}`}>
            <span className="result-eyebrow">Result</span>
            {result ? (
              <>
                <div className="result-label">{result.prediction}</div>
                <div className="result-prob num">{formatPct(result.probability, 2)}</div>
                <div className="result-bar">
                  <span style={{ width: `${Math.max(1, result.probability * 100)}%` }} />
                </div>
                <span className="result-note">
                  <Icon name="database" size={14} />
                  {result.saved ? 'Saved to Supabase' : 'Not saved (database offline)'}
                </span>
              </>
            ) : (
              <p className="result-empty">Run the analysis to see the model's verdict and problem probability.</p>
            )}
          </div>

          {error && <div className="card form-error">{error}</div>}

          <button type="submit" className="pill is-ink run-btn" disabled={busy}>
            {busy ? 'Analysing…' : 'Run analysis'}
            {!busy && <Icon name="arrowRight" size={16} />}
          </button>
        </aside>
      </div>
    </form>
  );
}
