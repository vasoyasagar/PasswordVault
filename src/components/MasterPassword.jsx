import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import {
  isBiometricAvailable,
  isBiometricEnrolled,
  authenticateBiometric,
} from '../services/biometric';
import { pauseAutoLock, resumeAutoLock } from '../hooks/useAutoLock';

export default function MasterPassword({ user, onUnlock, onSignOut, loading, error }) {
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [biometricError, setBiometricError] = useState('');

  useEffect(() => {
    (async () => {
      if (user?.email && await isBiometricAvailable() && isBiometricEnrolled(user.email)) {
        setBiometricReady(true);
      }
    })();
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) onUnlock(password);
  };

  const handleBiometric = async () => {
    setBiometricError('');
    try {
      pauseAutoLock();
      const storedPassword = await authenticateBiometric();
      onUnlock(storedPassword, true);
    } catch {
      setBiometricError('Biometric failed. Use master password.');
    } finally {
      resumeAutoLock();
    }
  };

  return (
    <div className="screen">
      <div className="theme-toggle-float"><ThemeToggle /></div>
      <div className="card master-card">
        <div className="master-user">
          {user?.picture && <img src={user.picture} alt="" className="avatar" referrerPolicy="no-referrer" />}
          <span className="master-email">{user?.email}</span>
          <button className="btn-text btn-sm" onClick={onSignOut}>Switch</button>
        </div>

        <div className="login-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7c6aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </div>

        <h2>Enter Master Password</h2>
        <p className="text-muted">This password encrypts your vault. Share it only with your family.</p>

        {error && <div className="error-msg">{error}</div>}
        {biometricError && <div className="error-msg">{biometricError}</div>}

        {biometricReady && (
          <>
            <button
              className="btn-biometric"
              onClick={handleBiometric}
              disabled={loading}
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2v3c0 1.1-.9 2-2 2" />
                <path d="M8 15V9a4 4 0 0 1 8 0" />
                <path d="M6 13V9a6 6 0 0 1 12 0v4" />
                <path d="M10 17a2 2 0 0 1-2-2V9a4 4 0 0 1 8 0" />
              </svg>
              Unlock with Biometrics
            </button>
            <div className="biometric-divider"><span>or enter password</span></div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Master password"
              autoFocus
              autoComplete="off"
            />
            <button type="button" className="input-toggle" onClick={() => setShow(!show)}>
              {show ? '🙈' : '👁'}
            </button>
          </div>
          <button type="submit" className="btn-primary btn-full" disabled={loading || !password.trim()}>
            {loading ? 'Unlocking...' : 'Unlock Vault'}
          </button>
        </form>
      </div>
    </div>
  );
}
