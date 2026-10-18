/**
 * Fight Mecca Motion Session Storage & Canonical Types Bridge
 */

export type { MotionFrame, MotionSession, Landmark } from '@/types/motion';
import { MotionSession } from '@/types/motion';

const STORAGE_KEY_PREFIX = 'fightmecca_motion_session_';

export function saveMotionSession(session: MotionSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${session.session_id}`, JSON.stringify(session));
  } catch (err) {
    console.warn('Failed to persist motion session to localStorage:', err);
  }
}

export function loadMotionSession(sessionId: string): MotionSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${sessionId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.warn(`Failed to load motion session ${sessionId}:`, err);
    return null;
  }
}
