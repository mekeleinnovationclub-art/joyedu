import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, ActiveRole, TeacherApplication } from '@/types';

interface AuthState {
  // User data
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  
  // Auth state
  isAuthenticated: boolean;
  isHydrated: boolean;
  isInitializing: boolean;
  
  // Teacher application
  teacherApplication: TeacherApplication | null;
  
  // Actions
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken?: string) => void;
  switchRole: (role: ActiveRole) => void;
  setTeacherApplication: (application: TeacherApplication | null) => void;
  setInitializing: (isInitializing: boolean) => void;
  setHydrated: () => void;
  logout: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: false,
      isInitializing: true,
      teacherApplication: null,
      
      setAuth: (user, accessToken, refreshToken) =>
        set({ 
          user, 
          accessToken, 
          refreshToken: refreshToken || null, 
          isAuthenticated: true,
          isInitializing: false,
        }),
      
      setUser: (user) => set({ user }),
      
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken: refreshToken || null }),
      
      switchRole: (role) =>
        set((state) => ({
          user: state.user ? { ...state.user, activeRole: role } : null,
        })),
      
      setTeacherApplication: (application) =>
        set({ teacherApplication: application }),
      
      setInitializing: (isInitializing) => set({ isInitializing }),
      
      setHydrated: () => set({ isHydrated: true }),
      
      logout: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null, 
        isAuthenticated: false,
        teacherApplication: null,
        isInitializing: false,
      }),
      
      clearAuth: () => set({ 
        user: null, 
        accessToken: null, 
        refreshToken: null, 
        isAuthenticated: false,
        teacherApplication: null,
        isInitializing: false,
      }),
    }),
    {
      name: 'joyedu-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        teacherApplication: state.teacherApplication,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true;
          // Keep isInitializing true until session validation completes in useAuth hook
          // This prevents race conditions where route guards redirect before auth is validated
          state.isInitializing = true;
        }
      },
    },
  ),
);
