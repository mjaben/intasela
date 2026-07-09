"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import AdSlot from "@/components/AdSlot";
import CreatePost from "@/components/CreatePost";
import { useUserStore } from "@/store/useUserStore";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(true);
  
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch("http://localhost:3001/posts", { headers });
      const data = await res.json();
      setPosts(data);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-10 flex">
        <button className="flex-1 text-center py-4 text-white font-bold border-b-2 border-[#3BC492]">For you</button>
        <button className="flex-1 text-center py-4 text-gray-500 font-medium hover:text-gray-300 transition-colors">Following</button>
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
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No posts yet. Be the first to post!</div>
        ) : (
          posts.map((post, index) => (
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
