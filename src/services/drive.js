const VAULT_FILENAME = 'PasswordVault.encrypted';
const VAULT_MIME = 'application/json';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

let accessToken = null;

export function setAccessToken(token) {
  accessToken = token;
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Drive API ${res.status}: ${body}`);
  }
  return res;
}

export async function findVaultFile() {
  const q = encodeURIComponent(`name='${VAULT_FILENAME}' and trashed=false`);
  const res = await request(
    `${API}/files?q=${q}&fields=files(id,name,modifiedTime)&spaces=drive`
  );
  const data = await res.json();
  return data.files?.[0] || null;
}

export async function getVaultFileById(fileId) {
  const res = await request(`${API}/files/${fileId}?fields=id,name,modifiedTime`);
  return res.json();
}

export async function readVaultFile(fileId) {
  const res = await request(`${API}/files/${fileId}?alt=media`);
  return res.json();
}

export async function createVaultFile(content) {
  const metadata = { name: VAULT_FILENAME, mimeType: VAULT_MIME };
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append(
    'file',
    new Blob([JSON.stringify(content)], { type: VAULT_MIME })
  );
  const res = await fetch(`${UPLOAD_API}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Create failed: ${res.status}`);
  return res.json();
}

export async function updateVaultFile(fileId, content) {
  const res = await fetch(`${UPLOAD_API}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': VAULT_MIME,
    },
    body: JSON.stringify(content),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.status}`);
  return res.json();
}

export async function shareVaultFile(fileId, email) {
  const res = await fetch(`${API}/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      role: 'writer',
      type: 'user',
      emailAddress: email,
    }),
  });
  if (!res.ok) throw new Error(`Share failed: ${res.status}`);
  return res.json();
}
