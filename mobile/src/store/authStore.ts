import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { User, AuthTokens } from '@aquapack/shared';

const AUTH_KEY = 'aquapack_auth';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, tokens: AuthTokens) => Promise<void>;
  updateTokens: (tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, tokens) => {
    await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify({ user, tokens }));
    set({
      user,
      tokens,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  updateTokens: async (tokens) => {
    const { user } = get();
    if (user) {
      await SecureStore.setItemAsync(AUTH_KEY, JSON.stringify({ user, tokens }));
    }
    set((state) => ({ ...state, tokens }));
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(AUTH_KEY);
    } catch (error) {
      console.warn('Failed to delete auth from SecureStore:', error);
      // Continue with logout even if SecureStore fails
    }
    set({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadAuth: async () => {
    try {
      const stored = await SecureStore.getItemAsync(AUTH_KEY);
      if (stored) {
        const { user, tokens } = JSON.parse(stored);
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
      set({ isLoading: false });
    }
  },
}));
