import { useState } from 'react';
import { getInterestCycleInfo } from '../services/interest';

export default function EntryCard({ entry, onEdit, onDelete, onViewPayments }) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const copy = async (text, label) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
      setConfirmDelete(false);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const CopyBtn = ({ value, label }) => (
    <button className="icon-btn-sm" onClick={() => copy(value, label)} title={`Copy ${label}`}>
      {copied === label ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ed573" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
    </button>
  );

  const ToggleBtn = () => (
    <button className="icon-btn-sm" onClick={() => setShowSecret(!showSecret)} title={showSecret ? 'Hide' : 'Show'}>
      {showSecret ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
      )}
    </button>
  );

  // --- MONEY CARD ---
  if (entry.category === 'money') {
    const totalPaid = (entry.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const lastPayment = (entry.payments || []).slice(-1)[0];
    const cycleInfo = getInterestCycleInfo(entry);
    return (
      <div className="entry-card money-card-entry">
        <div className="entry-header">
          <span className="entry-icon">💰</span>
          <div className="entry-info">
            <span className="entry-title">{entry.personName || entry.title}</span>
            {entry.title && entry.personName && <span className="entry-sub">{entry.title}</span>}
          </div>
          {cycleInfo && (
            <span className={`due-badge due-${cycleInfo.status}`}>
              {cycleInfo.status === 'paid' && '✓ Paid'}
              {cycleInfo.status === 'overdue' && `Overdue ${Math.abs(cycleInfo.daysUntilDue)}d`}
              {cycleInfo.status === 'due-soon' && `Due ${cycleInfo.daysUntilDue}d`}
              {cycleInfo.status === 'upcoming' && `${cycleInfo.daysUntilDue}d`}
            </span>
          )}
          {!cycleInfo && entry.noInterest && <span className="entry-category cat-other">No Interest</span>}
          {!cycleInfo && !entry.noInterest && <span className="entry-category cat-money">Money</span>}
        </div>

        {/* Interest Cycle Info */}
        {cycleInfo && (
          <div className={`cycle-info cycle-${cycleInfo.status}`}>
            <div className="cycle-row">
              <span className="cycle-label">Expected</span>
              <span className="cycle-value">₹{cycleInfo.expectedAmount.toLocaleString('en-IN')} / {cycleInfo.periodLabel}</span>
            </div>
            <div className="cycle-row">
              <span className="cycle-label">Due Date</span>
              <span className="cycle-value">{cycleInfo.nextDueDate}</span>
            </div>
            {cycleInfo.paidThisCycle > 0 && cycleInfo.remaining > 0 && (
              <div className="cycle-row">
                <span className="cycle-label">Remaining</span>
                <span className="cycle-value text-warning">₹{cycleInfo.remaining.toLocaleString('en-IN')}</span>
              </div>
            )}
            {cycleInfo.paidThisCycle > 0 && (
              <div className="cycle-row">
                <span className="cycle-label">Paid</span>
                <span className="cycle-value text-success">₹{cycleInfo.paidThisCycle.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
        )}

        <div className="money-details">
          <div className="money-grid">
            <div className="money-stat">
              <span className="money-stat-label">Amount</span>
              <span className="money-stat-value">₹{parseFloat(entry.amount || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="money-stat">
              <span className="money-stat-label">Interest</span>
              <span className="money-stat-value">{entry.interestRate || 0}%</span>
            </div>
            <div className="money-stat">
              <span className="money-stat-label">Given On</span>
              <span className="money-stat-value">{entry.dateGiven || '—'}</span>
            </div>
            <div className="money-stat">
              <span className="money-stat-label">Received</span>
              <span className="money-stat-value text-success">₹{totalPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>
          {lastPayment && (
            <div className="money-last-payment">
              Last: ₹{parseFloat(lastPayment.amount).toLocaleString('en-IN')} on {lastPayment.date}
              {lastPayment.note && ` — ${lastPayment.note}`}
            </div>
          )}
        </div>
        {entry.notes && <div className="entry-notes"><span className="text-muted">{entry.notes}</span></div>}
        <div className="entry-footer">
          {onViewPayments && (
            <button className="btn-text btn-sm btn-payments" onClick={onViewPayments}>
              📊 Payments ({(entry.payments || []).length})
            </button>
          )}
          <div className="entry-footer-right">
            <button className="btn-text btn-sm" onClick={onEdit}>Edit</button>
            <button className={`btn-text btn-sm ${confirmDelete ? 'btn-danger' : ''}`} onClick={handleDelete}>
              {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- DEBIT CARD ---
  if (entry.category === 'card') {
    return (
      <div className="entry-card card-card-entry">
        <div className="entry-header">
          <span className="entry-icon">💳</span>
          <div className="entry-info">
            <span className="entry-title">{entry.title}</span>
            {entry.cardHolder && <span className="entry-sub">{entry.cardHolder}</span>}
          </div>
          <span className="entry-category cat-card">Card</span>
        </div>
        <div className="card-visual">
          <div className="card-number">{showSecret ? (entry.cardNumber || '—') : '•••• •••• •••• ••••'}</div>
          <div className="card-row">
            {entry.expiryDate && <div className="card-field"><span className="card-field-label">Expiry</span><span>{entry.expiryDate}</span></div>}
            {entry.cvv && <div className="card-field"><span className="card-field-label">CVV</span><span>{showSecret ? entry.cvv : '•••'}</span></div>}
            {entry.pin && <div className="card-field"><span className="card-field-label">PIN</span><span>{showSecret ? entry.pin : '••••'}</span></div>}
          </div>
        </div>
        <div className="entry-actions-row">
          <ToggleBtn />
          {entry.cardNumber && <CopyBtn value={entry.cardNumber} label="card" />}
          {entry.cvv && <CopyBtn value={entry.cvv} label="cvv" />}
          {entry.pin && <CopyBtn value={entry.pin} label="pin" />}
        </div>
        {entry.notes && <div className="entry-notes"><span className="text-muted">{entry.notes}</span></div>}
        <div className="entry-footer">
          <div className="entry-footer-right">
            <button className="btn-text btn-sm" onClick={onEdit}>Edit</button>
            <button className={`btn-text btn-sm ${confirmDelete ? 'btn-danger' : ''}`} onClick={handleDelete}>
              {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- BANKING ---
  if (entry.category === 'banking') {
    return (
      <div className="entry-card banking-card-entry">
        <div className="entry-header">
          <span className="entry-icon">🏦</span>
          <div className="entry-info">
            <span className="entry-title">{entry.title}</span>
            {entry.username && <span className="entry-sub">{entry.username}</span>}
          </div>
          <span className="entry-category cat-banking">Banking</span>
        </div>
        <div className="banking-fields">
          {entry.username && (
            <div className="secret-row">
              <span className="secret-label">Username</span>
              <span className="secret-value">{entry.username}</span>
              <CopyBtn value={entry.username} label="user" />
            </div>
          )}
          {entry.password && (
            <div className="secret-row">
              <span className="secret-label">Password</span>
              <span className="secret-value mono">{showSecret ? entry.password : '••••••••'}</span>
              <ToggleBtn />
              <CopyBtn value={entry.password} label="pw" />
            </div>
          )}
          {entry.upiPin && (
            <div className="secret-row">
              <span className="secret-label">UPI PIN</span>
              <span className="secret-value mono">{showSecret ? entry.upiPin : '••••'}</span>
              <CopyBtn value={entry.upiPin} label="upi" />
            </div>
          )}
          {entry.mpin && (
            <div className="secret-row">
              <span className="secret-label">MPIN</span>
              <span className="secret-value mono">{showSecret ? entry.mpin : '••••'}</span>
              <CopyBtn value={entry.mpin} label="mpin" />
            </div>
          )}
          {entry.accountNumber && (
            <div className="secret-row">
              <span className="secret-label">A/C No.</span>
              <span className="secret-value mono">{showSecret ? entry.accountNumber : '••••••••'}</span>
              <CopyBtn value={entry.accountNumber} label="acc" />
            </div>
          )}
          {entry.ifsc && (
            <div className="secret-row">
              <span className="secret-label">IFSC</span>
              <span className="secret-value">{entry.ifsc}</span>
              <CopyBtn value={entry.ifsc} label="ifsc" />
            </div>
          )}
        </div>
        {entry.notes && <div className="entry-notes"><span className="text-muted">{entry.notes}</span></div>}
        <div className="entry-footer">
          <div className="entry-footer-right">
            <button className="btn-text btn-sm" onClick={onEdit}>Edit</button>
            <button className={`btn-text btn-sm ${confirmDelete ? 'btn-danger' : ''}`} onClick={handleDelete}>
              {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- LOGIN ---
  if (entry.category === 'login') {
    return (
      <div className="entry-card login-card-entry">
        <div className="entry-header">
          <span className="entry-icon">🔑</span>
          <div className="entry-info">
            <span className="entry-title">{entry.title}</span>
            {entry.username && <span className="entry-sub">{entry.username}</span>}
          </div>
          <span className="entry-category cat-login">Login</span>
        </div>
        <div className="banking-fields">
          {entry.username && (
            <div className="secret-row">
              <span className="secret-label">User</span>
              <span className="secret-value">{entry.username}</span>
              <CopyBtn value={entry.username} label="user" />
            </div>
          )}
          {entry.password && (
            <div className="secret-row">
              <span className="secret-label">Password</span>
              <span className="secret-value mono">{showSecret ? entry.password : '••••••••'}</span>
              <ToggleBtn />
              <CopyBtn value={entry.password} label="pw" />
            </div>
          )}
        </div>
        {entry.url && (
          <div className="entry-url"><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.url}</a></div>
        )}
        {entry.notes && <div className="entry-notes"><span className="text-muted">{entry.notes}</span></div>}
        <div className="entry-footer">
          <div className="entry-footer-right">
            <button className="btn-text btn-sm" onClick={onEdit}>Edit</button>
            <button className={`btn-text btn-sm ${confirmDelete ? 'btn-danger' : ''}`} onClick={handleDelete}>
              {confirmDelete ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- OTHER (generic) ---
  return (
    <div className="entry-card">
      <div className="entry-header">
        <span className="entry-icon">📦</span>
        <div className="entry-info">
          <span className="entry-title">{entry.title}</span>
          {entry.username && <span className="entry-sub">{entry.username}</span>}
        </div>
        <span className="entry-category cat-other">Other</span>
      </div>
      {entry.password && (
        <div className="secret-row">
          <span className="secret-label">Secret</span>
          <span className="secret-value mono">{showSecret ? entry.password : '••••••••'}</span>
          <ToggleBtn />
          <CopyBtn value={entry.password} label="pw" />
        </div>
      )}
      {entry.url && (
        <div className="entry-url"><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.url}</a></div>
      )}
      {entry.notes && <div className="entry-notes"><span className="text-muted">{entry.notes}</span></div>}
      <div className="entry-footer">
        <div className="entry-footer-right">
          <button className="btn-text btn-sm" onClick={onEdit}>Edit</button>
          <button className={`btn-text btn-sm ${confirmDelete ? 'btn-danger' : ''}`} onClick={handleDelete}>
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
