import { useState } from 'react';
import { MODELS_BY_MAKE } from '../fields';

const FUELS = ['Gasoline', 'Diesel', 'Hybrid', 'Electric'];
const YEARS = Array.from({ length: 21 }, (_, i) => 2025 - i);

export default function VehiclePicker({ value, onApply, onCancel, busy, applyLabel = 'Apply' }) {
  const [draft, setDraft] = useState(value);
  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  function changeMake(make) {
    const models = MODELS_BY_MAKE[make];
    setDraft((d) => ({
      ...d,
      make,
      model: models.includes(d.model) ? d.model : models[0],
      fuel_type: make === 'Tesla' ? 'Electric' : d.fuel_type === 'Electric' ? 'Gasoline' : d.fuel_type,
    }));
  }

  return (
    <form
      className="picker card"
      onSubmit={(e) => {
        e.preventDefault();
        onApply(draft);
      }}
    >
      <label>
        <span className="eyebrow">Make</span>
        <select className="select" value={draft.make} onChange={(e) => changeMake(e.target.value)}>
          {Object.keys(MODELS_BY_MAKE).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="eyebrow">Model</span>
        <select className="select" value={draft.model} onChange={(e) => set('model', e.target.value)}>
          {MODELS_BY_MAKE[draft.make].map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="eyebrow">Year</span>
        <select className="select" value={draft.model_year} onChange={(e) => set('model_year', Number(e.target.value))}>
          {YEARS.map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="eyebrow">Fuel</span>
        <select className="select" value={draft.fuel_type} onChange={(e) => set('fuel_type', e.target.value)}>
          {FUELS.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </label>
      <div className="picker-actions">
        <button type="button" className="pill" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="pill is-ink" disabled={busy}>
          {busy ? 'Switching…' : applyLabel}
        </button>
      </div>
    </form>
  );
}
