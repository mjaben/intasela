"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import ErrorState from "@/components/ErrorState";
import AdSlot from "@/components/AdSlot";
import CreatePost from "@/components/CreatePost";
import { useUserStore } from "@/store/useUserStore";
import { useBlockMuteStore } from "@/store/useBlockMuteStore";
import { motion } from "framer-motion";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);
  const [activeTab, setActiveTab] = useState<"For you" | "Following">("For you");
  
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const blockedUsers = useBlockMuteStore(s => s.blockedUsers);
  
  const filteredPosts = posts.filter(post => !blockedUsers.some(u => u.username === post.author.username));

  const fetchPosts = async () => {
    try {
      const cacheKey = `feed_${activeTab}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setPosts(JSON.parse(cached));
        // Only show skeleton if we have no cache
        if (posts.length === 0) setLoading(true);
      } else {
        setLoading(true);
      }
      
      setError(false);
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      
      let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts`;
      if (activeTab === "Following") {
        url += "?type=following";
      }

      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      setPosts(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      if (posts.length === 0) {
        setError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab]);

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen">
      {/* Top Header */}
      <header className="sticky top-[60px] sm:top-0 bg-background/90 backdrop-blur-md border-b border-border z-10 flex">
        <button 
          onClick={() => setActiveTab("For you")}
          className={`px-8 py-4 text-center font-bold text-[15px] transition-colors hover:bg-muted/50 relative ${activeTab === "For you" ? "text-foreground" : "text-muted-foreground"}`}
        >
          For you
          {activeTab === "For you" && (
            <motion.div
              layoutId="homeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-1 bg-[#3BC492] rounded-t-full mx-auto w-12"
            />
          )}
        </button>
        <button 
          onClick={() => setActiveTab("Following")}
          className={`px-8 py-4 text-center font-bold text-[15px] transition-colors hover:bg-muted/50 relative ${activeTab === "Following" ? "text-foreground" : "text-muted-foreground"}`}
        >
          Following
          {activeTab === "Following" && (
            <motion.div
              layoutId="homeTabIndicator"
              className="absolute bottom-0 left-0 right-0 h-1 bg-[#3BC492] rounded-t-full mx-auto w-12"
            />
          )}
        </button>
      </header>

      {/* Composer (What's on your mind?) */}
      <div className="p-4 border-b border-border">
        {isAuthenticated ? (
          <CreatePost onPostCreated={fetchPosts} />
        ) : showLoginPrompt ? (
          <div className="text-center py-6 relative">
            <button 
              onClick={() => setShowLoginPrompt(false)} 
              className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <p className="text-gray-400 mb-4">Log in to join the conversation and start earning!</p>
            <a href="/login" className="bg-[#3BC492] text-black font-bold px-6 py-2 rounded-full inline-block">Log In</a>
          </div>
        ) : null}
      </div>

      {/* Feed */}
      <div className="flex flex-col">
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
          <div className="p-8 text-center text-gray-500">No posts yet. Be the first to post!</div>
        ) : (
          filteredPosts.map((post, index) => (
            <div key={post.id}>
              <PostCard 
                id={post.id}
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
                mediaType={post.mediaType}
                mediaUrl={post.mediaUrl}
                thumbnailUrl={post.thumbnailUrl}
                onDelete={(id) => setPosts((prev) => prev.filter(p => p.id !== id))}
              />
              
              {/* Insert Ad every 3 posts */}
              {(index + 1) % 3 === 0 && (
                <div className="px-6 py-2">
                  <AdSlot format="horizontal" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
