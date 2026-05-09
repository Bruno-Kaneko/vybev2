import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { deleteAllUserNotifications, deleteNotification, getNotifications } from '@/lib/db';
import type { DBNotification } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

const POLL_INTERVAL_MS = 15_000;
const RECONNECT_DELAY_MS = 3_000;

type NotificationsContextType = {
  notifications: DBNotification[];
  pauseUpdates: () => void;
  resumeUpdates: () => void;
  refresh: () => Promise<void>;
  dismiss: (id: string) => void;
  clearAll: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [],
  pauseUpdates: () => {},
  resumeUpdates: () => {},
  refresh: async () => {},
  dismiss: () => {},
  clearAll: async () => {},
});

const log = (...args: any[]) => {
  if (__DEV__) console.log('[NOTIFS]', ...args);
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [notifications, setNotifications] = useState<DBNotification[]>([]);
  const pausedRef = useRef(false);
  const userIdRef = useRef<string | undefined>(userId);

  useEffect(() => { userIdRef.current = userId; }, [userId]);

  const refresh = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) { log('refresh skip: no user'); return; }
    if (pausedRef.current) { log('refresh skip: paused'); return; }
    try {
      const data = await getNotifications(uid);
      setNotifications(data);
      log('refresh ok, count=', data.length);
    } catch (e: any) {
      log('refresh err:', e?.message || e);
    }
  }, []);

  const pauseUpdates = useCallback(() => {
    pausedRef.current = true;
    log('paused');
  }, []);

  const resumeUpdates = useCallback(() => {
    pausedRef.current = false;
    log('resumed → refresh');
    refresh();
  }, [refresh]);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    deleteNotification(id).catch(e => log('dismiss err:', e?.message));
  }, []);

  const clearAll = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await deleteAllUserNotifications(uid);
      log('clearAll ok');
    } catch (e: any) {
      log('clearAll err:', e?.message);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      log('no user — reset state');
      setNotifications([]);
      return;
    }

    log('SETUP user=', userId);
    refresh();

    let channel = supabase
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
    <NotificationsContext.Provider value={{ notifications, pauseUpdates, resumeUpdates, refresh, dismiss, clearAll }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
