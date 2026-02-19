import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import '../../CSS/AdminBorrows.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/admin/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/admin/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/admin/borrows' },
  { label: 'Borrow Transactions', icon: 'pi pi-shopping-cart', path: '/admin/borrow-transactions' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/admin/reports' },
  { label: 'Approvals', icon: 'pi pi-check-circle', path: '/admin/approvals' },
];

export function AdminBorrowTransactions() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  // Refs for auto-focus (scanner ready)
  const barcodeInputRef = useRef(null);
  const rfidInputRef = useRef(null);

  // State for pending requests
  const [pendingRequests, setPendingRequests] = useState([]);
  
  // State for walk-in scanning
  const [barcodeInput, setBarcodeInput] = useState('');
  const [rfidInput, setRfidInput] = useState('');
  const [scannedItems, setScannedItems] = useState([]); // Changed to array for multiple items
  const [scannedBorrower, setScannedBorrower] = useState(null);
  const [notes, setNotes] = useState('');
  
  // Auto-calculate due date (3 days from now)
  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3); // Add 3 days
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };
  
  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'walkin'

  const loadPendingRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/borrow-requests/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load pending requests');
      }

      const data = await response.json();
      setPendingRequests(data.requests || []);
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
    loadPendingRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-focus barcode input when walk-in tab is active (scanner ready)
  useEffect(() => {
    if (activeTab === 'walkin' && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [activeTab]);

  const handleScanBarcode = async () => {
    if (!barcodeInput.trim()) {
      alert('Please enter a barcode');
      return;
    }

    // Check if item already scanned
    if (scannedItems.some(item => item.reference_id === barcodeInput)) {
      alert('This item has already been scanned!');
      setBarcodeInput('');
      barcodeInputRef.current?.focus(); // Auto-focus for next scan
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan-item/${barcodeInput}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Item not found');
      }

      const data = await response.json();
      
      // Check if item is available
      if (data.status !== 'AVAILABLE') {
        alert(`Item is not available. Current status: ${data.status}`);
        setBarcodeInput('');
        barcodeInputRef.current?.focus(); // Auto-focus for next scan
        return;
      }
      
      // Add to scanned items array
      setScannedItems([...scannedItems, data]);
      setBarcodeInput(''); // Clear input for next scan
      alert(`Item added: ${data.item_name} (${data.reference_id})`);
      
      // Auto-focus back to barcode input for continuous scanning
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } catch (err) {
      alert(`Error: ${err.message}`);
      setBarcodeInput('');
      barcodeInputRef.current?.focus(); // Auto-focus for next scan
    }
  };

  const handleRemoveItem = (referenceId) => {
    setScannedItems(scannedItems.filter(item => item.reference_id !== referenceId));
  };

  const handleScanRFID = async () => {
    if (!rfidInput.trim()) {
      alert('Please enter RFID');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/scan-rfid/${rfidInput}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('User not found');
      }

      const data = await response.json();
      setScannedBorrower(data);
      setRfidInput(''); // Clear RFID input
      alert(`Borrower scanned: ${data.username} (${data.role})`);
      
      // If items are already scanned, we're ready to process
      // Otherwise, focus back to barcode input
      if (scannedItems.length === 0) {
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
      setScannedBorrower(null);
      setRfidInput('');
      rfidInputRef.current?.focus(); // Stay on RFID for retry
    }
  };

  const handleProcessWalkIn = async () => {
    if (scannedItems.length === 0 || !scannedBorrower || !dueDate) {
      alert('Please scan at least one item, scan borrower RFID, and set due date');
      return;
    }

    try {
      // Process each item as a separate borrow
      const promises = scannedItems.map(item =>
        fetch(`${API_BASE_URL}/api/borrow-walkin/`, {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_instance_id: item.id,
            borrower_id: scannedBorrower.id,
            due_date: dueDate,
            notes: notes || 'Walk-in borrow',
          }),
        })
      );

      const responses = await Promise.all(promises);
      
      // Check if all succeeded
      const allSucceeded = responses.every(res => res.ok);
      
      if (!allSucceeded) {
        throw new Error('Some items failed to process');
      }

      alert(`Successfully processed ${scannedItems.length} item(s) for walk-in borrow!`);
      
      // Reset form
      setBarcodeInput('');
      setRfidInput('');
      setScannedItems([]);
      setScannedBorrower(null);
      setDueDate(getDefaultDueDate());
      setNotes('');
      
      // Auto-focus back to barcode input for next transaction
      setTimeout(() => barcodeInputRef.current?.focus(), 100);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleApproveRequest = async (borrowId) => {
    if (!confirm('Approve this pre-borrow request?')) return;

    try {
      setProcessingId(borrowId);
      const response = await fetch(`${API_BASE_URL}/api/borrow-requests/${borrowId}/approve/`, {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      await loadPendingRequests();
      alert('Pre-borrow request approved successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (borrowId) => {
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

      await loadPendingRequests();
      alert('Pre-borrow request rejected successfully!');
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

  if (loading && activeTab === 'pending') {
    return <div className="admin-dashboard loading">Loading transactions...</div>;
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
                className={`nav-btn ${item.path === '/admin/borrow-transactions' ? 'is-active' : ''}`}
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
            <h2>Borrow Transactions</h2>
            <p>Process walk-in borrows and manage pre-borrow requests (first come, first serve).</p>
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
            onClick={() => setActiveTab('walkin')}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: activeTab === 'walkin' ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' : 'transparent',
              color: activeTab === 'walkin' ? '#fff' : '#374151',
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
              boxShadow: activeTab === 'walkin' ? '0 4px 12px rgba(15, 118, 110, 0.3)' : 'none',
            }}
          >
            <i className="pi pi-qrcode" style={{ fontSize: '18px' }} />
            Walk-in Borrow (Scan)
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              flex: 1,
              padding: '12px 24px',
              background: activeTab === 'pending' ? 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)' : 'transparent',
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
              position: 'relative',
              boxShadow: activeTab === 'pending' ? '0 4px 12px rgba(15, 118, 110, 0.3)' : 'none',
            }}
          >
            <i className="pi pi-clock" style={{ fontSize: '18px' }} />
            Pre-Borrow Requests
            {pendingRequests.length > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: 700,
                marginLeft: '4px'
              }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Walk-in Borrow Section */}
        {activeTab === 'walkin' && (
          <section className="borrows-section">
            <div className="section-header">
              <div>
                <h3>Walk-in Borrow (On-Site)</h3>
                <p>Scan barcode and RFID to process immediate borrow</p>
              </div>
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              marginTop: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              border: '1px solid #e5e7eb'
            }}>
              {/* Barcode Scanner */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  marginBottom: '12px',
                  color: '#111827',
                  fontSize: '15px'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#fff',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}>1</span>
                  Scan Item Barcodes (Multiple Items Allowed)
                </label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      ref={barcodeInputRef}
                      type="text"
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleScanBarcode()}
                      placeholder="🔍 Scanner Ready - Scan or enter barcode (e.g., LAP001)"
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        border: '2px solid #0f766e',
                        borderRadius: '10px',
                        fontSize: '15px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxShadow: '0 0 0 3px rgba(15, 118, 110, 0.1)',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#0f766e';
                        e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#0f766e';
                        e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.1)';
                      }}
                    />
                  </div>
                  <button
                    onClick={handleScanBarcode}
                    style={{
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="pi pi-qrcode" />
                    Add Item
                  </button>
                </div>
                
                {/* Scanned Items List */}
                {scannedItems.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      color: '#059669', 
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="pi pi-check-circle" />
                      {scannedItems.length} item(s) scanned
                    </div>
                    {scannedItems.map((item, index) => (
                      <div key={item.reference_id} style={{ 
                        marginBottom: '8px',
                        padding: '12px 14px', 
                        background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', 
                        borderRadius: '10px',
                        border: '2px solid #10b981',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <span style={{
                          background: '#059669',
                          color: '#fff',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 700,
                          flexShrink: 0
                        }}>{index + 1}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#065f46', marginBottom: '2px' }}>
                            {item.item_name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#047857' }}>
                            {item.reference_id} • {item.category}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.reference_id)}
                          style={{
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.target.style.background = '#dc2626'}
                          onMouseLeave={(e) => e.target.style.background = '#ef4444'}
                        >
                          <i className="pi pi-times" style={{ fontSize: '10px' }} />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RFID Scanner */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  marginBottom: '12px',
                  color: '#111827',
                  fontSize: '15px'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#fff',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}>2</span>
                  Scan Borrower RFID
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    ref={rfidInputRef}
                    type="text"
                    value={rfidInput}
                    onChange={(e) => setRfidInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScanRFID()}
                    placeholder="📡 RFID Scanner Ready - Scan or enter RFID"
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: '2px solid #e5e7eb',
                      borderRadius: '10px',
                      fontSize: '15px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0f766e';
                      e.target.style.boxShadow = '0 0 0 3px rgba(15, 118, 110, 0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e5e7eb';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    onClick={handleScanRFID}
                    style={{
                      padding: '14px 28px',
                      background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <i className="pi pi-id-card" />
                    Scan
                  </button>
                </div>
                {scannedBorrower && (
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '14px 16px', 
                    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', 
                    borderRadius: '10px',
                    border: '2px solid #3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <i className="pi pi-user" style={{ color: '#1d4ed8', fontSize: '20px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#1e40af', marginBottom: '4px' }}>
                        {scannedBorrower.username}
                      </div>
                      <div style={{ fontSize: '13px', color: '#2563eb' }}>
                        Role: {scannedBorrower.role}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  marginBottom: '12px',
                  color: '#111827',
                  fontSize: '15px'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#fff',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}>3</span>
                  Due Date (Default: 3 days from now)
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    background: '#f9fafb',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="pi pi-info-circle" />
                  Default: 3-day borrow period. Borrowers can request extensions later.
                </p>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700, 
                  marginBottom: '12px',
                  color: '#111827',
                  fontSize: '15px'
                }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
                    color: '#fff',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700
                  }}>4</span>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0f766e'}
                  onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* Process Button */}
              <button
                onClick={handleProcessWalkIn}
                disabled={scannedItems.length === 0 || !scannedBorrower || !dueDate}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: scannedItems.length > 0 && scannedBorrower && dueDate 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : '#d1d5db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: scannedItems.length > 0 && scannedBorrower && dueDate ? 'pointer' : 'not-allowed',
                  fontWeight: 700,
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: scannedItems.length > 0 && scannedBorrower && dueDate 
                    ? '0 6px 20px rgba(16, 185, 129, 0.4)' 
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (scannedItems.length > 0 && scannedBorrower && dueDate) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = scannedItems.length > 0 && scannedBorrower && dueDate 
                    ? '0 6px 20px rgba(16, 185, 129, 0.4)' 
                    : 'none';
                }}
              >
                <i className="pi pi-check-circle" style={{ fontSize: '20px' }} />
                Process Walk-in Borrow
              </button>
            </div>
          </section>
        )}

        {/* Pending Pre-Borrow Requests Section */}
        {activeTab === 'pending' && (
          <section className="borrows-section">
            <div className="section-header">
              <div>
                <h3>Pre-Borrow Requests (Online)</h3>
                <p>Approve requests in first-come, first-serve order</p>
              </div>
              <span className="count-badge">{pendingRequests.length}</span>
            </div>

            <div className="borrows-list">
              {pendingRequests.length === 0 ? (
                <p className="empty-state">No pending pre-borrow requests</p>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="borrow-card pending">
                    <div className="borrow-header">
                      <h4>{request.item_name}</h4>
                      <span className="status-badge pending">Pre-Borrowed (Online)</span>
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
                    <div className="borrow-actions" style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                      <button
                        className="primary-btn"
                        onClick={() => handleApproveRequest(request.id)}
                        disabled={processingId === request.id}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                          fontWeight: 700,
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                          opacity: processingId === request.id ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (processingId !== request.id) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                        }}
                      >
                        <i className="pi pi-check" />
                        {processingId === request.id ? 'Processing...' : 'Approve & Mark Borrowed'}
                      </button>
                      <button
                        className="secondary-btn"
                        onClick={() => handleRejectRequest(request.id)}
                        disabled={processingId === request.id}
                        style={{
                          flex: 1,
                          padding: '12px 20px',
                          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: processingId === request.id ? 'not-allowed' : 'pointer',
                          fontWeight: 700,
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                          opacity: processingId === request.id ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          if (processingId !== request.id) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.4)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                        }}
                      >
                        <i className="pi pi-times" />
                        {processingId === request.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
