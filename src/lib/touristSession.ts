/**
 * Tourist Session — anonymous session tracking via localStorage.
 * Generates a UUID on first visit, persists across page reloads.
 */

const SESSION_KEY = 'tourist-session-id';

export function getTouristSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // localStorage may be unavailable in private browsing or restricted contexts
    return '';
  }
}
