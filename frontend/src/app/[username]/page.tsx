"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import { useUserStore } from "@/store/useUserStore";
import { useFollowStore } from "@/store/useFollowStore";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params.username as string;
  const username = decodeURIComponent(rawUsername).replace('@', ''); // handle /@username

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [replies, setReplies] = useState<any[]>([]);
  const [likes, setLikes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState("posts"); // posts, replies, likes
  const [followLoading, setFollowLoading] = useState(false);

  const globalFollowState = useFollowStore(s => s.followMap[username]);
  const followingChangeCount = useFollowStore(s => s.followingChangeCount);
  const setFollow = useFollowStore(s => s.setFollow);
  const isFollowing = globalFollowState ?? (profile?.isFollowing || false);

  useEffect(() => {
    if (profile && globalFollowState !== undefined && globalFollowState !== profile.isFollowing) {
      setProfile((prev: any) => ({
        ...prev,
        isFollowing: globalFollowState,
        followers: prev.followers + (globalFollowState ? 1 : -1)
      }));
    }
  }, [globalFollowState, profile?.isFollowing]);

  const currentUser = useUserStore((state) => state.user);

  const prevChangeCountRef = useRef(followingChangeCount);
  useEffect(() => {
    if (followingChangeCount !== prevChangeCountRef.current) {
      const diff = followingChangeCount - prevChangeCountRef.current;
      if (currentUser?.username === profile?.username && profile) {
        setProfile((prev: any) => ({ ...prev, following: prev.following + diff }));
      }
      prevChangeCountRef.current = followingChangeCount;
    }
  }, [followingChangeCount, currentUser?.username, profile?.username, profile]);

  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        setError(false);
        const token = localStorage.getItem("access_token");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Fetch profile
        const profileRes = await fetch(`http://localhost:3001/users/profile/${username}`, { headers });
        if (!profileRes.ok) throw new Error("Profile not found");
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch posts, replies, and likes concurrently
        const [postsRes, repliesRes, likesRes] = await Promise.all([
          fetch(`http://localhost:3001/posts/user/${username}`, { headers }),
          fetch(`http://localhost:3001/posts/user/${username}/replies`, { headers }),
          fetch(`http://localhost:3001/posts/user/${username}/likes`, { headers })
        ]);

        if (postsRes.ok) setPosts(await postsRes.json());
        if (repliesRes.ok) setReplies(await repliesRes.json());
        if (likesRes.ok) setLikes(await likesRes.json());
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchProfileData();
    }
  }, [username]);

  const handleDelete = (id: number) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    setReplies(prev => prev.filter(p => p.id !== id));
    setLikes(prev => prev.filter(p => p.id !== id));
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-screen p-8 flex justify-center mt-10">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-24 h-24 bg-muted rounded-full mb-4"></div>
          <div className="h-6 w-32 bg-muted rounded mb-2"></div>
          <div className="h-4 w-48 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex-1 min-h-screen p-8 flex flex-col items-center justify-center text-muted-foreground">
        <h2 className="text-2xl font-bold mb-2">Profile not found</h2>
        <p>The user @{username} doesn't exist or may have been deleted.</p>
        <button onClick={() => router.push('/')} className="mt-6 text-[#3BC492] hover:underline">
          Go back home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.username === profile.username;
  
  // Format join date safely
  const joinDate = profile.createdAt 
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Unknown';

  const location = profile.country || profile.state 
    ? `${profile.state ? profile.state + ', ' : ''}${profile.country || ''}`
    : null;

  return (
    <main className="flex-1 min-h-screen pb-20 relative">
      {/* Substack-style Cover / Profile Header Area */}
      <div className="w-full bg-gradient-to-b from-muted/50 to-background relative px-6 py-12 border-b border-border flex justify-between items-center">
        
        {/* Left Side: Profile Info & Action */}
        <div className="flex-1 max-w-xl z-10 pr-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{profile.name}</h1>
          <p className="text-muted-foreground text-[15px] mb-4">@{profile.username}</p>
          
          <div className="mb-4 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {profile.bio || profile.occupation || "No bio yet."}
          </div>

          <div className="flex flex-wrap gap-4 text-[14px] text-muted-foreground mb-6">
            {location && (
              <div className="flex items-center gap-1.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                {location}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              Joined {joinDate}
            </div>
          </div>
          
          <div className="flex gap-4 text-[14px] text-muted-foreground mb-8">
            <div className="hover:underline cursor-pointer" onClick={() => router.push(`/@${profile.username}/following`)}>
              <span className="font-bold text-foreground">{profile.following}</span> Following
            </div>
            <div className="hover:underline cursor-pointer" onClick={() => router.push(`/@${profile.username}/followers`)}>
              <span className="font-bold text-foreground">{profile.followers}</span> Followers
            </div>
          </div>

          <div>
            {isOwnProfile ? (
              <button 
                onClick={() => router.push('/profile/edit')}
                className="px-6 py-2 rounded-full border border-border font-bold hover:bg-muted transition-colors text-[14px]"
              >
                Edit profile
              </button>
            ) : (
              <button 
                onClick={async () => {
                  if (!currentUser) {
                    router.push('/login');
                    return;
                  }
                  setFollowLoading(true);
                  try {
                    const token = localStorage.getItem('access_token');
                    const method = isFollowing ? 'DELETE' : 'POST';
                    const res = await fetch(`http://localhost:3001/users/${profile.username}/follow`, {
                      method,
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                      setFollow(profile.username, !isFollowing);
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setFollowLoading(false);
                  }
                }}
                disabled={followLoading}
                className={`px-8 py-2 rounded-full font-bold transition-opacity text-[15px] ${isFollowing ? 'border border-border text-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'bg-[#3BC492] text-white hover:opacity-90'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Avatar inside the cover */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-muted overflow-hidden flex-shrink-0 z-10 shadow-lg relative">
          <img 
            src={profile.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.username}`} 
            alt={profile.name} 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Cover Image Background */}
        {profile.coverUrl && (
          <img src={profile.coverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover z-0 opacity-40" />
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {['posts', 'replies', 'likes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 text-center font-bold text-[15px] transition-colors hover:bg-muted/50 relative ${
              activeTab === tab ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <motion.div
                layoutId="profileTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-1 bg-[#3BC492] rounded-t-full mx-auto w-12"
              />
            )}
          </button>
        ))}
      </div>

      {/* Feed Content */}
      <div className="divide-y divide-border">
        {activeTab === 'posts' && (
          posts.length > 0 ? (
            posts.map((post: any) => (
              <PostCard 
                key={post.id} 
                id={post.id}
                author={{
                  name: post.author.firstName || post.author.username,
                  username: post.author.username,
                  avatarUrl: post.author.avatarUrl,
                  isFollowing: post.author.isFollowing
                }}
                content={post.content} 
                earned={post.earned}
                stats={post.stats}
                userInteractions={post.userInteractions}
                quotedPost={post.quotedPost}
                reselaedBy={post.reselaedBy}
                onDelete={handleDelete}
                onUnresela={(id) => {
                  if (post.reselaedBy === profile.username) {
                    setPosts(posts.filter((p: any) => p.id !== id));
                  }
                }}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              @{profile.username} hasn't posted anything yet.
            </div>
          )
        )}

        {activeTab === 'replies' && (
          replies.length > 0 ? (
            replies.map((post: any) => (
              <PostCard 
                key={post.id} 
                id={post.id}
                author={{
                  name: post.author.firstName || post.author.username,
                  username: post.author.username,
                  avatarUrl: post.author.avatarUrl,
                  isFollowing: post.author.isFollowing
                }}
                content={post.content} 
                earned={post.earned}
                stats={post.stats}
                userInteractions={post.userInteractions}
                quotedPost={post.quotedPost}
                parentPost={post.parent}
                isReplyContext={true}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              @{profile.username} hasn't replied to anything yet.
            </div>
          )
        )}

        {activeTab === 'likes' && (
          likes.length > 0 ? (
            likes.map((post: any) => (
              <PostCard 
                key={post.id} 
                id={post.id}
                author={{
                  name: post.author.firstName || post.author.username,
                  username: post.author.username,
                  avatarUrl: post.author.avatarUrl,
                  isFollowing: post.author.isFollowing
                }}
                content={post.content} 
                earned={post.earned}
                stats={post.stats}
                userInteractions={post.userInteractions}
                quotedPost={post.quotedPost}
                onDelete={handleDelete}
                onUnlike={(id) => setLikes((prev) => prev.filter(p => p.id !== id))}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              @{profile.username} hasn't liked any posts yet.
            </div>
          )
        )}
      </div>

    </main>
  );
}
