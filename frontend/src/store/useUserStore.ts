import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: {
    id: string;
    username: string;
    avatarUrl: string;
  } | null;
  walletBalance: number;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  logout: () => void;
  updateBalance: (amount: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      walletBalance: 0,
      isAuthenticated: false,
      
      login: (userData) => set({ 
        user: userData, 
        isAuthenticated: true 
      }),
      
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem("access_token");
        }
        set({ 
          user: null, 
          isAuthenticated: false,
          walletBalance: 0
        });
      },
      
      updateBalance: (amount) => set((state) => ({ 
        walletBalance: state.walletBalance + amount 
      })),
    }),
    {
      name: 'user-storage',
    }
  )
);
