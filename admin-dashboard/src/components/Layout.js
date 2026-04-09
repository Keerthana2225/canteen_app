import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV = [
  { path: '/home',      icon: '🏠', label: 'Home'      },
  { path: '/analytics', icon: '📈', label: 'Analytics'  },
  { path: '/records',   icon: '📋', label: 'Records'    },
];

export default function Layout({ children, title, subtitle, action }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 240,
        background: 'linear-gradient(180deg, #0a1628 0%, #0f2044 100%)',
        position: 'fixed',
        top: 0, left: 0, height: '100vh',
        display: 'flex', flexDirection: 'column',
        zIndex: 200,
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>

        {/* Brand */}
        <div style={{
          padding: '26px 20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38,
              background: 'linear-gradient(135deg, #1a56db 0%, #3b82f6 100%)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 19, flexShrink: 0,
              boxShadow: '0 4px 12px rgba(59,130,246,0.4)',
            }}>🍽️</div>
            <div>
              <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>
                TSF Brakes India
              </div>
              <div style={{ color: '#60a5fa', fontSize: 11, fontWeight: 500, marginTop: 1 }}>
                Canteen Dashboard
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#334155',
            letterSpacing: 1.2, textTransform: 'uppercase',
            padding: '0 10px', marginBottom: 10,
          }}>
            Navigation
          </div>
          {NAV.map(item => {
            const active = location.pathname === item.path;
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11,
                  padding: '11px 14px',
                  borderRadius: 10,
                  marginBottom: 3,
                  cursor: 'pointer',
                  background: active ? 'rgba(59,130,246,0.18)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(59,130,246,0.4)' : 'transparent'}`,
                  color: active ? '#bfdbfe' : '#64748b',
                  fontWeight: active ? 700 : 500,
                  fontSize: 13.5,
                  transition: 'all 0.15s',
                  userSelect: 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
              >
                <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                {item.label}
                {active && <span style={{ marginLeft: 'auto', width: 7, height: 7, background: '#3b82f6', borderRadius: '50%', boxShadow: '0 0 6px #3b82f6' }} />}
              </div>
            );
          })}
        </nav>

        {/* Status */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ color: '#475569', fontSize: 12 }}>API Online</span>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ marginLeft: 240, flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

        {/* Top bar */}
        <header style={{
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', letterSpacing: '-0.4px' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>{subtitle}</div>}
          </div>
          {action && <div>{action}</div>}
        </header>

        {/* Content */}
        <div style={{ flex: 1, padding: '28px 32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
