import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const API = `http://${window.location.hostname}:8000`;
const COLORS = ['#1565C0','#1976D2','#1E88E5','#2196F3','#42A5F5'];

const CATEGORIES = [
  { key: 'avg_food_quality',   label: 'Food Quality',  emoji: '🍱' },
  { key: 'avg_food_taste',     label: 'Food Taste',    emoji: '😋' },
  { key: 'avg_cleanliness',    label: 'Cleanliness',   emoji: '✨' },
  { key: 'avg_staff_behavior', label: 'Staff Behavior',emoji: '👨‍🍳' },
  { key: 'avg_food_hygiene',   label: 'Food Hygiene',  emoji: '🧼' },
];

const MOOD = v =>
  v >= 4.5 ? '🤩' : v >= 4 ? '😊' : v >= 3 ? '😐' : v >= 2 ? '😕' : v > 0 ? '😢' : '—';

function Stars({ value }) {
  const full = Math.round(value || 0);
  return (
    <span>
      <span style={{ color: '#FFD700', fontSize: 14 }}>{'★'.repeat(full)}</span>
      <span style={{ color: '#CBD5E0', fontSize: 14 }}>{'★'.repeat(5 - full)}</span>
    </span>
  );
}

export default function Dashboard() {
  const navigate   = useNavigate();
  const [summary,  setSummary]    = useState(null);
  const [feedback, setFeedback]   = useState([]);
  const [mealFilter, setMealFilter] = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [loading,    setLoading]    = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (mealFilter) params.meal_type = mealFilter;
      if (fromDate)   params.from_date = fromDate;
      if (toDate)     params.to_date   = toDate;
      const [s, f] = await Promise.all([
        axios.get(`${API}/feedback/summary`, { params }),
        axios.get(`${API}/feedback/all`,     { params }),
      ]);
      setSummary(s.data);
      setFeedback(f.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [mealFilter, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = CATEGORIES.map(c => ({
    name:  c.label,
    value: parseFloat(((summary?.[c.key]) || 0).toFixed(1)),
  }));

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F7FF' }}>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <div style={{
        width: 220, background: '#1565C0', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0,
        height: '100vh', zIndex: 100,
      }}>
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>🍽️ Canteen</div>
          <div style={{ color: '#90CAF9', fontSize: 12, marginTop: 4 }}>Admin Dashboard</div>
        </div>

        {[
          { icon: '📊', label: 'Dashboard',        path: '/dashboard' },
          { icon: '📋', label: 'Feedback Records', path: '/records'   },
        ].map(item => (
          <div key={item.label}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 20px', cursor: 'pointer',
              color: window.location.pathname === item.path ? '#fff' : '#90CAF9',
              background: window.location.pathname === item.path
                ? 'rgba(255,255,255,0.15)' : 'transparent',
              borderLeft: window.location.pathname === item.path
                ? '3px solid #FFD54F' : '3px solid transparent',
              fontSize: 14, fontWeight: 500,
              transition: 'all 0.2s',
            }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label}
          </div>
        ))}

        <div style={{ marginTop: 'auto', padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            background: '#69F0AE', borderRadius: '50%', marginRight: 8,
          }} />
          <span style={{ color: '#90CAF9', fontSize: 12 }}>API Online</span>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <div style={{ marginLeft: 220, flex: 1, padding: 28, overflowY: 'auto' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0D47A1' }}>📊 Dashboard</div>
            <div style={{ fontSize: 13, color: '#5C85C9', marginTop: 4 }}>
              Canteen feedback summary &amp; analytics
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                const params = new URLSearchParams();
                if (mealFilter) params.append('meal_type', mealFilter);
                if (fromDate)   params.append('from_date', fromDate);
                if (toDate)     params.append('to_date', toDate);
                const url = `${API}/feedback/export?${params.toString()}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('Export failed');
                const blob = await res.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `canteen_feedback_${new Date().toISOString().slice(0,10)}.xlsx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
              } catch (e) {
                alert('❌ Export failed. Make sure the backend is running.');
              }
            }}
            style={{
              background: '#1565C0', color: '#fff', border: 'none',
              padding: '12px 22px', borderRadius: 10, fontSize: 14,
              fontWeight: 700, cursor: 'pointer',
            }}>
            📥 Export to Excel
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '16px 20px',
          display: 'flex', gap: 16, alignItems: 'center',
          marginBottom: 24, border: '1px solid #BBDEFB', flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>MEAL TYPE</div>
            <select
              value={mealFilter}
              onChange={e => setMealFilter(e.target.value)}
              style={{ border: '1px solid #BBDEFB', borderRadius: 8, padding: '8px 12px', color: '#1565C0', background: '#F0F7FF', fontSize: 13 }}>
              <option value="">All Meals</option>
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>FROM DATE</div>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              style={{ border: '1px solid #BBDEFB', borderRadius: 8, padding: '8px 12px', color: '#1565C0', background: '#F0F7FF', fontSize: 13 }} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1565C0', marginBottom: 4 }}>TO DATE</div>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              style={{ border: '1px solid #BBDEFB', borderRadius: 8, padding: '8px 12px', color: '#1565C0', background: '#F0F7FF', fontSize: 13 }} />
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button onClick={fetchData}
              style={{ background: '#1565C0', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>
              Apply Filter
            </button>
            <button onClick={() => { setMealFilter(''); setFromDate(''); setToDate(''); }}
              style={{ background: '#EEF4FF', color: '#1565C0', border: '1px solid #BBDEFB', padding: '9px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
              Reset
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 24 }}>
          {/* Total */}
          <div style={{ background: '#EEF4FF', borderRadius: 14, padding: '18px 12px', textAlign: 'center', border: '1px solid #BBDEFB' }}>
            <div style={{ fontSize: 26 }}>📝</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#5C85C9', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>Total Feedback</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#1565C0', marginTop: 4 }}>
              {loading ? '—' : summary?.total_count ?? 0}
            </div>
            <div style={{ fontSize: 11, color: '#90CAF9' }}>responses</div>
          </div>

          {/* Category Cards */}
          {CATEGORIES.map(c => {
            const val = summary?.[c.key] || 0;
            return (
              <div key={c.key} style={{ background: '#fff', borderRadius: 14, padding: '18px 12px', textAlign: 'center', border: '1px solid #BBDEFB' }}>
                <div style={{ fontSize: 26 }}>{c.emoji}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#5C85C9', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 6 }}>{c.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#0D47A1', marginTop: 4 }}>
                  {loading ? '—' : val.toFixed(1)}
                </div>
                <Stars value={val} />
                <div style={{ fontSize: 22, marginTop: 6 }}>{MOOD(val)}</div>
              </div>
            );
          })}
        </div>

        {/* Chart */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #BBDEFB', marginBottom: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0D47A1', marginBottom: 20 }}>
            📈 Average Ratings by Category
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#BBDEFB" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#1565C0', fontWeight: 600 }} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#1565C0' }} />
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #BBDEFB', borderRadius: 10, fontSize: 13 }}
                formatter={v => [`${v} / 5.0`, 'Avg Rating']}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Insight Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:24 }}>

          {/* Best Category */}
          <div style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #BBDEFB' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#5C85C9', marginBottom:12 }}>🏆 Best Rated Category</div>
            {(() => {
              if (!summary || !summary.total_count) return <div style={{ color:'#A0AEC0', textAlign:'center', padding:20 }}>No data yet</div>;
              const best = CATEGORIES.reduce((a,b) => (summary[a.key]||0) > (summary[b.key]||0) ? a : b);
              const val = summary[best.key] || 0;
              return (
                <div style={{ textAlign:'center', padding:'10px 0' }}>
                  <div style={{ fontSize:48 }}>{best.emoji}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#0D47A1', marginTop:8 }}>{best.label}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:'#38A169', marginTop:4 }}>{val.toFixed(1)} ⭐</div>
                </div>
              );
            })()}
          </div>

          {/* Needs Improvement */}
          <div style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #BBDEFB' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#5C85C9', marginBottom:12 }}>⚠️ Needs Improvement</div>
            {(() => {
              if (!summary || !summary.total_count) return <div style={{ color:'#A0AEC0', textAlign:'center', padding:20 }}>No data yet</div>;
              const worst = CATEGORIES.reduce((a,b) => (summary[a.key]||0) < (summary[b.key]||0) ? a : b);
              const val = summary[worst.key] || 0;
              return (
                <div style={{ textAlign:'center', padding:'10px 0' }}>
                  <div style={{ fontSize:48 }}>{worst.emoji}</div>
                  <div style={{ fontSize:18, fontWeight:800, color:'#0D47A1', marginTop:8 }}>{worst.label}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:'#E53E3E', marginTop:4 }}>{val.toFixed(1)} ⭐</div>
                </div>
              );
            })()}
          </div>

          {/* Overall Health */}
          <div style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #BBDEFB' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#5C85C9', marginBottom:12 }}>📊 Overall Health Score</div>
            {(() => {
              if (!summary || !summary.total_count) return <div style={{ color:'#A0AEC0', textAlign:'center', padding:20 }}>No data yet</div>;
              const avg = CATEGORIES.map(c => summary[c.key]||0).reduce((a,b)=>a+b,0) / CATEGORIES.length;
              const pct = (avg/5*100).toFixed(0);
              const color = avg>=4 ? '#38A169' : avg>=3 ? '#ECC94B' : '#E53E3E';
              const face  = avg>=4.5?'🤩':avg>=4?'😊':avg>=3?'😐':avg>=2?'😕':'😢';
              return (
                <div style={{ textAlign:'center', padding:'10px 0' }}>
                  <div style={{ fontSize:52 }}>{face}</div>
                  <div style={{ fontSize:32, fontWeight:800, color, marginTop:8 }}>{avg.toFixed(1)} / 5.0</div>
                  <div style={{ background:'#F0F7FF', borderRadius:20, height:10, marginTop:12 }}>
                    <div style={{ background:color, borderRadius:20, height:10, width:`${pct}%`, transition:'width 0.5s' }}/>
                  </div>
                  <div style={{ fontSize:13, color:'#5C85C9', marginTop:6 }}>{pct}% satisfaction rate</div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Meal Breakdown */}
        <div style={{ background:'#fff', borderRadius:14, padding:20, border:'1px solid #BBDEFB', marginBottom:24 }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#0D47A1', marginBottom:16 }}>🍴 Feedback by Meal Type</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
            {[
              { label:'Breakfast', emoji:'🌅', bg:'#E3F2FD', color:'#1565C0' },
              { label:'Lunch',     emoji:'☀️', bg:'#E8F5E9', color:'#2E7D32' },
              { label:'Dinner',    emoji:'🌙', bg:'#EDE7F6', color:'#4527A0' },
            ].map(m => {
              const count = feedback.filter(r => r.meal_type === m.label).length;
              const pct   = feedback.length ? Math.round(count/feedback.length*100) : 0;
              return (
                <div key={m.label} style={{ background:m.bg, borderRadius:12, padding:'18px 20px', textAlign:'center' }}>
                  <div style={{ fontSize:36 }}>{m.emoji}</div>
                  <div style={{ fontSize:16, fontWeight:800, color:m.color, marginTop:8 }}>{m.label}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:m.color, marginTop:4 }}>{count}</div>
                  <div style={{ fontSize:12, color:m.color, opacity:0.7 }}>{pct}% of total</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* View All Records CTA */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <button
            onClick={() => navigate('/records')}
            style={{ background:'#1565C0', color:'#fff', border:'none', padding:'12px 32px', borderRadius:10, fontWeight:700, fontSize:15, cursor:'pointer' }}>
            📋 View All {feedback.length} Feedback Records →
          </button>
        </div>

      </div>
    </div>
  );
}
