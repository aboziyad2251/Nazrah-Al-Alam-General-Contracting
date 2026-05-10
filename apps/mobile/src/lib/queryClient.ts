import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { MMKV } from 'react-native-mmkv';

// MMKV is synchronous and ~30× faster than AsyncStorage — ideal for query cache
const mmkv = new MMKV({ id: 'nazrah-query-cache' });

const mmkvStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};

export const persister = createSyncStoragePersister({
  storage: mmkvStorage,
  key: 'NAZRAH_QUERY_CACHE',
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Equipment catalog: stale after 1 hour, kept in cache for 7 days (offline)
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30_000),
    },
  },
});
