import { create } from 'zustand';

interface PostInteraction {
  isLiked: boolean;
  likeCount: number;
  isBookmarked: boolean;
}

interface FeedState {
  interactions: Record<number, PostInteraction>;
  composerState: {
    isOpen: boolean;
    mode: 'CREATE' | 'REPLY' | 'QUOTE';
    targetPost?: {
      id: number;
      author: string;
      content: string;
      avatarUrl?: string;
    };
  };
  openComposer: (mode: 'CREATE' | 'REPLY' | 'QUOTE', targetPost?: any) => void;
  closeComposer: () => void;
  toggleLike: (postId: number) => void;
  toggleBookmark: (postId: number) => void;
  initPost: (postId: number, initialLikeCount: number) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  interactions: {},
  composerState: {
    isOpen: false,
    mode: 'CREATE'
  },
  
  openComposer: (mode, targetPost) => set({
    composerState: { isOpen: true, mode, targetPost }
  }),
  
  closeComposer: () => set({
    composerState: { isOpen: false, mode: 'CREATE', targetPost: undefined }
  }),
  
  initPost: (postId, initialLikeCount) => set((state) => ({
    interactions: {
      ...state.interactions,
      [postId]: state.interactions[postId] || {
        isLiked: false,
        likeCount: initialLikeCount,
        isBookmarked: false,
      }
    }
  })),

  toggleLike: (postId) => set((state) => {
    const post = state.interactions[postId];
    if (!post) return state;

    return {
      interactions: {
        ...state.interactions,
        [postId]: {
          ...post,
          isLiked: !post.isLiked,
          likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1
        }
      }
    };
  }),

  toggleBookmark: (postId) => set((state) => {
    const post = state.interactions[postId];
    if (!post) return state;

    return {
      interactions: {
        ...state.interactions,
        [postId]: {
          ...post,
          isBookmarked: !post.isBookmarked
        }
      }
    };
  })
}));
