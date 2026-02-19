import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import '../../CSS/AdminBorrows.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/handler/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/handler/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/handler/borrows' },
  { label: 'Borrow Transactions', icon: 'pi pi-shopping-cart', path: '/handler/borrow-transactions' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/handler/reports' },
];

export function HandlerBorrows() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [allBorrows, setAllBorrows] = useState([]);
  const [filteredBorrows, setFilteredBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  
  // Modal state
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadBorrows = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/admin/borrows/all/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load borrows');

      const data = await res.json();
      setAllBorrows(data.borrows || []);
      setFilteredBorrows(data.borrows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBorrowDetail = async (borrowId) => {
    try {
      setModalLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/borrows/${borrowId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!res.ok) throw new Error('Failed to load borrow details');

      const data = await res.json();
      setSelectedBorrow(data);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleRowClick = (borrow) => {
    loadBorrowDetail(borrow.id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBorrow(null);
  };

  useEffect(() => {
    if (!token || user?.role !== 'HANDLER') {
      navigate('/login');
      return;
    }
    loadBorrows();
  }, []);

  useEffect(() => {
    let filtered = allBorrows;

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.item_name.toLowerCase().includes(term) ||
        b.borrower_username.toLowerCase().includes(term)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          return new Date(a.due_date) - new Date(b.due_date);
        case 'borrow_date':
          return new Date(b.borrow_date) - new Date(a.borrow_date);
        case 'borrower':
          return a.borrower_username.localeCompare(b.borrower_username);
        case 'item':
          return a.item_name.localeCompare(b.item_name);
        default:
          return 0;
      }
    });

    setFilteredBorrows(filtered);
  }, [allBorrows, statusFilter, searchTerm, sortBy]);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'active';
      case 'RETURNED':
        return 'returned';
      case 'LATE':
        return 'late';
      case 'NOT_RETURNED':
        return 'not-returned';
      default:
        return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'NOT_RETURNED':
        return 'Not Returned';
      default:
        return status;
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status !== 'ACTIVE') return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="admin-borrows loading">Loading borrows...</div>;
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

          <nav className="nav-list" aria-label="Admin navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/handler/borrows' ? 'is-active' : ''}`}
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
            <h2>All Borrows</h2>
            <p>Comprehensive view of all equipment borrows and returns.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="borrows-controls">
          <div className="search-box">
            <i className="pi pi-search" />
            <input
              type="text"
              placeholder="Search by item or borrower..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="RETURNED">Returned</option>
              <option value="LATE">Late</option>
              <option value="NOT_RETURNED">Not Returned</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="due_date">Sort by Due Date</option>
              <option value="borrow_date">Sort by Borrow Date</option>
              <option value="borrower">Sort by Borrower</option>
              <option value="item">Sort by Item</option>
            </select>
          </div>

          <div className="result-count">
            {filteredBorrows.length} borrow{filteredBorrows.length !== 1 ? 's' : ''}
          </div>
        </section>

        <section className="borrows-table-section">
          {filteredBorrows.length === 0 ? (
            <div className="empty-state">
              <i className="pi pi-inbox" />
              <p>No borrows found</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="borrows-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Ref ID</th>
                    <th>Borrower</th>
                    <th>Email</th>
                    <th>Borrowed</th>
                    <th>Due Date</th>
                    <th>Returned</th>
                    <th>Status</th>
                    <th>Handler</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrows.map((borrow) => (
                    <tr 
                      key={borrow.id} 
                      className={`row-${getStatusColor(borrow.status)} clickable-row`}
                      onClick={() => handleRowClick(borrow)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="item-cell">
                        <strong>{borrow.item_name}</strong>
                      </td>
                      <td>
                        {borrow.item_reference_id ? (
                          <span className="ref-id-badge">{borrow.item_reference_id}</span>
                        ) : (
                          <span style={{ color: '#999' }}>-</span>
                        )}
                      </td>
                      <td>{borrow.borrower_username}</td>
                      <td className="email-cell">{borrow.borrower_email || '-'}</td>
                      <td>{new Date(borrow.borrow_date).toLocaleDateString()}</td>
                      <td>
                        <span className={isOverdue(borrow.due_date, borrow.status) ? 'overdue' : ''}>
                          {new Date(borrow.due_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td>
                        {borrow.return_date
                          ? new Date(borrow.return_date).toLocaleDateString()
                          : '-'}
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusColor(borrow.status)}`}>
                          {getStatusLabel(borrow.status)}
                        </span>
                      </td>
                      <td>{borrow.handler_username || '-'}</td>
                      <td className="notes-cell">
                        {borrow.notes && (
                          <span className="note-text" title={borrow.notes}>
                            {borrow.notes.substring(0, 30)}
                            {borrow.notes.length > 30 ? '...' : ''}
                          </span>
                        )}
                        {borrow.not_returned_reason && (
                          <span className="reason-badge">
                            {borrow.not_returned_reason === 'NO_CONTACT' ? 'No Contact' : borrow.not_returned_reason}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Borrow Detail Modal */}
        {showModal && selectedBorrow && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Transaction Details</h2>
                <button className="modal-close" onClick={closeModal}>
                  <i className="pi pi-times" />
                </button>
              </div>

              {modalLoading ? (
                <div className="modal-loading">Loading details...</div>
              ) : (
                <div className="modal-body">
                  {/* Item Information */}
                  <section className="detail-section">
                    <h3><i className="pi pi-box" /> Item Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Item Name</label>
                        <span className="detail-value">{selectedBorrow.item_name}</span>
                      </div>
                      <div className="detail-item">
                        <label>Reference ID</label>
                        <span className="detail-value ref-id-badge">
                          {selectedBorrow.item_reference_id || 'N/A'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Category</label>
                        <span className="detail-value">{selectedBorrow.item_category || 'N/A'}</span>
                      </div>
                      <div className="detail-item full-width">
                        <label>Description</label>
                        <span className="detail-value">{selectedBorrow.item_description || 'No description'}</span>
                      </div>
                      {selectedBorrow.item_instance_notes && (
                        <div className="detail-item full-width">
                          <label>Item Notes</label>
                          <span className="detail-value">{selectedBorrow.item_instance_notes}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Borrower Information */}
                  <section className="detail-section">
                    <h3><i className="pi pi-user" /> Borrower Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Username</label>
                        <span className="detail-value">{selectedBorrow.borrower_username}</span>
                      </div>
                      <div className="detail-item">
                        <label>Email</label>
                        <span className="detail-value">{selectedBorrow.borrower_email}</span>
                      </div>
                      <div className="detail-item">
                        <label>Role</label>
                        <span className="detail-value">{selectedBorrow.borrower_role}</span>
                      </div>
                    </div>
                  </section>

                  {/* Transaction Information */}
                  <section className="detail-section">
                    <h3><i className="pi pi-calendar" /> Transaction Information</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Borrow Date</label>
                        <span className="detail-value">
                          {new Date(selectedBorrow.borrow_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Due Date</label>
                        <span className="detail-value">
                          {new Date(selectedBorrow.due_date).toLocaleString()}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Return Date</label>
                        <span className="detail-value">
                          {selectedBorrow.return_date 
                            ? new Date(selectedBorrow.return_date).toLocaleString()
                            : 'Not returned yet'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Status</label>
                        <span className={`status-badge ${getStatusColor(selectedBorrow.status)}`}>
                          {getStatusLabel(selectedBorrow.status)}
                        </span>
                      </div>
                      {selectedBorrow.handler_username && (
                        <>
                          <div className="detail-item">
                            <label>Handler</label>
                            <span className="detail-value">{selectedBorrow.handler_username}</span>
                          </div>
                          <div className="detail-item">
                            <label>Handler Email</label>
                            <span className="detail-value">{selectedBorrow.handler_email || 'N/A'}</span>
                          </div>
                        </>
                      )}
                      {selectedBorrow.not_returned_reason && (
                        <div className="detail-item">
                          <label>Not Returned Reason</label>
                          <span className="reason-badge">{selectedBorrow.not_returned_reason}</span>
                        </div>
                      )}
                      {selectedBorrow.notes && (
                        <div className="detail-item full-width">
                          <label>Notes</label>
                          <span className="detail-value">{selectedBorrow.notes}</span>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Timeline */}
                  <section className="detail-section">
                    <h3><i className="pi pi-history" /> Activity Timeline</h3>
                    {selectedBorrow.logs && selectedBorrow.logs.length > 0 ? (
                      <div className="timeline">
                        {selectedBorrow.logs.map((log, index) => (
                          <div key={log.id} className="timeline-item">
                            <div className="timeline-marker" />
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span className="timeline-action">{log.action.replace(/_/g, ' ')}</span>
                                <span className="timeline-date">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                              <div className="timeline-description">{log.description}</div>
                              {log.performed_by_username && (
                                <div className="timeline-user">
                                  <i className="pi pi-user" />
                                  {log.performed_by_username} ({log.performed_by_role})
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-timeline">
                        <i className="pi pi-info-circle" />
                        <p>No activity logs available for this transaction</p>
                      </div>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
