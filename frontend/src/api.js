// Same origin in production (Vercel routes /api to the Python function);
// in development Vite proxies /api to the local FastAPI server.
export const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    let detail = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.detail) detail = typeof body.detail === 'string' ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* keep status text */
    }
    throw new Error(detail);
  }
  return response.json();
}

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const predict = (vehicleData) => request('/api/predict', json('POST', vehicleData));
export const getLive = (session, save = false) => request('/api/live', json('POST', { ...session, save }));
export const getDbStatus = () => request('/api/db/status');
export const getHistory = (source, limit = 200) =>
  request(`/api/history?limit=${limit}${source && source !== 'all' ? `&source=${source}` : ''}`);
