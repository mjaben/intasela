"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { useUserStore } from "@/store/useUserStore";
import { useToastStore } from "@/store/useToastStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Settings } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";

export default function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"POSTS" | "PENDING">("POSTS");
  const [showPendingAlert, setShowPendingAlert] = useState(false);
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
          addToast("You do not have access to this private space.", "error");
          router.push('/spaces');
          return;
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts?spaceId=${resolvedParams.id}`, { headers });
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = await res.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPendingPosts = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/pending-posts`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setPendingPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSpaceMembers = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const headers: Record<string, string> = token ? { "Authorization": `Bearer ${token}` } : {};
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/spaces/${resolvedParams.id}/members`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setSpaceMembers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSpace();
    fetchPosts();
    fetchSpaceMembers();
    fetchPendingPosts();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (!space || pendingPosts.length === 0) return;
    const isMod = space.members && space.members.length > 0 && (space.members[0].role === 'MODERATOR' || space.members[0].role === 'ADMIN');
    if (!isMod) return;

    const todayDate = new Date().toDateString();
    const storageKey = `pendingAlert_${space.id}`;
    let stored;
    try {
      stored = JSON.parse(localStorage.getItem(storageKey) || '{"date": "", "count": 0, "lastSeenCount": 0}');
    } catch {
      stored = { date: "", count: 0, lastSeenCount: 0 };
    }

    if (stored.date !== todayDate) {
      stored.count = 0;
      stored.date = todayDate;
    }

    if (pendingPosts.length > stored.lastSeenCount && stored.count < 5) {
      setShowPendingAlert(true);
      stored.count += 1;
      stored.lastSeenCount = pendingPosts.length;
      localStorage.setItem(storageKey, JSON.stringify(stored));

      const timer = setTimeout(() => {
        setShowPendingAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      if (pendingPosts.length !== stored.lastSeenCount) {
        stored.lastSeenCount = pendingPosts.length;
        localStorage.setItem(storageKey, JSON.stringify(stored));
      }
    }
  }, [pendingPosts.length, space]);

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

  const handleApprovePost = async (postId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${postId}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Post approved successfully", "success");
        fetchPendingPosts();
        fetchPosts();
      } else {
        const error = await res.json().catch(() => ({ message: "Failed to approve post" }));
        addToast(error.message || "Failed to approve post", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("An error occurred", "error");
    }
  };

  const handleRejectPost = async (postId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${postId}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        addToast("Post rejected", "success");
        fetchPendingPosts();
      } else {
        const error = await res.json().catch(() => ({ message: "Failed to reject post" }));
        addToast(error.message || "Failed to reject post", "error");
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
            <div className="flex items-center gap-3 mt-1">
              <AvatarGroup>
                {spaceMembers.slice(0, 3).map((member) => (
                  <Avatar key={member.id} className="border-2 border-black">
                    <AvatarImage src={member.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user.username}`} alt={`@${member.user.username}`} />
                    <AvatarFallback>{(member.user.firstName?.[0] || member.user.username?.[0] || '?').toUpperCase()}</AvatarFallback>
                  </Avatar>
                ))}
                {(space._count?.members || 0) > 3 && (
                  <AvatarGroupCount className="border-2 border-black bg-black/60 text-white backdrop-blur-md">
                    +{(space._count?.members || 0) - 3}
                  </AvatarGroupCount>
                )}
                {(space._count?.members || 0) <= 3 && (space._count?.members || 0) > 0 && (
                  <AvatarGroupCount className="border-2 border-black bg-black/60 text-white backdrop-blur-md">
                    {space._count?.members}
                  </AvatarGroupCount>
                )}
              </AvatarGroup>
              <p className="text-white/80 font-medium drop-shadow-sm flex items-center gap-1.5 font-geistMono text-xs tracking-wide">
                • <span className="capitalize text-white/70">{space.type.toLowerCase()}</span>
              </p>
            </div>
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="bg-black/40 text-red-400 border border-red-500/30 font-bold px-4 py-2 rounded-full hover:bg-red-500/20 backdrop-blur-md transition-colors">
                      Leave Space
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogMedia className="bg-red-500/10 text-red-500">
                        <AlertTriangle />
                      </AlertDialogMedia>
                      <AlertDialogTitle>Leave this space?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to leave this space? If it is a private space, you will need an invitation to rejoin.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={(e) => { e.preventDefault(); handleLeaveSpace(); }}>
                        Leave Space
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {space.members[0].role === 'MODERATOR' && (
                  <button 
                    onClick={() => router.push(`/spaces/${space.id}/members`)} 
                    className="flex items-center gap-2 bg-secondary text-secondary-foreground font-bold px-5 py-2 rounded-full hover:bg-secondary/80 backdrop-blur-md transform hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shadow-md"
                  >
                    <Settings className="w-4 h-4" /> Manage
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

      {space.members && space.members.length > 0 && (space.members[0].role === 'MODERATOR' || space.members[0].role === 'ADMIN') && (
        <div className="flex border-b border-border text-sm font-bold">
          <button 
            className={`flex-1 py-4 hover:bg-white/5 transition-colors ${activeTab === 'POSTS' ? 'text-white border-b-2 border-brand' : 'text-gray-500'}`}
            onClick={() => setActiveTab('POSTS')}
          >
            Selas
          </button>
          <button 
            className={`flex-1 py-4 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 ${activeTab === 'PENDING' ? 'text-white border-b-2 border-brand' : 'text-gray-500'}`}
            onClick={() => setActiveTab('PENDING')}
          >
            Pending Approvals
            {pendingPosts.length > 0 && (
              <span className="bg-[#3BC492] text-black text-[10px] px-1.5 py-0.5 rounded-full">{pendingPosts.length}</span>
            )}
          </button>
        </div>
      )}

      {space.members && space.members.length > 0 && (space.members[0].role === 'MODERATOR' || space.members[0].role === 'ADMIN') && showPendingAlert && activeTab === 'POSTS' && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 m-4 p-3 rounded-lg flex items-center justify-between text-yellow-500 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            There are {pendingPosts.length} pending selas awaiting your approval.
          </div>
          <button onClick={() => setActiveTab('PENDING')} className="bg-yellow-500 text-black px-3 py-1.5 rounded-full font-bold hover:bg-yellow-400">
            Review
          </button>
        </div>
      )}

      <div className="flex flex-col">
        {activeTab === 'POSTS' ? (
          posts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No selas in this space yet.</div>
          ) : (
            posts.map(post => {
              const postAuthorRole = spaceMembers.find(m => m.user?.username === post.author.username)?.role;
              return (
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
                  mediaType={post.mediaType}
                  mediaUrl={post.mediaUrl}
                  mediaUrls={post.mediaUrls}
                  thumbnailUrl={post.thumbnailUrl}
                  approvalStatus={post.approvalStatus}
                  authorRole={postAuthorRole}
                  onDelete={() => fetchPosts()}
                />
              );
            })
        )
      ) : (
        pendingPosts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No pending selas to review.</div>
        ) : (
          pendingPosts.map(post => {
            const postAuthorRole = spaceMembers.find(m => m.user?.username === post.author.username)?.role;
            return (
              <div key={post.id} className="relative border-b border-border group">
                <PostCard 
                  id={post.id}
createdAt={post.createdAt}
                  author={{
                    name: post.author.firstName || post.author.username,
                    username: post.author.username,
                    avatarUrl: post.author.avatarUrl
                  }}
                  content={post.content}
                  stats={{ likes: 0, reselas: 0, replies: 0, views: 0 }}
                  approvalStatus={post.approvalStatus}
                  authorRole={postAuthorRole}
                />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1 rounded-md backdrop-blur-sm z-10">
                  <button onClick={() => handleApprovePost(post.id)} className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded">Approve</button>
                  <button onClick={() => handleRejectPost(post.id)} className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded">Reject</button>
                </div>
              </div>
            );
          })
        )
      )}
      </div>
    </div>
  );
}
