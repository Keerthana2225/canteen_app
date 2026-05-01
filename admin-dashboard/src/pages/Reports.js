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

  const inputStyle = { border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px', color: '#0f172a', background: '#f8fafc', fontSize: 13, outline: 'none' };
  const labelStyle = { fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 5, textTransform: 'uppercase' };
  const btnStyle   = { background: '#1a56db', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 };

  return (
    <Layout title="Reports" subtitle="Day-wise, Meal-wise, and Critical feedback reports">

      {/* ── Quick Export Bar ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center', background: '#fff', padding: '12px 20px', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginRight: 8 }}>📥 Quick Export:</div>
        <button onClick={() => {
          const d = new Date().toISOString().slice(0, 10);
          handleExport(`from_date=${d}&to_date=${d}`);
        }} style={{ ...btnStyle, background: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
          Today's Data
        </button>
        <button onClick={() => {
          const d = new Date();
          const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
          const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10);
          handleExport(`from_date=${firstDay}&to_date=${lastDay}`);
        }} style={{ ...btnStyle, background: '#3b82f6', display: 'flex', alignItems: 'center', gap: 6 }}>
          This Month
        </button>
        <button onClick={() => handleExport()} style={{ ...btnStyle, background: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
          Overall Data
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 6, borderRadius: 14, marginBottom: 28, width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 22px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: activeTab === tab.id ? '#fff' : 'transparent',
            color: activeTab === tab.id ? (tab.id === 'critical' ? '#dc2626' : '#1a56db') : '#64748b',
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Day-wise Tab ── */}
      {activeTab === 'day' && (
        <>
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-end', border: '1px solid #e2e8f0', marginBottom: 20, flexWrap: 'wrap' }}>
            <div><div style={labelStyle}>From Date</div><input type="date" value={dayFrom} onChange={e => setDayFrom(e.target.value)} style={inputStyle} /></div>
            <div><div style={labelStyle}>To Date</div><input type="date" value={dayTo} onChange={e => setDayTo(e.target.value)} style={inputStyle} /></div>
            <button onClick={handleDayApply} style={btnStyle}>Apply</button>
            <button onClick={() => { setDayFrom(''); setDayTo(''); setTimeout(fetchDay, 0); }} style={{ ...btnStyle, background: '#f1f5f9', color: '#475569' }}>Reset</button>
          </div>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Date','Total Responses','Critical','Avg Rating','Status'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>Loading...</td></tr>
                ) : dayData.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8' }}>No data found</td></tr>
                ) : dayData.map((d, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: d.critical > 0 ? '#fff5f5' : 'transparent' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700, color: '#0f172a' }}>{d.date}</td>
                    <td style={{ padding: '12px 20px', fontWeight: 700, color: '#1a56db', fontSize: 16 }}>{d.total}</td>
                    <td style={{ padding: '12px 20px' }}>
                      {d.critical > 0
                        ? <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>🔴 {d.critical}</span>
                        : <span style={{ color: '#10b981', fontWeight: 700 }}>✅ 0</span>}
                    </td>
                    <td style={{ padding: '12px 20px', fontWeight: 800, fontSize: 15, color: scoreColor(d.avg_rating) }}>⭐ {d.avg_rating}</td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ background: d.avg_rating >= 4 ? '#dcfce7' : d.avg_rating >= 3 ? '#fef9c3' : '#fee2e2', color: scoreColor(d.avg_rating), padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12 }}>
                        {d.avg_rating >= 4 ? '🟢 Good' : d.avg_rating >= 3 ? '🟡 Average' : '🔴 Poor'}
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
          <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-end', border: '1px solid #e2e8f0', marginBottom: 20, flexWrap: 'wrap' }}>
            <div><div style={labelStyle}>From Date</div><input type="date" value={mealFrom} onChange={e => setMealFrom(e.target.value)} style={inputStyle} /></div>
            <div><div style={labelStyle}>To Date</div><input type="date" value={mealTo} onChange={e => setMealTo(e.target.value)} style={inputStyle} /></div>
            <button onClick={handleMealApply} style={btnStyle}>Apply</button>
            <button onClick={() => { setMealFrom(''); setMealTo(''); setTimeout(fetchMeal, 0); }} style={{ ...btnStyle, background: '#f1f5f9', color: '#475569' }}>Reset</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {loading ? <div style={{ color: '#94a3b8', padding: 20 }}>Loading...</div>
            : mealData.map((m, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a' }}>{m.meal_type}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{m.total} responses</div>
                  </div>
                  {m.critical > 0 && <span style={{ background: '#fee2e2', color: '#dc2626', padding: '3px 10px', borderRadius: 20, fontWeight: 800, fontSize: 11 }}>🔴 {m.critical} critical</span>}
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: scoreColor(m.avg_overall), marginBottom: 8 }}>⭐ {m.avg_overall}</div>
                {[
                  { label: 'Quality',  val: m.avg_food_quality },
                  { label: 'Taste',    val: m.avg_food_taste },
                  { label: 'Hygiene',  val: m.avg_food_hygiene },
                  { label: 'Staff',    val: m.avg_staff_behavior },
                  { label: 'Clean',    val: m.avg_cleanliness },
                ].map(c => (
                  <div key={c.label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                      <span>{c.label}</span><span style={{ fontWeight: 800, color: scoreColor(c.val) }}>{c.val}</span>
                    </div>
                    <div style={{ height: 5, background: '#f1f5f9', borderRadius: 5 }}>
                      <div style={{ height: 5, borderRadius: 5, width: `${(c.val / 5) * 100}%`, background: scoreColor(c.val) }} />
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
          <div style={{ background: '#fff5f5', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-end', border: '1px solid #fecaca', marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ ...labelStyle, color: '#dc2626' }}>Meal Type</div>
              <select value={critMeal} onChange={e => setCritMeal(e.target.value)} style={{ ...inputStyle, borderColor: '#fca5a5', background: '#fff5f5', color: '#7f1d1d', minWidth: 180 }}>
                <option value="">All Meals</option>
                {MEAL_TYPES_ALL.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div><div style={{ ...labelStyle, color: '#dc2626' }}>From</div><input type="date" value={critFrom} onChange={e => setCritFrom(e.target.value)} style={{ ...inputStyle, borderColor: '#fca5a5', background: '#fff5f5', color: '#7f1d1d' }} /></div>
            <div><div style={{ ...labelStyle, color: '#dc2626' }}>To</div><input type="date" value={critTo} onChange={e => setCritTo(e.target.value)} style={{ ...inputStyle, borderColor: '#fca5a5', background: '#fff5f5', color: '#7f1d1d' }} /></div>
            <button onClick={handleCritApply} style={{ ...btnStyle, background: '#dc2626' }}>Apply</button>
            <button onClick={() => { setCritMeal(''); setCritFrom(''); setCritTo(''); setTimeout(fetchCrit, 0); }} style={{ ...btnStyle, background: '#fee2e2', color: '#991b1b' }}>Reset</button>
          </div>
          {loading ? <div style={{ textAlign: 'center', padding: '40px 0', color: '#dc2626' }}>Loading...</div>
          : critData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 56 }}>✅</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#10b981', marginTop: 12 }}>No Critical Feedback Found</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fff5f5' }}>
                    {['#','Date','Meal','Rating','Comment'].map(h => (
                      <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', borderBottom: '1px solid #fecaca' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {critData.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #fef2f2', background: i % 2 === 0 ? '#fff' : '#fff5f5' }}>
                      <td style={{ padding: '12px 18px', color: '#94a3b8', fontWeight: 600 }}>#{row.id}</td>
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: '#0f172a' }}>{row.feedback_date || '—'}</td>
                      <td style={{ padding: '12px 18px' }}><span style={{ background: '#f1f5f9', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: 12, color: '#334155' }}>{row.meal_type}</span></td>
                      <td style={{ padding: '12px 18px', fontWeight: 900, fontSize: 16, color: '#dc2626' }}>⭐ {(row.overall_rating || 0).toFixed(1)}</td>
                      <td style={{ padding: '12px 18px', maxWidth: 320, color: '#334155', fontSize: 13 }}>{row.comments ? `"${row.comments}"` : <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>—</span>}</td>
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
