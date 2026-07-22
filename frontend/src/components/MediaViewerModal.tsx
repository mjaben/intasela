"use client";

import { useEffect } from "react";
import { useMediaViewerStore } from "@/store/useMediaViewerStore";
import { useFeedStore } from "@/store/useFeedStore";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import PostCard from "./PostCard";

export default function MediaViewerModal() {
  const { isOpen, post, currentIndex, mediaUrls, mediaType, closeViewer, next, prev } = useMediaViewerStore();
  const { openComposer } = useFeedStore();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const router = useRouter();

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isReselaed, setIsReselaed] = useState(false);
  const [reselaCount, setReselaCount] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (post) {
      setIsLiked(post.userInteractions?.isLiked || false);
      setLikeCount(post.stats?.likes || 0);
      setIsReselaed(post.userInteractions?.isReselaed || false);
      setReselaCount(post.stats?.reselas || 0);
      setIsBookmarked(post.userInteractions?.isBookmarked || false);
    }
  }, [post]);

  const handleToggle = async (type: "LIKE" | "RESELA" | "BOOKMARK") => {
    if (!isAuthenticated) return router.push('/login');
    
    if (type === "LIKE") {
      setIsLiked(!isLiked);
      setLikeCount(!isLiked ? likeCount + 1 : Math.max(0, likeCount - 1));
    } else if (type === "RESELA") {
      setIsReselaed(!isReselaed);
      setReselaCount(!isReselaed ? reselaCount + 1 : Math.max(0, reselaCount - 1));
    } else if (type === "BOOKMARK") {
      setIsBookmarked(!isBookmarked);
    }

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${post.id}/engage`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ type })
      });
    } catch (err) {
      console.error("Engagement failed", err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Intasela",
        text: "Check out this post on Intasela!",
        url: window.location.origin + `/@${post?.author?.username}/posts/${post?.id}`,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(window.location.origin + `/@${post?.author?.username}/posts/${post?.id}`);
      alert("Link copied to clipboard!");
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && currentIndex < mediaUrls.length - 1) {
      next();
    }
    if (isRightSwipe && currentIndex > 0) {
      prev();
    }
  };

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
    <div className="fixed inset-0 z-50 flex bg-black">
      {/* Left Area - Media */}
      <div className="flex-1 relative flex items-center justify-center h-full">
        {/* Top Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center">
          <button 
            onClick={closeViewer}
            className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>

          <button 
            className="p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
          </button>
        </div>

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
        <div 
          className="w-full h-full p-4 flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEndHandler}
        >
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

        {/* Carousel Dots */}
        {mediaUrls && mediaUrls.length > 1 && (
          <div className="absolute bottom-[140px] left-0 right-0 z-20 flex justify-center gap-1.5 md:hidden">
            {mediaUrls.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}

        {/* Mobile Bottom Bar (X Style) */}
        <div className="absolute bottom-0 left-0 right-0 z-20 md:hidden bg-black pb-[env(safe-area-inset-bottom,20px)] px-4 flex flex-col gap-4 pt-4 border-t border-white/10">
          
          {/* Action Pills */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => { if(!isAuthenticated) router.push('/login'); openComposer('REPLY', { id: post.id, author: post.author?.firstName || post.author?.username, content: post.content }); }} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-full py-2.5 text-white/90">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span className="text-[13px] font-medium">{post.stats?.replies || 0}</span>
            </button>
            <button onClick={() => handleToggle("RESELA")} className={`flex-1 flex items-center justify-center gap-2 transition-colors rounded-full py-2.5 ${isReselaed ? 'bg-green-500/20 text-green-500' : 'bg-white/10 hover:bg-white/20 text-white/90'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h13.8"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3.2"/></svg>
              <span className="text-[13px] font-medium">{reselaCount}</span>
            </button>
            <button onClick={() => handleToggle("LIKE")} className={`flex-1 flex items-center justify-center gap-2 transition-colors rounded-full py-2.5 ${isLiked ? 'bg-red-500/20 text-red-500' : 'bg-white/10 hover:bg-white/20 text-white/90'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              <span className="text-[13px] font-medium">{likeCount}</span>
            </button>
            <button onClick={() => handleToggle("BOOKMARK")} className={`flex shrink-0 items-center justify-center transition-colors rounded-full w-[42px] h-[42px] ${isBookmarked ? 'bg-primary/20 text-primary' : 'bg-white/10 hover:bg-white/20 text-white/90'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button onClick={handleShare} className="flex shrink-0 items-center justify-center bg-white/10 hover:bg-white/20 transition-colors rounded-full w-[42px] h-[42px] text-white/90">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            </button>
          </div>

          {/* Reply Input Pill */}
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
            className="w-full flex items-center px-4 py-3 rounded-full bg-white/10 hover:bg-white/15 transition-colors cursor-text mb-2"
          >
            <div className="flex-1 text-white/50 text-[15px] font-medium">
              Post your reply
            </div>
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
