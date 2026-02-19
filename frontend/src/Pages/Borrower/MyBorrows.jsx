import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import { NotificationBadge } from '../../components/NotificationBadge.jsx';
import '../../CSS/AdminBorrows.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/borrower/dashboard' },
  { label: 'Browse Items', icon: 'pi pi-search', path: '/borrower/browse' },
  { label: 'My Borrows', icon: 'pi pi-list', path: '/borrower/my-borrows' },
  { label: 'Account', icon: 'pi pi-user', path: '/borrower/account' },
];

export function MyBorrows() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'history'

  useEffect(() => {
    if (!token || (user?.role !== 'STUDENT' && user?.role !== 'PERSONNEL' && user?.role !== 'USER')) {
      navigate('/login');
      return;
    }
    loadBorrows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadBorrows = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/borrower/my-borrows/?status=${activeTab}`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load borrows');
      }

      const data = await response.json();
      setBorrows(data.borrows || []);
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

  const getStatusColor = (status) => {
    const colors = {
      ACTIVE: '#10b981',
      PENDING: '#f59e0b',
      RETURNED: '#6b7280',
      OVERDUE: '#ef4444',
      REJECTED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="admin-dashboard loading">Loading borrows...</div>;
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
                className={`nav-btn ${item.path === '/borrower/my-borrows' ? 'is-active' : ''}`}
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
            <h2>My Borrows</h2>
            <p>View your active borrows, pending requests, and borrow history.</p>
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

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '20px',
          background: '#fff',
          padding: '8px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <button
            onClick={() => setActiveTab('active')}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: activeTab === 'active' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
              color: activeTab === 'active' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <i className="pi pi-box" />
            Active Borrows
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: activeTab === 'pending' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
              color: activeTab === 'pending' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <i className="pi pi-clock" />
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: activeTab === 'history' ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' : 'transparent',
              color: activeTab === 'history' ? '#fff' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '15px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <i className="pi pi-history" />
            History
          </button>
        </div>

        {/* Borrows List */}
        <section className="borrows-section">
          {borrows.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              background: '#fff',
              borderRadius: '12px',
              textAlign: 'center',
              color: '#6b7280',
            }}>
              <i className="pi pi-inbox" style={{ fontSize: '64px', marginBottom: '20px', display: 'block', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 600 }}>
                {activeTab === 'active' && 'No Active Borrows'}
                {activeTab === 'pending' && 'No Pending Requests'}
                {activeTab === 'history' && 'No Borrow History'}
              </h3>
              <p style={{ marginBottom: '20px' }}>
                {activeTab === 'active' && 'You don\'t have any active borrows at the moment.'}
                {activeTab === 'pending' && 'You don\'t have any pending requests.'}
                {activeTab === 'history' && 'You haven\'t borrowed any items yet.'}
              </p>
              {activeTab !== 'history' && (
                <button
                  onClick={() => navigate('/borrower/browse')}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <i className="pi pi-search" style={{ marginRight: '8px' }} />
                  Browse Items
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {borrows.map((borrow) => (
                <div
                  key={borrow.id}
                  style={{
                    background: '#fff',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: isOverdue(borrow.due_date) && borrow.status === 'ACTIVE' ? '2px solid #ef4444' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                        {borrow.item_name}
                      </h3>
                      <p style={{ fontSize: '14px', color: '#6b7280', fontFamily: 'monospace' }}>
                        {borrow.reference_id}
                      </p>
                    </div>
                    <span style={{
                      padding: '6px 16px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      background: `${getStatusColor(borrow.status)}20`,
                      color: getStatusColor(borrow.status),
                    }}>
                      {isOverdue(borrow.due_date) && borrow.status === 'ACTIVE' ? 'OVERDUE' : borrow.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Borrowed Date</p>
                      <p style={{ fontSize: '14px', fontWeight: 600 }}>
                        {new Date(borrow.borrow_date).toLocaleDateString()}
                      </p>
                    </div>
                    {borrow.due_date && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Due Date</p>
                        <p style={{ 
                          fontSize: '14px', 
                          fontWeight: 600,
                          color: isOverdue(borrow.due_date) && borrow.status === 'ACTIVE' ? '#ef4444' : 'inherit'
                        }}>
                          {new Date(borrow.due_date).toLocaleDateString()}
                          {isOverdue(borrow.due_date) && borrow.status === 'ACTIVE' && (
                            <i className="pi pi-exclamation-triangle" style={{ marginLeft: '8px', color: '#ef4444' }} />
                          )}
                        </p>
                      </div>
                    )}
                    {borrow.return_date && (
                      <div>
                        <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Returned Date</p>
                        <p style={{ fontSize: '14px', fontWeight: 600 }}>
                          {new Date(borrow.return_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {borrow.notes && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#f9fafb', borderRadius: '8px' }}>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Notes</p>
                      <p style={{ fontSize: '14px' }}>{borrow.notes}</p>
                    </div>
                  )}

                  {isOverdue(borrow.due_date) && borrow.status === 'ACTIVE' && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#fee2e2',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                    }}>
                      <p style={{ fontSize: '13px', color: '#991b1b', margin: 0 }}>
                        <i className="pi pi-exclamation-triangle" style={{ marginRight: '6px' }} />
                        This item is overdue. Please return it as soon as possible.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
