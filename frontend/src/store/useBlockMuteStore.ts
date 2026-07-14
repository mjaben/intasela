import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserSummary {
  username: string;
  name: string;
  avatarUrl?: string;
}

interface BlockMuteState {
  blockedUsers: UserSummary[];
  mutedUsers: UserSummary[];
  mutedPosts: string[]; // array of post IDs

  toggleBlockUser: (user: UserSummary) => void;
  toggleMuteUser: (user: UserSummary) => void;
  toggleMutePost: (postId: string) => void;
  
  isUserBlocked: (username: string) => boolean;
  isUserMuted: (username: string) => boolean;
  isPostMuted: (postId: string) => boolean;
}

export const useBlockMuteStore = create<BlockMuteState>()(
  persist(
    (set, get) => ({
      blockedUsers: [],
      mutedUsers: [],
      mutedPosts: [],

      toggleBlockUser: (user) => set((state) => {
        const exists = state.blockedUsers.find(u => u.username === user.username);
        if (exists) {
          return { blockedUsers: state.blockedUsers.filter(u => u.username !== user.username) };
        } else {
          return { blockedUsers: [...state.blockedUsers, user] };
        }
      }),

      toggleMuteUser: (user) => set((state) => {
        const exists = state.mutedUsers.find(u => u.username === user.username);
        if (exists) {
          return { mutedUsers: state.mutedUsers.filter(u => u.username !== user.username) };
        } else {
          return { mutedUsers: [...state.mutedUsers, user] };
        }
      }),

      toggleMutePost: (postId) => set((state) => {
        const exists = state.mutedPosts.includes(postId);
        if (exists) {
          return { mutedPosts: state.mutedPosts.filter(id => id !== postId) };
        } else {
          return { mutedPosts: [...state.mutedPosts, postId] };
        }
      }),
      
      isUserBlocked: (username) => get().blockedUsers.some(u => u.username === username),
      isUserMuted: (username) => get().mutedUsers.some(u => u.username === username),
      isPostMuted: (postId) => get().mutedPosts.includes(postId),
    }),
    {
      name: 'block-mute-storage',
    }
  )
);
