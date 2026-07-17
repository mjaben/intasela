"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { useUserStore } from "@/store/useUserStore";
import { useToastStore } from "@/store/useToastStore";

export default function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const user = useUserStore((state) => state.user);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const addToast = useToastStore((state) => state.addToast);

  const fetchSpace = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}`, { 
        headers,
        cache: 'no-store'
      });
      if (!res.ok) {
        if (res.status === 403) {
          alert("You do not have access to this private space.");
          router.push('/spaces');
        }
        throw new Error("Failed to fetch space");
      }
      const data = await res.json();
      setSpace(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      // Add ?spaceId=${resolvedParams.id} if your backend filters it, or maybe we just use getFeed?
      // Wait, we didn't add a specific GET /spaces/:id/posts endpoint. The main feed only returns posts if spaceId is null or user is member.
      // But we want ONLY posts from this space. We should update the backend or just create a specific endpoint.
      // Let's assume we update PostsController to support ?spaceId=...
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts?spaceId=${resolvedParams.id}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSpace();
    fetchPosts();
  }, [resolvedParams.id]);

  const handleJoinRequest = async () => {
    if (!isAuthenticated) return router.push("/login");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/request-join`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Joined successfully!", "success");
        setSpace((prev: any) => ({
          ...prev,
          _count: { ...prev._count, members: (prev._count?.members || 0) + 1 },
          members: [{ userId: user?.id, status: 'ACTIVE', role: 'MEMBER' }]
        }));
        fetchSpace();
      } else {
        const error = await res.json();
        addToast(error.message || "Failed to join", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    }
  };

  const handleLeaveSpace = async () => {
    if (!isAuthenticated) return router.push("/login");
    if (!confirm("Are you sure you want to leave this space?")) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/leave`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Left the space", "success");
        setSpace((prev: any) => ({
          ...prev,
          _count: { ...prev._count, members: Math.max(0, (prev._count?.members || 0) - 1) },
          members: []
        }));
        fetchSpace();
      } else {
        const error = await res.json();
        addToast(error.message || "Failed to leave space", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    }
  };

  const handleAppealSuspension = async () => {
    if (!isAuthenticated) return router.push("/login");
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/appeal`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Appeal submitted to moderators", "success");
      } else {
        const error = await res.json();
        addToast(error.message || "Failed to submit appeal", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading space...</div>;
  if (!space) return <div className="p-8 text-center">Space not found</div>;

  const isMember = space.members && space.members.length > 0 && space.members[0].status === 'ACTIVE';
  const isPending = space.members && space.members.length > 0 && space.members[0].status === 'PENDING';
  const isSuspended = space.members && space.members.length > 0 && space.members[0].status === 'SUSPENDED';
  const isAppealed = space.members && space.members.length > 0 && space.members[0].status === 'APPEALED';

  return (
    <div className="w-full max-w-[650px] mx-auto min-h-screen pb-20 relative">
      <div className="relative h-48 sm:h-64 w-full bg-muted">
        {space.coverUrl ? (
          <Image src={space.coverUrl} alt={space.name} layout="fill" objectFit="cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#3BC492]/20 to-primary/10"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-md font-geistMono">{space.name}</h1>
            <p className="text-white/80 font-medium drop-shadow-sm flex items-center gap-1.5 font-geistMono text-xs tracking-wide">
              {space._count?.members || 0} Members • 
              <span className="capitalize text-white/70">{space.type.toLowerCase()}</span>
            </p>
          </div>
          <div>
            {!isMember ? (
              isSuspended ? (
                <div className="flex flex-col items-end gap-2">
                  <button 
                    onClick={handleAppealSuspension}
                    className="bg-yellow-500 text-black font-bold px-6 py-2 rounded-full hover:bg-yellow-400 transition-colors"
                  >
                    Appeal Suspension
                  </button>
                  {space.members[0].suspendReason && (
                    <p className="text-xs text-red-400 max-w-[200px] text-right">
                      Reason: {space.members[0].suspendReason}
                    </p>
                  )}
                </div>
              ) : isAppealed ? (
                <button 
                  disabled
                  className="bg-yellow-500/50 text-black/50 font-bold px-6 py-2 rounded-full cursor-not-allowed"
                >
                  Appeal Pending Review
                </button>
              ) : (
                <button 
                  onClick={handleJoinRequest}
                  disabled={isPending}
                  className="bg-[#3BC492] text-black font-bold px-6 py-2 rounded-full hover:bg-[#3BC492]/90 disabled:opacity-50"
                >
                  {isPending ? "Pending..." : "Join Space"}
                </button>
              )
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={handleLeaveSpace}
                  className="bg-black/40 text-red-400 border border-red-500/30 font-bold px-4 py-2 rounded-full hover:bg-red-500/20 backdrop-blur-md transition-colors"
                >
                  Leave Space
                </button>
                {space.members[0].role === 'MODERATOR' && (
                  <button onClick={() => router.push(`/spaces/${space.id}/members`)} className="bg-secondary text-secondary-foreground font-bold px-4 py-2 rounded-full hover:bg-secondary/80 backdrop-blur-md">
                    Manage
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-border">
        <p className="text-[15px]">{space.description || "Welcome to " + space.name}</p>
      </div>

      {isMember && (
        <div className="p-4 border-b border-border">
          <CreatePost spaceId={space.id} onPostCreated={fetchPosts} />
        </div>
      )}

      <div className="flex flex-col">
        {posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No posts in this space yet.</div>
        ) : (
          posts.map(post => (
            <PostCard 
              key={post.id}
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
              mediaUrls={post.mediaUrls}
              thumbnailUrl={post.thumbnailUrl}
              onDelete={() => fetchPosts()}
            />
          ))
        )}
      </div>
    </div>
  );
}
