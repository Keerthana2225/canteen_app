import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

const CATS = [
  { key: 'avg_food_quality',   label: 'Food Quality',   icon: '🍱', color: '#3b82f6' }, // blue
  { key: 'avg_food_taste',     label: 'Food Taste',     icon: '😋', color: '#8b5cf6' }, // violet
  { key: 'avg_food_hygiene',   label: 'Food Hygiene',   icon: '🧼', color: '#06b6d4' }, // cyan
  { key: 'avg_cleanliness',    label: 'Cleanliness',    icon: '✨', color: '#10b981' }, // emerald
  { key: 'avg_staff_behavior', label: 'Staff Behavior', icon: '👨‍🍳', color: '#f59e0b' }, // amber
];

const MEAL_META = [
  { label: 'Breakfast',              icon: '🌅', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Lunch',                  icon: '☀️', color: '#10b981', bg: '#ecfdf5' },
  { label: 'Dinner',                 icon: '🌙', color: '#8b5cf6', bg: '#f5f3ff' },
  { label: 'Midnight Supper',        icon: '🌃', color: '#6366f1', bg: '#e0e7ff' },
  { label: 'Early Morning Breakfast',icon: '🌄', color: '#f59e0b', bg: '#fffbeb' },
];

const scoreColor = v => v >= 4 ? '#10b981' : v >= 3 ? '#f59e0b' : '#ef4444';
const scoreFace  = v => v >= 4.5 ? '🤩' : v >= 4 ? '😊' : v >= 3 ? '😐' : v >= 2 ? '😕' : '😢';

function StatCard({ icon, label, value, color, loading }) {
  const val = parseFloat(value) || 0;
  const pct = (val / 5) * 100;
  return (
    <div style={{
      background: '#fff', borderRadius: 16, padding: '20px',
      border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      display: 'flex', flexDirection: 'column', gap: 14
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: color + '15', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{icon}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{label}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{loading ? '—' : val.toFixed(1)}<span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, marginLeft: 2 }}>/ 5</span></div>
      </div>
      <div style={{ height: 4, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: loading ? '0%' : `${pct}%`, background: color, borderRadius: 4, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [summary,  setSummary]  = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [critical, setCritical] = useState([]);
  const [dayReport,setDayReport]= useState([]);
  const [loading,  setLoading]  = useState(true);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, f, c, d] = await Promise.all([
        axios.get(`${API}/feedback/summary`),
        axios.get(`${API}/feedback/all?limit=500`),
        axios.get(`${API}/feedback/critical?limit=200`),
        axios.get(`${API}/feedback/day-report`),
      ]);
      setSummary(s.data);
      setFeedback(Array.isArray(f.data) ? f.data : []);
      setCritical(Array.isArray(c.data) ? c.data : []);
      setDayReport(Array.isArray(d.data) ? d.data : []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overall = summary ? CATS.map(c => summary[c.key] || 0).reduce((a, b) => a + b, 0) / CATS.length : 0;
  const mealCounts = {};
  MEAL_META.forEach(m => { mealCounts[m.label] = 0; });
  feedback.forEach(r => { if (mealCounts[r.meal_type] !== undefined) mealCounts[r.meal_type]++; });
  const recent = [...feedback].slice(0, 6);

  return (
    <Layout title="Dashboard" subtitle="Overview of your canteen's performance.">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Critical Banner ── */}
        {!loading && critical.length > 0 && (
          <div style={{ 
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div>
                <div style={{ color: '#991b1b', fontSize: 14, fontWeight: 700 }}>Action Required: {critical.length} Critical Entries</div>
                <div style={{ color: '#b91c1c', fontSize: 13, marginTop: 2 }}>{critical.length} recent feedback submissions have an overall rating below 2.0.</div>
              </div>
            </div>
            <button onClick={() => window.location.href = '/critical'} style={{ 
              background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 2px rgba(239, 68, 68, 0.2)'
            }}>Review</button>
          </div>
        )}

        {/* ── Hero / Top Section ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          
          {/* Health Score */}
          <div style={{ 
            background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', borderRadius: 20, padding: 32, 
            display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}>
            {/* Decorative bg orb */}
            <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0) 70%)', borderRadius: '50%' }} />
            
            <div style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>Overall Health</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 56, fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.04em', lineHeight: 1 }}>{loading ? '—' : overall.toFixed(1)}</span>
                <span style={{ fontSize: 20, color: '#64748b', fontWeight: 600 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: 48, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))' }}>{loading ? '⏳' : scoreFace(overall)}</div>
            </div>

            <div style={{ marginTop: 24, height: 4, background: 'rgba(241, 245, 249, 0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(overall / 5 * 100).toFixed(0)}%`, background: '#3b82f6', borderRadius: 4 }} />
            </div>
            
            <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Total Responses</div>
                <div style={{ fontSize: 16, color: '#f8fafc', fontWeight: 600, marginTop: 2 }}>{loading ? '—' : summary?.total_count ?? 0}</div>
              </div>
              <div style={{ width: 1, background: 'rgba(241, 245, 249, 0.1)' }} />
              <div>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Critical Feedback</div>
                <div style={{ fontSize: 16, color: (summary?.critical_count ?? 0) > 0 ? '#ef4444' : '#f8fafc', fontWeight: 600, marginTop: 2 }}>{loading ? '—' : summary?.critical_count ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Quick Category Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {CATS.slice(0, 3).map(c => <StatCard key={c.key} icon={c.icon} label={c.label} value={summary?.[c.key]} color={c.color} loading={loading} />)}
            {CATS.slice(3, 5).map(c => <StatCard key={c.key} icon={c.icon} label={c.label} value={summary?.[c.key]} color={c.color} loading={loading} />)}
            
            {/* Best Category Highlight */}
            {summary && summary.total_count > 0 && (
              <div style={{ background: '#f8fafc', borderRadius: 16, padding: '20px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Performing</div>
                {(() => { 
                  const best = CATS.reduce((a, b) => (summary[a.key] || 0) > (summary[b.key] || 0) ? a : b); 
                  return (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 24 }}>{best.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{best.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginTop: 2 }}>{(summary[best.key] || 0).toFixed(1)} ⭐</div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ── Detailed Breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          
          {/* Meal Distribution */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Feedback by Meal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {MEAL_META.map(m => {
                const count = mealCounts[m.label] || 0;
                const pct = feedback.length ? (count / feedback.length * 100).toFixed(0) : 0;
                return (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{m.icon}</span>
                        <span style={{ fontWeight: 500, fontSize: 13, color: '#334155' }}>{m.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{count}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8', width: 32, textAlign: 'right' }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Feedback */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Recent Feedback</div>
              <button onClick={() => window.location.href = '/records'} style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View All &rarr;</button>
            </div>
            
            <div style={{ padding: '0 24px' }}>
              {loading ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Loading...</div>
              : recent.length === 0 ? <div style={{ padding: '40px 0', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No feedback found.</div>
              : recent.map((r, i) => {
                const avg = ((r.food_quality + r.food_taste + r.food_hygiene + r.cleanliness + r.staff_behavior) / 5).toFixed(1);
                const sColor = scoreColor(parseFloat(avg));
                return (
                  <div key={i} style={{ 
                    display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', 
                    borderBottom: i < recent.length - 1 ? '1px solid #f1f5f9' : 'none' 
                  }}>
                    <div style={{ 
                      width: 40, height: 40, borderRadius: 20, background: sColor + '15', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                    }}>
                      {r.is_critical === 1 ? <span style={{ fontSize: 18 }}>🔴</span> : <span style={{ fontSize: 16, fontWeight: 700, color: sColor }}>{avg}</span>}
                    </div>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{r.meal_type}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>{r.feedback_date || 'Unknown Date'}</span>
                      </div>
                      {r.comments ? (
                        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>"{r.comments}"</div>
                      ) : (
                        <div style={{ fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' }}>No comment provided.</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}
