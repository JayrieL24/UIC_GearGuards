import './App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ForTableJSON } from './JSON/ForTableJSON.jsx';
import { clearSession, getStoredUser, getToken } from './lib/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/dashboard' },
  { label: 'Borrow', icon: 'pi pi-book', path: '/Borrow' },
  { label: 'Return', icon: 'pi pi-replay', path: '/Return' },
  { label: 'Account', icon: 'pi pi-user', path: '/Account' },
];

function App() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [backendHealth, setBackendHealth] = useState({
    loading: true,
    ok: false,
    text: 'Checking backend...',
  });
  const [redirected, setRedirected] = useState(false);

  const loadProducts = useCallback(() => {
    ForTableJSON.getProductsMini().then((data) => setProducts(data || []));
  }, []);

  // Redirect check - runs ONCE on mount
  useEffect(() => {
    if (redirected) return;
    
    const token = getToken();
    const user = getStoredUser();
    
    console.log('App.jsx redirect check - User:', user?.username, 'Role:', user?.role);
    
    if (!token) {
      navigate('/login', { replace: true });
      setRedirected(true);
      return;
    }
    
    // CRITICAL: Students/Personnel should NEVER see this page
    if (user?.role === 'STUDENT' || user?.role === 'PERSONNEL') {
      console.log('Redirecting to borrower dashboard');
      setRedirected(true);
      window.location.href = '/borrower/dashboard';
      return;
    }
    
    if (user?.role === 'ADMIN') {
      console.log('Redirecting to admin dashboard');
      setRedirected(true);
      window.location.href = '/admin/dashboard';
      return;
    }
    
    if (user?.role === 'HANDLER') {
      console.log('Redirecting to handler dashboard');
      setRedirected(true);
      window.location.href = '/handler/dashboard';
      return;
    }
    
    // Only load if we're staying on this page
    setRedirected(true);
    loadProducts();
    
    // Check backend health ONCE
    let cancelled = false;
    
    fetch(`${API_BASE_URL}/api/health/`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (cancelled) return;
        const isOk = data?.status === 'ok';
        setBackendHealth({
          loading: false,
          ok: isOk,
          text: isOk ? `Backend connected (${data.service})` : 'Backend responded with unexpected payload',
        });
      })
      .catch(error => {
        if (cancelled) return;
        setBackendHealth({
          loading: false,
          ok: false,
          text: `Backend unavailable (${error.message})`,
        });
      });
    
    return () => {
      cancelled = true;
    };
  }, [navigate, loadProducts, redirected]);

  const metrics = useMemo(() => {
    const borrowed = products.filter(
      (item) => String(item.Status || '').toLowerCase() === 'borrowed'
    ).length;
    const returned = products.filter(
      (item) => String(item.Status || '').toLowerCase() === 'returned'
    ).length;

    return {
      total: products.length,
      borrowed,
      returned,
    };
  }, [products]);

  const statusBodyTemplate = (rowData) => {
    const status = rowData?.Status || 'Unknown';
    const tone = String(status).toLowerCase() === 'borrowed' ? 'is-borrowed' : 'is-returned';
    return <span className={`status-badge ${tone}`}>{status}</span>;
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const user = getStoredUser();

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
              <p>Equipment Tracker</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/dashboard' ? 'is-active' : ''}`}
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
            <h2>Dashboard</h2>
            <p>Manage lab equipment and monitor item status in real time.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
          <div className={`health-pill ${backendHealth.ok ? 'ok' : 'error'}`}>
            <span className="dot" />
            <span>{backendHealth.loading ? 'Checking backend...' : backendHealth.text}</span>
          </div>
        </header>

        <section className="kpi-row">
          <article className="kpi-card">
            <p>Total items</p>
            <h3>{metrics.total}</h3>
          </article>
          <article className="kpi-card">
            <p>Borrowed</p>
            <h3>{metrics.borrowed}</h3>
          </article>
          <article className="kpi-card">
            <p>Returned</p>
            <h3>{metrics.returned}</h3>
          </article>
        </section>

        <section className="table-panel">
          <div className="table-header">
            <div>
              <h3>Recent Activity</h3>
              <p>Latest equipment movement records</p>
            </div>
            <button type="button" className="refresh-btn" onClick={loadProducts}>
              <i className="pi pi-refresh" />
              Refresh
            </button>
          </div>

          <DataTable
            value={products}
            scrollable
            scrollHeight="380px"
            stripedRows
            showGridlines
            className="activity-table"
            emptyMessage="No records found"
          >
            <Column field="ItemId" header="ID" style={{ width: '7rem' }} />
            <Column field="ItemName" header="Item" />
            <Column field="Status" header="Status" body={statusBodyTemplate} style={{ width: '10rem' }} />
            <Column field="DateBorrowed" header="Borrowed" style={{ width: '13rem' }} />
            <Column field="ReturnDate" header="Return" style={{ width: '13rem' }} />
          </DataTable>
        </section>
      </main>
    </div>
  );
}

export default App;
