import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

function MetricBadge({ label, icon, value }) {
  const color = value <= 2 ? 'var(--danger)' : value <= 3 ? 'var(--secondary)' : 'var(--success)';
  const bg = value <= 2 ? 'var(--danger-light)' : value <= 3 ? 'var(--secondary-light)' : 'var(--success-light)';
  return (
    <div title={label} style={{ 
      display: 'flex', alignItems: 'center', gap: 6, background: bg, color: color, 
      padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
      border: `1px solid rgba(0, 0, 0, 0.02)`
    }}>

      <span>{value}</span>
      <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, marginLeft: 2 }}>{label}</span>
    </div>
  );
}

function DetailedBreakdown({ row }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 16 }}>
      <MetricBadge label="Qual" value={row.food_quality} />
      <MetricBadge label="Taste" value={row.food_taste} />
      <MetricBadge label="Hygiene" value={row.food_hygiene} />
      <MetricBadge label="Staff" value={row.staff_behavior} />
      <MetricBadge label="Clean" value={row.cleanliness} />
    </div>
  );
}

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

  return (
    <Layout title="Critical Feedback" subtitle="All entries with overall rating below 2.0">
      
      {/* Soft Red Elegant Alert Banner */}
      <div style={{ 
        background: 'var(--danger-light)', 
        border: '1px solid var(--danger-border)', 
        borderRadius: 'var(--radius-card)', 
        padding: '24px 32px', 
        marginBottom: 28, 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <div style={{ color: 'var(--danger)', fontSize: 11, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>Urgent Attention Required</div>
          <div style={{ color: 'var(--text-primary)', fontSize: 20, fontWeight: 800, marginTop: 4 }}>{loading ? '...' : data.length} Critical Feedback {data.length === 1 ? 'Entry' : 'Entries'}</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginTop: 4, fontWeight: 500 }}>Overall rating &lt; 2.0 — immediate action needed</div>
        </div>
      </div>

      {/* Filters (Floating Box) */}
      <div className="dashboard-card" style={{ 
        display: 'flex', gap: 16, alignItems: 'flex-end', 
        marginBottom: 28, flexWrap: 'wrap',
        background: '#ffffff'
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>Meal Type</div>
          <select value={mealFilter} onChange={e => setMealFilter(e.target.value)} className="custom-select" style={{ minWidth: 180 }}>
            <option value="">All Meals</option>
            {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>From Date</div>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="custom-input" />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>To Date</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="custom-input" />
        </div>
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          <button onClick={fetchData} className="btn-primary" style={{ background: 'var(--danger)', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)' }}>
            Filter
          </button>
          <button onClick={() => { setFromDate(''); setToDate(''); setMealFilter(''); }} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)', fontSize: 15, fontWeight: 600 }}>Loading critical feedback...</div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', background: '#fff', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>No Critical Feedback</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>All feedback scores are currently above 2.0</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {data.map((item, i) => (
            <div key={i} className="dashboard-card" style={{ 
              background: '#ffffff', 
              padding: 24, 
              border: '1px solid var(--danger-border)', 
              boxShadow: 'var(--shadow-sm)',
              display: 'flex', gap: 20, alignItems: 'flex-start' 
            }}>
              <div style={{ 
                background: 'var(--danger-light)', 
                borderRadius: 12, 
                padding: '14px 18px', 
                minWidth: 90, 
                textAlign: 'center', 
                flexShrink: 0,
                border: '1px solid var(--danger-border)' 
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--danger)' }}>{(item.overall_rating || 0).toFixed(1)}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>Overall</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: 12 }}>Critical Alert</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 12 }}>{item.meal_type}</span>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>{item.feedback_date || '—'}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginLeft: 'auto', fontWeight: 500 }}>#{item.id}</span>
                </div>

                {/* Metric Breakdown */}
                <DetailedBreakdown row={item} />
                
                {item.comments ? (
                  <div style={{ background: 'var(--danger-light)', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid var(--danger)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--danger)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>💬 Comment</div>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic', fontWeight: 500 }}>"{item.comments}"</div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 13, fontStyle: 'italic', paddingLeft: 4 }}>No comment provided</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
