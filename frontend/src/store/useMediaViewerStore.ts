import { create } from 'zustand';

interface MediaViewerState {
  isOpen: boolean;
  post: any | null;
  currentIndex: number;
  mediaUrls: string[];
  mediaType: string;
  openViewer: (post: any, index: number) => void;
  closeViewer: () => void;
  next: () => void;
  prev: () => void;
}

export const useMediaViewerStore = create<MediaViewerState>((set) => ({
  isOpen: false,
  post: null,
  currentIndex: 0,
  mediaUrls: [],
  mediaType: 'IMAGE',
  openViewer: (post, index) => {
    const urls = post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls : (post.mediaUrl ? [post.mediaUrl] : []);
    set({
      isOpen: true,
      post,
      currentIndex: index,
      mediaUrls: urls,
      mediaType: post.mediaType || 'IMAGE',
    });
  },
  closeViewer: () => set({ isOpen: false, post: null, currentIndex: 0, mediaUrls: [] }),
  next: () => set((state) => ({
    currentIndex: state.currentIndex < state.mediaUrls.length - 1 ? state.currentIndex + 1 : state.currentIndex
  })),
  prev: () => set((state) => ({
    currentIndex: state.currentIndex > 0 ? state.currentIndex - 1 : 0
  })),
}));
