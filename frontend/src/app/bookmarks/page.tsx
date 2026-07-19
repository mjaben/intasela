"use client";

import { useEffect, useState } from "react";
import PostCard from "@/components/PostCard";
import PostSkeleton from "@/components/PostSkeleton";
import ErrorState from "@/components/ErrorState";
import { useUserStore } from "@/store/useUserStore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function BookmarksPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"All" | "Post (sela)" | "Resela with Note">("All");
  
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        setError(false);
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/bookmarks`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch bookmarks");
        const data = await res.json();
        setPosts(data);
      } catch (error) {
        console.error("Failed to fetch bookmarks:", error);
        if (posts.length === 0) {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [isAuthenticated, router]);

  const handleUnbookmark = (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === "All") return true;
    if (activeTab === "Post (sela)") return post.quotedPostId === null;
    if (activeTab === "Resela with Note") return post.quotedPostId !== null;
    return true;
  });

  if (!isAuthenticated) return null;

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border z-10 flex items-center px-4 py-4">
        <h1 className="text-xl font-extrabold tracking-tight">Bookmarks</h1>
        <div className="ml-2 text-sm text-muted-foreground mt-1">@{useUserStore.getState().user?.username}</div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {["All", "Post (sela)", "Resela with Note"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-4 px-2 text-center font-bold text-[15px] transition-colors hover:bg-muted/50 relative ${
              activeTab === tab ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div
                layoutId="bookmarkTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#3BC492] rounded-t-full mx-auto w-12"
              />
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="flex flex-col">
        {loading && posts.length === 0 ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <PostSkeleton key={i} />
            ))}
          </>
        ) : error && posts.length === 0 ? (
          <ErrorState 
            message="Failed to load your bookmarks. Please check your connection."
            onRetry={() => window.location.reload()}
          />
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
            <h2 className="text-xl font-bold mb-2">Save selas for later</h2>
            <p className="max-w-xs text-sm">Don't let the good ones fly away! Bookmark Selas to easily find them again in the future.</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard 
              key={post.id}
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
              parentPost={post.parent}
              mediaType={post.mediaType}
              mediaUrl={post.mediaUrl}
              mediaUrls={post.mediaUrls}
              thumbnailUrl={post.thumbnailUrl}
              onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
              onUnbookmark={handleUnbookmark}
            />
          ))
        )}
      </div>
    </div>
  );
}
