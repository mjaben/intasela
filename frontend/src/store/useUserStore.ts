import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserState {
  user: {
    id: string;
    username: string;
    avatarUrl: string;
    firstName?: string;
    lastName?: string;
    walletBalance?: number;
    createdAt?: string;
  } | null;
  walletBalance: number;
  isAuthenticated: boolean;
  login: (userData: any) => void;
  updateUser: (userData: any) => void;
  logout: () => void;
  updateBalance: (amount: number) => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      walletBalance: 0,
      isAuthenticated: false,
      
      login: (userData) => set({ 
        user: userData, 
        isAuthenticated: true,
        walletBalance: typeof userData?.walletBalance === 'number' ? userData.walletBalance : 0
      }),
      
      updateUser: (userData) => set((state) => ({
        user: { ...state.user, ...userData } as any,
        walletBalance: typeof userData?.walletBalance === 'number' ? userData.walletBalance : state.walletBalance
      })),
      
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

      fetchCurrentUser: async () => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem("access_token");
        if (!token) return;

        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            set({
              user: userData,
              isAuthenticated: true,
              walletBalance: typeof userData?.walletBalance === 'number' ? userData.walletBalance : 0
            });
          }
        } catch (e) {
          console.error("Failed to fetch current user profile", e);
        }
      }
    }),
    {
      name: 'user-storage',
    }
  )
);
