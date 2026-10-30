import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import Sparkline from './Sparkline';
import { getHistory } from '../api';
import { DRIVING_MODES, formatPct } from '../fields';
import './HistoryView.css';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'manual', label: 'Manual' },
  { id: 'live', label: 'Live' },
];

const timeFmt = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

export default function HistoryView({ db, onRetry }) {
  const [filter, setFilter] = useState('all');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRows = useCallback(() => {
    getHistory(filter)
      .then((res) => {
        setRows(res.entries);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchRows();
    const id = setInterval(fetchRows, 15000);
    return () => clearInterval(id);
  }, [fetchRows]);

  const load = () => {
    setLoading(true);
    fetchRows();
  };

  const changeFilter = (next) => {
    if (next === filter) return;
    setLoading(true);
    setFilter(next);
  };

  const stats = useMemo(() => {
    const total = rows.length;
    const flagged = rows.filter((r) => r.prediction_class === 1).length;
    const avg = total ? rows.reduce((s, r) => s + r.probability, 0) / total : 0;
    const peak = total ? Math.max(...rows.map((r) => r.probability)) : 0;
    return { total, flagged, rate: total ? flagged / total : 0, avg, peak };
  }, [rows]);

  const trend = useMemo(() => rows.slice(0, 120).map((r) => r.probability).reverse(), [rows]);

  if (error && !rows.length) {
    return (
      <div className="history">
        <HistoryHead filter={filter} setFilter={changeFilter} onRefresh={load} loading={loading} />
        <div className="card setup">
          <span className="setup-icon">
            <Icon name="database" size={22} />
          </span>
          <div>
            <h2 className="setup-title">History isn't available yet</h2>
            <p className="setup-text">{error}</p>
            {/not found|schema\.sql/i.test(error) && (
              <ol className="setup-steps">
                <li>Open your Supabase project and go to <strong>SQL Editor</strong>.</li>
                <li>
                  Paste the contents of <span className="mono">supabase/schema.sql</span> from this project and run it.
                </li>
                <li>Come back here and press Retry. Live readings and manual analyses will start saving straight away.</li>
              </ol>
            )}
            <button
              className="pill is-ink"
              onClick={() => {
                onRetry?.();
                load();
              }}
            >
              <Icon name="refresh" size={16} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history">
      <HistoryHead filter={filter} setFilter={changeFilter} onRefresh={load} loading={loading} />

      <div className="kpis">
        <div className="card kpi is-ink">
          <span className="kpi-label">Checks recorded</span>
          <span className="kpi-value num">{stats.total.toLocaleString()}</span>
          <span className="kpi-sub">Latest {rows.length ? timeFmt.format(new Date(rows[0].created_at)) : '—'}</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Flagged as problem</span>
          <span className={`kpi-value num ${stats.flagged ? 'is-bad' : ''}`}>{stats.flagged}</span>
          <span className="kpi-sub">{formatPct(stats.rate)} of checks</span>
        </div>
        <div className="card kpi">
          <span className="kpi-label">Average probability</span>
          <span className="kpi-value num">{formatPct(stats.avg, 2)}</span>
          <span className="kpi-sub">Peak {formatPct(stats.peak, 2)}</span>
        </div>
        <div className="card kpi kpi-trend">
          <span className="kpi-label">Probability trend</span>
          <Sparkline values={trend} height={56} />
          <span className="kpi-sub">Last {trend.length} checks, oldest to newest</span>
        </div>
      </div>

      <div className="card table-card">
        {rows.length === 0 ? (
          <p className="table-empty">
            {loading ? 'Loading…' : 'No checks saved yet. Live readings are stored every few seconds, and every manual analysis is stored too.'}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Vehicle</th>
                  <th>Mode</th>
                  <th>Codes</th>
                  <th>Result</th>
                  <th className="right">Probability</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="num nowrap">{timeFmt.format(new Date(r.created_at))}</td>
                    <td>
                      <span className="badge neutral">{r.source === 'live' ? 'Live' : 'Manual'}</span>
                    </td>
                    <td className="nowrap">
                      <strong>
                        {r.make} {r.model}
                      </strong>
                      <span className="muted"> {r.model_year}</span>
                    </td>
                    <td className="muted">{DRIVING_MODES[r.driving_mode] || '—'}</td>
                    <td>
                      {r.dtc_codes?.length ? (
                        <span className="mono">{r.dtc_codes.join(', ')}</span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${r.prediction_class === 1 ? 'bad' : 'ok'}`}>
                        <span className="dot" />
                        {r.prediction}
                      </span>
                    </td>
                    <td className="right">
                      <div className="prob-cell">
                        <span className="prob-track">
                          <span
                            className={r.prediction_class === 1 ? 'is-bad' : ''}
                            style={{ width: `${Math.max(1, r.probability * 100)}%` }}
                          />
                        </span>
                        <span className="num">{formatPct(r.probability, 2)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {db && !db.connected && rows.length > 0 && <p className="stale-note">Showing the last data loaded. {db.error}</p>}
    </div>
  );
}

function HistoryHead({ filter, setFilter, onRefresh, loading }) {
  return (
    <div className="history-head">
      <div>
        <h1 className="page-title">History</h1>
        <p className="page-sub">Every check stored in Supabase, newest first.</p>
      </div>
      <div className="history-tools">
        <div className="filters" role="tablist" aria-label="Source">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              className={`pill sm ${filter === f.id ? 'is-active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className={`round-btn ${loading ? 'is-spinning' : ''}`} onClick={onRefresh} aria-label="Refresh">
          <Icon name="refresh" size={16} />
        </button>
      </div>
    </div>
  );
}
