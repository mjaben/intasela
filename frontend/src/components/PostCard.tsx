"use client";

import { useUserStore } from "@/store/useUserStore";
import { useFeedStore } from "@/store/useFeedStore";
import { useFollowStore } from "@/store/useFollowStore";
import { useToastStore } from "@/store/useToastStore";
import { useBlockMuteStore } from "@/store/useBlockMuteStore";
import { useSystemSettingsStore } from "@/store/useSystemSettingsStore";
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
  thumbnailUrl,
  isBoosted
}: { 
  id: number;
  content: string;
  author: { name: string, username: string, avatarUrl?: string, isFollowing?: boolean, isFollower?: boolean };
  earned: number;
  stats?: { likes: number, reselas: number, replies: number, views: number, bookmarks?: number };
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
  isBoosted?: boolean;
}) {
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const user = useUserStore((state) => state.user);
  const { openComposer } = useFeedStore();
  const businessAdsEnabled = useSystemSettingsStore((state) => state.businessAdsEnabled);
  const router = useRouter();

  // Optimistic UI State
  const [isLiked, setIsLiked] = useState(userInteractions.isLiked);
  const [likeCount, setLikeCount] = useState(stats.likes);
  
  const [isReselaed, setIsReselaed] = useState(userInteractions.isReselaed);
  const [reselaCount, setReselaCount] = useState(stats.reselas);
  
  const [isBookmarked, setIsBookmarked] = useState(userInteractions.isBookmarked || false);
  const [bookmarkCount, setBookmarkCount] = useState(stats.bookmarks || 0);
  const [likeAnim, setLikeAnim] = useState(false);
  const globalFollowState = useFollowStore(s => s.followMap[author.username]);
  const setFollow = useFollowStore(s => s.setFollow);
  const isFollowing = globalFollowState ?? (author.isFollowing || false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const isUserBlocked = useBlockMuteStore(s => s.isUserBlocked(author.username));
  const isUserMuted = useBlockMuteStore(s => s.isUserMuted(author.username));
  const isPostMuted = useBlockMuteStore(s => s.isPostMuted(String(id)));
  const toggleBlockUser = useBlockMuteStore(s => s.toggleBlockUser);
  const toggleMuteUser = useBlockMuteStore(s => s.toggleMuteUser);
  const toggleMutePost = useBlockMuteStore(s => s.toggleMutePost);

  const addToast = useToastStore((state) => state.addToast);
  
  const [showReselaMenu, setShowReselaMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState("");
  
  const [views, setViews] = useState(stats.views);
  const cardRef = useRef<HTMLElement>(null);
  const hasViewedRef = useRef(false);

  // Sync state if props change (e.g. feed re-fetched)
  useEffect(() => {
    setIsLiked(userInteractions.isLiked);
    setLikeCount(stats.likes);
    setIsReselaed(userInteractions.isReselaed);
    setIsBookmarked(userInteractions.isBookmarked || false);
    setBookmarkCount(stats.bookmarks || 0);
    setReselaCount(stats.reselas);
    setViews(stats.views);
  }, [stats, userInteractions]);

  // Intersection Observer for Views
  useEffect(() => {
    if (!cardRef.current || hasViewedRef.current) return;

    // Prevent author from viewing their own post and inflating metrics
    if (user?.username === author.username) {
      hasViewedRef.current = true;
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !hasViewedRef.current) {
        hasViewedRef.current = true;
        setViews(prev => prev + 1); // Optimistically increment view
        
        // Notify backend quietly
        const token = localStorage.getItem("access_token");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${id}/view`, { method: "POST", headers })
          .catch(err => console.error("Failed to track view", err));
          
        observer.disconnect();
      }
    }, { threshold: 0.5 }); // Trigger when 50% visible

    observer.observe(cardRef.current);
    
    return () => observer.disconnect();
  }, [id, user?.username, author.username]);

  const handleToggle = async (type: "LIKE" | "RESELA" | "BOOKMARK", e: React.MouseEvent) => {
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
      setBookmarkCount(newValue ? bookmarkCount + 1 : bookmarkCount - 1);
      
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
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${id}/engage`, {
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
        setBookmarkCount(bookmarkCount);
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${id}`, {
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

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    toggleMuteUser({ username: author.username, name: author.name, avatarUrl: author.avatarUrl });
    addToast(isUserMuted ? `Unmuted @${author.username}` : `Muted @${author.username}`, "success");
    setShowOptionsMenu(false);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    toggleBlockUser({ username: author.username, name: author.name, avatarUrl: author.avatarUrl });
    addToast(isUserBlocked ? `Unblocked @${author.username}` : `Blocked @${author.username}`, "success");
    setShowOptionsMenu(false);
  };

  const handleMutePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    toggleMutePost(String(id));
    addToast(isPostMuted ? `Unmuted post notifications` : `Muted post notifications`, "success");
    setShowOptionsMenu(false);
  };

  const handleReportClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    setShowOptionsMenu(false);
    setShowReportModal(true);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportReason) return;
    
    // In a real app, send report to backend
    addToast("Report submitted successfully", "success");
    setShowReportModal(false);
    setSelectedReportReason("");
  };

  const handleUnfollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${author.username}/follow`, {
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
    <article ref={cardRef as any} className={`${isThreadContext ? 'py-2' : 'border-b border-border py-4'} px-4 transition-colors cursor-pointer relative`} onClick={() => router.push(`/@${author.username}/posts/${id}`)}>
      
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
            <div className="flex flex-col items-end gap-1 relative">
              {isBoosted && (
                <span className="text-[7.5px] uppercase font-medium text-muted-foreground tracking-widest bg-muted px-1 py-0.5 rounded absolute -top-3 right-0">
                  Boosted
                </span>
              )}
              <div className="flex items-center gap-2">
                {user?.username !== author.username && !isFollowing && (
                <button 
                  onClick={async (e) => { 
                    e.stopPropagation(); 
                    if(!isAuthenticated) return router.push("/login"); 
                    try {
                      const token = localStorage.getItem("access_token");
                      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${author.username}/follow`, {
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
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          {businessAdsEnabled && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowOptionsMenu(false);
                                router.push(`/ads/campaigns/new?postId=${id}`);
                              }}
                              className="w-full px-2.5 py-2 hover:bg-brand/10 text-left rounded-lg text-brand font-medium flex items-center gap-2.5 transition-colors text-[13px]"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                              Boost Post
                            </button>
                          )}
                          <button 
                            onClick={handleDelete} 
                            className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Delete
                          </button>
                        </div>
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
                                  await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${author.username}/follow`, {
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
                            onClick={handleMute} 
                            className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px]"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                            {isUserMuted ? `Unmute @${author.username}` : `Mute @${author.username}`}
                          </button>
                          
                          <button 
                            onClick={handleBlock} 
                            className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                            {isUserBlocked ? `Unblock @${author.username}` : `Block @${author.username}`}
                          </button>

                          <button 
                            onClick={handleMutePost} 
                            className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>
                            {isPostMuted ? `Unmute this post` : `Mute this post`}
                          </button>
                          
                          <button 
                            onClick={handleReportClick} 
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
          </div>
          
          {/* Body */}
          <div className="text-[14px] leading-relaxed mb-2 text-foreground/90 break-words prose prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
            
            {/* Media Content */}
            {mediaUrl && mediaType === 'VIDEO' && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
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
          <div className="flex items-center gap-3 sm:gap-6 text-muted-foreground text-[13px] mt-1 pr-1 sm:pr-2">
            
            {/* 1. Heart (Like) */}
            <button 
              onClick={(e) => handleToggle("LIKE", e)} 
              className={`flex items-center gap-2 transition-colors group ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
            >
              <div className="p-1.5 rounded-full group-hover:bg-red-500/10 -ml-1.5 transition-colors">
                <div 
                  className={`w-[18px] h-[18px] transition-all group-active:scale-90 ${likeAnim ? 'animate-scream' : 'scale-100'} ${isLiked ? 'bg-red-500' : 'bg-current'}`}
                  style={{
                    WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADZUlEQVR4nO3ae4hVVRTH8c+de+/MbZz3ODNRgfmYUuk1YZFWY6WRgTVSQdCDgbAgih5/RNEfGhmJPSYpEgzKMiiC6g+tiMyUnpY1jCViPgqkbJwps/qjMYIbB7ZQ5uSM93HuHfrC5cJm77XPOmeftX9r7cP/SGAGbsP9uAVnhfaRcBIuxVxMFgMJ3IAd+Bor8DBWYXdouwkVRxibRDc+x35swLv4DnvxFKYXw4lGvIHNmDNMn4uwCe+g5W/tZ4Rx7+PyIzg6CYuDU89gXKGcqEMfliN9lL7RnX8I32ICbsdPuHGE86zEV2hVgOX0NnpGOe5OHMAWtI9y7GJ8hCp55NqwrqM7PVq6UH+M876Fu+TxaezCTMXnVOzL11OJQuw28bEhhOiceRBLxMciPJIPQy/hOvFxJV7Nh6GNmC0+ZoW9J2d60SE+ZoSImTORhLhEfMwPaiJnXo75HVkSVELO3IsnxMeXOD8fhi4M70kczA572EhTg/8kEoj9mKr4vIeF+TT4GB5XXK4KyyqVT6Mn42ccrzicGDRWQfavJ/GcwpMM+urRQk3QFNLRKM8uJA/gY1QWcpIr8ANOKJD97pDqFsr+P1iKT1FbgB28H6cpElHR4DV8gJo82ewML/e5ikxlSEM35qHacVkoTMSm5zLhyWzKYU1fjYFQQoqVZNBhe0PeMBpuxfc4WwlxDQZx9zAVxsOd7wkFjdGWiIpCdFFfhCAwZZg+DVgbNFSzEiaFe/BjyLOjquEhOkJteMUIKpUlQXUikehtbGwYrKqq+iWVqrgjqtQnk8nfm5ub3lQuJBKJ1Z2ds/bs3tmXXbvmlezM8875beLECb+++MLKbE3NuINFFJ45Ma+xsWFg29bPst/s2vKv380Lu7Ntba15Ke0UlHQ6/cmCrvl/dHScOTjn4s7+wx3p6/0wW1dbOxSOGEqWikQiMVRZmYoi16rp06ZuP+TA8p6l2fHNTQdbW1sO1NfXDWUymShqlTQt4b/rlPYpO9avW5Ntb5/8Z3197f5MJhPpqWlYELK/sqAtnU4PVFdX70smk5tDSC575mLrMZ6tlBzRadfzY8GZBqzHMmVOBVbjaWXOs1iH45QxF2BnuTsRcTr2lIvGOhr3YXv4/qTsWRS+XxlvDLAMrxsDpHB93BehlPkLRtzTRcJTeY0AAAAASUVORK5CYII=)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADZUlEQVR4nO3ae4hVVRTH8c+de+/MbZz3ODNRgfmYUuk1YZFWY6WRgTVSQdCDgbAgih5/RNEfGhmJPSYpEgzKMiiC6g+tiMyUnpY1jCViPgqkbJwps/qjMYIbB7ZQ5uSM93HuHfrC5cJm77XPOmeftX9r7cP/SGAGbsP9uAVnhfaRcBIuxVxMFgMJ3IAd+Bor8DBWYXdouwkVRxibRDc+x35swLv4DnvxFKYXw4lGvIHNmDNMn4uwCe+g5W/tZ4Rx7+PyIzg6CYuDU89gXKGcqEMfliN9lL7RnX8I32ICbsdPuHGE86zEV2hVgOX0NnpGOe5OHMAWtI9y7GJ8hCp55NqwrqM7PVq6UH+M876Fu+TxaezCTMXnVOzL11OJQuw28bEhhOiceRBLxMciPJIPQy/hOvFxJV7Nh6GNmC0+ZoW9J2d60SE+ZoSImTORhLhEfMwPaiJnXo75HVkSVELO3IsnxMeXOD8fhi4M70kczA572EhTg/8kEoj9mKr4vIeF+TT4GB5XXK4KyyqVT6Mn42ccrzicGDRWQfavJ/GcwpMM+urRQk3QFNLRKM8uJA/gY1QWcpIr8ANOKJD97pDqFsr+P1iKT1FbgB28H6cpElHR4DV8gJo82ewML/e5ikxlSEM35qHacVkoTMSm5zLhyWzKYU1fjYFQQoqVZNBhe0PeMBpuxfc4WwlxDQZx9zAVxsOd7wkFjdGWiIpCdFFfhCAwZZg+DVgbNFSzEiaFe/BjyLOjquEhOkJteMUIKpUlQXUikehtbGwYrKqq+iWVqrgjqtQnk8nfm5ub3lQuJBKJ1Z2ds/bs3tmXXbvmlezM8875beLECb+++MLKbE3NuINFFJ45Ma+xsWFg29bPst/s2vKv380Lu7Ntba15Ke0UlHQ6/cmCrvl/dHScOTjn4s7+wx3p6/0wW1dbOxSOGEqWikQiMVRZmYoi16rp06ZuP+TA8p6l2fHNTQdbW1sO1NfXDWUymShqlTQt4b/rlPYpO9avW5Ntb5/8Z3197f5MJhPpqWlYELK/sqAtnU4PVFdX70smk5tDSC575mLrMZ6tlBzRadfzY8GZBqzHMmVOBVbjaWXOs1iH45QxF2BnuTsRcTr2lIvGOhr3YXv4/qTsWRS+XxlvDLAMrxsDpHB93BehlPkLRtzTRcJTeY0AAAAASUVORK5CYII=)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
              </div>
              <span className="">{likeCount}</span>
            </button>

            {/* 2. Comment / Reply */}
            <button onClick={handleReplyClick} className="flex items-center gap-2 hover:text-brand transition-colors group">
              <div className="p-1.5 rounded-full group-hover:bg-brand/10 -ml-1.5 transition-colors">
                <div 
                  className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100 transition-opacity bg-current"
                  style={{
                    WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADh0lEQVR4nO3Ze4inUxzH8dfuGLus2qzrbmMtxcS65bpbbsuuW2E3/CGS61JbaFxWJKuEtca6RRapdSv+4A/l9geNP+S2YluXGCyLRSktalPo1Ef9mmKfZ+Y383vUvOvUNHOec84z5zyf7/f7OYwzzv+WbvTgIOyJ3bGNhjMBc3EdXsD32Ixv8B4G8RV+w+d4HldjlobQgxuz0A/Qj4WYkZcbSvndTJyB+/Oib+McTOzA+u2IlfgJ9+b4DIcunIwX8REWGUMuwY+4Gzu1cdzjsAarMdUosj2ezZnfexQFoh9foHc0Jihnfl2O09ZGn4URh4PbOWiRzc9wjbHlJPyA2e0YbLvsxBU6wyJ8gmkjHehJPKKz3IyX/0XOK3Eu3sdknaUb7+LC4Ty8Lb7GHM1gX2xI/KrF9Xhas7gT99V5oKQK63FAxf6TE2NmRfsPwbE4EWcl/Vic1oelycluTytxo0rM2AEb6wThBQl6VV+66P3P+BIf5zy/hpfwTATjobS7Wl5gadqVmF5xvnuwrOqLlNzpWs1kv2TPlXgHR2omXfi9ipJ2p+MUzWVdlWi/czLbJvNclXS/t84Z7BAP4rIqH1PZujpMivzOSG2+fyT4cMxvaQsix63t4tQ3u9SY77ao3X8yPVptGPL7bUreDyPBpYR9taW9EjlubQ9HlmfXmLPEoFu31KnUGn90qn6uSDEtVlTpODha1VmbWIabqnR8ChdoLitwVZWOl+NRzeUJnFel426xecaiNh8Oa3Bo1c5v4NQag09NWTwWKcqvdeZaHFtzS0yM7Bb53YQ/8/P6xKO3hkjwSHO4o1K11gpypSI7sOZEExIcexIci51zREtQHKnx1l9VsVrpiyHXFLqz0yVzqMUpcdWH7V60mfNzPGuxB77DMZrBJHyaEroyRRHWYonmcEfdYz4x+X5J5prC/AhPMR8qsxwDDQqGc+L/1pLtJblsGbHP2sad2IgT6tr4Gxpyp7dVrvPKeo6u8+Dc1Omlqus08yI0xRPbte7Da3OReSn2MvYUgSlmwuu5hzl9uAMVC/JsPJbtLOb144ns85JytJspqeEfSNAdwJlJCttGb/zalZlgU+70ynavwg25cihKsk9yqmlDMtJ/cq6ZybVOS4m6KvX8L7FV+8byu+zKYo/HRbglfu5AFjWY/2pZ3F9pm5MFl7+9mdi0PK7JYfmgxxlnHKPP3/f5ueKem89DAAAAAElFTkSuQmCC)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADh0lEQVR4nO3Ze4inUxzH8dfuGLus2qzrbmMtxcS65bpbbsuuW2E3/CGS61JbaFxWJKuEtca6RRapdSv+4A/l9geNP+S2YluXGCyLRSktalPo1Ef9mmKfZ+Y383vUvOvUNHOec84z5zyf7/f7OYwzzv+WbvTgIOyJ3bGNhjMBc3EdXsD32Ixv8B4G8RV+w+d4HldjlobQgxuz0A/Qj4WYkZcbSvndTJyB+/Oib+McTOzA+u2IlfgJ9+b4DIcunIwX8REWGUMuwY+4Gzu1cdzjsAarMdUosj2ezZnfexQFoh9foHc0Jihnfl2O09ZGn4URh4PbOWiRzc9wjbHlJPyA2e0YbLvsxBU6wyJ8gmkjHehJPKKz3IyX/0XOK3Eu3sdknaUb7+LC4Ty8Lb7GHM1gX2xI/KrF9Xhas7gT99V5oKQK63FAxf6TE2NmRfsPwbE4EWcl/Vic1oelycluTytxo0rM2AEb6wThBQl6VV+66P3P+BIf5zy/hpfwTATjobS7Wl5gadqVmF5xvnuwrOqLlNzpWs1kv2TPlXgHR2omXfi9ipJ2p+MUzWVdlWi/czLbJvNclXS/t84Z7BAP4rIqH1PZujpMivzOSG2+fyT4cMxvaQsix63t4tQ3u9SY77ao3X8yPVptGPL7bUreDyPBpYR9taW9EjlubQ9HlmfXmLPEoFu31KnUGn90qn6uSDEtVlTpODha1VmbWIabqnR8ChdoLitwVZWOl+NRzeUJnFel426xecaiNh8Oa3Bo1c5v4NQag09NWTwWKcqvdeZaHFtzS0yM7Bb53YQ/8/P6xKO3hkjwSHO4o1K11gpypSI7sOZEExIcexIci51zREtQHKnx1l9VsVrpiyHXFLqz0yVzqMUpcdWH7V60mfNzPGuxB77DMZrBJHyaEroyRRHWYonmcEfdYz4x+X5J5prC/AhPMR8qsxwDDQqGc+L/1pLtJblsGbHP2sad2IgT6tr4Gxpyp7dVrvPKeo6u8+Dc1Omlqus08yI0xRPbte7Da3OReSn2MvYUgSlmwuu5hzl9uAMVC/JsPJbtLOb144ns85JytJspqeEfSNAdwJlJCttGb/zalZlgU+70ynavwg25cihKsk9yqmlDMtJ/cq6ZybVOS4m6KvX8L7FV+8byu+zKYo/HRbglfu5AFjWY/2pZ3F9pm5MFl7+9mdi0PK7JYfmgxxlnHKPP3/f5ueKem89DAAAAAElFTkSuQmCC)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
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
                  <div 
                    className={`w-[18px] h-[18px] transition-transform group-active:scale-90 opacity-70 group-hover:opacity-100 ${isReselaed ? 'bg-green-500' : 'bg-current'}`}
                    style={{
                      WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEdElEQVR4nO2Ze0yVZRzHP57De3/PAcSUBVRbzVIGkSy62JYt/mBs2rq5gQayjC6glViaKy3LpVZSaQY5hVjLUbZUxiovNdTSNCFrVIqpzZVmtbjLTd720kOjQsfhnBcP7Hy2Z+fs7Hl+z/s9z+V9nu8PQoQIEWKQXAakAQ8DC0R5DLgbuAHQCWImAauBY8BpYBtQDCwX5VXgA+AA0ATsAZ4Frhxg/JsURbHrO8YtwGfAcWAJED+ANhpwG7BKiLbb336B+m7D0OtkWW6xvxNgPMB64CcgGwgbZBwJyACOiFG85r8VwsJcc69LSmyKi4tpAFIIIFcA3wDrhKBAYAvKB86ItTVK/B6laWrjR5WbrJycmR2SJD0XoP56FusvQB7OMF6so1J7MHRdfyc7K7Pt2NFD1tulRVZ4uNf+A/3mWjGn03EWHagAqjweT+uhms8tW8j3tfstWZbbgXB/go8DTgJ3MTRcr+tay8oVS7ttEb0leVJSgz/P4AJ2iO3SaUYbhrbBNM3mlcuXnusrwi5PLZzXbRhGyWCDPwTsFoKcwuVyuXIVRanPzLi39evqPf8S0FsqtpZbpmnaM8NnooBfgYk4R5Ku67Xx8RMaKyve61dAb6k7XGOpqtIGjPW1k2XAGziI/Z4wTeOUqqptyclJ9fl5uV3r162xDh6o6ldMSkpyI3CPL32YwG9AHEODPfrpkiS9EBkZsVdRlJYxY6KaUlOnND75xKPdJRvWWvu+2GkVzMs/J0nSS74Eng1s4uIyHpipqmpxZGREta7rf0pSWIeu6+W+BNkJTCX40AF1oJUNoEF8DmumALsYATwCrGUEsAxYxAigEJhL8JEkrtEDxr7gRBN8PC5ulsOeRWLaD3tWB+mU95nKIH1J+8QocRIfqrOfY0wQtpPPxAXZEeVp4HWfW2madlySpA6v13tYluXFQAIXd1p9B0z2uaXHY57Y8uG7VllpkTUjc3pnVNToVkPXz6iqatufyQwtU4GvBtUyMjJi31vFr/3vzvxgbk6nfeExDOOUokgrgEScxQ3UDNo9MU2zbMnihee9P2/dvNGafX+WLarF6/X8rGnK84AScBn0OJCf+hNgQc6sGe0XMgNst2N+wZwuRZY7PR7DPvZ7CSwJwka92p8g0yfffGN9fwJ2V31sZWdltGuaetbj8bzv0EYwDqizr7r+BkqMjh7b2FdA7bdfWmlpqWcVRWlWVdU+IcfgDJeIdfFMIIKpbre768gPB/8Rcse09HbhKxXgHBOBo0DAnHdMUz+9/ZPNPSIKV73YrevqSWFmV4sM1OUB6+xvJ3OOWBNZAYxrb8Hhu4reLLR2bNtiaZrWLEQgXAzbC/4dsLfgWD8FTBM5lyphAQUWRVEK8/Me6I6NjWmWJFdOP1UuBdYAf4hUwH0iGTqQh08W6bofgf3AnThIjtvt7jZNc+MAvCY7BVcucigngO1ASZ+E6MtAmTDEG8WR45VAp9POR4Isy3sHkVK+CkgFZvVJUc8XYm8V9miIECFC4DN/AetW2sTrKgqoAAAAAElFTkSuQmCC)',
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEdElEQVR4nO2Ze0yVZRzHP57De3/PAcSUBVRbzVIGkSy62JYt/mBs2rq5gQayjC6glViaKy3LpVZSaQY5hVjLUbZUxiovNdTSNCFrVIqpzZVmtbjLTd720kOjQsfhnBcP7Hy2Z+fs7Hl+z/s9z+V9nu8PQoQIEWKQXAakAQ8DC0R5DLgbuAHQCWImAauBY8BpYBtQDCwX5VXgA+AA0ATsAZ4Frhxg/JsURbHrO8YtwGfAcWAJED+ANhpwG7BKiLbb336B+m7D0OtkWW6xvxNgPMB64CcgGwgbZBwJyACOiFG85r8VwsJcc69LSmyKi4tpAFIIIFcA3wDrhKBAYAvKB86ItTVK/B6laWrjR5WbrJycmR2SJD0XoP56FusvQB7OMF6so1J7MHRdfyc7K7Pt2NFD1tulRVZ4uNf+A/3mWjGn03EWHagAqjweT+uhms8tW8j3tfstWZbbgXB/go8DTgJ3MTRcr+tay8oVS7ttEb0leVJSgz/P4AJ2iO3SaUYbhrbBNM3mlcuXnusrwi5PLZzXbRhGyWCDPwTsFoKcwuVyuXIVRanPzLi39evqPf8S0FsqtpZbpmnaM8NnooBfgYk4R5Ku67Xx8RMaKyve61dAb6k7XGOpqtIGjPW1k2XAGziI/Z4wTeOUqqptyclJ9fl5uV3r162xDh6o6ldMSkpyI3CPL32YwG9AHEODPfrpkiS9EBkZsVdRlJYxY6KaUlOnND75xKPdJRvWWvu+2GkVzMs/J0nSS74Eng1s4uIyHpipqmpxZGREta7rf0pSWIeu6+W+BNkJTCX40AF1oJUNoEF8DmumALsYATwCrGUEsAxYxAigEJhL8JEkrtEDxr7gRBN8PC5ulsOeRWLaD3tWB+mU95nKIH1J+8QocRIfqrOfY0wQtpPPxAXZEeVp4HWfW2madlySpA6v13tYluXFQAIXd1p9B0z2uaXHY57Y8uG7VllpkTUjc3pnVNToVkPXz6iqatufyQwtU4GvBtUyMjJi31vFr/3vzvxgbk6nfeExDOOUokgrgEScxQ3UDNo9MU2zbMnihee9P2/dvNGafX+WLarF6/X8rGnK84AScBn0OJCf+hNgQc6sGe0XMgNst2N+wZwuRZY7PR7DPvZ7CSwJwka92p8g0yfffGN9fwJ2V31sZWdltGuaetbj8bzv0EYwDqizr7r+BkqMjh7b2FdA7bdfWmlpqWcVRWlWVdU+IcfgDJeIdfFMIIKpbre768gPB/8Rcse09HbhKxXgHBOBo0DAnHdMUz+9/ZPNPSIKV73YrevqSWFmV4sM1OUB6+xvJ3OOWBNZAYxrb8Hhu4reLLR2bNtiaZrWLEQgXAzbC/4dsLfgWD8FTBM5lyphAQUWRVEK8/Me6I6NjWmWJFdOP1UuBdYAf4hUwH0iGTqQh08W6bofgf3AnThIjtvt7jZNc+MAvCY7BVcucigngO1ASZ+E6MtAmTDEG8WR45VAp9POR4Isy3sHkVK+CkgFZvVJUc8XYm8V9miIECFC4DN/AetW2sTrKgqoAAAAAElFTkSuQmCC)',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
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
                      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAEdElEQVR4nO2Ze0yVZRzHP57De3/PAcSUBVRbzVIGkSy62JYt/mBs2rq5gQayjC6glViaKy3LpVZSaQY5hVjLUbZUxiovNdTSNCFrVIqpzZVmtbjLTd720kOjQsfhnBcP7Hy2Z+fs7Hl+z/s9z+V9nu8PQoQIEWKQXAakAQ8DC0R5DLgbuAHQCWImAauBY8BpYBtQDCwX5VXgA+AA0ATsAZ4Frhxg/JsURbHrO8YtwGfAcWAJED+ANhpwG7BKiLbb336B+m7D0OtkWW6xvxNgPMB64CcgGwgbZBwJyACOiFG85r8VwsJcc69LSmyKi4tpAFIIIFcA3wDrhKBAYAvKB86ItTVK/B6laWrjR5WbrJycmR2SJD0XoP56FusvQB7OMF6so1J7MHRdfyc7K7Pt2NFD1tulRVZ4uNf+A/3mWjGn03EWHagAqjweT+uhms8tW8j3tfstWZbbgXB/go8DTgJ3MTRcr+tay8oVS7ttEb0leVJSgz/P4AJ2iO3SaUYbhrbBNM3mlcuXnusrwi5PLZzXbRhGyWCDPwTsFoKcwuVyuXIVRanPzLi39evqPf8S0FsqtpZbpmnaM8NnooBfgYk4R5Ku67Xx8RMaKyve61dAb6k7XGOpqtIGjPW1k2XAGziI/Z4wTeOUqqptyclJ9fl5uV3r162xDh6o6ldMSkpyI3CPL32YwG9AHEODPfrpkiS9EBkZsVdRlJYxY6KaUlOnND75xKPdJRvWWvu+2GkVzMs/J0nSS74Eng1s4uIyHpipqmpxZGREta7rf0pSWIeu6+W+BNkJTCX40AF1oJUNoEF8DmumALsYATwCrGUEsAxYxAigEJhL8JEkrtEDxr7gRBN8PC5ulsOeRWLaD3tWB+mU95nKIH1J+8QocRIfqrOfY0wQtpPPxAXZEeVp4HWfW2madlySpA6v13tYluXFQAIXd1p9B0z2uaXHY57Y8uG7VllpkTUjc3pnVNToVkPXz6iqatufyQwtU4GvBtUyMjJi31vFr/3vzvxgbk6nfeExDOOUokgrgEScxQ3UDNo9MU2zbMnihee9P2/dvNGafX+WLarF6/X8rGnK84AScBn0OJCf+hNgQc6sGe0XMgNst2N+wZwuRZY7PR7DPvZ7CSwJwka92p8g0yfffGN9fwJ2V31sZWdltGuaetbj8bzv0EYwDqizr7r+BkqMjh7b2FdA7bdfWmlpqWcVRWlWVdU+IcfgDJeIdfFMIIKpbre768gPB/8Rcse09HbhKxXgHBOBo0DAnHdMUz+9/ZPNPSIKV73YrevqSWFmV4sM1OUB6+xvJ3OOWBNZAYxrb8Hhu4reLLR2bNtiaZrWLEQgXAzbC/4dsLfgWD8FTBM5lyphAQUWRVEK8/Me6I6NjWmWJFdOP1UuBdYAf4hUwH0iGTqQh08W6bofgf3AnThIjtvt7jZNc+MAvCY7BVcucigngO1ASZ+E6MtAmTDEG8WR45VAp9POR4Isy3sHkVK+CkgFZvVJUc8XYm8V9miIECFC4DN/AetW2sTrKgqoAAAAAElFTkSuQmCC" alt="synchronize--v2" className="w-[18px] h-[18px] invert" />
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
                <div 
                  className="w-[18px] h-[18px] opacity-70 group-hover:opacity-100 transition-opacity bg-current"
                  style={{
                    WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAENklEQVR4nO2ZaWxVRRTHf/BK371zW0PQ4G4iBkQwBhKg9bG5oCIkAiEBl4h+0KARNMbdELdPVbSiokKNRhOWD4LKJ1AoiLSlBY2IH9xQNEpcsAJCqyHgM6c9bcbJvffxAd97g/6SF2buTCdnlnPOfwb4n/8WV3ACcBLwFzAQzxkP5IFaPGeeTuR6PKcB+B5YgOdsA14FXsNjMkAHMAvYhMecB/wIDAa+w2OuBDYD/YDDQBZPuU2dHd2RIXjKQuA+LYuPTMZT3gKmaVki1+14yg7gQi1LHnmKMuVa4JGU9t+BKi1fB6wuEKpFl5WERuCjhDYRiXutumitj1PGugF4mxJwGtAO7AdMTPvFwHZnYgdSxnsc+IkSicE3gGZgQky7HKU3nW8HgVMSxlum4vIciswWYCrwEnBXTPtDGn5tdgKjE8bbqjsykyJylp7/Sk16ElpdlgJ3ON/eAWYnjPkL8ALwJEXkHuAVyxc+jOnzru6YTT3wQEzfaj12VwEbj4eBgTHm+TAM9gVBcMAY86yuepw0n6TlCOgEKpw+XwDDnW/zgSUx443QnDNAA0LfAnZWGmMWZbPZg/KLokhkUNjbGkXRi+PH5TpbmtfnW5rey9fWju6oquqajM25wM+O4bsco/vo5GSSNlN1p1xmqgoQvgKGpc2iujpqGJur6RQbt7VuzF926YROnUw3YRjuk0l8s+uTrp+UgyAr94kpwEjgDM3Q4uA2q52r7OlODunhAuDLmO/3W4FhBXCT1fYgUKdHUn5zM5nMke1tm3rtbNvaKHZK8u1GjlNrS2NvB+lcUVFxBFirW78H+APIOYY86kSo2gS/CfXv+8YEBgkawt3AYi2PAb7VCFingWBpEASH3QWXTegdLYqiJZdMHNd1tJo+WJfP5Wo6oihyVz+O6cB6J4esSui7R6OezQbr7Wus+qCwCHjMHcAY80z9mFEdYuOWzevycszEt/+xYmJ4GAb7ZXeCIKhPcHZi/OZXqy4r+HRK/pEnIpvdwKAeO+m+Hsu/PwDnx4zRL4rChbILxph2Y0z98bq09dFoc7bWXwbuTOgramCOVa/U42YHjx3Aw47EKRqy0tdoea1VjtNU4lM9DNaoZ9Ogyln8peg8Z0n6z4CLEvrdArxu1SfHhORbgaPAmZSAOSrDe3JI/5QHifetusgYN6AMUhVQEoar04q8/y2l31Dga6ter5KnbMgAh4CrgbaUfhKN/tSdE9Zo+C4rmlVLLS/QT7L+qVr+NMWfSkadGimRKQ25Ho/SXTlk3evLhsv1lndjgX4SFGaodpMn1bKjUldY7iiFQvV8zfBNlCnTj0Eu3KtvXDdrpveW2cBK4Akny3vHRD1SK/Q9y1uGafJsPQZ/KmsGqozZ6/t/W2dUFMrLife0F3gL9obPU67DXtFU7FfFfwt5Pp3LCcBI4ORSG0G58jfEiSNbtKMSxAAAAABJRU5ErkJggg==)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAENklEQVR4nO2ZaWxVRRTHf/BK371zW0PQ4G4iBkQwBhKg9bG5oCIkAiEBl4h+0KARNMbdELdPVbSiokKNRhOWD4LKJ1AoiLSlBY2IH9xQNEpcsAJCqyHgM6c9bcbJvffxAd97g/6SF2buTCdnlnPOfwb4n/8WV3ACcBLwFzAQzxkP5IFaPGeeTuR6PKcB+B5YgOdsA14FXsNjMkAHMAvYhMecB/wIDAa+w2OuBDYD/YDDQBZPuU2dHd2RIXjKQuA+LYuPTMZT3gKmaVki1+14yg7gQi1LHnmKMuVa4JGU9t+BKi1fB6wuEKpFl5WERuCjhDYRiXutumitj1PGugF4mxJwGtAO7AdMTPvFwHZnYgdSxnsc+IkSicE3gGZgQky7HKU3nW8HgVMSxlum4vIciswWYCrwEnBXTPtDGn5tdgKjE8bbqjsykyJylp7/Sk16ElpdlgJ3ON/eAWYnjPkL8ALwJEXkHuAVyxc+jOnzru6YTT3wQEzfaj12VwEbj4eBgTHm+TAM9gVBcMAY86yuepw0n6TlCOgEKpw+XwDDnW/zgSUx443QnDNAA0LfAnZWGmMWZbPZg/KLokhkUNjbGkXRi+PH5TpbmtfnW5rey9fWju6oquqajM25wM+O4bsco/vo5GSSNlN1p1xmqgoQvgKGpc2iujpqGJur6RQbt7VuzF926YROnUw3YRjuk0l8s+uTrp+UgyAr94kpwEjgDM3Q4uA2q52r7OlODunhAuDLmO/3W4FhBXCT1fYgUKdHUn5zM5nMke1tm3rtbNvaKHZK8u1GjlNrS2NvB+lcUVFxBFirW78H+APIOYY86kSo2gS/CfXv+8YEBgkawt3AYi2PAb7VCFingWBpEASH3QWXTegdLYqiJZdMHNd1tJo+WJfP5Wo6oihyVz+O6cB6J4esSui7R6OezQbr7Wus+qCwCHjMHcAY80z9mFEdYuOWzevycszEt/+xYmJ4GAb7ZXeCIKhPcHZi/OZXqy4r+HRK/pEnIpvdwKAeO+m+Hsu/PwDnx4zRL4rChbILxph2Y0z98bq09dFoc7bWXwbuTOgramCOVa/U42YHjx3Aw47EKRqy0tdoea1VjtNU4lM9DNaoZ9Ogyln8peg8Z0n6z4CLEvrdArxu1SfHhORbgaPAmZSAOSrDe3JI/5QHifetusgYN6AMUhVQEoar04q8/y2l31Dga6ter5KnbMgAh4CrgbaUfhKN/tSdE9Zo+C4rmlVLLS/QT7L+qVr+NMWfSkadGimRKQ25Ho/SXTlk3evLhsv1lndjgX4SFGaodpMn1bKjUldY7iiFQvV8zfBNlCnTj0Eu3KtvXDdrpveW2cBK4Akny3vHRD1SK/Q9y1uGafJsPQZ/KmsGqozZ6/t/W2dUFMrLife0F3gL9obPU67DXtFU7FfFfwt5Pp3LCcBI4ORSG0G58jfEiSNbtKMSxAAAAABJRU5ErkJggg==)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
              </div>
              <span className="">{views}</span>
            </button>

            <div className="flex gap-1 ml-auto shrink-0">
              {/* 5. Bookmark */}
              <button 
                onClick={(e) => handleToggle("BOOKMARK", e)} 
                className={`flex items-center gap-1 transition-colors group ${isBookmarked ? 'text-primary' : 'hover:text-primary'}`} 
                title="Bookmark"
              >
                <div className="p-1.5 rounded-full group-hover:bg-primary/10 transition-colors">
                  <div 
                    className={`w-[18px] h-[18px] transition-transform group-active:scale-90 opacity-70 group-hover:opacity-100 ${isBookmarked ? 'bg-primary' : 'bg-current'}`}
                    style={{
                      WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACRklEQVR4nO2ZuU9UURTGf4DgArI5yqIgUCiNMZFSY2IsrSxsLe2oaemgNjb+C7aUtiSWhFAAKpvKDI9xZpxhEQdZcpNTEMK8PPWcew15X3IyyZv3vnu/u54FUqRIoYlLQAcwCAzVsPvAiNi9mPc6algTxpgHSkBRbB1YirGFmP+iEzynrQociRUshDgRGfzi0IK0GEDIAVCnTfoduI1f/AbqtUnzwA38Yh+4oE3qNmgXflEFGrVJcwGE/LI4jrNAN36xB1zUJv0G9OAXP+USVsVXoBe/2AUua5OuBRCyA1zRJl0FbuIX20CzNukycAu/2AKuapN+BvrwiwrQqk36KYCQMtCmTfoRuI1flCRGUV9a50LIEjCAXxSBTm3SlQBCCsA1i3vExdo+kbeIgb4EmJG8RQzkfK1+/GLTQsh6gHskshCSDeCi5CyEbATwfiOLzR4FiBAjCyEhsiibFkJC5LXyFm0WLW7ZBEIyFg6cut+TYBVkLGKDds6BkIpFtBbCady2iJ9D7MsdoOUPv2kAngPP/mFGMhgky5LmmJzgUYkqp4FZ4APw9H+Ykb0E6UuX5B6Xi2wKeCjPXbHmBbAowh4nbPOHxUlZjcmMuwLoWzn33e+dGu+5WsdLyZG9Bx6EELJ/Rq3ikYx8VmYiaaNuQF7Jd++AuzFHficG9bwG6YQb1TlgRjr0txlzlw4dk03tBA35EHIoo56TWXiiyO06Oymb+/UJL7tsceQvy/ofxg49wBsRNCF7RL2q6xO9MkNu6aZIQUAcA5x4jYk8OqYWAAAAAElFTkSuQmCC)',
                      WebkitMaskSize: 'contain',
                      WebkitMaskRepeat: 'no-repeat',
                      WebkitMaskPosition: 'center',
                      maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAACRklEQVR4nO2ZuU9UURTGf4DgArI5yqIgUCiNMZFSY2IsrSxsLe2oaemgNjb+C7aUtiSWhFAAKpvKDI9xZpxhEQdZcpNTEMK8PPWcew15X3IyyZv3vnu/u54FUqRIoYlLQAcwCAzVsPvAiNi9mPc6algTxpgHSkBRbB1YirGFmP+iEzynrQociRUshDgRGfzi0IK0GEDIAVCnTfoduI1f/AbqtUnzwA38Yh+4oE3qNmgXflEFGrVJcwGE/LI4jrNAN36xB1zUJv0G9OAXP+USVsVXoBe/2AUua5OuBRCyA1zRJl0FbuIX20CzNukycAu/2AKuapN+BvrwiwrQqk36KYCQMtCmTfoRuI1flCRGUV9a50LIEjCAXxSBTm3SlQBCCsA1i3vExdo+kbeIgb4EmJG8RQzkfK1+/GLTQsh6gHskshCSDeCi5CyEbATwfiOLzR4FiBAjCyEhsiibFkJC5LXyFm0WLW7ZBEIyFg6cut+TYBVkLGKDds6BkIpFtBbCady2iJ9D7MsdoOUPv2kAngPP/mFGMhgky5LmmJzgUYkqp4FZ4APw9H+Ykb0E6UuX5B6Xi2wKeCjPXbHmBbAowh4nbPOHxUlZjcmMuwLoWzn33e+dGu+5WsdLyZG9Bx6EELJ/Rq3ikYx8VmYiaaNuQF7Jd++AuzFHficG9bwG6YQb1TlgRjr0txlzlw4dk03tBA35EHIoo56TWXiiyO06Oymb+/UJL7tsceQvy/ofxg49wBsRNCF7RL2q6xO9MkNu6aZIQUAcA5x4jYk8OqYWAAAAAElFTkSuQmCC)',
                      maskSize: 'contain',
                      maskRepeat: 'no-repeat',
                      maskPosition: 'center',
                    }}
                  />
                </div>
              </button>

              {/* 6. Share */}
              <div className="relative">
                <button onClick={handleShareMenuClick} className="flex items-center transition-colors group" title="Share">
                  <div className="p-1.5 rounded-full group-hover:bg-accent transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70 group-hover:opacity-100 transition-opacity text-current">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
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
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { e.stopPropagation(); setShowReportModal(false); }}>
          <div className="bg-[#18181b] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 sm:p-6 flex flex-col flex-1 overflow-hidden">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowReportModal(false); }} className="text-gray-400 hover:text-white transition-colors p-2 -mr-2 -mt-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-2">Report to Intasela</h2>
              <p className="text-sm text-gray-400 mb-6 leading-relaxed">
                Report content that violates Intasela's <a href="#" className="text-brand hover:underline">Content Guidelines</a> below. Your report is only viewed by our staff. Find additional reporting options and information in our <a href="#" className="text-brand hover:underline">Help Center</a>.
              </p>
              
              <form onSubmit={handleReportSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-2 pb-4 -mr-2 space-y-1 nice-scrollbar">
                  {[
                    "Spam",
                    "Impersonation",
                    "Hate, Abuse, and Violence",
                    "Child Safety",
                    "Explicit Media",
                    "Illegal & Regulated Behaviors",
                    "Private or Non-consensual Content",
                    "Suicide & Self Harm",
                    "Terrorism & Violent Extremism"
                  ].map((reason) => (
                    <label key={reason} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="radio" 
                          name="reportReason" 
                          value={reason} 
                          checked={selectedReportReason === reason} 
                          onChange={(e) => setSelectedReportReason(e.target.value)}
                          className="peer appearance-none w-5 h-5 border border-gray-600 rounded-full checked:border-brand transition-colors"
                        />
                        <div className="absolute w-2.5 h-2.5 bg-brand rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                      <span className="text-[15px] text-gray-200 group-hover:text-white transition-colors">{reason}</span>
                    </label>
                  ))}
                </div>
                
                <div className="pt-4 mt-2 border-t border-gray-800">
                  <button 
                    type="submit" 
                    disabled={!selectedReportReason}
                    className="w-full py-3.5 px-4 rounded-xl font-bold text-[15px] transition-all
                      disabled:bg-white/5 disabled:text-white/30 disabled:cursor-not-allowed
                      bg-white text-black hover:bg-gray-200 active:scale-[0.98]"
                  >
                    Submit report
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </article>
    </>
  );
}
