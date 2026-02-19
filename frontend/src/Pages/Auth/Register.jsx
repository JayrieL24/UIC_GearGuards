import { useState } from "react";
import { Link } from "react-router-dom";
import { registerRequest } from "../../lib/auth";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    requested_role: "STUDENT",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await registerRequest(form);
      setMessage(result.message || "Registration submitted for approval.");
      setForm({ username: "", email: "", password: "", requested_role: "STUDENT" });
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
          <h1>Join GearGuard</h1>
          <p>Register as a student, personnel, or staff member. Admin approves and assigns final access.</p>
          <ul>
            <li>Student/Personnel roles for borrowing equipment</li>
            <li>Staff role for delegated operations</li>
            <li>Approval-first security model</li>
          </ul>
        </section>

        <section className="auth-card">
          <header>
            <h2>Create Account</h2>
            <p>Submit your details for admin approval.</p>
          </header>

          <form onSubmit={onSubmit} className="auth-form">
            <div className="field-group">
              <label htmlFor="reg-username">Username</label>
              <input id="reg-username" name="username" value={form.username} onChange={onChange} required />
            </div>

            <div className="field-group">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" name="email" type="email" value={form.email} onChange={onChange} />
            </div>

            <div className="field-group">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                required
              />
            </div>

            <div className="field-group">
              <label htmlFor="reg-role">Requested Role</label>
              <select id="reg-role" name="requested_role" value={form.requested_role} onChange={onChange}>
                <option value="STUDENT">Student</option>
                <option value="PERSONNEL">Personnel</option>
                <option value="HANDLER">Staff</option>
              </select>
            </div>

            {error ? <p className="auth-error">{error}</p> : null}
            {message ? <p className="auth-success">{message}</p> : null}

            <div className="auth-actions">
              <Link to="/login">Back to login</Link>
              <button className="primary-btn" type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Register"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

export default Register;
