import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getStoredUser, clearSession } from '../../lib/auth.js';
import '../../CSS/AdminReports.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

// Simple Bar Chart Component
function BarChart({ data, title }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="chart-container">
      <h4>{title}</h4>
      <div className="bar-chart">
        {data.map((item, idx) => (
          <div key={idx} className="bar-item">
            <div className="bar-label">{item.label}</div>
            <div className="bar-wrapper">
              <div 
                className="bar-fill" 
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
            <div className="bar-value">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const navItems = [
  { label: 'Dashboard', icon: 'pi pi-home', path: '/handler/dashboard' },
  { label: 'Inventory', icon: 'pi pi-box', path: '/handler/inventory' },
  { label: 'Borrows', icon: 'pi pi-list', path: '/handler/borrows' },
  { label: 'Borrow Transactions', icon: 'pi pi-shopping-cart', path: '/handler/borrow-transactions' },
  { label: 'Reports', icon: 'pi pi-chart-bar', path: '/handler/reports' },
];

export function HandlerReports() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const token = getToken();

  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('analytics');

  const loadReportsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [analyticsRes, inventoryAIRes, borrowAIRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/reports/analytics/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/ai/inventory-analysis/`, {
          headers: { Authorization: `Token ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/ai/borrow-analysis/`, {
          headers: { Authorization: `Token ${token}` },
        }),
      ]);

      if (!analyticsRes.ok) {
        throw new Error('Failed to load analytics');
      }

      const analyticsData = await analyticsRes.json();
      const inventoryAIData = await inventoryAIRes.json();
      const borrowAIData = await borrowAIRes.json();

      setAnalytics(analyticsData);
      
      // Store AI analysis data
      setRecommendations([
        {
          type: 'inventory',
          title: 'Inventory Analysis',
          analysis: inventoryAIData.ai_analysis,
          available: inventoryAIData.ai_available,
        },
        {
          type: 'borrow',
          title: 'Borrow Pattern Analysis',
          analysis: borrowAIData.ai_analysis,
          available: borrowAIData.ai_available,
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'HANDLER') {
      navigate('/login');
      return;
    }
    loadReportsData();
  }, []);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  if (loading) {
    return <div className="admin-reports loading">Loading reports...</div>;
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
              <p>Handler Panel</p>
            </div>
          </div>

          <nav className="nav-list" aria-label="Admin navigation">
            {navItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`nav-btn ${item.path === '/handler/reports' ? 'is-active' : ''}`}
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
            <h2>Reports & Analytics</h2>
            <p>Analyze borrow patterns and get AI-powered inventory recommendations.</p>
            <p style={{ marginTop: 8, fontWeight: 700 }}>
              {user ? `${user.username} (${user.role})` : 'Guest mode'}
            </p>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="pi pi-chart-line" />
            Analytics
          </button>
          <button
            className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveTab('recommendations')}
          >
            <i className="pi pi-lightbulb" />
            AI Recommendations
          </button>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && analytics && (
          <div className="analytics-section">
            {/* Stats Overview */}
            <section className="stats-overview">
              <h3>Borrow Statistics</h3>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Total Borrows</div>
                  <div className="stat-value">{analytics.stats.total_borrows || 0}</div>
                </div>
                <div className="stat-box active">
                  <div className="stat-label">Active</div>
                  <div className="stat-value">{analytics.stats.active_borrows || 0}</div>
                </div>
                <div className="stat-box returned">
                  <div className="stat-label">Returned</div>
                  <div className="stat-value">{analytics.stats.returned_borrows || 0}</div>
                </div>
                <div className="stat-box late">
                  <div className="stat-label">Late</div>
                  <div className="stat-value">{analytics.stats.late_borrows || 0}</div>
                </div>
                <div className="stat-box not-returned">
                  <div className="stat-label">Not Returned</div>
                  <div className="stat-value">{analytics.stats.not_returned_borrows || 0}</div>
                </div>
              </div>
            </section>

            {/* Graphs Section */}
            <section className="graphs-section">
              <h3>Visual Analytics</h3>
              <div className="graphs-grid">
                <BarChart 
                  data={[
                    { label: 'Active', value: analytics.stats.active_borrows },
                    { label: 'Returned', value: analytics.stats.returned_borrows },
                    { label: 'Late', value: analytics.stats.late_borrows },
                    { label: 'Not Returned', value: analytics.stats.not_returned_borrows },
                  ]}
                  title="Borrow Status Distribution"
                />
                
                <BarChart 
                  data={(analytics.week_items || []).slice(0, 5).map(item => ({
                    label: item.item__name,
                    value: item.count,
                  }))}
                  title="Top 5 Borrowed Items (This Week)"
                />
              </div>
            </section>

            {/* AI Insights Section */}
            {recommendations.length > 0 && recommendations[1]?.analysis && (
              <section className="ai-insights-section">
                <div className="insights-header">
                  <h3>
                    <i className="pi pi-lightbulb" />
                    AI Insights & Recommendations
                  </h3>
                  <span className="ai-badge">Powered by Google Gemini</span>
                </div>
                <div className="ai-insights-content">
                  {recommendations[1].analysis.split('\n').map((line, idx) => (
                    line.trim() && <p key={idx}>{line}</p>
                  ))}
                </div>
              </section>
            )}

            {/* Most Borrowed Items */}
            <div className="analytics-grid">
              <section className="analytics-card">
                <h3>Most Borrowed (This Week)</h3>
                <div className="items-list">
                  {analytics.week_items.length === 0 ? (
                    <p className="empty">No data available</p>
                  ) : (
                    analytics.week_items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="rank">#{idx + 1}</span>
                        <span className="name">{item.item__name}</span>
                        <span className="count">{item.count} borrows</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="analytics-card">
                <h3>Most Borrowed (This Month)</h3>
                <div className="items-list">
                  {analytics.month_items.length === 0 ? (
                    <p className="empty">No data available</p>
                  ) : (
                    analytics.month_items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="rank">#{idx + 1}</span>
                        <span className="name">{item.item__name}</span>
                        <span className="count">{item.count} borrows</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="analytics-card">
                <h3>Most Borrowed (This Year)</h3>
                <div className="items-list">
                  {analytics.year_items.length === 0 ? (
                    <p className="empty">No data available</p>
                  ) : (
                    analytics.year_items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="rank">#{idx + 1}</span>
                        <span className="name">{item.item__name}</span>
                        <span className="count">{item.count} borrows</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Top Borrowers */}
            <section className="analytics-card full-width">
              <h3>Top Borrowers</h3>
              <div className="borrowers-list">
                {analytics.top_borrowers.length === 0 ? (
                  <p className="empty">No data available</p>
                ) : (
                  <table className="borrowers-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Username</th>
                        <th>Total Borrows</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.top_borrowers.map((borrower, idx) => (
                        <tr key={idx}>
                          <td className="rank">#{idx + 1}</td>
                          <td>{borrower.borrower__username}</td>
                          <td className="count">{borrower.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            {/* Item Utilization */}
            <section className="analytics-card full-width">
              <h3>Item Utilization</h3>
              <div className="utilization-list">
                {analytics.items.length === 0 ? (
                  <p className="empty">No items available</p>
                ) : (
                  analytics.items.map((item) => (
                    <div key={item.id} className="utilization-item">
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <p>{item.available} of {item.quantity} available</p>
                      </div>
                      <div className="utilization-bar">
                        <div
                          className="utilization-fill"
                          style={{ width: `${item.utilization}%` }}
                        />
                      </div>
                      <div className="utilization-percent">{item.utilization}%</div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="recommendations-section">
            <div className="recommendations-intro">
              <i className="pi pi-lightbulb" />
              <h3>AI-Powered Analysis (Google Gemini)</h3>
              <p>Real-time intelligent insights powered by Google AI</p>
            </div>

            {/* Visual Analytics Section */}
            {analytics && (
              <section className="graphs-section" style={{ marginBottom: '2rem' }}>
                <h3>Data Visualizations</h3>
                <div className="graphs-grid">
                  <BarChart 
                    data={[
                      { label: 'Active', value: analytics.stats.active_borrows },
                      { label: 'Returned', value: analytics.stats.returned_borrows },
                      { label: 'Late', value: analytics.stats.late_borrows },
                      { label: 'Not Returned', value: analytics.stats.not_returned_borrows },
                    ]}
                    title="Borrow Status Distribution"
                  />
                  
                  <BarChart 
                    data={(analytics.week_items || []).slice(0, 5).map(item => ({
                      label: item.item__name,
                      value: item.count,
                    }))}
                    title="Top 5 Borrowed Items (This Week)"
                  />
                </div>
              </section>
            )}

            {recommendations.length === 0 ? (
              <div className="empty-state">
                <i className="pi pi-inbox" />
                <p>No AI analysis available</p>
              </div>
            ) : (
              <div className="ai-analysis-list">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="ai-analysis-card">
                    <div className="analysis-header">
                      <h4>{rec.title}</h4>
                      <span className={`ai-status ${rec.available ? 'available' : 'unavailable'}`}>
                        <i className={rec.available ? 'pi pi-check-circle' : 'pi pi-exclamation-circle'} />
                        {rec.available ? 'AI Available' : 'AI Unavailable'}
                      </span>
                    </div>

                    <div className="analysis-content">
                      {rec.analysis ? (
                        <div className="analysis-text">
                          {rec.analysis.split('\n').map((line, i) => (
                            line.trim() && <p key={i}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="no-analysis">
                          {rec.available 
                            ? 'Generating analysis...' 
                            : 'AI service not configured. Please set HUGGINGFACE_API_KEY environment variable.'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
