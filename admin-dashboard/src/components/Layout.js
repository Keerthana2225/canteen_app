import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API = `http://${window.location.hostname}:8000`;

export default function Layout({ children, title, subtitle, action }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [criticalCount, setCriticalCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/feedback/critical?limit=500`)
      .then(r => r.json())
      .then(d => setCriticalCount(Array.isArray(d) ? d.length : 0))
      .catch(() => {});
  }, []);

  const NAV = [
    { path: '/home',      icon: 'grid-outline', label: 'Overview'  },
    { path: '/analytics', icon: 'bar-chart-outline', label: 'Analytics' },
    { path: '/records',   icon: 'list-outline', label: 'All Records' },
    { path: '/reports',   icon: 'document-text-outline', label: 'Reports'    },
    { path: '/critical',  icon: 'alert-circle-outline', label: 'Action Needed', badge: criticalCount },
  ];

  const getIcon = (name, active) => {
    const isCrit = name === 'alert-circle-outline';
    const color = active ? (isCrit ? 'var(--danger)' : 'var(--primary)') : 'var(--text-secondary)';
    if (name === 'grid-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
    if (name === 'bar-chart-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
    if (name === 'list-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
    if (name === 'document-text-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    if (name === 'alert-circle-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
    return null;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      
      {/* ── Sidebar ── */}
      <aside style={{
        width: 'var(--sidebar-w)', backgroundColor: 'var(--card-bg)',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', zIndex: 200,
        borderRight: '1px solid var(--border-color)',
      }}>
        {/* Brand Header */}
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--primary) 0%, #1D4ED8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>TSF Brakes India</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 10, fontWeight: 700, marginTop: 2, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Canteen Analytics</div>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ padding: '0 16px', flex: 1, marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 12 }}>
            Menu
          </div>
          {NAV.map(item => {
            const active = location.pathname === item.path;
            const isCrit = item.path === '/critical';
            
            // Premium background and text colors based on state
            let bgStyle = 'transparent';
            let textColor = 'var(--text-secondary)';
            if (active) {
              if (isCrit) {
                bgStyle = 'var(--danger-light)';
                textColor = 'var(--danger)';
              } else {
                bgStyle = 'var(--primary-light)';
                textColor = 'var(--primary)';
              }
            }

            return (
              <div 
                key={item.path} 
                onClick={() => navigate(item.path)} 
                className="smooth-transition"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', borderRadius: 'var(--radius-btn)', marginBottom: 4,
                  cursor: 'pointer',
                  background: bgStyle,
                  color: textColor,
                  fontWeight: active ? 700 : 500, 
                  fontSize: 13,
                  userSelect: 'none',
                }}
                onMouseEnter={e => { 
                  if (!active) {
                    e.currentTarget.style.background = 'var(--border-light)'; 
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={e => { 
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'; 
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                {getIcon(item.icon, active)}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--danger)', color: '#fff',
                    fontSize: 10, fontWeight: 700, borderRadius: 20,
                    padding: '2px 8px', textAlign: 'center', 
                    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}>{item.badge}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* Admin User Section at Bottom */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 36, height: 36, borderRadius: '50%', 
              background: 'var(--primary-light)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 14, fontWeight: 700, color: 'var(--primary)',
              border: '1px solid rgba(37, 99, 235, 0.15)'
            }}>
              A
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Admin User</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ 
                  width: 6, height: 6, 
                  background: 'var(--success)', 
                  borderRadius: '50%', 
                  boxShadow: '0 0 6px var(--success)',
                  animation: 'pulseGlow 2s infinite'
                }} />
                <span style={{ color: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }}>System Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Layout ── */}
      <main style={{ marginLeft: 'var(--sidebar-w)', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto', padding: '40px 48px' }} className="fade-in">
          
          {/* Header Panel */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 32,
          }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 28, color: 'var(--text-primary)', letterSpacing: '-0.04em', margin: 0 }}>{title}</h1>
              {subtitle && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>{subtitle}</div>}
            </div>
            {action && <div>{action}</div>}
          </header>

          {/* Render Child Component Page */}
          <div style={{ paddingBottom: 60 }}>
            {children}
          </div>

        </div>
      </main>
    </div>
  );
}

