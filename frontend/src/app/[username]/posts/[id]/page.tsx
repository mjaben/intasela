"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { useUserStore } from "@/store/useUserStore";
import { useFeedStore } from "@/store/useFeedStore";

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  // params.username is also available if needed
  
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { openComposer } = useFeedStore();

  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPost = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: any = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${postId}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch post");
      const data = await res.json();
      setPost(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading sela...</div>;
  }

  if (error || !post) {
    return <div className="p-8 text-center text-red-500">{error || "Sela not found"}</div>;
  }

  return (
    <div className="max-w-2xl mx-auto min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-6 p-4 bg-background/80 backdrop-blur-md border-b border-border">
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
          title="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="text-xl font-bold">Sela</h1>
      </div>

      {/* Main Post */}
      <div>
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
          earned={post.earned || 0}
          stats={post.stats}
          userInteractions={post.userInteractions}
          quotedPost={post.quotedPost}
          mediaType={post.mediaType}
          mediaUrl={post.mediaUrl}
          mediaUrls={post.mediaUrls}
          thumbnailUrl={post.thumbnailUrl}
          onDelete={() => router.push("/")}
          parentPost={post.parent}
          isReplyContext={!!post.parent}
          poll={post.poll}
        />
      </div>

      {/* Leave a Reply Box */}
      <div className="px-6 py-6 bg-background">
        <div 
          onClick={() => {
            if (!isAuthenticated) return router.push('/login');
            openComposer('REPLY', { 
              id: post.id, 
              author: post.author.firstName || post.author.username, 
              content: post.content 
            });
          }}
          className="flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-text group"
        >
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0">
            {user ? (
              <img src={user.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-full h-full text-gray-500 bg-gray-800" fill="currentColor" viewBox="0 0 24 24"><path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </div>
          <div className="flex-1 text-muted-foreground group-hover:text-foreground/80 transition-colors text-[15px]">
            Leave a reply...
          </div>
        </div>
      </div>

      {/* Replies Thread */}
      {post.replies && post.replies.length > 0 && (
        <div className="border-t border-border">
          {post.replies.map((reply: any) => (
            <PostCard 
              key={reply.id}
              id={reply.id}
              author={{
                name: reply.author.firstName || reply.author.username,
                username: reply.author.username,
                avatarUrl: reply.author.avatarUrl,
                isFollowing: reply.author.isFollowing,
                isFollower: reply.author.isFollower
              }}
              content={reply.content} 
              earned={reply.earned || 0}
              stats={reply.stats}
              userInteractions={reply.userInteractions}
              quotedPost={reply.quotedPost}
              mediaType={reply.mediaType}
              mediaUrl={reply.mediaUrl}
              mediaUrls={reply.mediaUrls}
              thumbnailUrl={reply.thumbnailUrl}
              poll={reply.poll}
              onDelete={() => fetchPost()}
            />
          ))}
        </div>
      )}
      
      {post.replies && post.replies.length === 0 && (
        <div className="p-12 text-center text-muted-foreground">
          No replies yet. Be the first to share your thoughts!
        </div>
      )}

      {/* Global Composer Modal */}
      {isAuthenticated && (
        <CreatePost onPostCreated={fetchPost} hideInline={true} />
      )}
    </div>
  );
}
