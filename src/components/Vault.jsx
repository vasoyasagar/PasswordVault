import { useState, useEffect } from 'react';
import EntryCard from './EntryCard';
import EntryForm from './EntryForm';
import PaymentHistory from './PaymentHistory';
import AccessLog from './AccessLog';
import ThemeToggle from './ThemeToggle';
import { getUpcomingDues } from '../services/interest';
import {
  isBiometricAvailable,
  isBiometricEnrolled,
  enrollBiometric,
  removeBiometric,
} from '../services/biometric';
import { pauseAutoLock, resumeAutoLock } from '../hooks/useAutoLock';

const TABS = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'money', label: 'Money', icon: '💰' },
  { key: 'card', label: 'Cards', icon: '💳' },
  { key: 'banking', label: 'Banking', icon: '🏦' },
  { key: 'login', label: 'Logins', icon: '🔑' },
  { key: 'other', label: 'Other', icon: '📦' },
];

export default function Vault({
  entries, user, fileId, onAdd, onUpdate, onDelete, onShare, onSync, onLock, onSignOut, loading, masterPassword,
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formCategory, setFormCategory] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [paymentEntry, setPaymentEntry] = useState(null);
  const [showAccessLog, setShowAccessLog] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      setBiometricSupported(available);
      if (available && user?.email) {
        setBiometricEnabled(isBiometricEnrolled(user.email));
      }
    })();
  }, [user]);

  const handleToggleBiometric = async () => {
    if (biometricEnabled) {
      removeBiometric();
      setBiometricEnabled(false);
    } else {
      try {
        pauseAutoLock();
        await enrollBiometric(user.email, masterPassword);
        setBiometricEnabled(true);
      } catch {
        // User cancelled or not supported
      } finally {
        resumeAutoLock();
      }
    }
  };

  const filtered = entries.filter((e) => {
    const matchTab = activeTab === 'all' || e.category === activeTab;
    if (!matchTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.title?.toLowerCase().includes(q) ||
      e.personName?.toLowerCase().includes(q) ||
      e.username?.toLowerCase().includes(q) ||
      e.bankName?.toLowerCase().includes(q) ||
      e.notes?.toLowerCase().includes(q)
    );
  });

  const getCounts = () => {
    const counts = { all: entries.length, money: 0, card: 0, banking: 0, login: 0, other: 0 };
    entries.forEach((e) => {
      if (counts[e.category] !== undefined) counts[e.category]++;
    });
    return counts;
  };
  const counts = getCounts();

  const moneyEntries = entries.filter((e) => e.category === 'money');
  const totalLent = moneyEntries.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalInterestReceived = moneyEntries.reduce((sum, e) => {
    return sum + (e.payments || []).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
  }, 0);

  const handleEdit = (entry) => {
    setEditEntry(entry);
    setFormCategory(entry.category);
    setShowForm(true);
  };

  const handleAdd = (category) => {
    setEditEntry(null);
    setFormCategory(category !== 'all' ? category : null);
    setShowForm(true);
  };

  const handleSave = (entry) => {
    if (editEntry) {
      onUpdate({ ...editEntry, ...entry, payments: entry.payments || editEntry.payments });
    } else {
      onAdd(entry);
    }
    setShowForm(false);
    setEditEntry(null);
    setFormCategory(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditEntry(null);
    setFormCategory(null);
  };

  const handleAddPayment = (entryId, payment) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    const updated = {
      ...entry,
      payments: [...(entry.payments || []), { ...payment, id: crypto.randomUUID(), date: payment.date || new Date().toISOString().split('T')[0] }],
    };
    onUpdate(updated);
  };

  const handleDeletePayment = (entryId, paymentId) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) return;
    onUpdate({
      ...entry,
      payments: (entry.payments || []).filter((p) => p.id !== paymentId),
    });
  };

  const handleShare = async () => {
    if (!shareEmail.trim()) return;
    try {
      await onShare(shareEmail.trim());
      setShareEmail('');
      setShowShare(false);
    } catch {
      alert('Failed to share. Make sure the email is a valid Google account.');
    }
  };

  // Keep payment entry in sync
  const currentPaymentEntry = paymentEntry ? entries.find(e => e.id === paymentEntry.id) : null;

  return (
    <div className="vault">
      {/* Header */}
      <header className="vault-header">
        <div className="vault-header-left">
          {user?.picture && (
            <img src={user.picture} alt="" className="avatar-sm" referrerPolicy="no-referrer" />
          )}
          <h1>Vault</h1>
        </div>
        <div className="vault-header-right">
          <ThemeToggle />
          <button className="icon-btn" onClick={onSync} disabled={loading} title="Sync">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'spin' : ''}>
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)} title="Menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </div>

        {showMenu && (
          <>
            <div className="backdrop" onClick={() => setShowMenu(false)} />
            <div className="dropdown-menu">
              <button onClick={() => { setShowShare(true); setShowMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
                Share Vault
              </button>
              <button onClick={() => { setShowAccessLog(true); setShowMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                Access History
              </button>
              {biometricSupported && (
                <button onClick={() => { handleToggleBiometric(); setShowMenu(false); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v3c0 1.1-.9 2-2 2" /><path d="M8 15V9a4 4 0 0 1 8 0" /><path d="M6 13V9a6 6 0 0 1 12 0v4" /></svg>
                  {biometricEnabled ? 'Disable Biometrics' : 'Enable Biometrics'}
                </button>
              )}
              <button onClick={() => { onLock(); setShowMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Lock Vault
              </button>
              <button onClick={() => { onSignOut(); setShowMenu(false); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                Sign Out
              </button>
            </div>
          </>
        )}
      </header>

      {/* Category Tabs */}
      <div className="tabs-scroll">
        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab ${activeTab === tab.key ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {counts[tab.key] > 0 && <span className="tab-count">{counts[tab.key]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Money Summary Card */}
      {activeTab === 'money' && moneyEntries.length > 0 && (
        <div className="summary-card">
          <div className="summary-row">
            <div className="summary-item">
              <span className="summary-label">Total Lent</span>
              <span className="summary-value text-warning">₹{totalLent.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-divider" />
            <div className="summary-item">
              <span className="summary-label">Interest Received</span>
              <span className="summary-value text-success">₹{totalInterestReceived.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Dues */}
      {(activeTab === 'money' || activeTab === 'all') && getUpcomingDues(entries).length > 0 && (
        <div className="upcoming-dues">
          <h3 className="upcoming-dues-title">📅 Upcoming Interest Dues</h3>
          <div className="upcoming-list">
            {getUpcomingDues(entries).map((due) => (
              <div key={due.entry.id} className={`upcoming-item upcoming-${due.status}`}>
                <div className="upcoming-left">
                  <span className="upcoming-name">{due.entry.personName || due.entry.title}</span>
                  <span className="upcoming-detail">
                    ₹{due.expectedAmount.toLocaleString('en-IN')} · Due {due.nextDueDate}
                  </span>
                </div>
                <div className="upcoming-right">
                  {due.status === 'overdue' && (
                    <span className="upcoming-badge badge-overdue">Overdue {Math.abs(due.daysUntilDue)}d</span>
                  )}
                  {due.status === 'due-soon' && (
                    <span className="upcoming-badge badge-due-soon">{due.daysUntilDue}d left</span>
                  )}
                  {due.status === 'upcoming' && (
                    <span className="upcoming-badge badge-upcoming">{due.daysUntilDue}d</span>
                  )}
                  {due.remaining < due.expectedAmount && due.remaining > 0 && (
                    <span className="upcoming-remaining">₹{due.remaining.toLocaleString('en-IN')} left</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="vault-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder={`Search ${activeTab === 'all' ? 'all entries' : TABS.find(t => t.key === activeTab)?.label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch('')}>&times;</button>
        )}
      </div>

      {/* Entry list */}
      <div className="vault-list">
        {filtered.length === 0 && (
          <div className="vault-empty">
            {entries.length === 0 ? (
              <>
                <span className="vault-empty-icon">🔐</span>
                <p>Your vault is empty</p>
                <p className="text-muted">Tap + to add your first entry</p>
              </>
            ) : filtered.length === 0 && search ? (
              <p className="text-muted">No results for "{search}"</p>
            ) : (
              <>
                <span className="vault-empty-icon">{TABS.find(t => t.key === activeTab)?.icon}</span>
                <p className="text-muted">No {TABS.find(t => t.key === activeTab)?.label.toLowerCase()} entries yet</p>
              </>
            )}
          </div>
        )}
        {filtered.map((entry) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            onEdit={() => handleEdit(entry)}
            onDelete={() => onDelete(entry.id)}
            onViewPayments={entry.category === 'money' ? () => setPaymentEntry(entry) : undefined}
          />
        ))}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => handleAdd(activeTab)}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      {/* Entry form modal */}
      {showForm && (
        <EntryForm
          entry={editEntry}
          defaultCategory={formCategory}
          onSave={handleSave}
          onClose={handleCloseForm}
        />
      )}

      {/* Payment history modal */}
      {currentPaymentEntry && (
        <PaymentHistory
          entry={currentPaymentEntry}
          onAddPayment={(payment) => handleAddPayment(currentPaymentEntry.id, payment)}
          onDeletePayment={(paymentId) => handleDeletePayment(currentPaymentEntry.id, paymentId)}
          onClose={() => setPaymentEntry(null)}
        />
      )}

      {/* Share modal */}
      {showShare && (
        <div className="modal-overlay" onClick={() => setShowShare(false)}>
          <div className="modal share-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Share Vault</h3>
            <p className="text-muted">Share with another Google account. They'll need the same master password to decrypt.</p>
            {fileId && (
              <div className="share-id">
                <span className="text-muted">Vault ID:</span>
                <code>{fileId}</code>
              </div>
            )}
            <div className="input-group">
              <input
                type="email"
                placeholder="Email address"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowShare(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleShare} disabled={!shareEmail.trim()}>Share</button>
            </div>
          </div>
        </div>
      )}

      {/* Access log modal */}
      {showAccessLog && (
        <AccessLog onClose={() => setShowAccessLog(false)} />
      )}
    </div>
  );
}
