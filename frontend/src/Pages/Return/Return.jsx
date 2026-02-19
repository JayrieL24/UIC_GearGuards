import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import itemsData from "../../JSON/Items.json";
import { clearSession, getStoredUser, getToken } from "../../lib/auth";

const navItems = [
  { label: "Dashboard", icon: "pi pi-home", path: "/borrower/dashboard" },
  { label: "Browse Items", icon: "pi pi-search", path: "/borrower/browse" },
  { label: "My Borrows", icon: "pi pi-list", path: "/borrower/my-borrows" },
  { label: "Account", icon: "pi pi-user", path: "/borrower/account" },
];

function Return() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (user?.role === 'STUDENT' || user?.role === 'PERSONNEL') {
      navigate('/borrower/my-borrows', { replace: true });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(
    () =>
      itemsData.map((item) => ({
        label: `${item.name} (${item.itemId})`,
        value: item,
      })),
    []
  );

  const handleReturn = () => {
    if (!selectedItem) return;
    console.log(`Returning ${selectedItem.name} - Qty: ${quantity}`);
  };

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
          <h2>Return Equipment</h2>
          <p>Select borrowed items and submit a return transaction.</p>
        </header>

        <section className="page-content-card">
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="return-item">Borrowed Item</label>
              <Dropdown
                inputId="return-item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.value)}
                options={items}
                placeholder="Select item"
                filter
              />
            </div>

            <div className="field-group">
              <label htmlFor="return-quantity">Quantity Returned</label>
              <InputNumber
                inputId="return-quantity"
                value={quantity}
                onValueChange={(e) => setQuantity(e.value ?? 1)}
                min={1}
                showButtons
              />
            </div>
          </div>

          <div className="action-row">
            <Button
              label="Confirm Return"
              icon="pi pi-check-circle"
              className="primary-btn"
              onClick={handleReturn}
              disabled={!selectedItem}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Return;
