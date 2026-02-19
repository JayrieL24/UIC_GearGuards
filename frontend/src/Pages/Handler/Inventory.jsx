import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import '../../CSS/AdminInventory.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/handler/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/handler/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/handler/borrows' },
  { label: 'Borrow Transactions', icon: 'pi pi-shopping-cart', path: '/handler/borrow-transactions' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/handler/reports' },
];

export function HandlerInventory() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states (view-only)
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/admin/categories/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
      
      // Select first category by default
      if (data.categories && data.categories.length > 0) {
        setSelectedCategory(data.categories[0]);
        loadCategoryItems(data.categories[0].id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryItems = async (categoryId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories/${categoryId}/items/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load items');
      }

      const data = await response.json();
      setCategoryItems(data.items || []);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'HANDLER') {
      navigate('/login');
      return;
    }
    loadCategories();
  }, []);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    loadCategoryItems(category.id);
  };

  const handleInstanceClick = (instance) => {
    setSelectedInstance(instance);
    setShowInstanceModal(true);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: '#10b981',
      IN_USE: '#3b82f6',
      FAULTY: '#ef4444',
      IN_REPAIR: '#f59e0b',
      OUT_OF_STOCK: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return <div className="admin-inventory loading">Loading inventory...</div>;
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
                className={`nav-btn ${item.path === '/handler/inventory' ? 'is-active' : ''}`}
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
            <h2>Inventory Management (View Only)</h2>
            <p>View equipment by category with individual item tracking.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
        </header>

        {/* Read-Only Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          border: '2px solid #f59e0b',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <i className="pi pi-eye" style={{ fontSize: '24px', color: '#d97706' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '4px', fontSize: '15px' }}>
              👁️ View-Only Mode
            </div>
            <div style={{ fontSize: '13px', color: '#b45309' }}>
              Handlers can view inventory but cannot add, edit, or delete items. Contact an Admin to make changes.
            </div>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {/* Category Tabs */}
        <section className="category-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory?.id === category.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category)}
            >
              <span className="tab-name">{category.display_name}</span>
              <span className="tab-count">{category.total_instances} items</span>
            </button>
          ))}
        </section>

        {/* Items Grid */}
        <section className="items-section">
          {categoryItems.length === 0 ? (
            <div className="empty-state">
              <i className="pi pi-inbox" />
              <p>No items in this category</p>
            </div>
          ) : (
            categoryItems.map((item) => (
              <div key={item.id} className="item-group">
                <div className="item-header">
                  <div>
                    <h3>{item.name}</h3>
                    {item.description && <p className="item-description">{item.description}</p>}
                  </div>
                  <div className="item-stats">
                    <span className="stat available">{item.available_count} Available</span>
                    <span className="stat in-use">{item.in_use_count} In Use</span>
                    {item.faulty_count > 0 && <span className="stat faulty">{item.faulty_count} Faulty</span>}
                    {item.in_repair_count > 0 && <span className="stat repair">{item.in_repair_count} In Repair</span>}
                  </div>
                </div>

                <div className="instances-grid">
                  {item.instances.length === 0 ? (
                    <div className="no-instances">
                      <p>No stock added yet</p>
                    </div>
                  ) : (
                    item.instances.map((instance) => (
                      <div
                        key={instance.id}
                        className="instance-card"
                        onClick={() => handleInstanceClick(instance)}
                      >
                        <div className="instance-ref">{instance.reference_id}</div>
                        <div 
                          className="instance-status"
                          style={{ backgroundColor: getStatusColor(instance.status) }}
                        >
                          {instance.status_display}
                        </div>
                        {instance.notes && (
                          <div className="instance-notes">{instance.notes}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {/* Instance View Modal (Read-Only) */}
      {showInstanceModal && selectedInstance && (
        <ViewInstanceModal
          instance={selectedInstance}
          onClose={() => {
            setShowInstanceModal(false);
            setSelectedInstance(null);
          }}
        />
      )}
    </div>
  );
}

// View Instance Modal Component (Read-Only for Handlers)
function ViewInstanceModal({ instance, onClose }) {
  const getStatusColor = (status) => {
    const colors = {
      AVAILABLE: '#10b981',
      IN_USE: '#3b82f6',
      FAULTY: '#ef4444',
      IN_REPAIR: '#f59e0b',
      OUT_OF_STOCK: '#6b7280',
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status) => {
    const labels = {
      AVAILABLE: 'Available',
      IN_USE: 'In Use',
      FAULTY: 'Faulty',
      IN_REPAIR: 'In Repair',
      OUT_OF_STOCK: 'Out of Stock',
    };
    return labels[status] || status;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>View Item Instance</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body">
          {/* Read-Only Notice */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <i className="pi pi-eye" style={{ fontSize: '18px', color: '#d97706' }} />
            <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
              View-only mode. Contact an Admin to edit or delete items.
            </div>
          </div>

          <div className="form-group">
            <label>Reference ID</label>
            <input 
              type="text" 
              value={instance.reference_id} 
              disabled 
              style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <div style={{
              padding: '12px 16px',
              background: '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: getStatusColor(instance.status),
              }} />
              <span style={{ fontWeight: 600, color: '#374151' }}>
                {getStatusLabel(instance.status)}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={instance.notes || 'No notes'}
              disabled
              rows="3"
              style={{ background: '#f3f4f6', cursor: 'not-allowed', resize: 'none' }}
            />
          </div>

          {instance.current_borrower && (
            <div className="form-group">
              <label>Current Borrower</label>
              <input 
                type="text" 
                value={instance.current_borrower} 
                disabled 
                style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
              />
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose} style={{ width: '100%' }}>
            <i className="pi pi-times" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
