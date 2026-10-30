import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import CarFigure from './CarFigure';
import Sparkline from './Sparkline';
import VehiclePicker from './VehiclePicker';
import { useLiveFeed } from '../hooks/useLiveFeed';
import { loadLiveSession, startLiveSession } from '../liveVehicle';
import {
  BODY_LABELS,
  DRIVING_MODES,
  DTC_DESCRIPTIONS,
  FIELDS,
  FIELD_ICONS,
  GROUPS,
  PAINTS,
  bodyType,
  formatPct,
  formatValue,
  hasPhoto,
} from '../fields';
import './LiveView.css';

// Typical healthy operating ranges, used to flag readings.
const RANGES = {
  coolant_temp_c: [70, 105],
  battery_voltage_v: [12.4, 14.8],
  short_term_fuel_trim_pct: [-10, 10],
  long_term_fuel_trim_pct: [-10, 10],
  intake_air_temp_c: [-20, 60],
  rpm: [0, 6000],
  engine_load_pct: [0, 90],
};

// Where callouts sit over the car, in % of the stage.
const CALLOUT_SPOTS = [
  { left: 14, top: 30 },
  { left: 46, top: 10 },
  { left: 64, top: 50 },
  { left: 30, top: 64 },
];


function rangeState(name, value) {
  const r = RANGES[name];
  if (!r || value === null || value === undefined) return null;
  return value < r[0] || value > r[1] ? 'out' : 'in';
}

function readPaint() {
  try {
    return localStorage.getItem('obd-paint') || 'sand';
  } catch {
    return 'sand';
  }
}

export default function LiveView() {
  const [session, setSession] = useState(loadLiveSession);
  const { data, series, isConnected } = useLiveFeed(session);
  const [group, setGroup] = useState('engine');
  const [paintId, setPaintId] = useState(readPaint);
  const [picking, setPicking] = useState(false);
  const rowRef = useRef(null);
  const vehicle = session.vehicle;

  useEffect(() => {
    try {
      localStorage.setItem('obd-paint', paintId);
    } catch {
      /* storage unavailable */
    }
  }, [paintId]);

  const v = data?.vehicle_data || {};
  const car = vehicle;
  const paint = PAINTS.find((p) => p.id === paintId) || PAINTS[0];
  const activeGroup = GROUPS.find((g) => g.id === group);
  const problem = data?.prediction_class === 1;
  const codes = v.dtc_codes || [];
  const mode = DRIVING_MODES[data?.driving_mode] || '—';

  function applyVehicle(next) {
    setSession(startLiveSession(next));
    setPicking(false);
  }

  const scrollRow = (dir) => rowRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });

  return (
    <div className="live">
      <section className="hero">
        <div className="hero-head">
          <div className="hero-title-row">
            <h1 className="hero-title">{car.make ? `${car.make} ${car.model}` : 'Connecting…'}</h1>
            <button
              className={`round-btn ${picking ? 'is-active' : ''}`}
              onClick={() => setPicking((p) => !p)}
              aria-expanded={picking}
              title="Change vehicle"
            >
              <Icon name="swap" size={16} />
            </button>
          </div>
          <p className="hero-sub">
            {car.model_year} · {car.fuel_type} · {BODY_LABELS[bodyType(car.model)]} ·{' '}
            <span className="num">{formatValue('odometer_km', car.odometer_km)} km</span>
          </p>
          {picking && (
            <VehiclePicker
              value={vehicle}
              onCancel={() => setPicking(false)}
              onApply={applyVehicle}
              applyLabel="Start engine"
            />
          )}
        </div>

        <aside className="hero-left">
          <div className="group-list" role="tablist" aria-label="Sensor group">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                role="tab"
                aria-selected={group === g.id}
                className={`pill ${group === g.id ? 'is-active' : ''}`}
                onClick={() => setGroup(g.id)}
              >
                {g.label}
              </button>
            ))}
          </div>
          <div className="note card">
            <span className="eyebrow">Stream</span>
            <span className={`stream ${isConnected ? 'is-on' : ''}`}>
              <span className="dot" />
              {isConnected ? 'Live, every 1 s' : 'Reconnecting…'}
            </span>
            <span className="eyebrow">Last reading {data?.timestamp || '—'}</span>
          </div>
        </aside>

        <div className="hero-stage">
          <div className="stage-ring" aria-hidden="true" />
          <CarFigure make={car.make} model={car.model} paint={paint.color} speed={v.vehicle_speed_kph || 0} showCredit />
          {activeGroup.fields.slice(0, CALLOUT_SPOTS.length).map((f, i) => (
            <div
              key={f}
              className={`callout ${rangeState(f, v[f]) === 'out' ? 'is-out' : ''}`}
              style={{ left: `${CALLOUT_SPOTS[i].left}%`, top: `${CALLOUT_SPOTS[i].top}%` }}
            >
              <span className="callout-dot" />
              <span className="callout-label">{FIELDS[f].label}</span>
              <span className="callout-value num">
                {formatValue(f, v[f])} {FIELDS[f].unit}
              </span>
            </div>
          ))}
        </div>

        <aside className="hero-right">
          <div className={`card is-ink verdict ${problem ? 'is-problem' : ''}`}>
            <div className="verdict-top">
              <span className="verdict-icon">
                <Icon name={problem ? 'alert' : 'check'} size={18} />
              </span>
              <span>Model verdict</span>
            </div>
            <div className="verdict-label">{data ? data.prediction : '—'}</div>
            <p className="verdict-text">
              {!data
                ? 'Waiting for the first reading.'
                : problem
                  ? 'The model recognises a fault pattern in the current readings. Inspect the flagged sensors.'
                  : 'Current readings match a healthy vehicle. No fault pattern detected.'}
            </p>
          </div>

          <div className="card prob-card">
            <div className="prob-head">
              <span className="eyebrow">Problem probability</span>
              <span className="eyebrow">last {series.length}s</span>
            </div>
            <div className={`prob-value num ${problem ? 'is-problem' : ''}`}>{data ? formatPct(data.probability, 2) : '—'}</div>
            <Sparkline values={series} className={problem ? 'is-problem' : ''} />
          </div>

          <div className="card codes-card">
            <span className="eyebrow">Fault codes</span>
            {codes.length ? (
              codes.map((c) => (
                <div key={c} className="code-row">
                  <span className="mono code">{c}</span>
                  <span>{DTC_DESCRIPTIONS[c] || 'Unknown code'}</span>
                </div>
              ))
            ) : (
              <span className="codes-empty">None reported</span>
            )}
          </div>
        </aside>
      </section>

      <section className="highlights">
        <div className="highlights-head">
          <h2 className="section-title">
            Sensor highlights
            <span className="badge neutral">{activeGroup.label}</span>
          </h2>
          {!hasPhoto(car.make, car.model) && (
          <div className="paints" role="radiogroup" aria-label="Paint colour">
            <span className="paints-label">Colour</span>
            {PAINTS.map((p) => (
              <button
                key={p.id}
                role="radio"
                aria-checked={paintId === p.id}
                aria-label={p.label}
                title={p.label}
                className={`paint ${paintId === p.id ? 'is-active' : ''}`}
                style={{ '--paint': p.color }}
                onClick={() => setPaintId(p.id)}
              />
            ))}
          </div>
          )}
        </div>

        <div className="highlights-body">
          <div className="row-arrows">
            <button className="round-btn" onClick={() => scrollRow(-1)} aria-label="Scroll left">
              <Icon name="arrowLeft" size={16} />
            </button>
            <button className="round-btn" onClick={() => scrollRow(1)} aria-label="Scroll right">
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
          <div className="stat-row" ref={rowRef}>
            <div className="stat card is-ink">
              <span className="stat-label">Driving mode</span>
              <span className="stat-big">{mode}</span>
              <span className="stat-sub num">{formatValue('vehicle_speed_kph', v.vehicle_speed_kph)} km/h</span>
            </div>
            {activeGroup.fields.map((f) => {
              const state = rangeState(f, v[f]);
              return (
                <div key={f} className={`stat card ${state === 'out' ? 'is-out' : ''}`}>
                  <div className="stat-top">
                    <span className="stat-icon">
                      <Icon name={FIELD_ICONS[f]} size={16} />
                    </span>
                    {state && <span className={`badge ${state === 'out' ? 'bad' : 'ok'}`}>{state === 'out' ? 'Check' : 'Normal'}</span>}
                  </div>
                  <span className="stat-label">{FIELDS[f].label}</span>
                  <span className="stat-value num">
                    {formatValue(f, v[f])}
                    <small>{FIELDS[f].unit}</small>
                  </span>
                  <span className="stat-sub">
                    {RANGES[f] ? `Normal ${RANGES[f][0]} to ${RANGES[f][1]} ${FIELDS[f].unit}` : 'No fixed range'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
