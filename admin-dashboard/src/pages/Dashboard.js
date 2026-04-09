import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

const CATS = [
  { key: 'avg_food_quality',   label: 'Food Quality',   emoji: '🍱', color: '#1a56db' },
  { key: 'avg_food_taste',     label: 'Food Taste',     emoji: '😋', color: '#7c3aed' },
  { key: 'avg_food_hygiene',   label: 'Food Hygiene',   emoji: '🧼', color: '#0891b2' },
  { key: 'avg_cleanliness',    label: 'Cleanliness',    emoji: '✨', color: '#059669' },
  { key: 'avg_staff_behavior', label: 'Staff Behavior', emoji: '👨‍🍳', color: '#d97706' },
];

const scoreColor = v => v >= 4 ? '#10b981' : v >= 3 ? '#f59e0b' : '#ef4444';
const scoreFace  = v => v >= 4.5 ? '🤩' : v >= 4 ? '😊' : v >= 3 ? '😐' : v >= 2 ? '😕' : '😢';

function StatCard({ emoji, label, value, color, loading }) {
  const val = parseFloat(value) || 0;
  const pct = (val / 5) * 100;
  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      padding: '22px 20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.09)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{
          width: 44, height: 44,
          background: color + '15',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>{emoji}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor(val) }}>
          {loading ? '—' : val.toFixed(1)} <span style={{ color: '#94a3b8', fontWeight: 400 }}>/ 5</span>
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>{label}</div>
      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 10 }}>
        <div style={{
          height: 6, borderRadius: 10,
          width: loading ? '0%' : `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{scoreFace(val)} {loading ? '' : `${pct.toFixed(0)}% satisfaction`}</div>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading,  setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        axios.get(`${API}/feedback/summary`),
        axios.get(`${API}/feedback/all`),
      ]);
      setSummary(s.data);
      setFeedback(f.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overall = summary
    ? CATS.map(c => summary[c.key] || 0).reduce((a, b) => a + b, 0) / CATS.length
    : 0;

  const mealCounts = { Breakfast: 0, Lunch: 0, Dinner: 0 };
  feedback.forEach(r => { if (mealCounts[r.meal_type] !== undefined) mealCounts[r.meal_type]++; });

  const recent = [...feedback].slice(-6).reverse();

  const exportExcel = async () => {
    try {
      const res = await fetch(`${API}/feedback/export`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `canteen_feedback_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); URL.revokeObjectURL(link.href);
    } catch { alert('❌ Export failed. Make sure the backend is running.'); }
  };

  return (
    <Layout
      title="Home"
      subtitle="Canteen feedback overview"
      action={
        <button onClick={exportExcel} style={{
          background: 'linear-gradient(135deg, #1a56db, #3b82f6)',
          color: '#fff', border: 'none',
          padding: '10px 20px', borderRadius: 10,
          fontWeight: 700, fontSize: 13,
          boxShadow: '0 4px 12px rgba(26,86,219,0.35)',
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          📥 Export Excel
        </button>
      }
    >
      {/* ── Hero Score ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #1e3a5f 50%, #1a56db 100%)',
        borderRadius: 20,
        padding: '32px 36px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 40px rgba(10,22,40,0.25)',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'rgba(59,130,246,0.08)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 100, width: 160, height: 160, background: 'rgba(59,130,246,0.05)', borderRadius: '50%' }} />

        <div>
          <div style={{ color: '#93c5fd', fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 }}>
            Overall Health Score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontSize: 56, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1 }}>
              {loading ? '—' : overall.toFixed(1)}
            </span>
            <span style={{ fontSize: 22, color: '#60a5fa', fontWeight: 600 }}>/5.0</span>
          </div>
          <div style={{ marginTop: 12, fontSize: 14, color: '#60a5fa', fontWeight: 500 }}>
            {loading ? '' : `${summary?.total_count ?? 0} total responses collected`}
          </div>
          {/* Score bar */}
          <div style={{ marginTop: 16, width: 260, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 10 }}>
            <div style={{
              height: 8, borderRadius: 10,
              width: `${(overall / 5 * 100).toFixed(0)}%`,
              background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              transition: 'width 1.2s ease',
            }} />
          </div>
        </div>
        <div style={{ fontSize: 90, opacity: 0.9, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
          {loading ? '⏳' : scoreFace(overall)}
        </div>
      </div>

      {/* ── Category Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 28 }}>
        {CATS.map(c => (
          <StatCard
            key={c.key}
            emoji={c.emoji}
            label={c.label}
            value={summary?.[c.key]}
            color={c.color}
            loading={loading}
          />
        ))}
      </div>

      {/* ── Meal Breakdown + Recent ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20, marginBottom: 28 }}>

        {/* Meal Counts */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>🍴 Feedback by Meal</div>
          {[
            { label: 'Breakfast', emoji: '🌅', color: '#1a56db', bg: '#eff6ff' },
            { label: 'Lunch',     emoji: '☀️', color: '#059669', bg: '#ecfdf5' },
            { label: 'Dinner',    emoji: '🌙', color: '#7c3aed', bg: '#f5f3ff' },
          ].map(m => {
            const count = mealCounts[m.label] || 0;
            const pct   = feedback.length ? (count / feedback.length * 100).toFixed(0) : 0;
            return (
              <div key={m.label} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 32, height: 32,
                      background: m.bg,
                      borderRadius: 8,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}>{m.emoji}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{m.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: m.color }}>{count}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ height: 7, background: '#f1f5f9', borderRadius: 8 }}>
                  <div style={{ height: 7, borderRadius: 8, width: `${pct}%`, background: m.color, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Entries */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 18 }}>🕐 Recent Feedback</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>Loading...</div>
          ) : recent.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>No feedback yet</div>
          ) : recent.map((r, i) => {
            const avg = ((r.food_quality + r.food_taste + r.food_hygiene + r.cleanliness + r.staff_behavior) / 5).toFixed(1);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '10px 0',
                borderBottom: i < recent.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <div style={{
                  width: 38, height: 38,
                  background: r.meal_type === 'Breakfast' ? '#eff6ff' : r.meal_type === 'Lunch' ? '#ecfdf5' : '#f5f3ff',
                  borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>
                  {r.meal_type === 'Breakfast' ? '🌅' : r.meal_type === 'Lunch' ? '☀️' : '🌙'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{r.meal_type}</div>
                  {r.comments && (
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.comments}
                    </div>
                  )}
                </div>
                <div style={{
                  fontWeight: 800, fontSize: 14,
                  color: scoreColor(parseFloat(avg)),
                  background: scoreColor(parseFloat(avg)) + '15',
                  padding: '4px 10px', borderRadius: 8,
                  flexShrink: 0,
                }}>
                  ⭐ {avg}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Quick Insights ── */}
      {summary && summary.total_count > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
          {[
            { title: '🏆 Best Category', ...(() => { const best = CATS.reduce((a, b) => (summary[a.key] || 0) > (summary[b.key] || 0) ? a : b); return { label: best.label, emoji: best.emoji, val: (summary[best.key] || 0).toFixed(1), color: '#059669' }; })() },
            { title: '⚠️ Needs Attention', ...(() => { const worst = CATS.reduce((a, b) => (summary[a.key] || 0) < (summary[b.key] || 0) ? a : b); return { label: worst.label, emoji: worst.emoji, val: (summary[worst.key] || 0).toFixed(1), color: '#ef4444' }; })() },
            { title: '📊 Satisfaction Rate', emoji: scoreFace(overall), label: `${(overall / 5 * 100).toFixed(0)}% positive`, val: overall.toFixed(1), color: scoreColor(overall) },
          ].map((card, i) => (
            <div key={i} style={{
              background: '#fff',
              borderRadius: 16,
              padding: '22px 24px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 14 }}>{card.title}</div>
              <div style={{ fontSize: 42 }}>{card.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 8 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: card.color, marginTop: 4 }}>{card.val} ⭐</div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
