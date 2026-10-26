import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <header
      style={{
        height: '64px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          style={{
            fontSize: '0.8125rem',
            fontWeight: '700',
            padding: '3px 10px',
            borderRadius: '6px',
            background: isAdmin ? '#fef3c7' : '#e8f5e9',
            color: isAdmin ? '#92400e' : '#15803d',
            border: `1px solid ${isAdmin ? '#fde68a' : '#bbf7d0'}`
          }}
        >
          {isAdmin ? 'Operations Desk' : 'Author Portal'}
        </span>
        <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
          BookLeaf Publishing Author Support & Communication
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isAdmin ? '#d97706' : '#0f5132',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.8125rem'
            }}
          >
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#0f172a', lineHeight: 1.2 }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{user?.email}</div>
          </div>
        </div>

        <button
          onClick={logout}
          title="Sign out"
          className="btn btn-ghost btn-sm"
          style={{ color: '#64748b', padding: '6px', marginLeft: '6px' }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
