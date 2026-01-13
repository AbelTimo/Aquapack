import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (user: User, tokens: AuthTokens) => void;
  updateTokens: (tokens: AuthTokens) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: (user, tokens) =>
        set({
          user,
          tokens,
          isAuthenticated: true,
          isLoading: false,
        }),

      updateTokens: (tokens) =>
        set((state) => ({
          ...state,
          tokens,
        })),

      logout: () =>
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) =>
        set((state) => ({
          ...state,
          isLoading: loading,
        })),
    }),
    {
      name: 'aquapack-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        console.log('[AuthStore] onRehydrateStorage called, state:', state);
        console.log('[AuthStore] localStorage at rehydration:', localStorage.getItem('aquapack-auth'));
        // Always set loading to false after hydration completes (whether successful or not)
        // Use setTimeout to ensure this runs after the store is fully initialized
        setTimeout(() => {
          console.log('[AuthStore] Setting isLoading to false');
          useAuthStore.setState({ isLoading: false });
        }, 0);
      },
    }
  )
);
