import { useState } from 'react';
import { generatePassword } from '../services/crypto';

const CATEGORIES = [
  { key: 'money', label: 'Money Lending', icon: '💰' },
  { key: 'card', label: 'Debit / Credit Card', icon: '💳' },
  { key: 'banking', label: 'Banking & UPI', icon: '🏦' },
  { key: 'login', label: 'Login / Password', icon: '🔑' },
  { key: 'other', label: 'Other Secret', icon: '📦' },
];

export default function EntryForm({ entry, defaultCategory, onSave, onClose }) {
  const [category, setCategory] = useState(entry?.category || defaultCategory || '');
  const [showPw, setShowPw] = useState(false);

  // Money fields
  const [personName, setPersonName] = useState(entry?.personName || '');
  const [amount, setAmount] = useState(entry?.amount || '');
  const [interestRate, setInterestRate] = useState(entry?.interestRate || '');
  const [dateGiven, setDateGiven] = useState(entry?.dateGiven || '');

  // Card fields
  const [cardTitle, setCardTitle] = useState(entry?.title || '');
  const [cardHolder, setCardHolder] = useState(entry?.cardHolder || '');
  const [cardNumber, setCardNumber] = useState(entry?.cardNumber || '');
  const [expiryDate, setExpiryDate] = useState(entry?.expiryDate || '');
  const [cvv, setCvv] = useState(entry?.cvv || '');
  const [cardPin, setCardPin] = useState(entry?.pin || '');

  // Banking fields
  const [bankTitle, setBankTitle] = useState(entry?.title || '');
  const [username, setUsername] = useState(entry?.username || '');
  const [password, setPassword] = useState(entry?.password || '');
  const [upiPin, setUpiPin] = useState(entry?.upiPin || '');
  const [mpin, setMpin] = useState(entry?.mpin || '');
  const [accountNumber, setAccountNumber] = useState(entry?.accountNumber || '');
  const [ifsc, setIfsc] = useState(entry?.ifsc || '');

  // Other fields
  const [otherTitle, setOtherTitle] = useState(entry?.title || '');
  const [otherUsername, setOtherUsername] = useState(entry?.username || '');
  const [otherPassword, setOtherPassword] = useState(entry?.password || '');
  const [otherUrl, setOtherUrl] = useState(entry?.url || '');

  // Login fields
  const [loginTitle, setLoginTitle] = useState(entry?.title || '');
  const [loginUsername, setLoginUsername] = useState(entry?.username || '');
  const [loginPassword, setLoginPassword] = useState(entry?.password || '');
  const [loginUrl, setLoginUrl] = useState(entry?.url || '');

  // Common
  const [notes, setNotes] = useState(entry?.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    let data = { category, notes: notes.trim() };

    if (category === 'money') {
      if (!personName.trim()) return;
      data = { ...data, title: personName.trim(), personName: personName.trim(), amount: parseFloat(amount) || 0, interestRate: parseFloat(interestRate) || 0, dateGiven, payments: entry?.payments || [] };
    } else if (category === 'card') {
      if (!cardTitle.trim()) return;
      data = { ...data, title: cardTitle.trim(), cardHolder: cardHolder.trim(), cardNumber: cardNumber.trim(), expiryDate: expiryDate.trim(), cvv: cvv.trim(), pin: cardPin.trim() };
    } else if (category === 'banking') {
      if (!bankTitle.trim()) return;
      data = { ...data, title: bankTitle.trim(), username: username.trim(), password, upiPin: upiPin.trim(), mpin: mpin.trim(), accountNumber: accountNumber.trim(), ifsc: ifsc.trim() };
    } else if (category === 'login') {
      if (!loginTitle.trim()) return;
      data = { ...data, title: loginTitle.trim(), username: loginUsername.trim(), password: loginPassword, url: loginUrl.trim() };
    } else {
      if (!otherTitle.trim()) return;
      data = { ...data, title: otherTitle.trim(), username: otherUsername.trim(), password: otherPassword, url: otherUrl.trim() };
    }

    onSave(data);
  };

  const handleGenerate = () => {
    if (category === 'banking') setPassword(generatePassword());
    else if (category === 'login') setLoginPassword(generatePassword());
    else setOtherPassword(generatePassword());
    setShowPw(true);
  };

  // Category picker if not yet selected
  if (!category) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal category-picker" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>What do you want to add?</h3>
            <button className="icon-btn" onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((c) => (
              <button key={c.key} className="category-option" onClick={() => setCategory(c.key)}>
                <span className="category-option-icon">{c.icon}</span>
                <span className="category-option-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentCat = CATEGORIES.find((c) => c.key === category);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal entry-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{entry ? 'Edit' : 'New'} {currentCat?.icon} {currentCat?.label}</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="entry-form">

          {/* === MONEY FORM === */}
          {category === 'money' && (
            <>
              <div className="form-field">
                <label>Person Name *</label>
                <input type="text" value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="Who did you give money to?" autoFocus required />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>Amount (₹) *</label>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50000" inputMode="numeric" />
                </div>
                <div className="form-field">
                  <label>Interest Rate (%)</label>
                  <input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="12" inputMode="decimal" />
                </div>
              </div>
              <div className="form-field">
                <label>Date Given</label>
                <input type="date" value={dateGiven} onChange={(e) => setDateGiven(e.target.value)} />
              </div>
            </>
          )}

          {/* === CARD FORM === */}
          {category === 'card' && (
            <>
              <div className="form-field">
                <label>Card Name *</label>
                <input type="text" value={cardTitle} onChange={(e) => setCardTitle(e.target.value)} placeholder="SBI Debit Card" autoFocus required />
              </div>
              <div className="form-field">
                <label>Card Holder Name</label>
                <input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="Full name on card" />
              </div>
              <div className="form-field">
                <label>Card Number</label>
                <input type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} inputMode="numeric" autoComplete="off" />
              </div>
              <div className="form-row form-row-3">
                <div className="form-field">
                  <label>Expiry</label>
                  <input type="text" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} placeholder="MM/YY" maxLength={5} />
                </div>
                <div className="form-field">
                  <label>CVV</label>
                  <input type={showPw ? 'text' : 'password'} value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder="•••" maxLength={4} inputMode="numeric" autoComplete="off" />
                </div>
                <div className="form-field">
                  <label>ATM PIN</label>
                  <input type={showPw ? 'text' : 'password'} value={cardPin} onChange={(e) => setCardPin(e.target.value)} placeholder="••••" maxLength={6} inputMode="numeric" autoComplete="off" />
                </div>
              </div>
              <button type="button" className="btn-text btn-sm" onClick={() => setShowPw(!showPw)}>
                {showPw ? '🙈 Hide secrets' : '👁 Show secrets'}
              </button>
            </>
          )}

          {/* === BANKING FORM === */}
          {category === 'banking' && (
            <>
              <div className="form-field">
                <label>App / Bank Name *</label>
                <input type="text" value={bankTitle} onChange={(e) => setBankTitle(e.target.value)} placeholder="SBI, PhonePe, GPay..." autoFocus required />
              </div>
              <div className="form-field">
                <label>Username / Customer ID</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username or ID" autoComplete="off" />
              </div>
              <div className="form-field">
                <label>Password</label>
                <div className="input-group">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Login password" autoComplete="off" />
                  <button type="button" className="input-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁'}</button>
                </div>
                <button type="button" className="btn-text btn-sm" onClick={handleGenerate} style={{ marginTop: 6 }}>🎲 Generate</button>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label>UPI PIN</label>
                  <input type={showPw ? 'text' : 'password'} value={upiPin} onChange={(e) => setUpiPin(e.target.value)} placeholder="UPI PIN" maxLength={6} inputMode="numeric" autoComplete="off" />
                </div>
                <div className="form-field">
                  <label>MPIN</label>
                  <input type={showPw ? 'text' : 'password'} value={mpin} onChange={(e) => setMpin(e.target.value)} placeholder="MPIN" maxLength={6} inputMode="numeric" autoComplete="off" />
                </div>
              </div>
              <div className="form-field">
                <label>Account Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Account number" inputMode="numeric" autoComplete="off" />
              </div>
              <div className="form-field">
                <label>IFSC Code</label>
                <input type="text" value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="SBIN0001234" autoComplete="off" />
              </div>
            </>
          )}

          {/* === LOGIN FORM === */}
          {category === 'login' && (
            <>
              <div className="form-field">
                <label>Site / App Name *</label>
                <input type="text" value={loginTitle} onChange={(e) => setLoginTitle(e.target.value)} placeholder="e.g. Gmail, Instagram, Netflix" autoFocus required />
              </div>
              <div className="form-field">
                <label>Username / Email</label>
                <input type="text" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} placeholder="Username or email" autoComplete="off" />
              </div>
              <div className="form-field">
                <label>Password</label>
                <div className="input-group">
                  <input type={showPw ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Password" autoComplete="off" />
                  <button type="button" className="input-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁'}</button>
                </div>
                <button type="button" className="btn-text btn-sm" onClick={handleGenerate} style={{ marginTop: 6 }}>🎲 Generate</button>
              </div>
              <div className="form-field">
                <label>URL</label>
                <input type="url" value={loginUrl} onChange={(e) => setLoginUrl(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          {/* === OTHER FORM === */}
          {category === 'other' && (
            <>
              <div className="form-field">
                <label>Title *</label>
                <input type="text" value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} placeholder="What is this secret for?" autoFocus required />
              </div>
              <div className="form-field">
                <label>Username / Email</label>
                <input type="text" value={otherUsername} onChange={(e) => setOtherUsername(e.target.value)} placeholder="Username or email" autoComplete="off" />
              </div>
              <div className="form-field">
                <label>Password / Secret</label>
                <div className="input-group">
                  <input type={showPw ? 'text' : 'password'} value={otherPassword} onChange={(e) => setOtherPassword(e.target.value)} placeholder="Secret value" autoComplete="off" />
                  <button type="button" className="input-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? '🙈' : '👁'}</button>
                </div>
                <button type="button" className="btn-text btn-sm" onClick={handleGenerate} style={{ marginTop: 6 }}>🎲 Generate</button>
              </div>
              <div className="form-field">
                <label>URL</label>
                <input type="url" value={otherUrl} onChange={(e) => setOtherUrl(e.target.value)} placeholder="https://..." />
              </div>
            </>
          )}

          {/* NOTES (all categories) */}
          <div className="form-field">
            <label>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." rows={2} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{entry ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
