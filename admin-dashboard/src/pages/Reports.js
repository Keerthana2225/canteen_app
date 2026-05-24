import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;
const MEAL_TYPES_ALL = ['Breakfast','Lunch','Dinner','Midnight Supper','Early Morning Breakfast'];
const scoreColor = v => v >= 4 ? '#10b981' : v >= 3 ? '#f59e0b' : '#ef4444';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('day');
  // Day-wise
  const [dayData,    setDayData]    = useState([]);
  const [dayFrom,    setDayFrom]    = useState('');
  const [dayTo,      setDayTo]      = useState('');
  // Meal-wise
  const [mealData,   setMealData]   = useState([]);
  const [mealFrom,   setMealFrom]   = useState('');
  const [mealTo,     setMealTo]     = useState('');
  // Critical
  const [critData,   setCritData]   = useState([]);
  const [critMeal,   setCritMeal]   = useState('');
  const [critFrom,   setCritFrom]   = useState('');
  const [critTo,     setCritTo]     = useState('');

  const [loading, setLoading] = useState(false);

  const fetchDay = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dayFrom) params.from_date = dayFrom;
      if (dayTo)   params.to_date   = dayTo;
      const r = await axios.get(`${API}/feedback/day-report`, { params });
      setDayData(Array.isArray(r.data) ? r.data : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [dayFrom, dayTo]);

  const fetchMeal = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (mealFrom) params.from_date = mealFrom;
      if (mealTo)   params.to_date   = mealTo;
      const r = await axios.get(`${API}/analytics/meal-report`, { params });
      setMealData(r.data?.meal_report || []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [mealFrom, mealTo]);

  const fetchCrit = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 500 };
      if (critMeal) params.meal_type = critMeal;
      if (critFrom) params.from_date = critFrom;
      if (critTo)   params.to_date   = critTo;
      const r = await axios.get(`${API}/feedback/critical`, { params });
      setCritData(Array.isArray(r.data) ? r.data : []);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [critMeal, critFrom, critTo]);

  // Only fetch on mount, remove dependencies to prevent auto-fetching on date change
  useEffect(() => { fetchDay(); fetchMeal(); fetchCrit(); }, []);

  const handleDayApply = () => {
    if (!dayFrom || !dayTo) { alert("Please select both 'From Date' and 'To Date'."); return; }
    fetchDay();
  };
  const handleMealApply = () => {
    if (!mealFrom || !mealTo) { alert("Please select both 'From Date' and 'To Date'."); return; }
    fetchMeal();
  };
  const handleCritApply = () => {
    if (!critFrom || !critTo) { alert("Please select both 'From Date' and 'To Date'."); return; }
    fetchCrit();
  };

  const handleExport = async (urlParams) => {
    try {
      let url = `${API}/feedback/export`;
      if (urlParams) url += `?${urlParams}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `canteen_report_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(link.href);
    } catch { alert('❌ Export failed. Make sure the backend is running.'); }
  };

  const TABS = [
    { id: 'day',      label: '📅 Day-wise Report' },
    { id: 'meal',     label: '🍽️ Meal-wise Report' },
    { id: 'critical', label: `🔴 Critical Report (${critData.length})` },
  ];

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' };

  return (
    <Layout title="Reports" subtitle="Day-wise, Meal-wise, and Critical feedback reports">


      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        {/* iOS-Style Capsule Tabs */}
        <div style={{ 
          display: 'flex', gap: 4, 
          background: 'var(--border-light)', 
          padding: 5, borderRadius: 14, 
          border: '1px solid var(--border-color)'
        }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            let activeColor = 'var(--primary)';
            if (tab.id === 'critical') activeColor = 'var(--danger)';

            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className="smooth-transition"
                style={{
                  padding: '8px 20px', borderRadius: 10, border: 'none', 
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  background: active ? '#ffffff' : 'transparent',
                  color: active ? activeColor : 'var(--text-secondary)',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <button onClick={() => handleExport()} className="btn-secondary" style={{ color: 'var(--primary)', borderColor: 'var(--primary)', fontWeight: 700, boxShadow: 'var(--shadow-sm)' }}>
          📥 Export Overall Data
        </button>
      </div>

      {/* ── Day-wise Tab ── */}
      {activeTab === 'day' && (
        <>
          <div className="dashboard-card" style={{ 
            display: 'flex', gap: 14, alignItems: 'flex-end', 
            marginBottom: 24, flexWrap: 'wrap', background: '#ffffff' 
          }}>
            <div><div style={labelStyle}>From Date</div><input type="date" value={dayFrom} onChange={e => setDayFrom(e.target.value)} className="custom-input" /></div>
            <div><div style={labelStyle}>To Date</div><input type="date" value={dayTo} onChange={e => setDayTo(e.target.value)} className="custom-input" /></div>
            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
              <button onClick={() => {
                if (!dayFrom || !dayTo) { alert("Please select 'From Date' and 'To Date' first."); return; }
                handleExport(`from_date=${dayFrom}&to_date=${dayTo}`);
              }} className="btn-secondary" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                📥 Export Excel
              </button>
              <button onClick={handleDayApply} className="btn-primary">Apply</button>
              <button onClick={() => { setDayFrom(''); setDayTo(''); setTimeout(fetchDay, 0); }} className="btn-secondary">Reset</button>
            </div>
          </div>
          
          <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden', background: '#ffffff', border: '1px solid var(--border-color)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--border-light)', borderBottom: '1px solid var(--border-color)' }}>
                  {['Date','Total Responses','Critical','Avg Rating','Status'].map(h => (
                    <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>Loading...</td></tr>
                ) : dayData.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>No data found</td></tr>
                ) : dayData.map((d, i) => (
                  <tr key={i} className="smooth-transition" style={{ 
                    borderBottom: '1px solid var(--border-light)', 
                    borderLeft: d.critical > 0 ? '3px solid var(--danger)' : '3px solid transparent',
                    background: 'transparent'
                  }}>
                    <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>{d.date}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--primary)', fontSize: 15 }}>{d.total}</td>
                    <td style={{ padding: '16px 20px' }}>
                      {d.critical > 0
                        ? <span className="status-badge danger" style={{ padding: '2px 8px', borderRadius: '4px' }}>{d.critical} Critical</span>
                        : <span className="status-badge success" style={{ padding: '2px 8px', borderRadius: '4px' }}>0</span>}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: 14, color: scoreColor(d.avg_rating) }}>{d.avg_rating}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className="status-badge" style={{ 
                        background: d.avg_rating >= 4 ? 'var(--success-light)' : d.avg_rating >= 3 ? 'var(--secondary-light)' : 'var(--danger-light)', 
                        color: scoreColor(d.avg_rating), 
                        padding: '4px 12px' 
                      }}>
                        {d.avg_rating >= 4 ? 'Good' : d.avg_rating >= 3 ? 'Average' : 'Poor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Meal-wise Tab ── */}
      {activeTab === 'meal' && (
        <>
          <div className="dashboard-card" style={{ 
            display: 'flex', gap: 14, alignItems: 'flex-end', 
            marginBottom: 24, flexWrap: 'wrap', background: '#ffffff' 
          }}>
            <div><div style={labelStyle}>From Date</div><input type="date" value={mealFrom} onChange={e => setMealFrom(e.target.value)} className="custom-input" /></div>
            <div><div style={labelStyle}>To Date</div><input type="date" value={mealTo} onChange={e => setMealTo(e.target.value)} className="custom-input" /></div>
            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
              <button onClick={() => {
                if (!mealFrom || !mealTo) { alert("Please select 'From Date' and 'To Date' first."); return; }
                handleExport(`from_date=${mealFrom}&to_date=${mealTo}`);
              }} className="btn-secondary" style={{ color: 'var(--primary)', borderColor: 'var(--primary)' }}>
                📥 Export Excel
              </button>
              <button onClick={handleMealApply} className="btn-primary">Apply</button>
              <button onClick={() => { setMealFrom(''); setMealTo(''); setTimeout(fetchMeal, 0); }} className="btn-secondary">Reset</button>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {loading ? <div style={{ color: 'var(--text-secondary)', padding: 20, fontWeight: 600 }}>Loading...</div>
            : mealData.map((m, i) => (
              <div key={i} className="dashboard-card" style={{ background: '#ffffff', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{m.meal_type}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>{m.total} responses</div>
                  </div>
                  {m.critical > 0 && <span className="status-badge danger" style={{ padding: '2px 8px', fontSize: 10, borderRadius: '4px' }}>{m.critical} critical</span>}
                </div>
                
                <div style={{ fontSize: 26, fontWeight: 800, color: scoreColor(m.avg_overall), display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                  <span>{m.avg_overall}</span>
                </div>
                
                {[
                  { label: 'Quality',  val: m.avg_food_quality },
                  { label: 'Taste',    val: m.avg_food_taste },
                  { label: 'Hygiene',  val: m.avg_food_hygiene },
                  { label: 'Staff',    val: m.avg_staff_behavior },
                  { label: 'Clean',    val: m.avg_cleanliness },
                ].map(c => (
                  <div key={c.label} style={{ marginBottom: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                      <span>{c.label}</span>
                      <span style={{ fontWeight: 800, color: scoreColor(c.val) }}>{c.val}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 5, overflow: 'hidden' }}>
                      <div className="smooth-transition" style={{ height: '100%', borderRadius: 5, width: `${(c.val / 5) * 100}%`, background: scoreColor(c.val) }} />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Critical Tab ── */}
      {activeTab === 'critical' && (
        <>
          <div className="dashboard-card" style={{ 
            display: 'flex', gap: 14, alignItems: 'flex-end', 
            marginBottom: 24, flexWrap: 'wrap', background: 'var(--danger-light)', 
            border: '1px solid var(--danger-border)' 
          }}>
            <div>
              <div style={{ ...labelStyle, color: 'var(--danger)' }}>Meal Type</div>
              <select value={critMeal} onChange={e => setCritMeal(e.target.value)} className="custom-select" style={{ borderColor: 'var(--danger-border)', background: '#ffffff', minWidth: 180 }}>
                <option value="">All Meals</option>
                {MEAL_TYPES_ALL.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><div style={{ ...labelStyle, color: 'var(--danger)' }}>From Date</div><input type="date" value={critFrom} onChange={e => setCritFrom(e.target.value)} className="custom-input" style={{ borderColor: 'var(--danger-border)' }} /></div>
            <div><div style={{ ...labelStyle, color: 'var(--danger)' }}>To Date</div><input type="date" value={critTo} onChange={e => setCritTo(e.target.value)} className="custom-input" style={{ borderColor: 'var(--danger-border)' }} /></div>
            <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
              <button onClick={() => {
                if (!critFrom || !critTo) { alert("Please select 'From Date' and 'To Date' first."); return; }
                handleExport(`from_date=${critFrom}&to_date=${critTo}`);
              }} className="btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                📥 Export Excel
              </button>
              <button onClick={handleCritApply} className="btn-primary" style={{ background: 'var(--danger)', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)' }}>Apply</button>
              <button onClick={() => { setCritMeal(''); setCritFrom(''); setCritTo(''); setTimeout(fetchCrit, 0); }} className="btn-secondary">Reset</button>
            </div>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--danger)', fontWeight: 600 }}>Loading...</div>
          ) : critData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)', marginTop: 16 }}>No Critical Feedback Found</div>
            </div>
          ) : (
            <div className="dashboard-card" style={{ padding: 0, overflow: 'hidden', background: '#ffffff', border: '1px solid var(--border-color)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--danger-light)', borderBottom: '1px solid var(--danger-border)' }}>
                    {['#','Date','Meal','Rating','Comment'].map(h => (
                      <th key={h} style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {critData.map((row, i) => (
                    <tr key={i} className="smooth-transition" style={{ borderBottom: '1px solid var(--border-light)', borderLeft: '3px solid var(--danger)', background: '#ffffff' }}>
                      <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 700 }}>#{row.id}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.feedback_date || '—'}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ background: 'var(--border-light)', padding: '4px 10px', borderRadius: 4, fontWeight: 700, fontSize: 12, color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.02)' }}>{row.meal_type}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, fontSize: 14, color: 'var(--danger)' }}>
                        { (row.overall_rating || 0).toFixed(1) }
                      </td>
                      <td style={{ padding: '16px 20px', maxWidth: 320, color: 'var(--text-primary)', fontStyle: 'italic', fontWeight: 500 }}>
                        {row.comments ? `"${row.comments}"` : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
