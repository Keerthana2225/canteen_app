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
  { key: 'avg_food_quality',   label: 'Food Quality' },
  { key: 'avg_food_taste',     label: 'Food Taste' },
  { key: 'avg_food_hygiene',   label: 'Food Hygiene' },
  { key: 'avg_cleanliness',    label: 'Cleanliness' },
  { key: 'avg_staff_behavior', label: 'Staff Behavior' },
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

  useEffect(() => { fetchData(); }, []); // Only fetch on mount, remove dependencies to avoid auto-fetch on state change

  const handleApply = () => {
    if (!fromDate || !toDate) {
      alert("Please select both 'From Date' and 'To Date' to apply filters.");
      return;
    }
    fetchData();
  };

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
      <div className="dashboard-card" style={{
        display: 'flex', gap: 20, alignItems: 'flex-end',
        marginBottom: 28, flexWrap: 'wrap',
        background: '#ffffff',
      }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>Meal Type</div>
          <select
            value={mealFilter}
            onChange={e => setMealFilter(e.target.value)}
            className="custom-select"
            style={{ minWidth: 160 }}
          >
            <option value="">All Meals</option>
            <option>Breakfast</option>
            <option>Lunch</option>
            <option>Dinner</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>From Date</div>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="custom-input"
          />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>To Date</div>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="custom-input"
          />
        </div>
        <div style={{ display: 'flex', gap: 12, marginLeft: 'auto' }}>
          <button onClick={handleApply} className="btn-primary">
            Apply Filters
          </button>
          <button onClick={() => { setMealFilter(''); setFromDate(''); setToDate(''); setTimeout(fetchData, 0); }} className="btn-secondary">
            Clear
          </button>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>

        {/* Chart */}
        <div className="dashboard-card" style={{ background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>📈 Performance by Category</div>
            <div style={{ fontSize: 12, background: 'var(--border-light)', padding: '6px 14px', borderRadius: 8, color: 'var(--text-secondary)', fontWeight: 700 }}>
              Based on {summary?.total_count || 0} reviews
            </div>
          </div>
          
          <div style={{ height: 320 }}>
            {loading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading chart data...</div>
            ) : (summary?.total_count || 0) === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>No data for selected filters</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }} barSize={40}>
                  <defs>
                    <linearGradient id="colorGrad0" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.95}/>
                    </linearGradient>
                    <linearGradient id="colorGrad1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.95}/>
                    </linearGradient>
                    <linearGradient id="colorGrad2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#0e7490" stopOpacity={0.95}/>
                    </linearGradient>
                    <linearGradient id="colorGrad3" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#047857" stopOpacity={0.95}/>
                    </linearGradient>
                    <linearGradient id="colorGrad4" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.95}/>
                      <stop offset="95%" stopColor="#b45309" stopOpacity={0.95}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 600 }} dy={10} />
                  <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} dx={-10} />
                  <Tooltip
                    cursor={{ fill: 'var(--border-light)', radius: 6 }}
                    contentStyle={{ border: 'none', borderRadius: 12, boxShadow: 'var(--shadow-lg)', fontWeight: 700, padding: '12px 16px', background: '#ffffff' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => [`${value} / 5.0`, 'Average Rating']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => <Cell key={i} fill={`url(#colorGrad${i % 5})`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="dashboard-card" style={{ background: '#ffffff' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 28 }}>📊 Category Breakdown</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {CATS.map((c, i) => {
              const val = summary ? (summary[c.key] || 0) : 0;
              const pct = (val / 5) * 100;
              const color = COLORS[i % COLORS.length];
              return (
                <div key={c.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{c.label}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {loading ? '-' : val.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 10, overflow: 'hidden' }}>
                    <div className="smooth-transition" style={{
                      height: '100%', width: loading ? '0%' : `${pct}%`,
                      background: color, borderRadius: 10,
                    }} />
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 16, paddingTop: 20, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Weighted Average</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)' }}>{loading ? '-' : overall.toFixed(1)}</div>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
}
