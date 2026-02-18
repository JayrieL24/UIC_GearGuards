import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  approveRegistration,
  clearSession,
  fetchPendingRegistrations,
  getStoredUser,
  rejectRegistration,
} from "../../lib/auth";

function Approvals() {
  const navigate = useNavigate();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const user = getStoredUser();

  const loadPending = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPendingRegistrations();
      setPending(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      navigate("/login");
      return;
    }
    loadPending();
  }, []);

  const handleApprove = async (item, role) => {
    setBusyId(item.user_id);
    try {
      await approveRegistration(item.user_id, role);
      await loadPending();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item) => {
    setBusyId(item.user_id);
    try {
      await rejectRegistration(item.user_id);
      await loadPending();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <div className="page-shell">
      <main className="page-main" style={{ maxWidth: 980, margin: "0 auto", width: "100%" }}>
        <header className="page-header">
          <h2>Admin Approvals</h2>
          <p>Main admin can approve registrations and assign roles.</p>
        </header>

        <section className="page-content-card">
          <div className="action-row" style={{ marginTop: 0, marginBottom: 12 }}>
            <button className="primary-btn" type="button" onClick={logout}>
              Logout
            </button>
          </div>

          {loading ? <p>Loading pending registrations...</p> : null}
          {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

          {!loading && !pending.length ? <p>No pending registrations.</p> : null}

          {pending.map((item) => (
            <article
              key={item.user_id}
              style={{
                border: "1px solid #dde3f2",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <p style={{ margin: 0, fontWeight: 700 }}>{item.username}</p>
              <p style={{ margin: "4px 0", color: "#5b6475" }}>{item.email || "No email"}</p>
              <p style={{ margin: "4px 0", color: "#5b6475" }}>
                Requested: <strong>{item.requested_role}</strong>
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="primary-btn"
                  type="button"
                  disabled={busyId === item.user_id}
                  onClick={() => handleApprove(item, "USER")}
                >
                  Approve as User
                </button>
                <button
                  className="primary-btn"
                  type="button"
                  disabled={busyId === item.user_id}
                  onClick={() => handleApprove(item, "HANDLER")}
                >
                  Approve as Handler
                </button>
                <button
                  type="button"
                  disabled={busyId === item.user_id}
                  onClick={() => handleReject(item)}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #efb3b3",
                    background: "#fff3f2",
                    color: "#b42318",
                    padding: "10px 14px",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Approvals;
