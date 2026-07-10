"use client";

import { useUserStore } from "@/store/useUserStore";
import { useFeedStore } from "@/store/useFeedStore";
import { useFollowStore } from "@/store/useFollowStore";
import { useToastStore } from "@/store/useToastStore";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';
import { useState, useEffect, useRef } from 'react';

const SCREAM_ANIMATION = `
@keyframes scream {
  0% { transform: scale(1); }
  30% { transform: scale(1.7) rotate(-15deg); filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.8)); }
  50% { transform: scale(1.7) rotate(15deg); }
  70% { transform: scale(0.8) rotate(-10deg); }
  90% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}
.animate-scream {
  animation: scream 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
`;

export default function PostCard({ 
  id,
  content, 
  author, 
  earned,
  stats = { likes: 0, reselas: 0, replies: 0, views: 0 },
  userInteractions = { isLiked: false, isReselaed: false },
  quotedPost,
  onDelete,
  onUnlike,
  onUnresela,
  onUnbookmark,
  parentPost,
  isReplyContext,
  isThreadContext,
  reselaedBy,
  mediaType,
  mediaUrl,
  thumbnailUrl
}: { 
  id: number;
  content: string;
  author: { name: string, username: string, avatarUrl?: string, isFollowing?: boolean, isFollower?: boolean };
  earned: number;
  stats?: { likes: number, reselas: number, replies: number, views: number };
  userInteractions?: { isLiked: boolean, isReselaed: boolean, isBookmarked?: boolean };
  quotedPost?: {
    id: number;
    author: { firstName: string, username: string, avatarUrl: string };
    content: string;
  };
  onDelete?: (id: number) => void;
  onUnlike?: (id: number) => void;
  onUnresela?: (id: number) => void;
  onUnbookmark?: (id: number) => void;
  parentPost?: any;
  isReplyContext?: boolean;
  isThreadContext?: boolean;
  reselaedBy?: string;
  mediaType?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
}) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const { openComposer } = useFeedStore();
  const router = useRouter();

  // Optimistic UI State
  const [isLiked, setIsLiked] = useState(userInteractions.isLiked);
  const [likeCount, setLikeCount] = useState(stats.likes);
  
  const [isReselaed, setIsReselaed] = useState(userInteractions.isReselaed);
  const [reselaCount, setReselaCount] = useState(stats.reselas);
  
  const [isBookmarked, setIsBookmarked] = useState(userInteractions.isBookmarked || false);
  const [likeAnim, setLikeAnim] = useState(false);
  const globalFollowState = useFollowStore(s => s.followMap[author.username]);
  const setFollow = useFollowStore(s => s.setFollow);
  const isFollowing = globalFollowState ?? (author.isFollowing || false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const addToast = useToastStore((state) => state.addToast);
  
  const [showReselaMenu, setShowReselaMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [views, setViews] = useState(stats.views);
  const cardRef = useRef<HTMLElement>(null);
  const hasViewedRef = useRef(false);

  // Sync state if props change (e.g. feed re-fetched)
  useEffect(() => {
    setIsLiked(userInteractions.isLiked);
    setLikeCount(stats.likes);
    setIsReselaed(userInteractions.isReselaed);
    setIsBookmarked(userInteractions.isBookmarked || false);
    setReselaCount(stats.reselas);
    setViews(stats.views);
  }, [stats, userInteractions]);

  // Intersection Observer for Views
  useEffect(() => {
    if (!cardRef.current || hasViewedRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !hasViewedRef.current) {
        hasViewedRef.current = true;
        setViews(prev => prev + 1); // Optimistically increment view
        
        // Notify backend quietly
        fetch(`http://localhost:3001/posts/${id}/view`, { method: "POST" })
          .catch(err => console.error("Failed to track view", err));
          
        observer.disconnect();
      }
    }, { threshold: 0.5 }); // Trigger when 50% visible

    observer.observe(cardRef.current);
    
    return () => observer.disconnect();
  }, [id]);

  const handleToggle = async (type: "LIKE" | "RESELA", e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Optimistic Update
    if (type === "LIKE") {
      const newValue = !isLiked;
      setIsLiked(newValue);
      setLikeCount(newValue ? likeCount + 1 : likeCount - 1);
      
      if (newValue) {
        setLikeAnim(true);
        setTimeout(() => setLikeAnim(false), 600); // Animation duration
      } else {
        if (onUnlike) onUnlike(id);
      }
    } else if (type === "RESELA") {
      const newValue = !isReselaed;
      setIsReselaed(newValue);
      setReselaCount(newValue ? reselaCount + 1 : reselaCount - 1);
      
      if (!newValue && onUnresela) {
        onUnresela(id);
      }
    } else if (type === "BOOKMARK") {
      const newValue = !isBookmarked;
      setIsBookmarked(newValue);
      
      if (newValue) {
        addToast("Sela Saved");
      } else {
        addToast("Sela Unsaved");
      }
      
      if (!newValue && onUnbookmark) {
        onUnbookmark(id);
      }
    }

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`http://localhost:3001/posts/${id}/engage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type })
      });
    } catch (err) {
      // Revert on error
      if (type === "LIKE") {
        setIsLiked(isLiked);
        setLikeCount(likeCount);
      } else if (type === "RESELA") {
        setIsReselaed(isReselaed);
        setReselaCount(reselaCount);
      } else if (type === "BOOKMARK") {
        setIsBookmarked(isBookmarked);
      }
    }
  };

  const handleReplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    openComposer('REPLY', { id, author: author.name, content });
  };

  const handleReselaMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    setShowReselaMenu(!showReselaMenu);
  };

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowReselaMenu(false);
    openComposer('QUOTE', { id, author: author.name, content });
  };

  const handleShareMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:3001/posts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete post");
      if (onDelete) onDelete(id);
    } catch (err) {
      console.error(err);
      alert("Failed to delete post. It might have active replies or quotes.");
    } finally {
      setIsDeleting(false);
      setShowOptionsMenu(false);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/@${author.username}/posts/${id}`);
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
      setShowOptionsMenu(false);
    }, 2000);
  };

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`http://localhost:3001/users/${author.username}/follow`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      setFollow(author.username, false);
      setShowOptionsMenu(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (isDeleting) {
    return <article className="border-b border-border p-6 text-center text-muted-foreground animate-pulse">Deleting post...</article>;
  }

  if (parentPost) {
    return (
      <div className="flex flex-col border-b border-border transition-colors relative pt-3 pb-0 px-4 sm:px-6">
        {isReplyContext && (
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] font-medium pl-[44px] mb-1 z-10 relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>You replied</span>
          </div>
        )}

        {reselaedBy && (
          <div className="flex items-center gap-2 text-muted-foreground text-[13px] font-medium pl-[44px] mb-1 z-10 relative">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h13.8"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3.2"/>
            </svg>
            <span onClick={(e) => { e.stopPropagation(); router.push(`/@${reselaedBy}`); }} className="hover:underline hover:text-foreground cursor-pointer">
              {user?.username === reselaedBy ? "You Resela'd" : `${reselaedBy} Resela'd`}
            </span>
          </div>
        )}

        <div className="relative">
          <PostCard
            id={parentPost.id}
            content={parentPost.content}
            author={{
              name: parentPost.author.firstName || parentPost.author.username,
              username: parentPost.author.username,
              avatarUrl: parentPost.author.avatarUrl,
              isFollowing: parentPost.author.isFollowing,
              isFollower: parentPost.author.isFollower
            }}
            stats={parentPost.stats}
            userInteractions={parentPost.userInteractions}
            quotedPost={parentPost.quotedPost}
            isThreadContext={true}
            earned={parentPost.earned || 0}
            mediaType={parentPost.mediaType}
            mediaUrl={parentPost.mediaUrl}
            thumbnailUrl={parentPost.thumbnailUrl}
          />
          {/* Vertical Connecting Line */}
          <div className="absolute top-[48px] left-[20px] bottom-[-10px] w-[2px] bg-[#2F3336] z-0" />
        </div>

        <div className="relative z-10 pt-1">
          <PostCard
             id={id}
             content={content}
             author={author}
             stats={{ likes: likeCount, reselas: reselaCount, replies: stats.replies, views: stats.views }}
             userInteractions={{ isLiked, isReselaed, isBookmarked }}
             quotedPost={quotedPost}
             onDelete={onDelete}
             onUnlike={onUnlike}
             onUnresela={onUnresela}
             onUnbookmark={onUnbookmark}
             isThreadContext={true}
             earned={earned}
             mediaType={mediaType}
             mediaUrl={mediaUrl}
             thumbnailUrl={thumbnailUrl}
          />
        </div>
      </div>
    );
  }

  return (
    <>
    <style>{SCREAM_ANIMATION}</style>
    <article ref={cardRef as any} className={`${isThreadContext ? 'py-2' : 'border-b border-border py-4'} px-0 transition-colors cursor-pointer relative`} onClick={() => router.push(`/@${author.username}/posts/${id}`)}>
      
      {reselaedBy && !parentPost && (
        <div className="flex items-center gap-2 text-muted-foreground text-[13px] font-medium pl-[56px] mb-2 sm:pl-[64px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h13.8"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3.2"/>
          </svg>
          <span onClick={(e) => { e.stopPropagation(); router.push(`/@${reselaedBy}`); }} className="hover:underline hover:text-foreground cursor-pointer">
            {user?.username === reselaedBy ? "You Resela'd" : `${reselaedBy} Resela'd`}
          </span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar */}
        <div 
          className="w-10 h-10 rounded-full bg-muted shrink-0 overflow-hidden mt-0.5 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => { e.stopPropagation(); router.push(`/@${author.username}`); }}
        >
          <img src={author.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${author.username}`} alt={author.name} className="w-full h-full object-cover" />
        </div>
        
        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center">
              <span 
                className="font-bold mr-2 text-[14px] cursor-pointer hover:underline"
                onClick={(e) => { e.stopPropagation(); router.push(`/@${author.username}`); }}
              >
                {author.name}
              </span>
              <span className="text-muted-foreground text-[13px]">2h</span>
            </div>
            {/* Top Right Actions */}
            <div className="flex items-center gap-2 relative">
              {user?.username !== author.username && !isFollowing && (
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    if(!isAuthenticated) return router.push("/login"); 
                    try {
                      const token = localStorage.getItem("access_token");
                      await fetch(`http://localhost:3001/users/${author.username}/follow`, {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${token}` }
                      });
                      setFollow(author.username, true);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="text-primary font-bold text-[11px] px-3 py-1 rounded-full border border-primary/40 hover:bg-primary/10 transition-colors uppercase tracking-wide whitespace-nowrap"
                >
                  {author.isFollower ? "Follow Back" : "Follow"}
                </button>
              )}

              {/* 3-dot Menu (Available to all) */}
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(!showOptionsMenu); }}
                  className="p-1.5 rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                </button>
                
                {showOptionsMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(false); }}></div>
                    <div className="absolute top-8 right-0 z-20 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl p-1.5 min-w-[160px]">
                      
                      {/* Copy Link Option - Common to all */}
                      <button 
                        onClick={handleCopyLink} 
                        className="w-full px-2.5 py-2 hover:bg-accent text-left rounded-lg text-foreground font-medium flex items-center gap-2.5 transition-colors text-[13px]"
                      >
                        {copySuccess ? (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            <span className="text-[#22c55e]">Copied!</span>
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            Copy link
                          </>
                        )}
                      </button>

                      {user?.username === author.username ? (
                        /* Author-only Options */
                        <button 
                          onClick={handleDelete} 
                          className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          Delete
                        </button>
                      ) : (
                        /* Non-Author Options */
                        <>
                          {isFollowing ? (
                            <button 
                              onClick={handleUnfollow} 
                              className="w-full px-2.5 py-2 hover:bg-accent text-left rounded-lg text-foreground font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                              Unfollow @{author.username}
                            </button>
                          ) : (
                            <button 
                              onClick={async (e) => { 
                                e.stopPropagation(); 
                                if(!isAuthenticated) return router.push("/login"); 
                                try {
                                  const token = localStorage.getItem("access_token");
                                  await fetch(`http://localhost:3001/users/${author.username}/follow`, {
                                    method: "POST",
                                    headers: { "Authorization": `Bearer ${token}` }
                                  });
                                  setFollow(author.username, true);
                                  setShowOptionsMenu(false);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="w-full px-2.5 py-2 hover:bg-accent text-left rounded-lg text-foreground font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                              {author.isFollower ? `Follow @${author.username} Back` : `Follow @${author.username}`}
                            </button>
                          )}
                          
                          <div className="h-px bg-white/10 my-1 mx-1"></div>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(false); }} 
                            className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                            Mute
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(false); }} 
                            className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                            Block
                          </button>
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(false); }} 
                            className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            Report
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Body */}
          <div className="text-[14px] leading-relaxed mb-2 text-foreground/90 break-words prose prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {/* Media Content */}
            {mediaUrl && mediaType === 'VIDEO' && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-border bg-black" onClick={(e) => e.stopPropagation()}>
                <video 
                  src={mediaUrl} 
                  poster={thumbnailUrl} 
                  controls 
                  className="w-full max-h-[500px] object-contain"
                  preload="metadata"
                />
              </div>
            )}

            {mediaUrl && mediaType === 'IMAGE' && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
                <img src={mediaUrl} alt="Post media" className="w-full max-h-[500px] object-cover" />
              </div>
            )}
            
            {quotedPost && (
              <div 
                className="mt-4 border border-border rounded-xl p-4 bg-background hover:bg-accent/30 transition-colors cursor-pointer"
                onClick={(e) => { e.stopPropagation(); router.push(`/${quotedPost.author.username}/posts/${quotedPost.id}`); }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-muted">
                    <img src={quotedPost.author.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${quotedPost.author.username}`} alt={quotedPost.author.firstName || quotedPost.author.username} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-bold text-[14px]">{quotedPost.author.firstName || quotedPost.author.username}</span>
                  <span className="text-muted-foreground text-[13px]">· 5h</span>
                </div>
                <div className="text-[14px] text-foreground/90 prose prose-invert max-w-none">
                  <ReactMarkdown>{quotedPost.content}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>

          {/* Engagement Bar */}
          <div className="flex items-center gap-8 text-muted-foreground text-[13px] mt-1">
            
            {/* 1. Heart (Like) */}
            <button 
              onClick={(e) => handleToggle("LIKE", e)} 
              className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-red-500/10 -ml-1.5 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-all ${likeAnim ? 'animate-scream text-red-500' : 'scale-100'} group-active:scale-90`}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <span className="">{likeCount}</span>
            </button>

            {/* 2. Comment / Reply */}
            <button onClick={handleReplyClick} className="flex items-center gap-2 hover:text-blue-500 transition-colors group">
              <div className="p-1.5 rounded-full group-hover:bg-blue-500/10 -ml-1.5 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <span className="">{stats.replies}</span>
            </button>

            {/* 3. Resela */}
            <div className="relative">
              <button 
                onClick={handleReselaMenuClick} 
                className={`flex items-center gap-2 transition-colors group ${isReselaed ? 'text-green-500' : 'hover:text-green-500'}`} 
                title="Resela (Repost)"
              >
                <div className="p-1.5 rounded-full group-hover:bg-green-500/10 -ml-1.5 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-active:scale-90 opacity-70 group-hover:opacity-100">
                    <path d="M17 2.1l4 4-4 4"/>
                    <path d="M3 12.2v-2a4 4 0 0 1 4-4h13.8"/>
                    <path d="M7 21.9l-4-4 4-4"/>
                    <path d="M21 11.8v2a4 4 0 0 1-4 4H3.2"/>
                  </svg>
                </div>
                <span className="">{reselaCount}</span>
              </button>
              
              {/* Resela Dropdown Menu */}
              {showReselaMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowReselaMenu(false); }}></div>
                  <div className="absolute top-10 left-0 z-20 bg-[#18181b] border border-gray-700 rounded-xl shadow-2xl p-2 flex flex-col min-w-[160px]">
                    <button 
                      onClick={(e) => { setShowReselaMenu(false); handleToggle("RESELA", e); }} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.2v-2a4 4 0 0 1 4-4h13.8"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.8v2a4 4 0 0 1-4 4H3.2"/></svg>
                      {isReselaed ? 'Undo Resela' : 'Resela'}
                    </button>
                    <button 
                      onClick={handleQuoteClick} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      Resela with note
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* 4. Impressions */}
            <button className="flex items-center gap-2 hover:text-primary transition-colors group" title="Post Impressions">
              <div className="p-1.5 rounded-full group-hover:bg-primary/10 -ml-1.5 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <span className="">{views}</span>
            </button>

            <div className="flex gap-0 ml-auto">
              {/* 5. Bookmark */}
              <button 
                onClick={(e) => handleToggle("BOOKMARK", e)} 
                className={`flex items-center transition-colors group mr-2 ${isBookmarked ? 'text-primary' : 'hover:text-primary'}`} 
                title="Bookmark"
              >
                <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-transform group-active:scale-90">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
              </button>

              {/* 6. Share */}
              <div className="relative">
                <button onClick={handleShareMenuClick} className="flex items-center transition-colors group" title="Share">
                  <div className="p-1.5 rounded-full group-hover:bg-accent transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-transform group-active:scale-90"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
                  </div>
                </button>
              
              {/* Share Dropdown Menu */}
              {showShareMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowShareMenu(false); }}></div>
                  <div className="absolute bottom-full right-0 mb-2 z-20 bg-[#18181b] border border-gray-700 rounded-xl shadow-2xl p-2 flex flex-col min-w-[220px]">
                    <button 
                      onClick={handleCopyLink} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                    >
                      {copySuccess ? (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                          <span className="text-[#22c55e]">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                          Copy link
                        </>
                      )}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this post by ${author.name}`)}&url=${encodeURIComponent(`${window.location.origin}/@${author.username}/posts/${id}`)}`, '_blank'); setShowShareMenu(false); }} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Share to X
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this post by ${author.name}: ${window.location.origin}/@${author.username}/posts/${id}`)}`, '_blank'); setShowShareMenu(false); }} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Share to WhatsApp
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}/@${author.username}/posts/${id}`)}&text=${encodeURIComponent(`Check out this post by ${author.name}`)}`, '_blank'); setShowShareMenu(false); }} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
                      Share to Telegram
                    </button>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/@${author.username}/posts/${id}`)}`, '_blank'); setShowShareMenu(false); }} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Share to Facebook
                    </button>

                    <button 
                      onClick={(e) => { e.stopPropagation(); window.open(`https://snapchat.com/scan?attachmentUrl=${encodeURIComponent(`${window.location.origin}/@${author.username}/posts/${id}`)}`, '_blank'); setShowShareMenu(false); }} 
                      className="p-3 hover:bg-gray-800 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.115 0c.237 0 .528.016.877.05 1.854.195 3.582 1.064 4.836 2.435 1.166 1.272 1.884 2.977 1.884 4.779 0 1.65-.506 3.04-1.482 4.183-.061.07-.061.141-.02.222.446.84 1.259 1.503 2.43 1.977.514.208 1.08.396 1.685.556.463.125.596.347.404.75a1.5 1.5 0 0 1-.958.851c-1.396.398-2.879.519-4.437.358-.252-.027-.372.072-.372.292 0 .151.111.282.272.323.746.191 1.472.364 2.179.504 1.554.318 2.503.983 2.825 1.98.203.625.172 1.242-.08 1.857-.132.317-.363.636-.677.933a6.666 6.666 0 0 1-2.975 1.677c-1.553.44-3.287.656-5.205.656-2.037 0-3.913-.238-5.638-.707a7.585 7.585 0 0 1-3.126-1.798c-.283-.277-.484-.564-.606-.864-.213-.52-.222-1.046-.03-1.58.293-.817 1.16-1.39 2.583-1.716.676-.153 1.382-.323 2.128-.504.172-.04.283-.182.283-.334.01-.191-.081-.282-.272-.292a21.196 21.196 0 0 1-4.256-.384 1.492 1.492 0 0 1-.908-.822c-.161-.363-.05-.565.323-.681.666-.208 1.27-.419 1.825-.634 1.12-.436 1.876-1.052 2.29-1.848.05-.08.06-.151.01-.222-.97-1.139-1.463-2.511-1.463-4.143 0-1.787.706-3.481 1.855-4.737C7.771 1.066 9.486-.008 11.23-.008h.885z"/>
                      </svg>
                      Share to Snapchat
                    </button>
                  </div>
                </>
              )}
            </div>
            </div>

          </div>
        </div>
      </div>
    </article>
    </>
  );
}
