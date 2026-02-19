import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getStoredUser, getToken, loginRequest } from "../../lib/auth";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();
    if (!token || !user) return;
    
    console.log('Login redirect check - User role:', user.role);
    
    if (user.role === "ADMIN") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user.role === "HANDLER") {
      navigate("/handler/dashboard", { replace: true });
    } else if (user.role === "STUDENT" || user.role === "PERSONNEL" || user.role === "USER") {
      navigate("/borrower/dashboard", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await loginRequest(form);
      console.log('Login successful - User role:', result.role);
      
      if (result.role === "ADMIN") {
        navigate("/admin/dashboard", { replace: true });
      } else if (result.role === "HANDLER") {
        navigate("/handler/dashboard", { replace: true });
      } else if (result.role === "STUDENT" || result.role === "PERSONNEL" || result.role === "USER") {
        navigate("/borrower/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-orb auth-orb-a" />
      <div className="auth-orb auth-orb-b" />

      <main className="auth-layout">
        <section className="auth-hero">
          <div className="auth-brand">GG</div>
          <h1>GearGuard</h1>
          <p>Secure equipment tracking and role-based access for admins, handlers, and borrowers.</p>
          <ul>
            <li>Role-based approvals</li>
            <li>Admin-controlled registration</li>
            <li>Borrow and return workflows</li>
          </ul>
        </section>

        <section className="auth-card">
          <header>
            <h2>Welcome Back</h2>
            <p>Sign in with your approved account.</p>
          </header>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="field-group">
              <label htmlFor="username">Username</label>
              <input id="username" name="username" value={form.username} onChange={onChange} required />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </div>

            {error ? <p className="auth-error">{error}</p> : null}

            <div className="auth-actions">
              <Link to="/register">Create account</Link>
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Login;
