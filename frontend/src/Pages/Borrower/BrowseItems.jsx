import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import { NotificationBadge } from '../../components/NotificationBadge.jsx';
import '../../CSS/AdminInventory.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/borrower/dashboard' },
  { label: 'Browse Items', icon: 'pi pi-search', path: '/borrower/browse' },
  { label: 'My Borrows', icon: 'pi pi-list', path: '/borrower/my-borrows' },
  { label: 'Account', icon: 'pi pi-user', path: '/borrower/account' },
];

export function BrowseItems() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryItems, setCategoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!token || (user?.role !== 'STUDENT' && user?.role !== 'PERSONNEL' && user?.role !== 'USER')) {
      navigate('/login');
      return;
    }
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/borrower/categories/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load categories');
      }

      const data = await response.json();
      setCategories(data.categories || []);
      
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
      const response = await fetch(`${API_BASE_URL}/api/borrower/categories/${categoryId}/items/`, {
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

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    loadCategoryItems(category.id);
  };

  const handleRequestItem = (item) => {
    setSelectedItem(item);
    setShowRequestModal(true);
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  // Helper function to get appropriate icon for each item type
  const getItemIcon = (itemName) => {
    const name = itemName.toLowerCase();
    if (name.includes('laptop') || name.includes('computer')) return 'pi pi-desktop';
    if (name.includes('tablet')) return 'pi pi-tablet';
    if (name.includes('phone') || name.includes('smartphone')) return 'pi pi-mobile';
    if (name.includes('camera')) return 'pi pi-camera';
    if (name.includes('projector')) return 'pi pi-video';
    if (name.includes('mouse')) return 'pi pi-circle';
    if (name.includes('keyboard')) return 'pi pi-th-large';
    if (name.includes('monitor') || name.includes('screen')) return 'pi pi-window-maximize';
    if (name.includes('cable') || name.includes('wire')) return 'pi pi-link';
    if (name.includes('drive') || name.includes('storage')) return 'pi pi-database';
    if (name.includes('robot')) return 'pi pi-cog';
    if (name.includes('sensor')) return 'pi pi-wifi';
    if (name.includes('battery')) return 'pi pi-bolt';
    return 'pi pi-box';
  };

  const filteredItems = categoryItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="admin-inventory loading">Loading items...</div>;
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
                className={`nav-btn ${item.path === '/borrower/browse' ? 'is-active' : ''}`}
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
            <h2>Browse Available Items</h2>
            <p>Request items for borrowing. First-come, first-serve basis.</p>
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

        {/* Search Bar */}
        <div style={{ marginBottom: '24px', position: 'relative' }}>
          <i className="pi pi-search" style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            fontSize: '16px',
            zIndex: 1,
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name or description..."
            style={{
              width: '100%',
              padding: '16px 16px 16px 48px',
              border: '2px solid #e5e7eb',
              borderRadius: '12px',
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.3s ease',
              background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0f766e';
              e.target.style.boxShadow = '0 4px 12px rgba(15, 118, 110, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e5e7eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f3f4f6';
              }}
            >
              <i className="pi pi-times" style={{ fontSize: '12px', color: '#6b7280' }} />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <section className="category-tabs" style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '24px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`category-tab ${selectedCategory?.id === category.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category)}
              style={{
                padding: '16px 24px',
                borderRadius: '12px',
                border: selectedCategory?.id === category.id 
                  ? '2px solid #0f766e' 
                  : '2px solid #e5e7eb',
                background: selectedCategory?.id === category.id 
                  ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' 
                  : '#fff',
                color: selectedCategory?.id === category.id ? '#fff' : '#374151',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: 600,
                fontSize: '14px',
                whiteSpace: 'nowrap',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                minWidth: '140px',
                boxShadow: selectedCategory?.id === category.id 
                  ? '0 4px 12px rgba(15, 118, 110, 0.3)' 
                  : '0 2px 4px rgba(0,0,0,0.05)',
              }}
              onMouseEnter={(e) => {
                if (selectedCategory?.id !== category.id) {
                  e.currentTarget.style.borderColor = '#0f766e';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory?.id !== category.id) {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                }
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 700 }}>
                {category.display_name}
              </span>
              <span style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '12px',
                background: selectedCategory?.id === category.id 
                  ? 'rgba(255,255,255,0.2)' 
                  : '#f3f4f6',
                color: selectedCategory?.id === category.id ? '#fff' : '#6b7280',
                fontWeight: 600,
              }}>
                {category.available_count} available
              </span>
            </button>
          ))}
        </section>

        {/* Items Grid */}
        <section className="items-section">
          {filteredItems.length === 0 ? (
            <div className="empty-state">
              <i className="pi pi-inbox" />
              <p>{searchQuery ? 'No items match your search' : 'No items available in this category'}</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
                    borderRadius: '16px',
                    padding: '0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    border: '1px solid #e5e7eb',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.boxShadow = '0 12px 24px rgba(15, 118, 110, 0.15)';
                    e.currentTarget.style.borderColor = '#0f766e';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  {/* Header with gradient background */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    padding: '24px 20px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}>
                    {/* Decorative circles */}
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      right: '-20px',
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                    }} />
                    <div style={{
                      position: 'absolute',
                      bottom: '-30px',
                      left: '-30px',
                      width: '120px',
                      height: '120px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)',
                    }} />
                    
                    {/* Item icon */}
                    <div style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '12px',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      <i className={getItemIcon(item.name)} style={{ fontSize: '28px', color: '#fff' }} />
                    </div>
                    
                    <h3 style={{ 
                      margin: 0, 
                      fontSize: '20px', 
                      fontWeight: 700,
                      color: '#fff',
                      position: 'relative',
                      zIndex: 1,
                    }}>
                      {item.name}
                    </h3>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '20px' }}>
                    {item.description && (
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#6b7280', 
                        marginBottom: '16px',
                        lineHeight: '1.6',
                        minHeight: '42px',
                      }}>
                        {item.description}
                      </p>
                    )}
                    
                    {/* Stats */}
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: item.in_use_count > 0 ? '1fr 1fr' : '1fr',
                      gap: '8px',
                      marginBottom: '16px',
                    }}>
                      <div style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                        border: '1px solid #6ee7b7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        <i className="pi pi-check-circle" style={{ fontSize: '16px', color: '#065f46' }} />
                        <div>
                          <div style={{ fontSize: '18px', fontWeight: 700, color: '#065f46' }}>
                            {item.available_count}
                          </div>
                          <div style={{ fontSize: '11px', color: '#047857', fontWeight: 500 }}>
                            Available
                          </div>
                        </div>
                      </div>
                      
                      {item.in_use_count > 0 && (
                        <div style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          border: '1px solid #93c5fd',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <i className="pi pi-clock" style={{ fontSize: '16px', color: '#1e40af' }} />
                          <div>
                            <div style={{ fontSize: '18px', fontWeight: 700, color: '#1e40af' }}>
                              {item.in_use_count}
                            </div>
                            <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: 500 }}>
                              In Use
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Request Button */}
                    <button
                      onClick={() => handleRequestItem(item)}
                      disabled={item.available_count === 0}
                      style={{
                        width: '100%',
                        padding: '14px',
                        background: item.available_count > 0 
                          ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' 
                          : 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: item.available_count > 0 ? 'pointer' : 'not-allowed',
                        fontWeight: 600,
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease',
                        boxShadow: item.available_count > 0 
                          ? '0 4px 12px rgba(15, 118, 110, 0.3)' 
                          : 'none',
                      }}
                      onMouseEnter={(e) => {
                        if (item.available_count > 0) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 118, 110, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = item.available_count > 0 
                          ? '0 4px 12px rgba(15, 118, 110, 0.3)' 
                          : 'none';
                      }}
                    >
                      <i className={item.available_count > 0 ? 'pi pi-send' : 'pi pi-ban'} />
                      {item.available_count > 0 ? 'Request to Borrow' : 'Not Available'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Request Modal */}
      {showRequestModal && selectedItem && (
        <RequestModal
          item={selectedItem}
          onClose={() => {
            setShowRequestModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            setShowRequestModal(false);
            setSelectedItem(null);
            loadCategoryItems(selectedCategory.id);
          }}
          token={token}
        />
      )}
    </div>
  );
}

// Request Modal Component
function RequestModal({ item, onClose, onSuccess, token }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/api/borrower/request-borrow/`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item_id: item.id,
          notes: notes || '',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to submit request');
      }

      alert('Borrow request submitted successfully! You will be notified when approved.');
      onSuccess();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Request to Borrow</h3>
          <button className="close-btn" onClick={onClose}>
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Item</label>
            <input type="text" value={item.name} disabled />
          </div>

          {item.description && (
            <div className="form-group">
              <label>Description</label>
              <textarea value={item.description} disabled rows="2" />
            </div>
          )}

          <div className="form-group">
            <label>Available</label>
            <input type="text" value={`${item.available_count} items available`} disabled />
          </div>

          <div className="form-group">
            <label>Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Add any special requests or notes..."
            />
          </div>

          <div style={{
            background: '#dbeafe',
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px',
          }}>
            <p style={{ fontSize: '13px', color: '#1e40af', margin: 0 }}>
              <i className="pi pi-info-circle" style={{ marginRight: '6px' }} />
              Your request will be processed on a first-come, first-serve basis. You'll be notified when approved.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
            <i className="pi pi-send" />
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
