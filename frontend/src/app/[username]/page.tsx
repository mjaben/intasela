"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import PostCard from "@/components/PostCard";
import { useUserStore } from "@/store/useUserStore";
import { useFollowStore } from "@/store/useFollowStore";
import { motion } from "framer-motion";
import PostSkeleton from "@/components/PostSkeleton";
import ErrorState from "@/components/ErrorState";

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
  const [activeTab, setActiveTab] = useState("posts"); // posts, replies, reselas, likes, orbit
  const [selaFilter, setSelaFilter] = useState<"all" | "sela">("all");
  const [selaFilterOpen, setSelaFilterOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const touchStartX = useRef<number | null>(null);

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
        const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/profile/${username}`, { headers });
        if (!profileRes.ok) throw new Error("Profile not found");
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch posts, replies, and likes concurrently
        const [postsRes, repliesRes, likesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/user/${username}`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/user/${username}/replies`, { headers }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/user/${username}/likes`, { headers })
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
      <div className="w-full max-w-[650px] mx-auto min-h-screen pt-4">
        <div className="flex flex-col gap-4 px-4 pb-8 border-b border-border">
          <div className="flex items-center gap-4 animate-pulse pt-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-muted/60 shrink-0 border-4 border-background" />
            <div className="space-y-3 flex-1">
              <div className="h-8 bg-muted/60 rounded-md w-1/3" />
              <div className="h-5 bg-muted/60 rounded-md w-1/4" />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {[1, 2, 3, 4, 5].map((i) => (
            <PostSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-[650px] mx-auto min-h-screen pt-4">
        <ErrorState 
          message={`Failed to load profile for @${username}.`}
          onRetry={() => window.location.reload()}
          fullHeight={true}
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 min-h-screen p-8 flex flex-col items-center justify-center text-gray-400 bg-background">
        <h2 className="text-2xl font-bold mb-2 text-white">Profile not found</h2>
        <p>The user @{username} doesn't exist or may have been deleted.</p>
        <button onClick={() => router.push('/')} className="mt-6 text-[#ACC8A2] hover:underline font-bold">
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    const tabs = ["posts", "replies", "reselas", "likes", "orbit"];
    const currentIndex = tabs.indexOf(activeTab);

    let newTab = activeTab;

    // Swipe left (next tab)
    if (diff > 50 && currentIndex < tabs.length - 1) {
      newTab = tabs[currentIndex + 1];
    }
    // Swipe right (prev tab)
    else if (diff < -50 && currentIndex > 0) {
      newTab = tabs[currentIndex - 1];
    }

    if (newTab !== activeTab) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
      setActiveTab(newTab);
    }
    touchStartX.current = null;
  };

  const selaFeedPosts = posts.filter((post) => {
    if (selaFilter === "all") return true;
    return !post.parent && !post.reselaedBy;
  });

  const reselaPosts = posts.filter(post => post.reselaedBy === profile.username);

  const orbitVideos = posts.filter(post => post.mediaType === "VIDEO");

  return (
    <main 
      className="flex-1 min-h-screen relative bg-background overflow-x-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Substack-style Cover / Profile Header Area */}
      <div className="w-full bg-gradient-to-b from-white/10 to-background relative px-6 py-12 border-b border-white/10 flex justify-between items-center">
        
        {/* Left Side: Profile Info & Action */}
        <div className="flex-1 max-w-xl z-10 pr-6">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 text-white">{profile.name}</h1>
          <p className="text-gray-400 text-[15px] mb-4">@{profile.username}</p>
          
          <div className="mb-4 text-[15px] leading-relaxed text-gray-200 whitespace-pre-wrap">
            {profile.bio || profile.occupation || "No bio yet."}
          </div>

          <div className="flex flex-wrap gap-4 text-[14px] text-gray-400 mb-6">
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
          
          <div className="flex gap-4 text-[14px] text-gray-400 mb-8">
            <div className="hover:underline cursor-pointer" onClick={() => router.push(`/@${profile.username}/following`)}>
              <span className="font-bold text-white">{profile.followingCount ?? profile.following}</span> Following
            </div>
            <div className="hover:underline cursor-pointer" onClick={() => router.push(`/@${profile.username}/followers`)}>
              <span className="font-bold text-white">{profile.followers}</span> Followers
            </div>
          </div>

          <div>
            {isOwnProfile ? (
              <button 
                onClick={() => router.push('/profile/edit')}
                className="px-6 py-2 rounded-full border border-white/10 text-white font-bold hover:bg-white/5 transition-colors text-[14px]"
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
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${profile.username}/follow`, {
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
                className={`px-8 py-2 rounded-full font-bold transition-opacity text-[15px] ${isFollowing ? 'border border-white/10 text-white hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' : 'bg-[#ACC8A2] text-[#1A2517] hover:opacity-90'}`}
              >
                {isFollowing ? 'Following' : (profile.isFollower ? 'Follow Back' : 'Follow')}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Avatar inside the cover */}
        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-white/5 overflow-hidden flex-shrink-0 z-10 shadow-lg relative">
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
      <div className="flex border-b border-white/10 overflow-x-auto no-scrollbar">
        {[
          {
            id: 'posts', 
            label: 'Sela',
            icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAADGUlEQVR4nO2Zu2sVQRSHPxOTImpIETVpIlj5wj9BV73aqCQ+wtUIdkHEJySVKX0gonZq6xUNqRJLg0WwsfZt4hO7oIRAJOgVzJWB38oQdvfu3ruv4v5git09M3O+nZkzwxloqKGG4lArcAwYAz4Ci0AlobIIfFBfRfUdi44CXxJ0vFr5DByuB6AZuGk1+AI4C2wC2khObcBm4Jz6dPu/ATTV0qAL8QsYrLWROtUEnAJ+WzCRdMSC2EH22mnBHApbqVXzsqKRyItOy6dPYQNA0VoTWUynoDX7Sr71E0JjMjYLO2+6IN8ehTGekbGJHF7aAkwAT33KKNCzrE4nUAqoY5eJgL63yrfpMCA/Zbza5/vjELH/K7DBqnM94t4x4dP3Gn1fCAPiNuanKX0fAgrLyl7guQeMu+5MmQNOetQ1ZUg2U3X4FxnE8fne7gPTC3zX+1mf+k6eQIJguoAnel/WSOUaJAjGhNE7ev932V7l5BEkCMboErAkmGKWILvDNFYFZsSaZgYiVZCStfN3xgBz1woAA2mCrAfexQhj1syk3v9IE8RoHfBGdi8jwKwCnqneN2Cj1Z4ZkUraIG4ojXNk+qy+SzH4F94wAZgTwC1gbRz+VTM00+A2cDwhmGqKDeSBZWOmQ9owlbj3ETfKdCcUAFIDcUPlpEJonCPTkybIgBUy71nf44AZTRPEUXajrOeRGGB2ZXloLOrgt+QB8z4ijJP16XdQMBWdnZprhHGyBnFHpmwFgO4aYJw8gKA1M2tFtb6IME4WIF7Jh4ISC3NWO0UfmH1JJx8WZGhSL7Wmg+xiUkF4wNSSDmqPkg5yE3QmGeYlkzwbD5lsK3kcALuqJOvGAxJ02+Sb+RlV9VDGF8mfhkIc8/+rX8avrTCaBzUDb+Wbufaoqhbd4ZkKZ8iPzsunGfkYSr3aqc2+sIfsVZAvxqcDUStf0x8o6z4vi2m2UlcJf+TLlVoaMZc8V/UXKjoEDgPbgQ6SU4f6GLYOnsaHy8CKeho+aIXkLMo0sD+uv9SiS8iSIsd8go7Pq4/76tNMr4Yaaoj69A9vwTyZmjM3rwAAAABJRU5ErkJggg=="
          }, 
          {
            id: 'replies', 
            label: 'Replies',
            svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          }, 
          {
            id: 'reselas', 
            label: 'Resela',
            svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
          }, 
          {
            id: 'likes', 
            label: 'Likes',
            svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          },
          {
            id: 'orbit',
            label: 'Orbit',
            svg: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
          }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);
                setActiveTab(tab.id);
              }}
              className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-[15px] transition-colors hover:bg-white/5 relative overflow-hidden min-w-[70px] shrink-0 ${
                isActive ? "text-white" : "text-gray-400"
              }`}
            >
              <div className={`w-[18px] h-[18px] shrink-0 transition-transform duration-300 flex items-center justify-center ${isActive ? "scale-100" : "scale-90"}`}>
                {tab.icon ? (
                  <img 
                    src={tab.icon} 
                    alt={tab.label} 
                    className={`w-full h-full object-contain brightness-0 invert ${isActive ? "opacity-100" : "opacity-60"}`} 
                  />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${isActive ? "text-white" : "text-gray-400 opacity-80"}`}>
                    {tab.svg}
                  </div>
                )}
              </div>
              
              <div className={`transition-all duration-300 ease-out overflow-hidden flex items-center ${isActive ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"}`}>
                <span className="text-[14px] whitespace-nowrap">
                  {tab.label}
                </span>
              </div>

              {isActive && (
                <motion.div
                  layoutId="profileTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#ACC8A2] rounded-t-full mx-auto w-12"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Feed Content */}
      <div className="divide-y divide-white/10 pb-20">
        {activeTab === 'posts' && (
          <div className="flex flex-col">
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/5 relative z-30">
              <span className="text-[13px] font-bold text-white/50 tracking-wider font-mono uppercase">Showing</span>
              <div className="relative">
                <button 
                  onClick={() => setSelaFilterOpen(!selaFilterOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[13px] rounded-full px-4 py-1.5 transition-all outline-none focus:ring-1 focus:ring-[#ACC8A2]/50 font-medium"
                >
                  {selaFilter === "all" ? "All Activity" : "Selas Only"}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${selaFilterOpen ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>

                {selaFilterOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSelaFilterOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-[#1A2517]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex flex-col py-1.5">
                        <button 
                          onClick={() => { setSelaFilter("all"); setSelaFilterOpen(false); }}
                          className={`flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/5 ${selaFilter === "all" ? "text-[#ACC8A2]" : "text-white/80"}`}
                        >
                          All Activity
                          {selaFilter === "all" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </button>
                        <button 
                          onClick={() => { setSelaFilter("sela"); setSelaFilterOpen(false); }}
                          className={`flex items-center justify-between px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-white/5 ${selaFilter === "sela" ? "text-[#ACC8A2]" : "text-white/80"}`}
                        >
                          Selas Only
                          {selaFilter === "sela" && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {selaFeedPosts.length > 0 ? (
              selaFeedPosts.map((post: any) => (
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
                reselaedBy={post.reselaedBy}
                mediaType={post.mediaType}
                mediaUrl={post.mediaUrl}
                mediaUrls={post.mediaUrls}
                thumbnailUrl={post.thumbnailUrl}
                onDelete={handleDelete}
                onUnresela={(id) => {
                  if (post.reselaedBy === profile.username) {
                    setPosts(posts.filter((p: any) => p.id !== id));
                  }
                }}
              />
            ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                @{profile.username} hasn't dropped any selas yet.
              </div>
            )}
          </div>
        )}

        {activeTab === 'replies' && (
          replies.length > 0 ? (
            replies.map((post: any) => (
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
                isReplyContext={true}
                mediaType={post.mediaType}
                mediaUrl={post.mediaUrl}
                mediaUrls={post.mediaUrls}
                thumbnailUrl={post.thumbnailUrl}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              @{profile.username} hasn't replied to anything yet.
            </div>
          )
        )}

        {activeTab === 'reselas' && (
          reselaPosts.length > 0 ? (
            reselaPosts.map((post: any) => (
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
                reselaedBy={post.reselaedBy}
                mediaType={post.mediaType}
                mediaUrl={post.mediaUrl}
                mediaUrls={post.mediaUrls}
                thumbnailUrl={post.thumbnailUrl}
                onDelete={handleDelete}
                onUnresela={(id) => {
                  if (post.reselaedBy === profile.username) {
                    setPosts(posts.filter((p: any) => p.id !== id));
                  }
                }}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              @{profile.username} hasn't reselaed anything yet.
            </div>
          )
        )}

        {activeTab === 'likes' && (
          likes.length > 0 ? (
            likes.map((post: any) => (
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
                mediaType={post.mediaType}
                mediaUrl={post.mediaUrl}
                mediaUrls={post.mediaUrls}
                thumbnailUrl={post.thumbnailUrl}
                onDelete={handleDelete}
                onUnlike={(id) => setLikes((prev) => prev.filter(p => p.id !== id))}
              />
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              @{profile.username} hasn't liked any selas yet.
            </div>
          )
        )}

        {activeTab === 'orbit' && (
          orbitVideos.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 p-1">
              {orbitVideos.map((video: any) => (
                <div 
                  key={video.id} 
                  className="aspect-[9/16] relative bg-white/5 cursor-pointer group overflow-hidden"
                  onClick={() => router.push(`/orbit?videoId=${video.id}`)}
                >
                  <img 
                    src={video.thumbnailUrl || video.mediaUrl} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt="Video thumbnail"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100" />
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 z-10">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span className="text-white text-[12px] font-bold shadow-sm">
                      {video.stats?.views ? (video.stats.views > 1000 ? `${(video.stats.views/1000).toFixed(1)}K` : video.stats.views) : 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400">
              @{profile.username} hasn't posted any Orbit videos yet.
            </div>
          )
        )}
      </div>

    </main>
  );
}
