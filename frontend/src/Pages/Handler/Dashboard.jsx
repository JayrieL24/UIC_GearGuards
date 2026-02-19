import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import '../../CSS/AdminDashboard.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/handler/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/handler/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/handler/borrows' },
  { label: 'Borrow Transactions', icon: 'pi pi-shopping-cart', path: '/handler/borrow-transactions' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/handler/reports' },
];

export function HandlerDashboard() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getStoredUser();

  // Immediate redirect if not authenticated or not a handler
  if (!token || !user || user.role !== 'HANDLER') {
    clearSession();
    window.location.href = '/login';
    return null;
  }

  const [stats, setStats] = useState(null);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [archivedBorrows, setArchivedBorrows] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, activeBorrowsRes, archivedBorrowsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/dashboard/stats/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/borrows/active/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/borrows/archived/`, {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      if (!statsRes.ok || !activeBorrowsRes.ok || !archivedBorrowsRes.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const statsData = await statsRes.json();
      const activeBorrowsData = await activeBorrowsRes.json();
      const archivedBorrowsData = await archivedBorrowsRes.json();

      setStats(statsData);
      setActiveBorrows(activeBorrowsData.borrows || []);
      setArchivedBorrows(archivedBorrowsData.borrows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStatusFilter = async (status) => {
    setSelectedStatus(status);
    try {
      const url = status
        ? `${API_BASE_URL}/api/admin/borrows/archived/?status=${status}`
        : `${API_BASE_URL}/api/admin/borrows/archived/`;

      const res = await fetch(url, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error('Failed to filter borrows');

      const data = await res.json();
      setArchivedBorrows(data.borrows || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  if (loading) {
    return <div className="admin-dashboard loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="admin-dashboard error">Error: {error}</div>;
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
              <p>Handler Panel</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Handler navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/handler/dashboard' ? 'is-active' : ''}`}
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
            <h2>Handler Dashboard</h2>
            <p>Manage equipment borrows and monitor system activity.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
        </header>

        {/* Stats Cards */}
        <section className="kpi-row">
          <article className="kpi-card">
            <p>Total Borrows</p>
            <h3>{stats?.total_borrows || 0}</h3>
          </article>
          <article className="kpi-card">
            <p>Active</p>
            <h3>{stats?.active_borrows || 0}</h3>
          </article>
          <article className="kpi-card">
            <p>Late</p>
            <h3>{stats?.late_borrows || 0}</h3>
          </article>
          <article className="kpi-card">
            <p>Returned</p>
            <h3>{stats?.returned_borrows || 0}</h3>
          </article>
          <article className="kpi-card">
            <p>Not Returned</p>
            <h3>{stats?.not_returned_borrows || 0}</h3>
          </article>
        </section>

        {/* Main Content */}
        <div className="admin-content">
          {/* Active Borrows */}
          <section className="borrows-section active-section">
            <div className="section-header">
              <div>
                <h3>Active Borrows</h3>
                <p>Currently borrowed items</p>
              </div>
              <span className="count-badge">{activeBorrows.length}</span>
            </div>
            <div className="borrows-list">
              {activeBorrows.length === 0 ? (
                <p className="empty-state">No active borrows</p>
              ) : (
                activeBorrows.map((borrow) => (
                  <div key={borrow.id} className="borrow-card">
                    <div className="borrow-header">
                      <h4>{borrow.item_name}</h4>
                      <span className="status-badge active">Active</span>
                    </div>
                    <div className="borrow-details">
                      <p><strong>Borrower:</strong> {borrow.borrower_username}</p>
                      <p><strong>Borrowed:</strong> {new Date(borrow.borrow_date).toLocaleDateString()}</p>
                      <p><strong>Due:</strong> {new Date(borrow.due_date).toLocaleDateString()}</p>
                      {borrow.handler_username && (
                        <p><strong>Handler:</strong> {borrow.handler_username}</p>
                      )}
                      {borrow.notes && <p><strong>Notes:</strong> {borrow.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Archived Borrows */}
          <section className="borrows-section archived-section">
            <div className="section-header">
              <div>
                <h3>Archived Borrows</h3>
                <p>Returned, late, or not returned items</p>
              </div>
              <span className="count-badge">{archivedBorrows.length}</span>
            </div>

            {/* Status Filter */}
            <div className="filter-buttons">
              <button
                className={`filter-btn ${selectedStatus === '' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('')}
              >
                All
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'RETURNED' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('RETURNED')}
              >
                Returned
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'LATE' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('LATE')}
              >
                Late
              </button>
              <button
                className={`filter-btn ${selectedStatus === 'NOT_RETURNED' ? 'active' : ''}`}
                onClick={() => handleStatusFilter('NOT_RETURNED')}
              >
                Not Returned
              </button>
            </div>

            <div className="borrows-list">
              {archivedBorrows.length === 0 ? (
                <p className="empty-state">No archived borrows</p>
              ) : (
                archivedBorrows.map((borrow) => (
                  <div key={borrow.id} className={`borrow-card ${borrow.status.toLowerCase()}`}>
                    <div className="borrow-header">
                      <h4>{borrow.item_name}</h4>
                      <span className={`status-badge ${borrow.status.toLowerCase()}`}>
                        {borrow.status === 'NOT_RETURNED' ? 'Not Returned' : borrow.status}
                      </span>
                    </div>
                    <div className="borrow-details">
                      <p><strong>Borrower:</strong> {borrow.borrower_username}</p>
                      <p><strong>Borrowed:</strong> {new Date(borrow.borrow_date).toLocaleDateString()}</p>
                      <p><strong>Due:</strong> {new Date(borrow.due_date).toLocaleDateString()}</p>
                      {borrow.return_date && (
                        <p><strong>Returned:</strong> {new Date(borrow.return_date).toLocaleDateString()}</p>
                      )}
                      {borrow.not_returned_reason && (
                        <p><strong>Reason:</strong> {borrow.not_returned_reason === 'NO_CONTACT' ? 'No Contact' : borrow.not_returned_reason}</p>
                      )}
                      {borrow.handler_username && (
                        <p><strong>Handler:</strong> {borrow.handler_username}</p>
                      )}
                      {borrow.notes && <p><strong>Notes:</strong> {borrow.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
