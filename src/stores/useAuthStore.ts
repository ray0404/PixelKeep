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
    console.log('Unlock ritual started...');
    try {
      // Race the database check against a 5-second timeout
      const checkPromise = db.meta.get('password_check');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database Timeout')), 5000)
      );

      console.log('Checking meta table for password_check (with timeout)...');
      const check = await Promise.race([checkPromise, timeoutPromise]) as any;
      console.log('Meta check result:', check ? 'found' : 'not found');
      
      if (check) {
        const result = decrypt(check.value, enteredPassword);
        console.log('Decryption result:', result === 'ok' ? 'Success' : 'Failure');
        if (result === 'ok') {
          set({ isAuthenticated: true, password: enteredPassword, isLocked: false });
          return true;
        }
        return false;
      } else {
        // First time setup
        console.log('First time setup: creating password_check...');
        const verification = { key: 'password_check', value: encrypt('ok', enteredPassword) };
        await db.meta.put(verification);
        set({ isAuthenticated: true, password: enteredPassword, isLocked: false });
        console.log('Unlock successful (setup)');
        return true;
      }
    } catch (err) {
      console.error('CRITICAL: Unlock ritual failed at database level:', err);
      throw err;
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