const LOG_KEY = 'vault-access-log';
const MAX_LOG_ENTRIES = 50;

/**
 * Parse basic device info from user agent.
 */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  // Browser detection
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';

  // OS detection
  if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

/**
 * Record a vault access event.
 */
export function recordAccess(email, action = 'unlock') {
  const { browser, os } = getDeviceInfo();
  const entry = {
    id: crypto.randomUUID(),
    email,
    action,
    browser,
    os,
    timestamp: new Date().toISOString(),
  };

  const log = getAccessLog();
  log.unshift(entry);

  // Keep only the last MAX_LOG_ENTRIES
  const trimmed = log.slice(0, MAX_LOG_ENTRIES);
  localStorage.setItem(LOG_KEY, JSON.stringify(trimmed));

  return entry;
}

/**
 * Get access log entries.
 */
export function getAccessLog() {
  try {
    const stored = localStorage.getItem(LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Format relative time from a timestamp.
 */
export function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return then.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
