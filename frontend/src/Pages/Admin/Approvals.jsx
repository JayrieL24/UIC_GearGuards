import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  approveRegistration,
  clearSession,
  fetchPendingRegistrations,
  getStoredUser,
  getToken,
  rejectRegistration,
} from "../../lib/auth";
import "../../CSS/AdminApprovals.css";

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/admin/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/admin/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/admin/borrows' },
  { label: 'Borrow Transactions', icon: 'pi pi-shopping-cart', path: '/admin/borrow-transactions' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/admin/reports' },
  { label: 'Approvals', icon: 'pi pi-check-circle', path: '/admin/approvals' },
];

function Approvals() {
  const navigate = useNavigate();
  const token = getToken();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const user = getStoredUser();

  const loadPending = async () => {
    setLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const data = await fetchPendingRegistrations();
      setPending(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== "ADMIN") {
      navigate("/login");
      return;
    }
    loadPending();
  }, []);

  const handleApprove = async (item, role) => {
    setBusyId(item.user_id);
    setError("");
    setSuccessMessage("");
    try {
      await approveRegistration(item.user_id, role);
      setSuccessMessage(`${item.username} approved as ${role}`);
      await loadPending();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item) => {
    setBusyId(item.user_id);
    setError("");
    setSuccessMessage("");
    try {
      await rejectRegistration(item.user_id);
      setSuccessMessage(`${item.username} rejected`);
      await loadPending();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate("/login");
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
              <p>Admin Panel</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Admin navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/admin/approvals' ? 'is-active' : ''}`}
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
            <h2>User Approvals</h2>
            <p>Review and approve pending user registrations.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
        </header>

        {successMessage && (
          <div className="success-banner">
            <i className="pi pi-check-circle" />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-banner">
            <i className="pi pi-exclamation-circle" />
            {error}
          </div>
        )}

        <section className="approvals-section">
          {loading ? (
            <div className="loading-state">
              <i className="pi pi-spin pi-spinner" />
              <p>Loading pending registrations...</p>
            </div>
          ) : pending.length === 0 ? (
            <div className="empty-state">
              <i className="pi pi-inbox" />
              <p>No pending registrations</p>
              <span>All users have been approved or rejected.</span>
            </div>
          ) : (
            <div className="approvals-list">
              <div className="approvals-header">
                <h3>Pending Registrations ({pending.length})</h3>
              </div>
              {pending.map((item) => (
                <div key={item.user_id} className="approval-card">
                  <div className="card-header">
                    <div className="user-info">
                      <h4>{item.username}</h4>
                      <p className="email">{item.email || "No email provided"}</p>
                    </div>
                    <span className="requested-role">
                      Requested: <strong>{item.requested_role}</strong>
                    </span>
                  </div>

                  <div className="card-actions">
                    <button
                      className="approve-btn user-btn"
                      type="button"
                      disabled={busyId === item.user_id}
                      onClick={() => handleApprove(item, "STUDENT")}
                      title="Approve as Student"
                    >
                      <i className="pi pi-check" />
                      Approve as Student
                    </button>
                    <button
                      className="approve-btn user-btn"
                      type="button"
                      disabled={busyId === item.user_id}
                      onClick={() => handleApprove(item, "PERSONNEL")}
                      title="Approve as Personnel"
                    >
                      <i className="pi pi-check" />
                      Approve as Personnel
                    </button>
                    <button
                      className="approve-btn handler-btn"
                      type="button"
                      disabled={busyId === item.user_id}
                      onClick={() => handleApprove(item, "HANDLER")}
                      title="Approve as Staff"
                    >
                      <i className="pi pi-check" />
                      Approve as Staff
                    </button>
                    <button
                      className="reject-btn"
                      type="button"
                      disabled={busyId === item.user_id}
                      onClick={() => handleReject(item)}
                      title="Reject registration"
                    >
                      <i className="pi pi-times" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Approvals;
