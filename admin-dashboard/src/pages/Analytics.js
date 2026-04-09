import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const API = `http://${window.location.hostname}:8000`;
const COLORS = ['#1a56db','#7c3aed','#0891b2','#059669','#d97706'];

const CATS = [
  { key: 'avg_food_quality',   label: 'Food Quality',  emoji: '🍱' },
  { key: 'avg_food_taste',     label: 'Food Taste',    emoji: '😋' },
  { key: 'avg_food_hygiene',   label: 'Food Hygiene',  emoji: '🧼' },
  { key: 'avg_cleanliness',    label: 'Cleanliness',   emoji: '✨' },
  { key: 'avg_staff_behavior', label: 'Staff Behavior',emoji: '👨‍🍳' },
];

export default function Analytics() {
  const [summary, setSummary]       = useState(null);
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
      const res = await axios.get(`${API}/feedback/summary`, { params });
      setSummary(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [mealFilter, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const chartData = CATS.map(c => ({
    name:  c.label,
    value: parseFloat(((summary?.[c.key]) || 0).toFixed(1)),
  }));

  const overall = summary
    ? CATS.map(c => summary[c.key] || 0).reduce((a, b) => a + b, 0) / CATS.length
    : 0;

  return (
    <Layout title="Analytics" subtitle="Deep dive into feedback metrics">

      {/* Filters (Floating Bar) */}
      <div style={{
        background: '#fff', borderRadius: 16, padding: '16px 24px',
        display: 'flex', gap: 20, alignItems: 'flex-end',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        border: '1px solid #e2e8f0',
        marginBottom: 28, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Meal Type</div>
          <select
            value={mealFilter}
            onChange={e => setMealFilter(e.target.value)}
            style={{
              border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 14px',
              color: '#0f172a', background: '#f8fafc', fontSize: 14, minWidth: 160,
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          >
            <option value="">All Meals</option>
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>From Date</div>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            style={{
              border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 14px',
              color: '#0f172a', background: '#f8fafc', fontSize: 14,
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>To Date</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            style={{
              border: '1px solid #cbd5e1', borderRadius: 10, padding: '9px 14px',
              color: '#0f172a', background: '#f8fafc', fontSize: 14,
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          <button onClick={fetchData}
            style={{
              background: '#0f172a', color: '#fff', border: 'none',
              padding: '10px 24px', borderRadius: 10,
              fontWeight: 600, fontSize: 14,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
            onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
          >
            Apply Filters
          </button>
          <button onClick={() => { setMealFilter(''); setFromDate(''); setToDate(''); }}
            style={{
              background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
              padding: '10px 24px', borderRadius: 10,
              fontWeight: 600, fontSize: 14,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>

        {/* Chart */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '28px 24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>📈 Performance by Category</div>
            <div style={{ fontSize: 13, background: '#f1f5f9', padding: '6px 12px', borderRadius: 8, color: '#475569', fontWeight: 600 }}>
              Based on {summary?.total_count || 0} reviews
            </div>
          </div>
          
          <div style={{ height: 320 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>Loading chart data...</div>
            ) : (summary?.total_count || 0) === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>No data for selected filters</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }} dy={10} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 600, padding: '12px 16px' }}
                    itemStyle={{ color: '#0f172a' }}
                    formatter={(value) => [`${value} / 5.0`, 'Average Rating']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div style={{
          background: '#fff', borderRadius: 16, padding: '28px 24px',
          border: '1px solid #e2e8f0', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 28 }}>📊 Category Breakdown</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {CATS.map((c, i) => {
              const val = summary ? (summary[c.key] || 0) : 0;
              const pct = (val / 5) * 100;
              const color = COLORS[i % COLORS.length];
              return (
                <div key={c.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{c.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{c.label}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      {loading ? '-' : val.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: loading ? '0%' : `${pct}%`,
                      background: color, borderRadius: 10,
                      transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                    }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 16, paddingTop: 20, borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0a1628' }}>Weighted Average</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#1a56db' }}>{loading ? '-' : overall.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
}
