import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

const MEAL_TYPES_ALL = ['Breakfast','Lunch','Dinner','Midnight Supper','Early Morning Breakfast'];

function Stars({ value }) {
  const full = Math.round(value || 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#fbbf24', fontSize: 14, letterSpacing: 2 }}>{'★'.repeat(full)}</span>
      <span style={{ color: '#cbd5e1', fontSize: 14, letterSpacing: 2 }}>{'★'.repeat(5 - full)}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginLeft: 6 }}>{(value || 0).toFixed(1)}</span>
    </div>
  );
}

const CRITICAL_BADGE = () => (
  <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: 11 }}>🔴 Critical</span>
);

function MetricBadge({ label, icon, value }) {
  const color = value <= 2 ? '#ef4444' : value <= 3 ? '#f59e0b' : '#10b981';
  const bg = value <= 2 ? '#fee2e2' : value <= 3 ? '#fffbeb' : '#ecfdf5';
  return (
    <div title={label} style={{ 
      display: 'flex', alignItems: 'center', gap: 6, background: bg, color: color, 
      padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 800,
      border: `1px solid ${color}33`
    }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span>{value}</span>
      <span style={{ fontSize: 9, opacity: 0.8, fontWeight: 700, marginLeft: 2, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function DetailedBreakdown({ row }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 350 }}>
      <MetricBadge label="Qual" icon="🏆" value={row.food_quality} />
      <MetricBadge label="Taste" icon="🍽️" value={row.food_taste} />
      <MetricBadge label="Hygiene" icon="🧼" value={row.food_hygiene} />
      <MetricBadge label="Staff" icon="👤" value={row.staff_behavior} />
      <MetricBadge label="Clean" icon="✨" value={row.cleanliness} />
    </div>
  );
}

export default function Records() {
  const [feedback,   setFeedback]   = useState([]);
  const [mealFilter, setMealFilter] = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [search,     setSearch]     = useState('');
  const [critOnly,   setCritOnly]   = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (mealFilter) params.meal_type = mealFilter;
      if (fromDate)   params.from_date = fromDate;
      if (toDate)     params.to_date   = toDate;
      if (critOnly)   params.is_critical = 1;
      const res = await axios.get(`${API}/feedback/all`, { params });
      setFeedback(res.data);
      setPage(1);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [mealFilter, fromDate, toDate, critOnly]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = feedback.filter(r =>
    !search || (r.comments && r.comments.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const inputStyle = {
    border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 14px',
    color: '#0f172a', background: '#f8fafc', fontSize: 14, outline: 'none',
  };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' };

  return (
    <Layout title="Feedback Records" subtitle={`Viewing ${filtered.length} responses`}>
      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px 24px', display: 'flex', gap: 20, alignItems: 'flex-end', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={labelStyle}>Meal Type</div>
          <select value={mealFilter} onChange={e => setMealFilter(e.target.value)} style={{ ...inputStyle, minWidth: 180 }}>
            <option value="">All Meals</option>
            {MEAL_TYPES_ALL.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <div style={labelStyle}>From</div>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>To</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={labelStyle}>Search Comments</div>
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
          <input type="checkbox" id="critOnly" checked={critOnly} onChange={e => setCritOnly(e.target.checked)} style={{ width: 16, height: 16, accentColor: '#ef4444' }} />
          <label htmlFor="critOnly" style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', cursor: 'pointer' }}>🔴 Critical Only</label>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchData} style={{ background: '#1a56db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Filter</button>
          <button onClick={() => { setMealFilter(''); setFromDate(''); setToDate(''); setSearch(''); setCritOnly(false); }} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Reset</button>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['ID','Date','Meal','Status','Detailed Breakdown','Overall','Comment'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>Loading records...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>No feedback matches your criteria.</td></tr>
              ) : paginated.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: row.is_critical === 1 ? '#fff5f5' : 'transparent' }}>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>#{row.id}</td>
                  <td style={{ padding: '14px 18px', fontSize: 12, color: '#475569' }}>{row.feedback_date || '—'}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, background: '#f1f5f9', padding: '3px 10px', borderRadius: 20, color: '#334155' }}>{row.meal_type}</span>
                  </td>
                  <td style={{ padding: '14px 18px' }}>{row.is_critical === 1 ? <CRITICAL_BADGE /> : <span style={{ color: '#10b981', fontSize: 12, fontWeight: 700 }}>✅ Normal</span>}</td>
                  <td style={{ padding: '14px 18px' }}><DetailedBreakdown row={row} /></td>
                  <td style={{ padding: '14px 18px', fontWeight: 800, color: row.overall_rating <= 2 ? '#dc2626' : row.overall_rating <= 3 ? '#f59e0b' : '#10b981' }}>
                    {row.overall_rating ? row.overall_rating.toFixed(1) : '—'}
                  </td>
                  <td style={{ padding: '14px 18px', maxWidth: 240 }}>
                    {row.comments ? <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>"{row.comments}"</div>
                      : <span style={{ color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Showing <b>{(page - 1) * PER_PAGE + 1}</b>–<b>{Math.min(page * PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: '#fff', border: '1px solid #e2e8f0', color: page === 1 ? '#cbd5e1' : '#0f172a', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: '#fff', border: '1px solid #e2e8f0', color: page === totalPages ? '#cbd5e1' : '#0f172a', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
