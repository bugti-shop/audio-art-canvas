import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { performFullCalendarSync, isCalendarSyncEnabled, initializeCalendarSync } from '@/utils/systemCalendarSync';
import { loadTasksFromDB } from '@/utils/taskStorage';
import { getSetting } from '@/utils/settingsStorage';
import { CalendarEvent } from '@/types/note';
import { toast } from 'sonner';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Automatically syncs app tasks/events with the device's native calendar.
 * Runs on app focus and periodically.
 * 
 * Prevents sync loops by ignoring calendarEventsUpdated events
 * that originate from the sync process itself.
 */
export const useSystemCalendarSync = () => {
  const lastSyncRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const toastIdRef = useRef<string | number | undefined>();
  const isSyncingRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Initialize permissions on mount
    initializeCalendarSync().catch((e) => {
      if (String(e).includes('not implemented')) return;
      console.warn('Calendar sync init:', e);
    });

    const doSync = async () => {
      // Prevent concurrent syncs (which cause duplicate pushes)
      if (isSyncingRef.current) return;

      try {
        const enabled = await isCalendarSyncEnabled();
        if (!enabled) return;

        const now = Date.now();
        if (now - lastSyncRef.current < 60_000) return; // 1 min cooldown
        lastSyncRef.current = now;
        isSyncingRef.current = true;

        const tasks = await loadTasksFromDB();
        const events = await getSetting<CalendarEvent[]>('calendarEvents', []);

        toastIdRef.current = toast.loading('📅 Syncing calendar...', { duration: Infinity });

        const result = await performFullCalendarSync(tasks, events, ({ phase, current, total }) => {
          if (toastIdRef.current && total > 0) {
            toast.loading(`📅 ${phase}: ${current}/${total}`, { id: toastIdRef.current, duration: Infinity });
          }
        });

        if (result.pushed > 0 || result.pulled > 0 || result.updated > 0) {
          const parts = [];
          if (result.pushed > 0) parts.push(`${result.pushed} pushed`);
          if (result.pulled > 0) parts.push(`${result.pulled} new`);
          if (result.updated > 0) parts.push(`${result.updated} updated`);
          toast.success(`📅 Sync complete: ${parts.join(', ')}`, {
            id: toastIdRef.current,
            duration: 3000,
          });
        } else {
          toast.dismiss(toastIdRef.current);
        }

        if (result.errors.length > 0) {
          console.warn('Calendar sync errors:', result.errors);
        }
      } catch (e) {
        if (toastIdRef.current) toast.dismiss(toastIdRef.current);
        const msg = String(e);
        if (!msg.includes('not implemented') && !msg.includes('UNIMPLEMENTED')) {
          console.warn('Calendar sync failed:', e);
        }
      } finally {
        isSyncingRef.current = false;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') doSync();
    };

    // Only sync on task changes, NOT on calendarEventsUpdated from sync itself
    const handleTaskChange = () => {
      setTimeout(doSync, 3000);
    };

    const handleCalendarChange = (e: Event) => {
      // Ignore events dispatched by the sync process to break the loop
      const detail = (e as CustomEvent)?.detail;
      if (detail?.fromSync) return;
      setTimeout(doSync, 3000);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('tasksUpdated', handleTaskChange);
    window.addEventListener('calendarEventsUpdated', handleCalendarChange);

    // Initial sync
    doSync();

    // Periodic sync
    intervalRef.current = setInterval(doSync, SYNC_INTERVAL_MS);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('tasksUpdated', handleTaskChange);
      window.removeEventListener('calendarEventsUpdated', handleCalendarChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);
};
