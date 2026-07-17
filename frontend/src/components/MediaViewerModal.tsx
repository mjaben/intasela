"use client";

import { useEffect } from "react";
import { useMediaViewerStore } from "@/store/useMediaViewerStore";
import PostCard from "./PostCard";

export default function MediaViewerModal() {
  const { isOpen, post, currentIndex, mediaUrls, mediaType, closeViewer, next, prev } = useMediaViewerStore();

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
            className="absolute right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        )}
      </div>

      {/* Right Area - Post Context (hidden on mobile by default) */}
      <div className="w-full md:w-[350px] lg:w-[400px] h-full bg-background border-l border-border hidden md:flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-border sticky top-0 bg-background/90 backdrop-blur z-10">
          <h2 className="font-bold text-lg">Post</h2>
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
          />
        </div>
      </div>
    </div>
  );
}
