import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

/**
 * expo-secure-store has a 2048-byte value limit on iOS.
 * Supabase session tokens (JWT + metadata) routinely exceed this.
 * We chunk large values across multiple SecureStore keys.
 */
const CHUNK_SIZE = 1500;

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
    if (!countStr) {
      return SecureStore.getItemAsync(key);
    }
    const count = parseInt(countStr, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}__chunk_${i}`),
      ),
    );
    if (chunks.some((c) => c === null)) return null;
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      return SecureStore.setItemAsync(key, value);
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}__chunks`, String(chunks.length));
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}__chunk_${i}`, chunk)),
    );
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}__chunks`);
    if (countStr) {
      const count = parseInt(countStr, 10);
      await SecureStore.deleteItemAsync(`${key}__chunks`);
      await Promise.all(
        Array.from({ length: count }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}__chunk_${i}`),
        ),
      );
    }
    // Always attempt to delete the plain key too (handles non-chunked values)
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: SecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);
