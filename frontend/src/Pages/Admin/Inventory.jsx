import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import '../../CSS/AdminInventory.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/admin/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/admin/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/admin/borrows' },
  { label: 'Borrow Transactions', icon: 'pi pi-shopping-cart', path: '/admin/borrow-transactions' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/admin/reports' },
  { label: 'Approvals', icon: 'pi pi-check-circle', path: '/admin/approvals' },
];

export function AdminInventory() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [showInstanceModal, setShowInstanceModal] = useState(false);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [showAddInstanceModal, setShowAddInstanceModal] = useState(false);
  const [selectedItemForAdd, setSelectedItemForAdd] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);

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
    if (!token || user?.role !== 'ADMIN') {
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

  const handleUpdateInstance = async (instanceId, updates) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/item-instances/${instanceId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update instance');
      }

      // Reload items
      if (selectedCategory) {
        loadCategoryItems(selectedCategory.id);
      }
      setShowInstanceModal(false);
      setSelectedInstance(null);
    } catch (err) {
      alert('Error updating instance: ' + err.message);
    }
  };

  const handleDeleteInstance = async (instanceId) => {
    if (!confirm('Are you sure you want to delete this item instance?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/item-instances/${instanceId}/delete/`, {
        method: 'DELETE',
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to delete instance');
      }

      // Reload items
      if (selectedCategory) {
        loadCategoryItems(selectedCategory.id);
      }
      setShowInstanceModal(false);
      setSelectedInstance(null);
    } catch (err) {
      alert('Error deleting instance: ' + err.message);
    }
  };

  const handleAddInstance = async (itemId, referenceId, notes) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/items/${itemId}/instances/add/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reference_id: referenceId, notes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to add instance');
      }

      // Reload items
      if (selectedCategory) {
        loadCategoryItems(selectedCategory.id);
      }
      setShowAddInstanceModal(false);
      setSelectedItemForAdd(null);
    } catch (err) {
      alert('Error adding instance: ' + err.message);
    }
  };

  const handleAddItem = async (name, description) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories/${selectedCategory.id}/items/create/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to create item');
      }

      // Reload items
      loadCategoryItems(selectedCategory.id);
      setShowAddItemModal(false);
    } catch (err) {
      alert('Error creating item: ' + err.message);
    }
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
              <p>Admin Panel</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Admin navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/admin/inventory' ? 'is-active' : ''}`}
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
            <h2>Inventory Management</h2>
            <p>Manage equipment by category with individual item tracking.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
        </header>

        {/* Scanner Info Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <i className="pi pi-qrcode" style={{ fontSize: '24px', color: '#1d4ed8' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '4px', fontSize: '15px' }}>
              📦 Barcode Scanner Ready
            </div>
            <div style={{ fontSize: '13px', color: '#2563eb' }}>
              When adding stock, click "Enable Scanner" and scan the barcode on the physical item. It will auto-save with the scanned barcode as Reference ID.
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

        {/* Add Item Button */}
        {selectedCategory && (
          <div className="action-bar">
            <button className="add-item-btn" onClick={() => setShowAddItemModal(true)}>
              <i className="pi pi-plus" />
              Add New Item Type
            </button>
          </div>
        )}

        {/* Items Grid */}
        <section className="items-section">
          {categoryItems.length === 0 ? (
            <div className="empty-state">
              <i className="pi pi-inbox" />
              <p>No items in this category</p>
              <button className="add-btn-empty" onClick={() => setShowAddItemModal(true)}>
                <i className="pi pi-plus" />
                Add First Item
              </button>
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
                  <button 
                    className="add-instance-btn"
                    onClick={() => {
                      setSelectedItemForAdd(item);
                      setShowAddInstanceModal(true);
                    }}
                  >
                    <i className="pi pi-plus" />
                    Add Stock
                  </button>
                </div>

                <div className="instances-grid">
                  {item.instances.length === 0 ? (
                    <div className="no-instances">
                      <p>No stock added yet</p>
                      <button 
                        className="add-first-btn"
                        onClick={() => {
                          setSelectedItemForAdd(item);
                          setShowAddInstanceModal(true);
                        }}
                      >
                        Add First Stock
                      </button>
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

      {/* Instance Edit Modal */}
      {showInstanceModal && selectedInstance && (
        <InstanceModal
          instance={selectedInstance}
          onClose={() => {
            setShowInstanceModal(false);
            setSelectedInstance(null);
          }}
          onUpdate={handleUpdateInstance}
          onDelete={handleDeleteInstance}
        />
      )}

      {/* Add Instance Modal */}
      {showAddInstanceModal && selectedItemForAdd && (
        <AddInstanceModal
          item={selectedItemForAdd}
          onClose={() => {
            setShowAddInstanceModal(false);
            setSelectedItemForAdd(null);
          }}
          onAdd={handleAddInstance}
        />
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <AddItemModal
          category={selectedCategory}
          onClose={() => setShowAddItemModal(false)}
          onAdd={handleAddItem}
        />
      )}
    </div>
  );
}

// Instance Edit Modal Component
function InstanceModal({ instance, onClose, onUpdate, onDelete }) {
  const [status, setStatus] = useState(instance.status);
  const [notes, setNotes] = useState(instance.notes || '');

  const handleSave = () => {
    onUpdate(instance.id, { status, notes });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Item Instance</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Reference ID</label>
            <input type="text" value={instance.reference_id} disabled />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="AVAILABLE">Available</option>
              <option value="IN_USE">In Use</option>
              <option value="FAULTY">Faulty</option>
              <option value="IN_REPAIR">In Repair</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add notes about this item..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-delete" onClick={() => onDelete(instance.id)}>
            <i className="pi pi-trash" />
            Delete
          </button>
          <div className="btn-group">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave}>
              <i className="pi pi-check" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Instance Modal Component
function AddInstanceModal({ item, onClose, onAdd }) {
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');
  const [scanMode, setScanMode] = useState(false);
  const barcodeInputRef = useRef(null);

  // Auto-focus when scan mode is enabled
  useEffect(() => {
    if (scanMode && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scanMode]);

  const handleScanBarcode = () => {
    if (!referenceId.trim()) {
      alert('Please scan or enter a barcode');
      return;
    }
    // Auto-save when barcode is scanned
    handleAdd();
  };

  const handleAdd = () => {
    if (!referenceId.trim()) {
      alert('Please enter a reference ID');
      return;
    }
    onAdd(item.id, referenceId, notes);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Stock - {item.name}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Reference ID (Barcode) *
              <button
                type="button"
                onClick={() => setScanMode(!scanMode)}
                style={{
                  padding: '4px 12px',
                  background: scanMode ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.3s ease',
                }}
              >
                <i className={scanMode ? 'pi pi-check' : 'pi pi-qrcode'} style={{ fontSize: '11px' }} />
                {scanMode ? 'Scanner Active' : 'Enable Scanner'}
              </button>
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && scanMode) {
                  handleScanBarcode();
                }
              }}
              placeholder={scanMode ? "🔍 Scanner Ready - Scan barcode on item..." : "e.g., LAP001, MOU042"}
              autoFocus={!scanMode}
              style={{
                border: scanMode ? '2px solid #0f766e' : '1px solid #ddd',
                boxShadow: scanMode ? '0 0 0 3px rgba(15, 118, 110, 0.1)' : 'none',
                transition: 'all 0.3s ease',
              }}
            />
            {scanMode && (
              <p style={{ 
                fontSize: '13px', 
                color: '#059669', 
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600
              }}>
                <i className="pi pi-info-circle" />
                Scan the barcode on the physical item. It will auto-save after scanning.
              </p>
            )}
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add notes about this specific item..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd}>
            <i className="pi pi-plus" />
            {scanMode ? 'Save Manually' : 'Add Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Item Modal Component
function AddItemModal({ category, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!name.trim()) {
      alert('Please enter an item name');
      return;
    }
    onAdd(name, description);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Item - {category.display_name}</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Item Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Laptop, Mouse, USB Drive"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="Add description..."
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleAdd}>
            <i className="pi pi-plus" />
            Create Item
          </button>
        </div>
      </div>
    </div>
  );
}
