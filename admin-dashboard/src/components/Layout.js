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

  // Map icons to simple SVG or emoji for now ifionicons isn't loaded, but we'll use sleek SVGs
  const getIcon = (name, active) => {
    const color = active ? '#0f172a' : '#64748b';
    if (name === 'grid-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
    if (name === 'bar-chart-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>;
    if (name === 'list-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
    if (name === 'document-text-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
    if (name === 'alert-circle-outline') return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#ef4444' : color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
    return null;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      
      {/* ── Sidebar ── */}
      <aside style={{
        width: 260, backgroundColor: '#ffffff',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column', zIndex: 200,
        borderRight: '1px solid #e2e8f0',
      }}>
        {/* Brand */}
        <div style={{ padding: '32px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(15, 23, 42, 0.2)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
          </div>
          <div>
            <div style={{ color: '#0f172a', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>TSF Brakes India</div>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 500, marginTop: 2, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Canteen Analytics</div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '0 12px', flex: 1, marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0 16px', marginBottom: 12 }}>
            Menu
          </div>
          {NAV.map(item => {
            const active = location.pathname === item.path;
            const isCrit = item.path === '/critical';
            return (
              <div key={item.path} onClick={() => navigate(item.path)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderRadius: 8, marginBottom: 4,
                cursor: 'pointer',
                background: active ? (isCrit ? '#fef2f2' : '#f1f5f9') : 'transparent',
                color: active ? (isCrit ? '#991b1b' : '#0f172a') : '#64748b',
                fontWeight: active ? 600 : 500, fontSize: 14,
                transition: 'all 0.15s ease', userSelect: 'none',
              }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                {getIcon(item.icon, active)}
                {item.label}
                {item.badge > 0 && (
                  <span style={{
                    marginLeft: 'auto', background: '#ef4444', color: '#fff',
                    fontSize: 11, fontWeight: 700, borderRadius: 20,
                    padding: '2px 8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
                  }}>{item.badge}</span>
                )}
              </div>
            );
          })}
        </nav>

        {/* User / API Status */}
        <div style={{ padding: '24px', borderTop: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 36, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#475569' }}>
              A
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>Admin User</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <div style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ color: '#64748b', fontSize: 11, fontWeight: 500 }}>System Online</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ marginLeft: 260, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: 1400, width: '100%', margin: '0 auto', padding: '40px 48px' }}>
          
          {/* Page Header */}
          <header style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 32,
          }}>
            <div>
              <h1 style={{ fontWeight: 800, fontSize: 28, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>{title}</h1>
              {subtitle && <div style={{ fontSize: 14, color: '#64748b', marginTop: 6, fontWeight: 400 }}>{subtitle}</div>}
            </div>
            {action && <div>{action}</div>}
          </header>

          {/* Page Content */}
          <div style={{ paddingBottom: 60 }}>
            {children}
          </div>

        </div>
      </main>
    </div>
  );
}
