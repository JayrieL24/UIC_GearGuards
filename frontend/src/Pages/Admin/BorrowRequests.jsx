import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import '../../CSS/AdminBorrows.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/admin/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/admin/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/admin/borrows' },
  { label: 'Borrow Requests', icon: 'pi pi-clock', path: '/admin/borrow-requests' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/admin/reports' },
  { label: 'Approvals', icon: 'pi pi-check-circle', path: '/admin/approvals' },
];

export function AdminBorrowRequests() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const loadBorrowRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/borrow-requests/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load borrow requests');
      }

      const data = await response.json();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    loadBorrowRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApprove = async (borrowId) => {
    if (!confirm('Approve this borrow request?')) return;

    try {
      setProcessingId(borrowId);
      const response = await fetch(`${API_BASE_URL}/api/borrow-requests/${borrowId}/approve/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      await loadBorrowRequests();
      alert('Borrow request approved successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (borrowId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      setProcessingId(borrowId);
      const response = await fetch(`${API_BASE_URL}/api/borrow-requests/${borrowId}/reject/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      await loadBorrowRequests();
      alert('Borrow request rejected successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  if (loading) {
    return <div className="admin-dashboard loading">Loading borrow requests...</div>;
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
              <p>Admin Panel</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Admin navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/admin/borrow-requests' ? 'is-active' : ''}`}
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
            <h2>Borrow Requests</h2>
            <p>Review and approve pending borrow requests from borrowers.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
        </header>

        {error && (
          <div className="error-banner" style={{ padding: '12px', background: '#fee', borderRadius: '8px', marginBottom: '16px' }}>
            Error: {error}
          </div>
        )}

        <section className="borrows-section">
          <div className="section-header">
            <div>
              <h3>Pending Requests</h3>
              <p>Requests waiting for approval</p>
            </div>
            <span className="count-badge">{requests.length}</span>
          </div>

          <div className="borrows-list">
            {requests.length === 0 ? (
              <p className="empty-state">No pending borrow requests</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="borrow-card pending">
                  <div className="borrow-header">
                    <h4>{request.item_name}</h4>
                    <span className="status-badge pending">Pending</span>
                  </div>
                  <div className="borrow-details">
                    <p><strong>Borrower:</strong> {request.borrower_username}</p>
                    <p><strong>Requested:</strong> {new Date(request.borrow_date).toLocaleString()}</p>
                    <p><strong>Due Date:</strong> {new Date(request.due_date).toLocaleDateString()}</p>
                    {request.item_instance_ref && (
                      <p><strong>Instance:</strong> {request.item_instance_ref}</p>
                    )}
                    {request.notes && <p><strong>Notes:</strong> {request.notes}</p>}
                  </div>
                  <div className="borrow-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      className="primary-btn"
                      onClick={() => handleApprove(request.id)}
                      disabled={processingId === request.id}
                      style={{
                        padding: '8px 16px',
                        background: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {processingId === request.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      className="secondary-btn"
                      onClick={() => handleReject(request.id)}
                      disabled={processingId === request.id}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {processingId === request.id ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
