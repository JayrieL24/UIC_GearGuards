import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MultiSelect } from "primereact/multiselect";
import { InputNumber } from "primereact/inputnumber";
import { Button } from "primereact/button";
import items from "../../JSON/Items.json";
import { clearSession, getStoredUser, getToken } from "../../lib/auth";

interface InputValue {
  name: string;
  code: string;
  status: string;
  itemId: string;
}

const navItems = [
  { label: "Dashboard", icon: "pi pi-home", path: "/borrower/dashboard" },
  { label: "Browse Items", icon: "pi pi-search", path: "/borrower/browse" },
  { label: "My Borrows", icon: "pi pi-list", path: "/borrower/my-borrows" },
  { label: "Account", icon: "pi pi-user", path: "/borrower/account" },
];

function Borrow() {
  const navigate = useNavigate();
  const location = useLocation();
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedItems, setSelectedItems] = useState<InputValue[]>([]);
  const availableItems: InputValue[] = items as InputValue[];

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    
    if (user?.role === 'STUDENT' || user?.role === 'PERSONNEL') {
      navigate('/borrower/browse', { replace: true });
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCount = useMemo(() => selectedItems.length, [selectedItems]);

  const handleBorrow = () => {
    if (!selectedItems.length) return;

    selectedItems.forEach((item) => {
      console.log(
        `Borrowing ${item.name} (Code: ${item.code}, Status: ${item.status}, Item ID: ${item.itemId}, Qty: ${quantity})`
      );
    });
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
          <h2>Borrow Equipment</h2>
          <p>Select available items, set quantity, and submit a borrow request.</p>
        </header>

        <section className="page-content-card">
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="borrow-items">Items Available</label>
              <MultiSelect
                inputId="borrow-items"
                value={selectedItems}
                onChange={(e) => setSelectedItems(e.value)}
                options={availableItems}
                optionLabel="name"
                placeholder="Select item(s)"
                display="chip"
                itemTemplate={(option: InputValue) => (
                  <div>
                    <strong>{option.name}</strong>
                    <div>Status: {option.status}</div>
                    <div>Item ID: {option.itemId}</div>
                  </div>
                )}
              />
            </div>

            <div className="field-group">
              <label htmlFor="borrow-quantity">Quantity</label>
              <InputNumber
                inputId="borrow-quantity"
                value={quantity}
                onValueChange={(e) => setQuantity(e.value ?? 1)}
                min={1}
                showButtons
              />
            </div>
          </div>

          <div className="action-row">
            <Button
              label={`Borrow ${selectedCount || ""}`.trim()}
              icon="pi pi-check"
              className="primary-btn"
              onClick={handleBorrow}
              disabled={!selectedCount}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Borrow;
