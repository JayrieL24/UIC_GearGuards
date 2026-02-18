import { useLocation, useNavigate } from "react-router-dom";
import { clearSession } from "../../lib/auth";

const navItems = [
  { label: "Dashboard", icon: "pi pi-home", path: "/dashboard" },
  { label: "Borrow", icon: "pi pi-book", path: "/Borrow" },
  { label: "Return", icon: "pi pi-replay", path: "/Return" },
  { label: "Account", icon: "pi pi-user", path: "/Account" },
];

function Scan() {
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <aside className="page-sidebar">
        <div>
          <div className="page-brand">
            <div className="page-brand-mark">GG</div>
            <div>
              <h1>GearGuard</h1>
              <p>Equipment Tracker</p>
            </div>
          </div>

          <nav className="page-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`page-nav-btn ${location.pathname === item.path ? "is-active" : ""}`}
                onClick={() => navigate(item.path)}
              >
                <i className={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button type="button" className="page-logout-btn" onClick={handleLogout}>
          <i className="pi pi-sign-out" />
          <span>Logout</span>
        </button>
      </aside>

      <main className="page-main">
        <header className="page-header">
          <h2>Scan Station</h2>
          <p>Use scanner mode to identify equipment quickly.</p>
        </header>

        <section className="page-content-card scan-card">
          <div className="scan-icon">
            <i className="pi pi-qrcode" />
          </div>
          <h3>Ready to Scan</h3>
          <p>Point your barcode or QR scanner at an item to begin.</p>
        </section>
      </main>
    </div>
  );
}

export default Scan;
