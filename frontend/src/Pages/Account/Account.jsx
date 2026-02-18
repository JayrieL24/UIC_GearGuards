import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Password } from "primereact/password";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { clearSession } from "../../lib/auth";

const navItems = [
  { label: "Dashboard", icon: "pi pi-home", path: "/dashboard" },
  { label: "Borrow", icon: "pi pi-book", path: "/Borrow" },
  { label: "Return", icon: "pi pi-replay", path: "/Return" },
  { label: "Account", icon: "pi pi-user", path: "/Account" },
];

function Account() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSave = () => {
    console.log("Updating account info", { username, hasPassword: Boolean(password) });
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
          <h2>Account Settings</h2>
          <p>Manage profile details and secure your account credentials.</p>
        </header>

        <section className="page-content-card">
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="account-username">Display Name</label>
              <InputText
                id="account-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div className="field-group">
              <label htmlFor="account-password">New Password</label>
              <Password
                inputId="account-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                toggleMask
                feedback={false}
                placeholder="Enter a new password"
              />
            </div>
          </div>

          <div className="action-row">
            <Button
              label="Save Changes"
              icon="pi pi-save"
              className="primary-btn"
              onClick={handleSave}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default Account;
