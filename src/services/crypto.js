const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const PBKDF2_ITERATIONS = 600000;

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(base64) {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return {
    v: 1,
    salt: toBase64(salt),
    iv: toBase64(iv),
    data: toBase64(encrypted),
  };
}

export async function decrypt(encryptedObj, password) {
  const salt = fromBase64(encryptedObj.salt);
  const iv = fromBase64(encryptedObj.iv);
  const data = fromBase64(encryptedObj.data);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

export function generatePassword(length = 20) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*_+-=?';
  const all = upper + lower + digits + symbols;

  const values = crypto.getRandomValues(new Uint32Array(length));
  const chars = Array.from(values, (v) => all[v % all.length]);

  // Guarantee at least one from each category
  const guarantee = [upper, lower, digits, symbols];
  const positions = crypto.getRandomValues(new Uint32Array(guarantee.length));
  guarantee.forEach((set, i) => {
    const pos = positions[i] % length;
    const pick = crypto.getRandomValues(new Uint32Array(1))[0];
    chars[pos] = set[pick % set.length];
  });

  return chars.join('');
}
