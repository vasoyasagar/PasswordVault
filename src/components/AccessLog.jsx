import { getAccessLog, formatRelativeTime } from '../services/accessLog';

export default function AccessLog({ onClose }) {
  const log = getAccessLog();

  const actionLabels = {
    unlock: '🔓 Unlocked vault',
    'biometric-unlock': '👆 Biometric unlock',
    sync: '🔄 Synced vault',
    lock: '🔒 Locked vault',
    'sign-in': '🔑 Signed in',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal access-log-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🕐 Access History</h3>
          <button className="icon-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="access-log-list">
          {log.length === 0 && (
            <p className="text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>
              No access history yet
            </p>
          )}
          {log.map((entry) => (
            <div key={entry.id} className="access-log-item">
              <div className="access-log-left">
                <span className="access-log-action">
                  {actionLabels[entry.action] || entry.action}
                </span>
                <span className="access-log-meta">
                  {entry.browser}/{entry.os} · {entry.email}
                </span>
              </div>
              <span className="access-log-time">
                {formatRelativeTime(entry.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
