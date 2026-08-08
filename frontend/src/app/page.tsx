"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import ErrorState from "@/components/ErrorState";
import AdSlot from "@/components/AdSlot";
import CreatePost from "@/components/CreatePost";
import { useUserStore } from "@/store/useUserStore";
import { useBlockMuteStore } from "@/store/useBlockMuteStore";
import { motion, AnimatePresence } from "framer-motion";
import PullToRefresh from "@/components/PullToRefresh";
import { Loader2 } from "lucide-react";
import { getRandomizedAdIndices } from "@/utils/adPlacement";
import { hapticTap } from "@/utils/haptic";


export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPosts, setNewPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);
  const [activeTab, setActiveTab] = useState<"For you" | "Following">("For you");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isHomeRefreshing, setIsHomeRefreshing] = useState(false);
  
  const postsRef = useRef<any[]>([]);
  const loaderRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const blockedUsers = useBlockMuteStore(s => s.blockedUsers);
  
  const filteredPosts = posts.filter(post => !blockedUsers.some(u => u.username === post.author.username));
  const adIndices = useMemo(() => getRandomizedAdIndices(filteredPosts.length, 3, 6, `feed_${activeTab}`), [filteredPosts.length, activeTab]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50 && activeTab === "For you") {
      hapticTap();
      setActiveTab("Following");
    } else if (diff < -50 && activeTab === "Following") {
      hapticTap();
      setActiveTab("For you");
    }
    touchStartX.current = null;
  };


  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);

  const fetchPosts = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setHasMore(true);
        setLoading(true);
        const cacheKey = `feed_${activeTab}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached && posts.length === 0) {
          setPosts(JSON.parse(cached));
        }
      } else {
        setIsFetchingMore(true);
      }
      
      const targetPage = reset ? 1 : page + 1;
      setError(false);
      if (reset) setNewPosts([]);
      
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts?page=${targetPage}`;
      if (activeTab === "Following") {
        url += "&type=following";
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      if (data.length < 20) {
        setHasMore(false);
      }
      
      if (reset) {
        setPosts(data);
        localStorage.setItem(`feed_${activeTab}`, JSON.stringify(data));
      } else {
        setPosts(prev => {
          // Prevent duplicates
          const newItems = data.filter((d: any) => !prev.some(p => p.id === d.id));
          return [...prev, ...newItems];
        });
        setPage(targetPage);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      if (posts.length === 0 && reset) {
        setError(true);
      }
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, [activeTab]);

  const handleHomeRefreshRef = useRef<(() => void) | null>(null);
  handleHomeRefreshRef.current = async () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsHomeRefreshing(true);
    await fetchPosts(true);
    setIsHomeRefreshing(false);
  };
  
  useEffect(() => {
    const handler = () => handleHomeRefreshRef.current?.();
    window.addEventListener('home:refresh', handler);
    return () => window.removeEventListener('home:refresh', handler);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading && !isFetchingMore) {
        fetchPosts(false);
      }
    }, {
      rootMargin: "100px"
    });
    
    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }
    
    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore, page, activeTab]);

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
        
        let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts`;
        if (activeTab === "Following") {
          url += "?type=following";
        }
        
        const res = await fetch(url, { headers });
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.length > 0 && postsRef.current.length > 0) {
          const topCurrentPostId = postsRef.current[0].id;
          const index = data.findIndex((p: any) => p.id === topCurrentPostId);
          if (index > 0) {
            setNewPosts(data.slice(0, index));
          } else if (index === -1) {
            setNewPosts(data);
          }
        }
      } catch (e) {
        // Silently ignore polling errors
      }
    }, 180000); // 3 minutes

    return () => clearInterval(pollInterval);
  }, [activeTab]);

  const handleShowNewPosts = () => {
    setPosts(prev => {
      const merged = [...newPosts, ...prev];
      // Keep cache up to date
      localStorage.setItem(`feed_${activeTab}`, JSON.stringify(merged));
      return merged;
    });
    setNewPosts([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PullToRefresh onRefresh={async () => { await fetchPosts(true); }}>
      <div
        className="w-full max-w-[650px] mx-auto min-h-screen relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <header className="sticky top-[calc(60px+var(--safe-area-inset-top))] sm:top-0 bg-[#0f150e]/90 backdrop-blur-md border-b border-border z-30 flex">
        <button 
          onClick={() => setActiveTab("For you")}
          className={`flex-1 px-8 py-4 text-center font-bold text-[15px] transition-colors hover:bg-accent/50 relative ${activeTab === "For you" ? "text-white" : "text-gray-400 font-medium"}`}
        >
          For you
          {activeTab === "For you" && (
            <motion.div
              layoutId="homeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-1 bg-[#ACC8A2] rounded-t-full mx-auto w-16"
            />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("Following")}
          className={`flex-1 px-8 py-4 text-center font-bold text-[15px] transition-colors hover:bg-accent/50 relative ${activeTab === "Following" ? "text-white" : "text-gray-400 font-medium"}`}
        >
          Following
          {activeTab === "Following" && (
            <motion.div
              layoutId="homeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-1 bg-[#ACC8A2] rounded-t-full mx-auto w-20"
            />
          )}
        </button>
      </header>

      {/* Double Tap Refresh Spinner */}
      <AnimatePresence>
        {isHomeRefreshing && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="absolute top-[calc(80px+var(--safe-area-inset-top))] left-0 right-0 flex justify-center z-50 pointer-events-none"
          >
            <div className="bg-background border border-border shadow-md rounded-full p-2 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#ACC8A2] animate-spin" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Post Up Button */}
      <AnimatePresence>
        {newPosts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-[calc(68px+var(--safe-area-inset-top))] z-40 flex justify-center w-full pt-3 pointer-events-none"
          >
            <button 
              onClick={handleShowNewPosts}
              className="pointer-events-auto flex items-center gap-2 bg-[#ACC8A2] text-[#1A2517] font-bold text-[13px] px-5 py-2 rounded-full shadow-[0_4px_16px_rgba(172,200,162,0.3)] transition-transform hover:scale-105 active:scale-95 border border-[#1A2517]/10"
            >
              <span>↑</span>
              <div className="flex -space-x-1.5">
                {Array.from(new Set(newPosts.map(p => p.author.avatarUrl || 'https://i.pravatar.cc/150?u=' + p.author.id)))
                  .slice(0, 3)
                  .map((avatar, i) => (
                    <img key={i} src={avatar} className="w-6 h-6 rounded-full border-[1.5px] border-[#ACC8A2] object-cover bg-[#1A2517]" alt="Avatar" />
                ))}
              </div>
              <span className="ml-1">New posts</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer (What's on your mind?) */}
      <div className="hidden sm:block p-4 border-b border-border">
        {isAuthenticated ? (
          <CreatePost onPostCreated={fetchPosts} />
        ) : showLoginPrompt ? (
          <div className="text-center py-6 relative hidden sm:block">
            <button 
              onClick={() => setShowLoginPrompt(false)} 
              className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <p className="text-gray-400 mb-4">Log in to join the conversation and start earning!</p>
            <a href="/login" className="bg-[#ACC8A2] text-[#1A2517] font-bold px-6 py-2 rounded-full inline-block">Log In</a>
          </div>
        ) : null}
      </div>

      {/* Feed */}
      <div className="flex flex-col pb-28 sm:pb-0">
        {loading && filteredPosts.length === 0 ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </>
        ) : error && filteredPosts.length === 0 ? (
          <ErrorState 
            message={`Failed to load the ${activeTab} feed. Please check your connection.`} 
            onRetry={fetchPosts} 
          />
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No selas yet. Be the first to sela!</div>
        ) : (
          filteredPosts.map((post, index) => (
            <div key={post.id}>
              <PostCard 
                id={post.id}
createdAt={post.createdAt}
                author={{
                  name: post.author.firstName || post.author.username,
                  username: post.author.username,
                  avatarUrl: post.author.avatarUrl,
                  isFollowing: post.author.isFollowing,
                  isFollower: post.author.isFollower
                }}
                content={post.content} 
                earned={post.earned}
                stats={post.stats}
                userInteractions={post.userInteractions}
                quotedPost={post.quotedPost}
                poll={post.poll}
                mediaType={post.mediaType}
                mediaUrl={post.mediaUrl}
                mediaUrls={post.mediaUrls}
                thumbnailUrl={post.thumbnailUrl}
                space={post.space}
                onDelete={(id) => setPosts((prev) => prev.filter(p => p.id !== id))}
              />
              
              {/* Randomized Ad Placement */}
              {adIndices.has(index) && (
                <div className="px-4 sm:px-6 py-1">
                  <AdSlot format="horizontal" slotId={`feed_${index}`} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Loader for Infinite Scroll */}
      {hasMore && !loading && posts.length >= 20 && (
        <div ref={loaderRef} className="py-8 flex justify-center">
          {isFetchingMore && (
            <svg className="animate-spin h-6 w-6 text-[#ACC8A2]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="py-12 text-center text-gray-500 text-sm font-medium pb-24">
          You've caught up! No more posts to show.
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}
