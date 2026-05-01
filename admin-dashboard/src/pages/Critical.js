import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

export default function Critical() {
  const [data,      setData]      = useState([]);
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [mealFilter,setMealFilter]= useState('');
  const [loading,   setLoading]   = useState(true);

  const MEAL_TYPES = ['Breakfast','Lunch','Dinner','Midnight Supper','Early Morning Breakfast'];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (fromDate)   params.from_date = fromDate;
      if (toDate)     params.to_date   = toDate;
      if (mealFilter) params.meal_type = mealFilter;
      const res = await axios.get(`${API}/feedback/critical`, { params });
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [fromDate, toDate, mealFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const inputStyle = { border: '1px solid #fca5a5', borderRadius: 10, padding: '9px 14px', color: '#7f1d1d', background: '#fff5f5', fontSize: 14, outline: 'none' };

  return (
    <Layout title="Critical Feedback" subtitle="All entries with overall rating below 2.0">
      {/* Alert banner */}
      <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #b91c1c)', borderRadius: 16, padding: '20px 28px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#fca5a5', fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>⚠️ Urgent Attention Required</div>
          <div style={{ color: '#fff', fontSize: 24, fontWeight: 900, marginTop: 4 }}>{loading ? '...' : data.length} Critical Feedback {data.length === 1 ? 'Entry' : 'Entries'}</div>
          <div style={{ color: '#fca5a5', fontSize: 13, marginTop: 4 }}>Overall rating &lt; 2.0 — immediate action needed</div>
        </div>
        <div style={{ fontSize: 64, opacity: 0.7 }}>🔴</div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '16px 24px', display: 'flex', gap: 16, alignItems: 'flex-end', border: '1px solid #fecaca', marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase' }}>Meal Type</div>
          <select value={mealFilter} onChange={e => setMealFilter(e.target.value)} style={{ ...inputStyle, minWidth: 180 }}>
            <option value="">All Meals</option>
            {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase' }}>From Date</div>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 6, textTransform: 'uppercase' }}>To Date</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={inputStyle} />
        </div>
        <button onClick={fetchData} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Filter</button>
        <button onClick={() => { setFromDate(''); setToDate(''); setMealFilter(''); }} style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', padding: '10px 20px', borderRadius: 10, fontWeight: 700, cursor: 'pointer' }}>Reset</button>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626', fontSize: 16 }}>Loading critical feedback...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 64 }}>✅</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10b981', marginTop: 16 }}>No Critical Feedback!</div>
          <div style={{ fontSize: 14, color: '#94a3b8', marginTop: 8 }}>All feedback scores are above 2.0</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {data.map((item, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, border: '2px solid #fca5a5', boxShadow: '0 4px 16px rgba(220,38,38,0.1)', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ background: '#fee2e2', borderRadius: 12, padding: '10px 14px', minWidth: 80, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#dc2626' }}>{(item.overall_rating || 0).toFixed(1)}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', letterSpacing: 0.5 }}>/ 5.0</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                  <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 10px', borderRadius: 20, fontWeight: 800, fontSize: 12 }}>🔴 Critical</span>
                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>🍽️ {item.meal_type}</span>
                  <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>📅 {item.feedback_date || '—'}</span>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>#{item.id}</span>
                </div>
                {item.comments ? (
                  <div style={{ background: '#fff5f5', borderRadius: 10, padding: '10px 14px', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>💬 Comment</div>
                    <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.6 }}>"{item.comments}"</div>
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic' }}>No comment provided</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
