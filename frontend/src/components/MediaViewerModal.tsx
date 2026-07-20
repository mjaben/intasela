"use client";

import { useEffect } from "react";
import { useMediaViewerStore } from "@/store/useMediaViewerStore";
import { useFeedStore } from "@/store/useFeedStore";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import PostCard from "./PostCard";

export default function MediaViewerModal() {
  const { isOpen, post, currentIndex, mediaUrls, mediaType, closeViewer, next, prev } = useMediaViewerStore();
  const { openComposer } = useFeedStore();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") closeViewer();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, next, prev, closeViewer]);

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/95 backdrop-blur-sm">
      {/* Left Area - Media */}
      <div className="flex-1 relative flex items-center justify-center h-full">
        {/* Close Button */}
        <button 
          onClick={closeViewer}
          className="absolute top-4 left-4 z-10 p-2.5 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>

        {/* Previous Button */}
        {currentIndex > 0 && (
          <button 
            onClick={prev}
            className="absolute left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}

        {/* Media Content */}
        <div className="w-full h-full p-4 flex items-center justify-center">
          {mediaType === "VIDEO" ? (
            <video 
              src={mediaUrls[0]} 
              controls 
              autoPlay
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <img 
              src={mediaUrls[currentIndex]} 
              alt="Media" 
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Next Button */}
        {currentIndex < mediaUrls.length - 1 && (
          <button 
            onClick={next}
            className="absolute right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors hidden md:block"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}

        {/* Mobile Bottom Engagement Overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-20 md:hidden bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-10 pb-[env(safe-area-inset-bottom,20px)] px-4 flex flex-col gap-3">
          
          <div className="flex items-center justify-around text-white/90">
            <button className="flex items-center gap-1 hover:text-white" onClick={() => { if(!isAuthenticated) router.push('/login'); openComposer('REPLY', { id: post.id, author: post.author?.firstName || post.author?.username, content: post.content }); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span className="text-sm">{post.stats?.replies || 0}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h13.8"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3.2"/></svg>
              <span className="text-sm">{post.stats?.reselas || 0}</span>
            </button>
            <button className="flex items-center gap-1 hover:text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span className="text-sm">{post.stats?.likes || 0}</span>
            </button>
          </div>

          <div 
            onClick={() => {
              if (!isAuthenticated) return router.push('/login');
              closeViewer();
              openComposer('REPLY', { 
                id: post.id, 
                author: post.author?.firstName || post.author?.username, 
                content: post.content 
              });
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-full border border-white/20 bg-black/40 backdrop-blur-md cursor-text"
          >
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
              {user ? (
                <img src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-full h-full text-gray-500 bg-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              )}
            </div>
            <div className="flex-1 text-white/70 text-[14px]">
              Post your reply
            </div>
            <button className="bg-brand text-black px-4 py-1.5 rounded-full text-sm font-bold opacity-50">
              Reply
            </button>
          </div>

        </div>
      </div>

      {/* Right Area - Post Context (hidden on mobile by default) */}
      <div className="w-full md:w-[350px] lg:w-[400px] h-full bg-background border-l border-border hidden md:flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-border sticky top-0 bg-background/90 backdrop-blur z-10">
          <h2 className="font-bold text-lg">Sela</h2>
        </div>
        <div className="p-0">
          <PostCard 
            id={post.id}
            author={{
              name: post.author?.firstName || post.author?.username,
              username: post.author?.username,
              avatarUrl: post.author?.avatarUrl,
              isFollowing: post.author?.isFollowing,
              isFollower: post.author?.isFollower
            }}
            content={post.content} 
            earned={post.earned || 0}
            stats={post.stats}
            userInteractions={post.userInteractions}
            quotedPost={post.quotedPost}
            mediaType={post.mediaType}
            mediaUrl={post.mediaUrl}
            mediaUrls={post.mediaUrls}
            thumbnailUrl={post.thumbnailUrl}
            space={post.space}
            hideMedia={true}
            createdAt={post.createdAt}
          />
        </div>
      </div>
    </div>
  );
}
