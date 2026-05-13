import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { deleteNotification, getNotifications, markAllNotificationsRead, NOTIFICATIONS_TTL_MS } from '@/lib/db';
import type { DBNotification } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

const POLL_INTERVAL_MS = 15_000;
const SEEN_KEY = (uid: string) => `notif_seen_at:${uid}`;

type NotificationsContextType = {
  notifications: DBNotification[];
  unreadCount: number;
  /** Epoch ms — notifications created at or before this are considered "seen". */
  seenAt: number;
  /** A notification is unread if it isn't flagged read in the DB and arrived after the last "seen" mark. */
  isUnread: (n: { read: boolean; created_at: string }) => boolean;
  refresh: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  unreadCount: 0,
  seenAt: 0,
  isUnread: () => false,
  refresh: async () => {},
  markAllAsRead: async () => {},
  dismiss: () => {},
});

const log = (...args: any[]) => {
  if (__DEV__) console.log('[NOTIFS]', ...args);
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const [seenAt, setSeenAt] = useState(0);
  const userIdRef = useRef<string | undefined>(userId);

  useEffect(() => { userIdRef.current = userId; }, [userId]);

  // Load the persisted "seen" mark for this user (survives reloads).
  useEffect(() => {
    if (!userId) { setSeenAt(0); return; }
    let cancelled = false;
    AsyncStorage.getItem(SEEN_KEY(userId))
      .then(v => { if (!cancelled && v) setSeenAt(parseInt(v, 10) || 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userId]);

  const isUnread = useCallback(
    (n: { read: boolean; created_at: string }) => !n.read && new Date(n.created_at).getTime() > seenAt,
    [seenAt]
  );

  const unreadCount = useMemo(
    () => notifications.filter(isUnread).length,
    [notifications, isUnread]
  );

  const refresh = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) { log('refresh skip: no user'); return; }
    try {
      const fresh = await getNotifications(uid);
      const cutoff = Date.now() - NOTIFICATIONS_TTL_MS;
      setNotifications(prev => {
        const readIds = new Set(prev.filter(p => p.read).map(p => p.id));
        const merged = fresh
          .filter(f => new Date(f.created_at).getTime() >= cutoff)
          .map(f => (readIds.has(f.id) && !f.read ? { ...f, read: true } : f))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // avoid needless re-render if nothing changed
        if (merged.length === prev.length && merged.every((m, i) => prev[i]?.id === m.id && prev[i]?.read === m.read)) return prev;
        return merged;
      });
      log('refresh ok, fetched=', fresh.length);
    } catch (e: any) {
      log('refresh err:', e?.message || e);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    // "Seen" mark: at least now, but never earlier than the newest notification we already hold,
    // so a client clock that lags behind the server can't leave old notifications stuck as unread.
    const newestMs = notifications.reduce((m, n) => Math.max(m, new Date(n.created_at).getTime()), 0);
    const mark = Math.max(Date.now(), newestMs);
    setSeenAt(prev => (mark > prev ? mark : prev));
    AsyncStorage.setItem(SEEN_KEY(uid), String(mark)).catch(() => {});
    // Best-effort DB flag too (harmless if RLS/permissions block it — the seen-mark above is what counts).
    setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true }));
    try {
      await markAllNotificationsRead(uid);
      log('markAllAsRead ok, mark=', mark);
    } catch (e: any) {
      log('markAllAsRead err:', e?.message);
    }
  }, [notifications]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteNotification(id).catch(e => log('dismiss err:', e?.message));
  }, []);

  useEffect(() => {
    if (!userId) {
      log('no user — reset state');
      setNotifications([]);
      return;
    }

    log('SETUP user=', userId);
    refresh();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          log('▶ REALTIME INSERT id=', (payload.new as any)?.id);
          refresh();
        }
      )
      .subscribe((status, err) => {
        log('channel status=', status, err ? `err=${err.message}` : '');
      });

    const pollInterval = setInterval(() => {
      log('⟳ poll tick');
      refresh();
    }, POLL_INTERVAL_MS);

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      log('appState=', state);
      if (state === 'active') refresh();
    });

    return () => {
      log('CLEANUP user=', userId);
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      appStateSub.remove();
    };
  }, [userId, refresh]);

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, seenAt, isUnread, refresh, markAllAsRead, dismiss }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
