import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

const MEAL_TYPES_ALL = ['Breakfast','Lunch','Dinner','Midnight Supper','Early Morning Breakfast'];

function Stars({ value }) {
  const full = Math.round(value || 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <span className="stars-display">{'★'.repeat(full)}{'☆'.repeat(5 - full)}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', marginLeft: 6 }}>{(value || 0).toFixed(1)}</span>
    </div>
  );
}

const CRITICAL_BADGE = () => (
  <span className="status-badge danger" style={{ padding: '2px 8px', borderRadius: '4px' }}>Critical</span>
);

function MetricBadge({ label, icon, value }) {
  const color = value <= 2 ? 'var(--danger)' : value <= 3 ? 'var(--secondary)' : 'var(--success)';
  const bg = value <= 2 ? 'var(--danger-light)' : value <= 3 ? 'var(--secondary-light)' : 'var(--success-light)';
  return (
    <div title={label} style={{ 
      display: 'flex', alignItems: 'center', gap: 4, background: bg, color: color, 
      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
      border: `1px solid rgba(0, 0, 0, 0.02)`
    }}>
      <span>{value}</span>
      <span style={{ fontSize: 8, opacity: 0.8, fontWeight: 700, marginLeft: 2, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function DetailedBreakdown({ row }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 350 }}>
      <MetricBadge label="Qual" value={row.food_quality} />
      <MetricBadge label="Taste" value={row.food_taste} />
      <MetricBadge label="Hygiene" value={row.food_hygiene} />
      <MetricBadge label="Staff" value={row.staff_behavior} />
      <MetricBadge label="Clean" value={row.cleanliness} />
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

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' };

  return (
    <Layout title="Feedback Records" subtitle={`Viewing ${filtered.length} responses`}>
      
      {/* Filters (Floating Panel) */}
      <div className="dashboard-card" style={{ 
        display: 'flex', gap: 20, alignItems: 'flex-end', 
        marginBottom: 28, flexWrap: 'wrap',
        background: '#ffffff' 
      }}>
        <div>
          <div style={labelStyle}>Meal Type</div>
          <select value={mealFilter} onChange={e => setMealFilter(e.target.value)} className="custom-select" style={{ minWidth: 180 }}>
            <option value="">All Meals</option>
            {MEAL_TYPES_ALL.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <div style={labelStyle}>From Date</div>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="custom-input" />
        </div>
        <div>
          <div style={labelStyle}>To Date</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="custom-input" />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={labelStyle}>Search Comments</div>
          <input type="text" placeholder="Search comments..." value={search} onChange={e => setSearch(e.target.value)} className="custom-input" style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10 }}>
          <input type="checkbox" id="critOnly" checked={critOnly} onChange={e => setCritOnly(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--danger)' }} />
          <label htmlFor="critOnly" style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', cursor: 'pointer' }}>Critical Only</label>
        </div>
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          <button onClick={fetchData} className="btn-primary">Filter</button>
          <button onClick={() => { setMealFilter(''); setFromDate(''); setToDate(''); setSearch(''); setCritOnly(false); }} className="btn-secondary">Reset</button>
        </div>
      </div>

      {/* Table Container */}
      <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden', background: '#ffffff', border: '1px solid var(--border-color)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--border-light)', borderBottom: '1px solid var(--border-color)' }}>
                {['ID','Date','Meal','Status','Detailed Breakdown','Overall','Comment'].map(h => (
                  <th key={h} style={{ padding: '16px 20px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading records...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>No feedback matches your criteria.</td></tr>
              ) : paginated.map((row, i) => {
                const isCrit = row.is_critical === 1;
                return (
                  <tr key={i} className="smooth-transition" style={{ 
                    borderBottom: '1px solid var(--border-light)', 
                    borderLeft: isCrit ? '3px solid var(--danger)' : '3px solid transparent',
                    background: 'transparent'
                  }}>
                    <td style={{ padding: '16px 20px', fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>#{row.id}</td>
                    <td style={{ padding: '16px 20px', fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{row.feedback_date || '—'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--border-light)', padding: '4px 10px', borderRadius: 20, color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.02)' }}>{row.meal_type}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {isCrit ? <CRITICAL_BADGE /> : <span className="status-badge success" style={{ padding: '2px 8px', borderRadius: '4px' }}>Normal</span>}
                    </td>
                    <td style={{ padding: '16px 20px' }}><DetailedBreakdown row={row} /></td>
                    <td style={{ padding: '16px 20px' }}>
                      <Stars value={row.overall_rating} />
                    </td>
                    <td style={{ padding: '16px 20px', maxWidth: 260 }}>
                      {row.comments ? (
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, fontStyle: 'italic', borderLeft: '3px solid var(--primary)', paddingLeft: 8 }}>
                          "{row.comments}"
                        </div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--border-light)', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
              Showing <b>{(page - 1) * PER_PAGE + 1}</b>–<b>{Math.min(page * PER_PAGE, filtered.length)}</b> of <b>{filtered.length}</b>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1} 
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: 13, height: 'auto', opacity: page === 1 ? 0.5 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
              >
                Prev
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages} 
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: 13, height: 'auto', opacity: page === totalPages ? 0.5 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </Layout>
  );
}
