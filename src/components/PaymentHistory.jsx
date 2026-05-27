import { useState } from 'react';

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PaymentHistory({ entry, onAddPayment, onDeletePayment, onClose }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [confirmId, setConfirmId] = useState(null);

  const payments = (entry.payments || []).slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const totalReceived = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onAddPayment({ amount: parseFloat(amount), date, note: note.trim() });
    setAmount('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = (id) => {
    if (confirmId === id) {
      onDeletePayment(id);
      setConfirmId(null);
    } else {
      setConfirmId(id);
      setTimeout(() => setConfirmId(null), 3000);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>💰 {entry.personName || entry.title}</h3>
            <p className="text-muted" style={{ marginTop: 4 }}>
              ₹{parseFloat(entry.amount || 0).toLocaleString('en-IN')} at {entry.interestRate || 0}%
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="payment-summary">
          <div className="payment-summary-item">
            <span className="summary-label">Total Received</span>
            <span className="summary-value text-success">₹{totalReceived.toLocaleString('en-IN')}</span>
          </div>
          <div className="payment-summary-item">
            <span className="summary-label">Payments</span>
            <span className="summary-value">{payments.length}</span>
          </div>
        </div>

        {/* Add payment form */}
        <form onSubmit={handleAdd} className="payment-form">
          <h4>Record Payment</h4>
          <div className="form-row">
            <div className="form-field">
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount ₹" inputMode="numeric" required />
            </div>
            <div className="form-field">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field" style={{ flex: 1 }}>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (e.g. April interest)" />
            </div>
            <button type="submit" className="btn-primary btn-compact" disabled={!amount}>+ Add</button>
          </div>
        </form>

        {/* Payment list */}
        <div className="payment-list">
          {payments.length === 0 && (
            <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>
              No payments recorded yet
            </p>
          )}
          {payments.map((p) => (
            <div key={p.id} className="payment-item">
              <div className="payment-item-left">
                <span className="payment-amount">₹{parseFloat(p.amount).toLocaleString('en-IN')}</span>
                <span className="payment-date">{fmtDate(p.date)}</span>
                {p.note && <span className="payment-note">{p.note}</span>}
              </div>
              <button
                className={`icon-btn-sm ${confirmId === p.id ? 'btn-danger-bg' : ''}`}
                onClick={() => handleDelete(p.id)}
                title="Delete"
              >
                {confirmId === p.id ? '✓' : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
