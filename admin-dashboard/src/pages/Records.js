import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

function Stars({ value }) {
  const full = Math.round(value || 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#fbbf24', fontSize: 15, letterSpacing: 2 }}>
        {'★'.repeat(full)}
      </span>
      <span style={{ color: '#cbd5e1', fontSize: 15, letterSpacing: 2 }}>
        {'★'.repeat(5 - full)}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginLeft: 6 }}>
        {(value || 0).toFixed(1)}
      </span>
    </div>
  );
}

export default function Records() {
  const [feedback,   setFeedback]   = useState([]);
  const [mealFilter, setMealFilter] = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (mealFilter) params.meal_type = mealFilter;
      if (fromDate)   params.from_date = fromDate;
      if (toDate)     params.to_date   = toDate;
      const res = await axios.get(`${API}/feedback/all`, { params });
      setFeedback(res.data);
      setPage(1);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [mealFilter, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = feedback.filter(r =>
    !search || (r.comments && r.comments.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <Layout title="Feedback Records" subtitle={`Viewing ${filtered.length} responses`}>

      {/* Filters */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '16px 24px',
        display: 'flex', gap: 20, alignItems: 'flex-end',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        border: '1px solid #e2e8f0',
        marginBottom: 24, flexWrap: 'wrap',
      }}>
        {/* Meal Type */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Meal Type</div>
          <select value={mealFilter} onChange={e => setMealFilter(e.target.value)} style={{
            border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px', color: '#0f172a', background: '#f8fafc', fontSize: 14, minWidth: 140, outline: 'none'
          }}>
            <option value="">All Meals</option>
            <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
          </select>
        </div>
        {/* Dates */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>From</div>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{
            border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 14px', color: '#0f172a', background: '#f8fafc', fontSize: 14, outline: 'none'
          }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>To</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{
            border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 14px', color: '#0f172a', background: '#f8fafc', fontSize: 14, outline: 'none'
          }} />
        </div>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' }}>Search Comments</div>
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{
            border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 14px', color: '#0f172a', background: '#f8fafc', fontSize: 14, width: '100%', outline: 'none'
          }} />
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchData} style={{
            background: '#1a56db', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          }}>Filter</button>
          <button onClick={() => { setMealFilter(''); setFromDate(''); setToDate(''); setSearch(''); }} style={{
            background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: 10, fontWeight: 600, fontSize: 14,
          }}>Reset</button>
        </div>
      </div>

      {/* Table Card */}
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.02)', overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Meal</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Quality</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Taste</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Cleanliness</th>
                <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Comment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>Loading records...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>No feedback matches your criteria.</td></tr>
              ) : (
                paginated.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>#{row.id}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: row.meal_type === 'Breakfast' ? '#eff6ff' : row.meal_type === 'Lunch' ? '#ecfdf5' : '#f5f3ff',
                        color: row.meal_type === 'Breakfast' ? '#1d4ed8' : row.meal_type === 'Lunch' ? '#047857' : '#6d28d9',
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                      }}>
                        {row.meal_type === 'Breakfast' ? '🌅' : row.meal_type === 'Lunch' ? '☀️' : '🌙'} {row.meal_type}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}><Stars value={row.food_quality} /></td>
                    <td style={{ padding: '16px 24px' }}><Stars value={row.food_taste} /></td>
                    <td style={{ padding: '16px 24px' }}><Stars value={row.cleanliness} /></td>
                    <td style={{ padding: '16px 24px', maxWidth: 280 }}>
                      {row.comments ? (
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>"{row.comments}"</div>
                      ) : (
                        <span style={{ color: '#cbd5e1', fontSize: 13, fontStyle: 'italic' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Showing <span style={{ fontWeight: 600, color: '#0f172a' }}>{(page - 1) * PER_PAGE + 1}</span> to <span style={{ fontWeight: 600, color: '#0f172a' }}>{Math.min(page * PER_PAGE, filtered.length)}</span> of <span style={{ fontWeight: 600, color: '#0f172a' }}>{filtered.length}</span> results
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                background: '#fff', border: '1px solid #e2e8f0', color: page === 1 ? '#cbd5e1' : '#0f172a', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}>Prev</button>
              
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                  // simple subset for pagination if lots of pages
                  if (totalPages > 7 && n > 2 && n < totalPages - 1 && Math.abs(n - page) > 1) {
                    if (n === 3 || n === totalPages - 2) return <span key={n} style={{ padding: '4px 8px', color: '#94a3b8' }}>...</span>;
                    return null;
                  }
                  return (
                    <button key={n} onClick={() => setPage(n)} style={{
                      background: n === page ? '#1a56db' : '#fff', color: n === page ? '#fff' : '#475569', border: n === page ? '1px solid #1a56db' : '1px solid #e2e8f0', width: 32, height: 32, borderRadius: 8, fontSize: 13, fontWeight: 600,
                    }}>{n}</button>
                  );
                })}
              </div>

              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                background: '#fff', border: '1px solid #e2e8f0', color: page === totalPages ? '#cbd5e1' : '#0f172a', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: page === totalPages ? 'not-allowed' : 'pointer'
              }}>Next</button>
            </div>
          </div>
        )}
      </div>

    </Layout>
  );
}
