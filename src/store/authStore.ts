import { create } from 'zustand';
import type { AuthStateShape } from '../types/store';
import { pb } from '../utils/pocketbase';

interface AuthStore extends AuthStateShape {
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  restore: () => void;
}

const snapshotFromPb = (): AuthStateShape => {
  const isAuthenticated = pb.authStore.isValid;
  // We store a convenience username to display in the top bar. PocketBase record fields vary;
  // prefer "username" (auth collection) but fall back to "email".
  const record = pb.authStore.record as unknown as { username?: string; email?: string } | null;
  const username = isAuthenticated ? record?.username ?? record?.email ?? null : null;
  return { isAuthenticated, username };
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...snapshotFromPb(),
  isLoading: false,
  error: null,
  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    const adminUser = import.meta.env.VITE_ADMIN_USER ?? 'admin';
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD ?? 'password';

    // Debug logging (remove after fixing)
    // eslint-disable-next-line no-console
    console.log('Login attempt:', { username, adminUser, match: username === adminUser && password === adminPassword });

    // Gate login attempts to the configured admin credentials.
    if (username !== adminUser || password !== adminPassword) {
      set({ isLoading: false, error: `Invalid credentials. Expected: ${adminUser}` });
      return false;
    }

    try {
      // Auth against a PocketBase auth collection named "users".
      await pb.collection('users').authWithPassword(username, password);
      set({ ...snapshotFromPb(), isLoading: false, error: null });
      return true;
    } catch (err) {
      console.error(err);
      set({
        isLoading: false,
        error:
          'PocketBase login failed. Verify the PocketBase URL and that the "users" collection contains this admin user.'
      });
      return false;
    }
  },
  logout: () => {
    pb.authStore.clear();
    set({ ...snapshotFromPb(), error: null });
  },
  restore: () => {
    set({ ...snapshotFromPb() });
  }
}));

