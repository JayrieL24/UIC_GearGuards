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

export function BorrowerDashboard() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [stats, setStats] = useState({
    active_borrows: 0,
    pending_requests: 0,
    overdue_items: 0,
    total_borrowed: 0,
  });
  const [recentBorrows, setRecentBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || (user?.role !== 'STUDENT' && user?.role !== 'PERSONNEL' && user?.role !== 'USER')) {
      navigate('/login');
      return;
    }
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load borrower stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/borrower/stats/`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Load recent borrows
      const borrowsResponse = await fetch(`${API_BASE_URL}/api/borrower/my-borrows/?limit=5`, {
        headers: { Authorization: `Token ${token}` },
      });
      
      if (borrowsResponse.ok) {
        const borrowsData = await borrowsResponse.json();
        setRecentBorrows(borrowsData.borrows || []);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  if (loading) {
    return <div className="admin-dashboard loading">Loading dashboard...</div>;
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
                className={`nav-btn ${item.path === '/borrower/dashboard' ? 'is-active' : ''}`}
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
            <h2>Welcome, {user?.username}!</h2>
            <p>Manage your borrowed items and browse available equipment.</p>
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

        {/* Stats Cards */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginBottom: '28px',
        }}>
          {/* Active Borrows */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
            borderRadius: '12px',
            padding: '18px',
            border: '2px solid #bfdbfe',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => navigate('/borrower/my-borrows')}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              opacity: 0.1,
            }} />
            
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}>
                <i className="pi pi-box" style={{ fontSize: '20px', color: '#fff' }} />
              </div>
              <i className="pi pi-arrow-right" style={{ fontSize: '14px', color: '#3b82f6', opacity: 0.6 }} />
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: '#1e40af',
                marginBottom: '2px',
                lineHeight: 1,
              }}>
                {stats.active_borrows}
              </h3>
              <p style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}>
                Active Borrows
              </p>
            </div>
          </div>

          {/* Pending Requests */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
            borderRadius: '12px',
            padding: '18px',
            border: '2px solid #fde68a',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => navigate('/borrower/my-borrows')}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              opacity: 0.1,
            }} />
            
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}>
                <i className="pi pi-clock" style={{ fontSize: '20px', color: '#fff' }} />
              </div>
              <i className="pi pi-arrow-right" style={{ fontSize: '14px', color: '#f59e0b', opacity: 0.6 }} />
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: '#b45309',
                marginBottom: '2px',
                lineHeight: 1,
              }}>
                {stats.pending_requests}
              </h3>
              <p style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}>
                Pending Requests
              </p>
            </div>
          </div>

          {/* Overdue Items */}
          <div style={{
            background: stats.overdue_items > 0 
              ? 'linear-gradient(135deg, #ffffff 0%, #fef2f2 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
            borderRadius: '12px',
            padding: '18px',
            border: stats.overdue_items > 0 ? '2px solid #fecaca' : '2px solid #bbf7d0',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = stats.overdue_items > 0 
              ? '0 8px 16px rgba(239, 68, 68, 0.2)'
              : '0 8px 16px rgba(16, 185, 129, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => navigate('/borrower/my-borrows')}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: stats.overdue_items > 0 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              opacity: 0.1,
            }} />
            
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: stats.overdue_items > 0 
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: stats.overdue_items > 0 
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}>
                <i className={stats.overdue_items > 0 ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'} 
                   style={{ fontSize: '20px', color: '#fff' }} />
              </div>
              <i className="pi pi-arrow-right" style={{ 
                fontSize: '14px', 
                color: stats.overdue_items > 0 ? '#ef4444' : '#10b981', 
                opacity: 0.6 
              }} />
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: stats.overdue_items > 0 ? '#991b1b' : '#065f46',
                marginBottom: '2px',
                lineHeight: 1,
              }}>
                {stats.overdue_items}
              </h3>
              <p style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}>
                Overdue Items
              </p>
            </div>
          </div>

          {/* Total Borrowed */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
            borderRadius: '12px',
            padding: '18px',
            border: '2px solid #e9d5ff',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          onClick={() => navigate('/borrower/my-borrows')}
          >
            {/* Decorative circle */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              opacity: 0.1,
            }} />
            
            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
              }}>
                <i className="pi pi-history" style={{ fontSize: '20px', color: '#fff' }} />
              </div>
              <i className="pi pi-arrow-right" style={{ fontSize: '14px', color: '#8b5cf6', opacity: 0.6 }} />
            </div>
            
            <div>
              <h3 style={{ 
                fontSize: '28px', 
                fontWeight: 800, 
                color: '#6b21a8',
                marginBottom: '2px',
                lineHeight: 1,
              }}>
                {stats.total_borrowed}
              </h3>
              <p style={{ 
                fontSize: '13px', 
                color: '#6b7280',
                fontWeight: 600,
                letterSpacing: '0.3px',
              }}>
                Total Borrowed
              </p>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="quick-actions" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <button
              onClick={() => navigate('/borrower/browse')}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <i className="pi pi-search" style={{ fontSize: '20px' }} />
              Browse Items
            </button>

            <button
              onClick={() => navigate('/borrower/my-borrows')}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              <i className="pi pi-list" style={{ fontSize: '20px' }} />
              My Borrows
            </button>
          </div>
        </section>

        {/* Recent Borrows */}
        <section className="recent-section" style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>Recent Borrows</h3>
          {recentBorrows.length === 0 ? (
            <div style={{
              padding: '40px',
              background: '#fff',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#6b7280',
            }}>
              <i className="pi pi-inbox" style={{ fontSize: '48px', marginBottom: '16px', display: 'block' }} />
              <p>No borrows yet. Browse items to get started!</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Item</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Reference ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#374151' }}>Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBorrows.map((borrow) => (
                    <tr key={borrow.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px 16px' }}>{borrow.item_name}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{borrow.reference_id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: borrow.status === 'ACTIVE' ? '#d1fae5' : '#fef3c7',
                          color: borrow.status === 'ACTIVE' ? '#065f46' : '#92400e',
                        }}>
                          {borrow.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {new Date(borrow.due_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
