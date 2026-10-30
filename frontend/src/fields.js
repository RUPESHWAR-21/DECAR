// Display metadata for the model's input fields.

import PHOTOS from './carPhotos.json';

export const FIELDS = {
  model_year: { label: 'Model year', unit: '', decimals: 0, step: 1 },
  odometer_km: { label: 'Odometer', unit: 'km', decimals: 0, step: 1000 },
  engine_displacement_l: { label: 'Displacement', unit: 'L', decimals: 1, step: 0.1 },
  ambient_temp_c: { label: 'Ambient temp', unit: '°C', decimals: 1, step: 1 },
  coolant_temp_c: { label: 'Coolant temp', unit: '°C', decimals: 1, step: 1 },
  rpm: { label: 'Engine speed', unit: 'rpm', decimals: 0, step: 50 },
  vehicle_speed_kph: { label: 'Vehicle speed', unit: 'km/h', decimals: 0, step: 1 },
  engine_load_pct: { label: 'Engine load', unit: '%', decimals: 1, step: 1 },
  throttle_pos_pct: { label: 'Throttle', unit: '%', decimals: 1, step: 1 },
  maf_g_s: { label: 'Mass air flow', unit: 'g/s', decimals: 1, step: 0.5 },
  map_kpa: { label: 'Manifold pressure', unit: 'kPa', decimals: 1, step: 1 },
  intake_air_temp_c: { label: 'Intake air temp', unit: '°C', decimals: 1, step: 1 },
  short_term_fuel_trim_pct: { label: 'Short-term fuel trim', unit: '%', decimals: 1, step: 0.5 },
  long_term_fuel_trim_pct: { label: 'Long-term fuel trim', unit: '%', decimals: 1, step: 0.5 },
  o2_sensor_v_b1s1: { label: 'O₂ sensor, upstream', unit: 'V', decimals: 2, step: 0.01 },
  o2_sensor_v_b1s2: { label: 'O₂ sensor, downstream', unit: 'V', decimals: 2, step: 0.01 },
  battery_voltage_v: { label: 'Battery', unit: 'V', decimals: 1, step: 0.1 },
};

export const GROUPS = [
  { id: 'engine', label: 'Engine', fields: ['rpm', 'vehicle_speed_kph', 'engine_load_pct', 'throttle_pos_pct', 'coolant_temp_c'] },
  { id: 'air', label: 'Air & fuel', fields: ['maf_g_s', 'map_kpa', 'intake_air_temp_c', 'short_term_fuel_trim_pct', 'long_term_fuel_trim_pct'] },
  { id: 'emissions', label: 'Emissions', fields: ['o2_sensor_v_b1s1', 'o2_sensor_v_b1s2', 'ambient_temp_c'] },
  { id: 'electrical', label: 'Electrical', fields: ['battery_voltage_v'] },
];

export const FIELD_ICONS = {
  rpm: 'gauge',
  vehicle_speed_kph: 'speed',
  engine_load_pct: 'activity',
  throttle_pos_pct: 'pedal',
  coolant_temp_c: 'thermo',
  maf_g_s: 'wind',
  map_kpa: 'gauge',
  intake_air_temp_c: 'thermo',
  short_term_fuel_trim_pct: 'fuel',
  long_term_fuel_trim_pct: 'fuel',
  o2_sensor_v_b1s1: 'activity',
  o2_sensor_v_b1s2: 'activity',
  ambient_temp_c: 'thermo',
  battery_voltage_v: 'battery',
};

export const MODELS_BY_MAKE = {
  Audi: ['A4', 'Q5'],
  BMW: ['3 Series', 'X3'],
  Chevrolet: ['Equinox', 'Malibu', 'Silverado'],
  Ford: ['Escape', 'F-150', 'Focus'],
  Honda: ['Accord', 'CR-V', 'Civic'],
  Hyundai: ['Elantra', 'Tucson'],
  Kia: ['Forte', 'Sportage'],
  Mercedes: ['C-Class', 'GLC'],
  Nissan: ['Altima', 'Rogue'],
  Subaru: ['Forester', 'Outback'],
  Tesla: ['Model 3', 'Model S', 'Model Y'],
  Toyota: ['Camry', 'Corolla', 'RAV4'],
  Volkswagen: ['Golf', 'Passat', 'Tiguan'],
};

const BODY_BY_MODEL = {
  'CR-V': 'suv', Equinox: 'suv', Escape: 'suv', Forester: 'suv', GLC: 'suv', Outback: 'suv',
  Q5: 'suv', RAV4: 'suv', Rogue: 'suv', Sportage: 'suv', Tiguan: 'suv', Tucson: 'suv',
  X3: 'suv', 'Model Y': 'suv',
  'F-150': 'truck', Silverado: 'truck',
  Focus: 'hatch', Golf: 'hatch',
};

export function bodyType(model) {
  return BODY_BY_MODEL[model] || 'sedan';
}

export const BODY_LABELS = { sedan: 'Sedan', suv: 'SUV', truck: 'Pickup', hatch: 'Hatchback' };

export const PAINTS = [
  { id: 'silver', label: 'Silver', color: '#c9ccd0' },
  { id: 'red', label: 'Red', color: '#b3261e' },
  { id: 'blue', label: 'Blue', color: '#1f5fd1' },
  { id: 'sand', label: 'Sand', color: '#d2a06c' },
  { id: 'black', label: 'Black', color: '#232326' },
];

export const DTC_DESCRIPTIONS = {
  P0100: 'MAF circuit malfunction',
  P0101: 'MAF range / performance',
  P0102: 'MAF circuit low',
  P0103: 'MAF circuit high',
  P0104: 'MAF circuit intermittent',
  P0130: 'O₂ sensor circuit (B1S1)',
  P0131: 'O₂ sensor low voltage (B1S1)',
  P0132: 'O₂ sensor high voltage (B1S1)',
  P0133: 'O₂ sensor slow response (B1S1)',
  P0134: 'O₂ sensor no activity (B1S1)',
  P0135: 'O₂ heater circuit (B1S1)',
  P0171: 'System too lean (bank 1)',
  P0172: 'System too rich (bank 1)',
  P0217: 'Engine overheat condition',
  P0300: 'Random misfire detected',
  P0301: 'Cylinder 1 misfire',
  P0302: 'Cylinder 2 misfire',
  P0303: 'Cylinder 3 misfire',
  P0304: 'Cylinder 4 misfire',
  P0420: 'Catalyst efficiency low',
  P0562: 'System voltage low',
  P0A1F: 'Battery control module',
  P0A80: 'Replace hybrid battery pack',
};

export const DRIVING_MODES = {
  idle: 'Idling',
  accelerating: 'Accelerating',
  cruising: 'Cruising',
  decelerating: 'Decelerating',
};

export function formatValue(name, value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  if (name === 'model_year') return String(Math.round(n));
  const decimals = FIELDS[name] ? FIELDS[name].decimals : 1;
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPct(p, decimals = 1) {
  return `${(Number(p || 0) * 100).toFixed(decimals)}%`;
}

export function carSlug(make, model) {
  return `${make}-${model}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

// Wikimedia cutouts in public/cars, with credits (see tools/fetch_car_photos.py).
export { PHOTOS };

export function hasPhoto(make, model) {
  return Boolean(PHOTOS[carSlug(make || '', model || '')]);
}
