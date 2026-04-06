import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = `http://${window.location.hostname}:8000`;

const MEAL_COLORS = {
  Breakfast: { bg: '#E3F2FD', color: '#1565C0', emoji: '🌅' },
  Lunch:     { bg: '#E8F5E9', color: '#2E7D32', emoji: '☀️' },
  Dinner:    { bg: '#EDE7F6', color: '#4527A0', emoji: '🌙' },
};

const MOOD = v =>
  v >= 5 ? '🤩' : v >= 4 ? '😊' : v >= 3 ? '😐' : v >= 2 ? '😕' : v > 0 ? '😢' : '';

function Stars({ value }) {
  const full = Math.round(value || 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ color: '#FFD700', fontSize: 15, letterSpacing: 1 }}>
        {'★'.repeat(full)}
      </span>
      <span style={{ color: '#CBD5E0', fontSize: 15, letterSpacing: 1 }}>
        {'★'.repeat(5 - full)}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#1565C0', marginLeft: 4 }}>
        {(value || 0).toFixed(1)}
      </span>
    </div>
  );
}

export default function FeedbackTable() {
  const navigate = useNavigate();
  const [feedback,   setFeedback]   = useState([]);
  const [mealFilter, setMealFilter] = useState('');
  const [fromDate,   setFromDate]   = useState('');
  const [toDate,     setToDate]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (mealFilter) params.meal_type = mealFilter;
      if (fromDate)   params.from_date = fromDate;
      if (toDate)     params.to_date   = toDate;
      const res = await axios.get(`${API}/feedback/all`, { params });
      setFeedback(res.data);
      setPage(1);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [mealFilter, fromDate, toDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = feedback.filter(r =>
    !search || (r.comments && r.comments.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages  = Math.ceil(filtered.length / PER_PAGE);
  const paginated   = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  const avgOf = key => {
    const vals = feedback.map(r => r[key]).filter(v => v > 0);
    return vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1) : '—';
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#F0F7FF' }}>

      {/* Sidebar */}
      <div style={{
        width:220, background:'#1565C0', flexShrink:0,
        display:'flex', flexDirection:'column',
        position:'fixed', top:0, left:0, height:'100vh', zIndex:100,
      }}>
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ color:'#fff', fontSize:20, fontWeight:700 }}>🍽️ Canteen</div>
          <div style={{ color:'#90CAF9', fontSize:12, marginTop:4 }}>Admin Dashboard</div>
        </div>
        {[
          { icon:'📊', label:'Dashboard',        path:'/dashboard' },
          { icon:'📋', label:'Feedback Records', path:'/records'   },
        ].map(item => (
          <div key={item.label} onClick={() => navigate(item.path)} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'14px 20px', cursor:'pointer',
            color: window.location.pathname===item.path ? '#fff' : '#90CAF9',
            background: window.location.pathname===item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
            borderLeft: window.location.pathname===item.path ? '3px solid #FFD54F' : '3px solid transparent',
            fontSize:14, fontWeight:500,
          }}>
            <span style={{ fontSize:18 }}>{item.icon}</span>{item.label}
          </div>
        ))}
        <div style={{ marginTop:'auto', padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,0.15)' }}>
          <span style={{ display:'inline-block', width:8, height:8, background:'#69F0AE', borderRadius:'50%', marginRight:8 }}/>
          <span style={{ color:'#90CAF9', fontSize:12 }}>API Online</span>
        </div>
      </div>

      {/* Main */}
      <div style={{ marginLeft:220, flex:1, padding:28 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <div style={{ fontSize:26, fontWeight:800, color:'#0D47A1' }}>📋 Feedback Records</div>
            <div style={{ fontSize:13, color:'#5C85C9', marginTop:4 }}>
              {feedback.length} total responses
            </div>
          </div>
          <button onClick={async () => {
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
          }} style={{
            background:'#1565C0', color:'#fff', border:'none',
            padding:'12px 22px', borderRadius:10, fontSize:14,
            fontWeight:700, cursor:'pointer',
          }}>📥 Export to Excel</button>
        </div>

        {/* Quick Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
          {[
            { label:'Food Quality',  key:'food_quality',  emoji:'🍱' },
            { label:'Food Taste',    key:'food_taste',    emoji:'😋' },
            { label:'Cleanliness',   key:'cleanliness',   emoji:'✨' },
            { label:'Staff Behavior',key:'staff_behavior',emoji:'👨‍🍳' },
            { label:'Food Hygiene',  key:'food_hygiene',  emoji:'🧼' },
          ].map(c => (
            <div key={c.key} style={{
              background:'#fff', borderRadius:12, padding:'14px 16px',
              border:'1px solid #BBDEFB', display:'flex',
              alignItems:'center', gap:12,
            }}>
              <span style={{ fontSize:28 }}>{c.emoji}</span>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'#5C85C9', textTransform:'uppercase' }}>
                  {c.label}
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:'#0D47A1', marginTop:2 }}>
                  {avgOf(c.key)}
                  <span style={{ fontSize:12, color:'#90CAF9', marginLeft:4 }}>/ 5</span>
                </div>
              </div>
              <span style={{ fontSize:22, marginLeft:'auto' }}>{MOOD(parseFloat(avgOf(c.key)))}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{
          background:'#fff', borderRadius:14, padding:'16px 20px',
          border:'1px solid #BBDEFB', marginBottom:20,
          display:'flex', gap:16, alignItems:'flex-end', flexWrap:'wrap',
        }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#1565C0', marginBottom:6 }}>MEAL TYPE</div>
            <select value={mealFilter} onChange={e => setMealFilter(e.target.value)} style={{
              border:'1px solid #BBDEFB', borderRadius:8, padding:'8px 12px',
              color:'#1565C0', background:'#F0F7FF', fontSize:13,
            }}>
              <option value="">All Meals</option>
              <option>Breakfast</option><option>Lunch</option><option>Dinner</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#1565C0', marginBottom:6 }}>FROM DATE</div>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{
              border:'1px solid #BBDEFB', borderRadius:8, padding:'8px 12px',
              color:'#1565C0', background:'#F0F7FF', fontSize:13,
            }}/>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#1565C0', marginBottom:6 }}>TO DATE</div>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{
              border:'1px solid #BBDEFB', borderRadius:8, padding:'8px 12px',
              color:'#1565C0', background:'#F0F7FF', fontSize:13,
            }}/>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#1565C0', marginBottom:6 }}>SEARCH COMMENTS</div>
            <input
              type="text" placeholder="Search comments..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                border:'1px solid #BBDEFB', borderRadius:8, padding:'8px 12px',
                color:'#1565C0', background:'#F0F7FF', fontSize:13, width:200,
              }}/>
          </div>
          <button onClick={fetchData} style={{
            background:'#1565C0', color:'#fff', border:'none',
            padding:'9px 20px', borderRadius:8, fontWeight:700, cursor:'pointer',
          }}>Apply Filter</button>
          <button onClick={() => { setMealFilter(''); setFromDate(''); setToDate(''); setSearch(''); }} style={{
            background:'#EEF4FF', color:'#1565C0', border:'1px solid #BBDEFB',
            padding:'9px 16px', borderRadius:8, cursor:'pointer',
          }}>Reset</button>
        </div>

        {/* Table */}
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #BBDEFB', overflow:'hidden' }}>
          <div style={{
            padding:'14px 20px', display:'flex',
            justifyContent:'space-between', alignItems:'center',
            borderBottom:'1px solid #BBDEFB', background:'#F8FBFF',
          }}>
            <div style={{ fontSize:15, fontWeight:700, color:'#0D47A1' }}>
              All Feedback Entries
            </div>
            <div style={{ fontSize:12, color:'#5C85C9' }}>
              Showing {filtered.length === 0 ? 0 : (page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
            </div>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#EEF4FF' }}>
                  {['#','Meal Type','🍱 Food Quality','😋 Food Taste','✨ Cleanliness','👨‍🍳 Staff','🧼 Food Hygiene','💬 Comments'].map(h => (
                    <th key={h} style={{
                      padding:'12px 16px', fontSize:11, fontWeight:700,
                      color:'#1565C0', textAlign:'left',
                      textTransform:'uppercase', letterSpacing:0.5,
                      borderBottom:'2px solid #BBDEFB', whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} style={{ padding:50, textAlign:'center', color:'#90CAF9', fontSize:16 }}>
                    ⏳ Loading feedback...
                  </td></tr>
                ) : paginated.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding:50, textAlign:'center', color:'#A0AEC0', fontSize:15 }}>
                    📭 No feedback found. Try adjusting your filters.
                  </td></tr>
                ) : paginated.map((row, i) => {
                  const meal = MEAL_COLORS[row.meal_type] || MEAL_COLORS.Lunch;
                  return (
                    <tr key={i} style={{
                      background: i%2===0 ? '#fff' : '#F8FBFF',
                      transition:'background 0.15s',
                    }}>
                      <td style={{ padding:'13px 16px', color:'#90CAF9', fontSize:13, fontWeight:600 }}>
                        {(page-1)*PER_PAGE+i+1}
                      </td>
                      <td style={{ padding:'13px 16px' }}>
                        <span style={{
                          display:'inline-flex', alignItems:'center', gap:6,
                          background:meal.bg, color:meal.color,
                          padding:'5px 12px', borderRadius:20,
                          fontSize:12, fontWeight:700,
                        }}>
                          {meal.emoji} {row.meal_type}
                        </span>
                      </td>
                      <td style={{ padding:'13px 16px' }}><Stars value={row.food_quality}/></td>
                      <td style={{ padding:'13px 16px' }}><Stars value={row.food_taste}/></td>
                      <td style={{ padding:'13px 16px' }}><Stars value={row.cleanliness}/></td>
                      <td style={{ padding:'13px 16px' }}><Stars value={row.staff_behavior}/></td>
                      <td style={{ padding:'13px 16px' }}><Stars value={row.food_hygiene}/></td>
                      <td style={{ padding:'13px 16px', maxWidth:200 }}>
                        {row.comments
                          ? <span style={{ color:'#2D3748', fontSize:13 }}>{row.comments}</span>
                          : <span style={{ color:'#CBD5E0', fontSize:12, fontStyle:'italic' }}>No comment</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding:'16px 20px', display:'flex',
              justifyContent:'center', alignItems:'center', gap:12,
              borderTop:'1px solid #BBDEFB',
            }}>
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} style={{
                background: page===1 ? '#F0F7FF' : '#1565C0',
                color: page===1 ? '#90CAF9' : '#fff',
                border:'1px solid #BBDEFB', padding:'8px 18px',
                borderRadius:8, fontWeight:600, cursor: page===1 ? 'default' : 'pointer',
              }}>← Prev</button>

              {Array.from({ length: totalPages }, (_,i) => i+1).map(n => (
                <button key={n} onClick={() => setPage(n)} style={{
                  background: n===page ? '#1565C0' : '#EEF4FF',
                  color: n===page ? '#fff' : '#1565C0',
                  border:'1px solid #BBDEFB', padding:'8px 14px',
                  borderRadius:8, fontWeight:600, cursor:'pointer',
                  minWidth:36,
                }}>{n}</button>
              ))}

              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages} style={{
                background: page===totalPages ? '#F0F7FF' : '#1565C0',
                color: page===totalPages ? '#90CAF9' : '#fff',
                border:'1px solid #BBDEFB', padding:'8px 18px',
                borderRadius:8, fontWeight:600, cursor: page===totalPages ? 'default' : 'pointer',
              }}>Next →</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
