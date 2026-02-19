import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import { NotificationBadge } from '../../components/NotificationBadge.jsx';
import '../../CSS/AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/borrower/dashboard' },
  { label: 'Browse Items', icon: 'pi pi-search', path: '/borrower/browse' },
  { label: 'My Borrows', icon: 'pi pi-list', path: '/borrower/my-borrows' },
  { label: 'Account', icon: 'pi pi-user', path: '/borrower/account' },
];

export function Notifications() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || (user?.role !== 'STUDENT' && user?.role !== 'PERSONNEL' && user?.role !== 'USER')) {
      navigate('/login');
      return;
    }
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/borrower/notifications/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const getNotificationIcon = (type) => {
    const icons = {
      APPROVED: 'pi-check-circle',
      REJECTED: 'pi-times-circle',
      OVERDUE: 'pi-exclamation-triangle',
    };
    return icons[type] || 'pi-bell';
  };

  const getNotificationColor = (type) => {
    const colors = {
      APPROVED: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '#10b981' },
      REJECTED: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' },
      OVERDUE: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' },
    };
    return colors[type] || { bg: '#f3f4f6', border: '#d1d5db', text: '#374151', icon: '#6b7280' };
  };

  if (loading) {
    return <div className="admin-dashboard loading">Loading notifications...</div>;
  }

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
                className={`nav-btn ${item.path === '/borrower/notifications' ? 'is-active' : ''}`}
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
            <h2>Notifications</h2>
            <p>Stay updated on your borrow requests and due dates.</p>
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

        {error && <div className="error-banner">{error}</div>}

        {/* Notifications List */}
        <section style={{ marginTop: '20px' }}>
          {notifications.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              background: '#fff',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#6b7280',
            }}>
              <i className="pi pi-bell" style={{ fontSize: '64px', marginBottom: '20px', display: 'block', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
                No Notifications
              </h3>
              <p>You're all caught up! No new notifications at this time.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {notifications.map((notification) => {
                const colors = getNotificationColor(notification.type);
                return (
                  <div
                    key={notification.id}
                    style={{
                      background: colors.bg,
                      border: `2px solid ${colors.border}`,
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'start',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      if (notification.borrow_id) {
                        navigate('/borrower/my-borrows');
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(4px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i 
                        className={`pi ${getNotificationIcon(notification.type)}`}
                        style={{ fontSize: '24px', color: colors.icon }}
                      />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: colors.text, margin: 0 }}>
                          {notification.title}
                        </h3>
                        <span style={{ fontSize: '12px', color: colors.text, opacity: 0.7, whiteSpace: 'nowrap', marginLeft: '12px' }}>
                          {new Date(notification.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p style={{ fontSize: '14px', color: colors.text, margin: '0 0 8px 0', lineHeight: '1.5' }}>
                        {notification.message}
                      </p>
                      
                      {notification.reference_id && (
                        <p style={{ fontSize: '13px', color: colors.text, opacity: 0.8, margin: 0, fontFamily: 'monospace' }}>
                          Reference: {notification.reference_id}
                        </p>
                      )}
                      
                      {notification.days_overdue && (
                        <div style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          background: '#fff',
                          borderRadius: '6px',
                          display: 'inline-block',
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: colors.icon }}>
                            {notification.days_overdue} day(s) overdue
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
