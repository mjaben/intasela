import { create } from 'zustand';

interface PostInteraction {
  isLiked: boolean;
  likeCount: number;
  isBookmarked: boolean;
}

interface FeedState {
  interactions: Record<number, PostInteraction>;
  toggleLike: (postId: number) => void;
  toggleBookmark: (postId: number) => void;
  initPost: (postId: number, initialLikeCount: number) => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  interactions: {},
  
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
