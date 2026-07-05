import { useState, useEffect, useCallback } from 'react';
import { initAuth, signIn, signOut } from './services/auth';
import {
  setAccessToken,
  findVaultFile,
  readVaultFile,
  createVaultFile,
  updateVaultFile,
  shareVaultFile,
} from './services/drive';
import { encrypt, decrypt } from './services/crypto';
import { recordAccess } from './services/accessLog';
import useAutoLock from './hooks/useAutoLock';
import Login from './components/Login';
import MasterPassword from './components/MasterPassword';
import Vault from './components/Vault';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function App() {
  const [user, setUser] = useState(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [entries, setEntries] = useState([]);
  const [fileId, setFileId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('login'); // login | master | vault
  const [toast, setToast] = useState('');

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Missing VITE_GOOGLE_CLIENT_ID in .env');
      return;
    }
    const timer = setInterval(() => {
      if (window.google?.accounts?.oauth2) {
        clearInterval(timer);
        initAuth(CLIENT_ID, (tokenResponse) => {
          setAccessToken(tokenResponse.access_token);
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          })
            .then((r) => r.json())
            .then((info) => {
              setUser({
                email: info.email,
                name: info.name,
                picture: info.picture,
                token: tokenResponse.access_token,
              });
              setStep('master');
            })
            .catch(() => setError('Failed to get user info'));
        });
      }
    }, 200);
    return () => clearInterval(timer);
  }, []);

  const handleUnlock = useCallback(async (password, viaBiometric = false) => {
    setLoading(true);
    setError('');
    try {
      const file = await findVaultFile();
      if (file) {
        setFileId(file.id);
        const encData = await readVaultFile(file.id);
        const json = await decrypt(encData, password);
        const vault = JSON.parse(json);
        setEntries(vault.entries || []);
      } else {
        const empty = { entries: [] };
        const enc = await encrypt(JSON.stringify(empty), password);
        const created = await createVaultFile(enc);
        setFileId(created.id);
        setEntries([]);
      }
      setMasterPassword(password);
      setStep('vault');
      recordAccess(user?.email, viaBiometric ? 'biometric-unlock' : 'unlock');
    } catch {
      setError('Wrong master password or failed to load vault.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const saveVault = useCallback(
    async (updated) => {
      if (!fileId || !masterPassword) return;
      const enc = await encrypt(JSON.stringify({ entries: updated }), masterPassword);
      await updateVaultFile(fileId, enc);
    },
    [fileId, masterPassword]
  );

  const handleAdd = useCallback(
    async (entry) => {
      const newEntries = [
        ...entries,
        { ...entry, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ];
      setEntries(newEntries);
      await saveVault(newEntries);
      showToast('Entry added');
    },
    [entries, saveVault, showToast]
  );

  const handleUpdate = useCallback(
    async (entry) => {
      const newEntries = entries.map((e) =>
        e.id === entry.id ? { ...entry, updatedAt: new Date().toISOString() } : e
      );
      setEntries(newEntries);
      await saveVault(newEntries);
      showToast('Entry updated');
    },
    [entries, saveVault, showToast]
  );

  const handleDelete = useCallback(
    async (id) => {
      const newEntries = entries.filter((e) => e.id !== id);
      setEntries(newEntries);
      await saveVault(newEntries);
      showToast('Entry deleted');
    },
    [entries, saveVault, showToast]
  );

  const handleShare = useCallback(
    async (email) => {
      if (!fileId) return;
      await shareVaultFile(fileId, email);
      showToast(`Shared with ${email}`);
    },
    [fileId, showToast]
  );

  const handleSync = useCallback(async () => {
    if (!fileId || !masterPassword) return;
    setLoading(true);
    try {
      const encData = await readVaultFile(fileId);
      const json = await decrypt(encData, masterPassword);
      const vault = JSON.parse(json);
      setEntries(vault.entries || []);
      showToast('Vault synced');
      recordAccess(user?.email, 'sync');
    } catch {
      showToast('Sync failed');
    } finally {
      setLoading(false);
    }
  }, [fileId, masterPassword, showToast]);

  const handleLock = useCallback(() => {
    setMasterPassword('');
    setEntries([]);
    setStep('master');
    recordAccess(user?.email, 'lock');
  }, [user]);

  // Auto-lock on idle (5 min) or tab blur
  useAutoLock(step === 'vault', handleLock);

  const handleSignOut = useCallback(() => {
    signOut(user?.token);
    setUser(null);
    setMasterPassword('');
    setEntries([]);
    setFileId(null);
    setStep('login');
  }, [user]);

  return (
    <>
      {toast && <div className="toast">{toast}</div>}

      {step === 'login' && (
        <Login onSignIn={signIn} error={error} />
      )}

      {step === 'master' && (
        <MasterPassword
          user={user}
          onUnlock={handleUnlock}
          onSignOut={handleSignOut}
          loading={loading}
          error={error}
        />
      )}

      {step === 'vault' && (
        <Vault
          entries={entries}
          user={user}
          fileId={fileId}
          masterPassword={masterPassword}
          onAdd={handleAdd}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onShare={handleShare}
          onSync={handleSync}
          onLock={handleLock}
          onSignOut={handleSignOut}
          loading={loading}
        />
      )}
    </>
  );
}
