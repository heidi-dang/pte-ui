const STORAGE_PREFIX = 'pte_session_draft';

interface DraftKey {
  userId?: string;
  sessionId: string;
  questionId: string;
  taskCode: string;
}

function buildKey(key: DraftKey): string {
  return `${STORAGE_PREFIX}:${key.userId || 'anon'}:${key.sessionId}:${key.questionId}:${key.taskCode}`;
}

export function saveDraft(key: DraftKey, data: any): void {
  try {
    const entry = { data, savedAt: Date.now() };
    localStorage.setItem(buildKey(key), JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function getDraft(key: DraftKey): { data: any; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(buildKey(key));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDraft(key: DraftKey): void {
  try {
    localStorage.removeItem(buildKey(key));
  } catch {
    // ignore
  }
}

export function clearAllSessionDrafts(sessionId: string, userId?: string): void {
  try {
    const prefix = `${STORAGE_PREFIX}:${userId || 'anon'}:${sessionId}:`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export function getDraftKeysForSession(sessionId: string, userId?: string): { questionId: string; taskCode: string }[] {
  const prefix = `${STORAGE_PREFIX}:${userId || 'anon'}:${sessionId}:`;
  const keys: { questionId: string; taskCode: string }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        const parts = k.split(':');
        if (parts.length >= 5) {
          keys.push({ questionId: parts[3], taskCode: parts[4] });
        }
      }
    }
  } catch {
    // ignore
  }
  return keys;
}
