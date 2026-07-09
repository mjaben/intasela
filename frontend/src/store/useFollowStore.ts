import { create } from 'zustand';

interface FollowState {
  followMap: Record<string, boolean>;
  followingChangeCount: number;
  setFollow: (username: string, isFollowing: boolean) => void;
}

export const useFollowStore = create<FollowState>((set) => ({
  followMap: {},
  followingChangeCount: 0,
  setFollow: (username, isFollowing) => set((state) => {
    const currentState = state.followMap[username];
    let diff = 0;
    if (isFollowing && currentState !== true) diff = 1;
    if (!isFollowing && currentState !== false) diff = -1;

    return {
      followMap: { ...state.followMap, [username]: isFollowing },
      followingChangeCount: state.followingChangeCount + diff
    };
  }),
}));
