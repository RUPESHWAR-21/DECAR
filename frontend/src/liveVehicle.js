// The live simulation is stateless on the server: the browser remembers which vehicle is
// running and when its engine was started, and sends both with every live request.

const KEY = 'obd-live-vehicle';

export const DEFAULT_VEHICLE = {
  make: 'Toyota',
  model: 'Camry',
  model_year: 2018,
  fuel_type: 'Gasoline',
  odometer_km: 80000,
  engine_displacement_l: 2.5,
};

export function loadLiveSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.vehicle && saved?.started_at) return saved;
  } catch {
    /* storage unavailable or corrupt */
  }
  return startLiveSession(DEFAULT_VEHICLE);
}

export function startLiveSession(vehicle) {
  const session = { vehicle: { ...DEFAULT_VEHICLE, ...vehicle }, started_at: Date.now() / 1000 };
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable */
  }
  return session;
}
