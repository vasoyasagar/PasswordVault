import { useEffect, useRef, useCallback } from 'react';

const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Module-level pause flag — prevents lock during system dialogs (e.g. Touch ID)
let paused = false;
export function pauseAutoLock() { paused = true; }
export function resumeAutoLock() { paused = false; }

export default function useAutoLock(isUnlocked, onLock) {
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isUnlocked) {
      timerRef.current = setTimeout(() => {
        if (!paused) onLock();
      }, AUTO_LOCK_TIMEOUT);
    }
  }, [isUnlocked, onLock]);

  useEffect(() => {
    if (!isUnlocked) return;

    // Reset timer on user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => document.addEventListener(e, resetTimer, { passive: true }));

    // Lock on tab visibility change (but not during system dialogs)
    const handleVisibility = () => {
      if (document.hidden && isUnlocked && !paused) {
        onLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Start the initial timer
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => document.removeEventListener(e, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isUnlocked, onLock, resetTimer]);
}
