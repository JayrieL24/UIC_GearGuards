import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import { NotificationBadge } from '../../components/NotificationBadge.jsx';
import '../../CSS/Account.css';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/borrower/dashboard' },
  { label: 'Browse Items', icon: 'pi pi-search', path: '/borrower/browse' },
  { label: 'My Borrows', icon: 'pi pi-list', path: '/borrower/my-borrows' },
  { label: 'Account', icon: 'pi pi-user', path: '/borrower/account' },
];

export function BorrowerAccount() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!token || (user?.role !== 'STUDENT' && user?.role !== 'PERSONNEL' && user?.role !== 'USER')) {
      navigate('/login');
      return;
    }
    
    // Pre-fill username
    if (user?.username) {
      setUsername(user.username);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    console.log('Updating account info', { username, hasPassword: Boolean(password) });
    alert('Account update feature coming soon!');
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="dashboard-shell">
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />

      <aside className="sidebar-panel">
        <div>
          <div className="brand-block">
            <div className="brand-mark">GG</div>
            <div>
              <h1>GearGuard</h1>
              <p>{user?.role === 'STUDENT' ? 'Student' : 'Personnel'} Portal</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Borrower navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/borrower/account' ? 'is-active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button type="button" className="logout-btn" onClick={handleLogout}>
          <i className="pi pi-sign-out" />
          <span>Logout</span>
        </button>
      </aside>

      <main className="main-panel">
        <header className="top-row">
          <div>
            <h2>Account Settings</h2>
            <p>Manage your profile details and account credentials.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
          <button
            onClick={() => navigate('/borrower/notifications')}
            style={{
              position: 'relative',
              background: '#fff',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              padding: '12px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0f766e';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 118, 110, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <i className="pi pi-bell" style={{ fontSize: '20px', color: '#0f766e' }} />
            <NotificationBadge />
          </button>
        </header>

        <section style={{ marginTop: '20px' }}>
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxWidth: '600px',
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>Profile Information</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                }}
                disabled
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Username cannot be changed
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  background: '#f9fafb',
                  color: '#6b7280',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Account Status
              </label>
              <span style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                background: user?.is_approved ? '#d1fae5' : '#fef3c7',
                color: user?.is_approved ? '#065f46' : '#92400e',
              }}>
                {user?.is_approved ? 'Approved' : 'Pending Approval'}
              </span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (optional)"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                Leave blank to keep current password
              </p>
            </div>

            <button
              onClick={handleSave}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <i className="pi pi-save" />
              Save Changes
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
