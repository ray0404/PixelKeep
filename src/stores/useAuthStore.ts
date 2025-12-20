import { create } from 'zustand';
import { db } from '../db/db';
import { encrypt, decrypt } from '../utils/encryption';

interface AuthState {
  isAuthenticated: boolean;
  password: string | null;
  isLocked: boolean;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  password: null,
  isLocked: true,

  unlock: async (enteredPassword: string) => {
    const check = await db.meta.get('password_check');
    if (check) {
      const result = decrypt(check.value, enteredPassword);
      if (result === 'ok') {
        set({ isAuthenticated: true, password: enteredPassword, isLocked: false });
        return true;
      }
      return false;
    } else {
      // First time setup
      const verification = { key: 'password_check', value: encrypt('ok', enteredPassword) };
      await db.meta.put(verification);
      set({ isAuthenticated: true, password: enteredPassword, isLocked: false });
      return true;
    }
  },

  lock: () => {
    set({ isAuthenticated: false, password: null, isLocked: true });
  },

  initialize: async () => {
    const check = await db.meta.get('password_check');
    if (check) {
      set({ isLocked: true, isAuthenticated: false });
    } else {
      // No password set yet, but we still want to show unlock screen for setup
      set({ isLocked: false, isAuthenticated: false });
    }
  }
}));
