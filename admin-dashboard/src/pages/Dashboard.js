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

const scoreColor = v => v >= 4 ? 'var(--success)' : v >= 3 ? 'var(--secondary)' : 'var(--danger)';


function StatCard({ icon, label, value, color, loading }) {
  const val = parseFloat(value) || 0;
  const pct = (val / 5) * 100;
  return (
    <div className="dashboard-card" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      background: 'var(--card-bg)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-card)',
      padding: '20px 24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 38, height: 38, 
            background: color + '12', 
            borderRadius: '50%', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontSize: 18 
          }}>{icon}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>{label}</div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
          {loading ? '—' : val.toFixed(1)}
          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginLeft: 2 }}>/ 5</span>
        </div>
      </div>
      <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
        <div className="smooth-transition" style={{ height: '100%', width: loading ? '0%' : `${pct}%`, background: color, borderRadius: 10 }} />
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
            background: 'var(--danger-light)', 
            border: '1px solid var(--danger-border)', 
            borderRadius: 'var(--radius-card)', 
            padding: '16px 24px', 
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              </div>
              <div>
                <div style={{ color: 'var(--danger)', fontSize: 14, fontWeight: 700 }}>Action Required: {critical.length} Critical Entries</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{critical.length} recent feedback submissions have an overall rating below 2.0.</div>
              </div>
            </div>
            <button onClick={() => window.location.href = '/critical'} className="btn-primary" style={{ background: 'var(--danger)', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.15)' }}>
              Review
            </button>
          </div>
        )}

        {/* ── Hero / Top Section ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          
          {/* Health Score Card */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: 'var(--radius-card)', 
            padding: 24, 
            display: 'flex', flexDirection: 'column', justifyContent: 'center', 
            position: 'relative', overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--border-color)'
          }}>
            
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>Overall Health Score</div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 48, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{loading ? '—' : overall.toFixed(1)}</span>
                <span style={{ fontSize: 18, color: 'var(--text-secondary)', fontWeight: 600 }}>/ 5.0</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, padding: '6px 14px', background: 'var(--primary-light)', borderRadius: 20, color: 'var(--primary)' }}>
                {loading ? '...' : overall >= 4 ? 'Excellent' : overall >= 3 ? 'Average' : 'Critical'}
              </div>
            </div>

            <div style={{ marginTop: 24, height: 6, background: 'var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
              <div className="smooth-transition" style={{ height: '100%', width: `${(overall / 5 * 100).toFixed(0)}%`, background: 'var(--primary)', borderRadius: 10 }} />
            </div>
            
            <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Total Responses</div>
                <div style={{ fontSize: 16, color: 'var(--text-primary)', fontWeight: 700, marginTop: 4 }}>{loading ? '—' : summary?.total_count ?? 0}</div>
              </div>
              <div style={{ width: 1, background: 'var(--border-light)' }} />
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Critical Feedback</div>
                <div style={{ fontSize: 16, color: (summary?.critical_count ?? 0) > 0 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 700, marginTop: 4 }}>{loading ? '—' : summary?.critical_count ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Quick Category Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {CATS.slice(0, 3).map(c => <StatCard key={c.key} icon={c.icon} label={c.label} value={summary?.[c.key]} color={c.color} loading={loading} />)}
            {CATS.slice(3, 5).map(c => <StatCard key={c.key} icon={c.icon} label={c.label} value={summary?.[c.key]} color={c.color} loading={loading} />)}
            
            {/* Best Category Highlight */}
            {summary && summary.total_count > 0 && (
              <div style={{ 
                background: '#ffffff', 
                borderRadius: 'var(--radius-card)', 
                padding: '20px', 
                border: '1px dashed var(--border-color)', 
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                {(() => {
                  const vals = CATS.map(c => summary[c.key] || 0);
                  const maxVal = Math.max(...vals);
                  const allEqual = vals.every(v => v === vals[0]);
                  if (allEqual) {
                    return (
                      <>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Categories</div>
                        <div style={{ marginTop: 12 }}>
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto' }}>⚖️</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>All Equal</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginTop: 2 }}>{vals[0].toFixed(1)} ⭐ across all</div>
                        </div>
                      </>
                    );
                  }
                  const best = CATS[vals.indexOf(maxVal)];
                  return (
                    <>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Performing</div>
                      <div style={{ marginTop: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto' }}>{best.icon}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8 }}>{best.label}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>{maxVal.toFixed(1)} ⭐</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* ── Detailed Breakdown ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
          
          {/* Meal Distribution */}
          <div className="dashboard-card" style={{ background: '#fff', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Feedback by Meal</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {MEAL_META.map(m => {
                const count = mealCounts[m.label] || 0;
                const pct = feedback.length ? (count / feedback.length * 100).toFixed(0) : 0;
                return (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{m.icon}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{m.label}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{count}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 32, textAlign: 'right', fontWeight: 500 }}>{pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
                      <div className="smooth-transition" style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 10 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="dashboard-card" style={{ background: '#fff', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Feedback</div>
              <button onClick={() => window.location.href = '/records'} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                View All &rarr;
              </button>
            </div>
            
            <div style={{ padding: '0 24px' }}>
              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</div>
              ) : recent.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>No feedback found.</div>
              ) : (
                recent.map((r, i) => {
                  const avg = ((r.food_quality + r.food_taste + r.food_hygiene + r.cleanliness + r.staff_behavior) / 5).toFixed(1);
                  const sColor = scoreColor(parseFloat(avg));
                  const isCrit = r.is_critical === 1;
                  return (
                    <div key={i} style={{ 
                      display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 0', 
                      borderBottom: i < recent.length - 1 ? '1px solid var(--border-light)' : 'none' 
                    }}>
                      <div style={{ 
                        width: 38, height: 38, borderRadius: '50%', 
                        background: isCrit ? 'var(--danger-light)' : sColor + '12', 
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        border: `1px solid ${isCrit ? 'rgba(239, 68, 68, 0.15)' : sColor + '20'}`
                      }}>
                        {isCrit ? (
                          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--danger)' }}>CRIT</span>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 800, color: sColor }}>{avg}</span>
                        )}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{r.meal_type}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{r.feedback_date || 'Unknown Date'}</span>
                          {isCrit && (
                            <span style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                              Critical
                            </span>
                          )}
                        </div>
                        {r.comments ? (
                          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontStyle: 'italic' }}>
                            "{r.comments}"
                          </div>
                        ) : (
                          <div style={{ fontSize: 13, color: '#cbd5e1', fontStyle: 'italic' }}>No comment provided.</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}

