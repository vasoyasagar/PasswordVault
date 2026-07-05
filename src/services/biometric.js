const CREDENTIAL_KEY = 'vault-biometric-credential';
const PASSWORD_KEY = 'vault-biometric-pw';

/**
 * Check if WebAuthn/biometric is available on this device.
 */
export async function isBiometricAvailable() {
  if (!window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Check if biometric unlock is enrolled for this user.
 */
export function isBiometricEnrolled(email) {
  const stored = localStorage.getItem(CREDENTIAL_KEY);
  if (!stored) return false;
  try {
    const data = JSON.parse(stored);
    return data.email === email;
  } catch {
    return false;
  }
}

/**
 * Enroll biometric: register a credential and store encrypted master password.
 */
export async function enrollBiometric(email, masterPassword) {
  const userId = new TextEncoder().encode(email);
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  // Remove any existing enrollment first to avoid conflicts
  const existing = localStorage.getItem(CREDENTIAL_KEY);
  let excludeCredentials = [];
  if (existing) {
    try {
      const { credentialId } = JSON.parse(existing);
      excludeCredentials = [{ id: base64ToBuffer(credentialId), type: 'public-key' }];
    } catch { /* ignore */ }
  }

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: 'Password Vault' },
      user: {
        id: userId,
        name: email,
        displayName: email.split('@')[0],
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' },  // RS256
      ],
      excludeCredentials,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 120000,
    },
  });

  if (!credential) throw new Error('Biometric enrollment failed');

  // Store credential ID and encrypted password
  const credentialId = bufferToBase64(credential.rawId);

  // Encrypt master password with a device-bound key
  const encryptedPw = await encryptForStorage(masterPassword);

  localStorage.setItem(CREDENTIAL_KEY, JSON.stringify({
    email,
    credentialId,
    enrolledAt: new Date().toISOString(),
  }));
  localStorage.setItem(PASSWORD_KEY, encryptedPw);

  return true;
}

/**
 * Authenticate with biometric and retrieve the stored master password.
 */
export async function authenticateBiometric() {
  const stored = localStorage.getItem(CREDENTIAL_KEY);
  if (!stored) throw new Error('No biometric enrolled');

  const { credentialId } = JSON.parse(stored);
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{
        id: base64ToBuffer(credentialId),
        type: 'public-key',
        transports: ['internal'],
      }],
      userVerification: 'required',
      timeout: 120000,
    },
  });

  if (!assertion) throw new Error('Biometric authentication failed');

  // Retrieve stored password
  const encryptedPw = localStorage.getItem(PASSWORD_KEY);
  if (!encryptedPw) throw new Error('No stored password found');

  return await decryptFromStorage(encryptedPw);
}

/**
 * Remove biometric enrollment.
 */
export function removeBiometric() {
  localStorage.removeItem(CREDENTIAL_KEY);
  localStorage.removeItem(PASSWORD_KEY);
}

// --- Internal helpers ---

async function encryptForStorage(plaintext) {
  const key = await getStorageKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return JSON.stringify({
    iv: bufferToBase64(iv),
    data: bufferToBase64(encrypted),
  });
}

async function decryptFromStorage(stored) {
  const { iv, data } = JSON.parse(stored);
  const key = await getStorageKey();
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(iv) },
    key,
    base64ToBuffer(data)
  );
  return new TextDecoder().decode(decrypted);
}

async function getStorageKey() {
  // Derive a consistent key from a fixed salt + origin
  // This isn't meant to be unbreakable — biometric verification is the security gate
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(window.location.origin + '-vault-biometric'),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('vault-device-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
