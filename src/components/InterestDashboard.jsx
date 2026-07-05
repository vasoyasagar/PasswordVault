import { useMemo } from 'react';

export default function InterestDashboard({ entries, onClose }) {
  const stats = useMemo(() => {
    const moneyEntries = entries.filter((e) => e.category === 'money');
    const allPayments = [];

    moneyEntries.forEach((entry) => {
      (entry.payments || []).forEach((p) => {
        allPayments.push({
          ...p,
          personName: entry.personName || entry.title,
          amount: parseFloat(p.amount) || 0,
        });
      });
    });

    // Group payments by month
    const monthlyMap = {};
    allPayments.forEach((p) => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { total: 0, payments: [] };
      monthlyMap[key].total += p.amount;
      monthlyMap[key].payments.push(p);
    });

    // Sort months descending
    const months = Object.keys(monthlyMap).sort((a, b) => b.localeCompare(a));

    // Per-person totals
    const personMap = {};
    moneyEntries.forEach((entry) => {
      const name = entry.personName || entry.title;
      const total = (entry.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
      personMap[name] = (personMap[name] || 0) + total;
    });
    const topPersons = Object.entries(personMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Yearly totals
    const yearlyMap = {};
    allPayments.forEach((p) => {
      const year = new Date(p.date).getFullYear();
      yearlyMap[year] = (yearlyMap[year] || 0) + p.amount;
    });
    const years = Object.entries(yearlyMap).sort((a, b) => b[0] - a[0]);

    const grandTotal = allPayments.reduce((s, p) => s + p.amount, 0);
    const thisMonth = monthlyMap[months[0]]?.total || 0;
    const thisYear = yearlyMap[new Date().getFullYear()] || 0;

    // Find max for bar chart scaling
    const maxMonthly = months.length > 0 ? Math.max(...months.slice(0, 12).map(m => monthlyMap[m].total)) : 0;

    return { months, monthlyMap, topPersons, years, grandTotal, thisMonth, thisYear, maxMonthly };
  }, [entries]);

  const formatMonth = (key) => {
    const [y, m] = key.split('-');
    const d = new Date(y, parseInt(m) - 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal dashboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📊 Interest Dashboard</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Summary Cards */}
        <div className="dashboard-summary">
          <div className="dash-stat">
            <span className="dash-stat-value text-success">₹{stats.grandTotal.toLocaleString('en-IN')}</span>
            <span className="dash-stat-label">Total Earned</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">₹{stats.thisYear.toLocaleString('en-IN')}</span>
            <span className="dash-stat-label">This Year</span>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-value">₹{stats.thisMonth.toLocaleString('en-IN')}</span>
            <span className="dash-stat-label">This Month</span>
          </div>
        </div>

        {/* Monthly Bar Chart */}
        {stats.months.length > 0 && (
          <div className="dashboard-section">
            <h4>Monthly Interest (Last 12 months)</h4>
            <div className="dash-chart">
              {stats.months.slice(0, 12).map((month) => (
                <div key={month} className="dash-bar-row">
                  <span className="dash-bar-label">{formatMonth(month)}</span>
                  <div className="dash-bar-track">
                    <div
                      className="dash-bar-fill"
                      style={{ width: `${stats.maxMonthly > 0 ? (stats.monthlyMap[month].total / stats.maxMonthly) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="dash-bar-value">₹{stats.monthlyMap[month].total.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per Person */}
        {stats.topPersons.length > 0 && (
          <div className="dashboard-section">
            <h4>Interest by Person</h4>
            <div className="dash-person-list">
              {stats.topPersons.map(([name, total]) => (
                <div key={name} className="dash-person-row">
                  <span className="dash-person-name">{name}</span>
                  <span className="dash-person-amount text-success">₹{total.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Yearly */}
        {stats.years.length > 0 && (
          <div className="dashboard-section">
            <h4>Yearly Totals</h4>
            <div className="dash-person-list">
              {stats.years.map(([year, total]) => (
                <div key={year} className="dash-person-row">
                  <span className="dash-person-name">{year}</span>
                  <span className="dash-person-amount text-success">₹{total.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats.grandTotal === 0 && (
          <p className="text-muted" style={{ textAlign: 'center', padding: '30px 0' }}>
            No interest payments recorded yet
          </p>
        )}
      </div>
    </div>
  );
}
