import { create } from 'zustand';
import type { SyncRecord } from '@/types/api';

interface SyncState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;

  enqueueMutation: (record: Omit<SyncRecord, 'id' | 'synced_at'>) => Promise<void>;
  flushQueue: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  error: null,

  enqueueMutation: async (record) => {
    // TODO: write to SQLite sync_queue table (Phase 2)
    set((state) => ({ pendingCount: state.pendingCount + 1 }));
  },

  flushQueue: async () => {
    // TODO: read sync_queue, POST to Supabase, mark synced (Phase 2)
    set({ isSyncing: true, error: null });
    try {
      // await syncManager.flush();
      set({ lastSyncedAt: new Date().toISOString(), pendingCount: 0 });
    } catch (err) {
      set({ error: String(err) });
    } finally {
      set({ isSyncing: false });
    }
  },
}));
