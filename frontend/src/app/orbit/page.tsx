"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useFollowStore } from "@/store/useFollowStore";
import { useBlockMuteStore } from "@/store/useBlockMuteStore";
import { useToastStore } from "@/store/useToastStore";

function OrbitContent() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedType, setFeedType] = useState<'for_you' | 'following'>('for_you');
  const router = useRouter();
  const searchParams = useSearchParams();
  const videoId = searchParams.get('videoId');

  useEffect(() => {
    const fetchOrbitPosts = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        let url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/orbit?type=${feedType}`;
        if (videoId) {
          url += `&videoId=${videoId}`;
        }

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to fetch orbit posts", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrbitPosts();
  }, [feedType, videoId]);

  return (
    <div className="w-full h-screen bg-background overflow-y-scroll snap-y snap-mandatory relative no-scrollbar" style={{ height: '100dvh' }}>
      {/* Back button or Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4 bg-black/30 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-lg">
        <button onClick={() => router.push("/")} className="text-white hover:text-gray-300 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      </div>

      {/* Tabs Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6">
        <button 
          onClick={() => setFeedType('following')} 
          className={`text-[16px] font-bold drop-shadow-md transition-colors ${feedType === 'following' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
        >
          Following
          {feedType === 'following' && <div className="h-[3px] w-4 bg-white mx-auto mt-1 rounded-full"></div>}
        </button>
        <span className="text-white/40 drop-shadow-md font-bold text-[14px]">|</span>
        <button 
          onClick={() => setFeedType('for_you')} 
          className={`text-[16px] font-bold drop-shadow-md transition-colors ${feedType === 'for_you' ? 'text-white' : 'text-white/60 hover:text-white/80'}`}
        >
          For You
          {feedType === 'for_you' && <div className="h-[3px] w-4 bg-white mx-auto mt-1 rounded-full"></div>}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full text-white">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="flex items-center justify-center h-full text-white">No videos yet.</div>
      ) : (
        posts.map((post) => (
          <OrbitPlayer key={post.id} post={post} />
        ))
      )}
    </div>
  );
}

function OrbitPlayer({ post }: { post: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const currentUser = useUserStore((state) => state.user);

  const globalFollowState = useFollowStore(s => s.followMap[post.author.username]);
  const setFollow = useFollowStore(s => s.setFollow);
  const isFollowing = globalFollowState ?? (post.author.isFollowing || false);

  const [isLiked, setIsLiked] = useState(post.userInteractions?.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);

  const [isReselaed, setIsReselaed] = useState(post.userInteractions?.isReselaed || false);
  const [reselaCount, setReselaCount] = useState(post.stats?.reselas || 0);
  
  const [isBookmarked, setIsBookmarked] = useState(post.userInteractions?.isBookmarked || false);
  const [bookmarkCount, setBookmarkCount] = useState(post.stats?.bookmarks || 0);
  const [views, setViews] = useState(post.stats?.views || 0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const isUserBlocked = useBlockMuteStore(s => s.isUserBlocked(post.author.username));
  const isUserMuted = useBlockMuteStore(s => s.isUserMuted(post.author.username));
  const isPostMuted = useBlockMuteStore(s => s.isPostMuted(post.id));
  const toggleBlockUser = useBlockMuteStore(s => s.toggleBlockUser);
  const toggleMuteUser = useBlockMuteStore(s => s.toggleMuteUser);
  const toggleMutePost = useBlockMuteStore(s => s.toggleMutePost);

  const addToast = useToastStore((state) => state.addToast);
  
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportReason, setSelectedReportReason] = useState("");
  
  const hasViewedRef = useRef(false);

  const handleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    toggleMuteUser({ username: post.author.username, name: post.author.name, avatarUrl: post.author.avatarUrl });
    addToast(isUserMuted ? `Unmuted @${post.author.username}` : `Muted @${post.author.username}`, "success");
    setShowOptionsMenu(false);
  };

  const handleBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    toggleBlockUser({ username: post.author.username, name: post.author.name, avatarUrl: post.author.avatarUrl });
    addToast(isUserBlocked ? `Unblocked @${post.author.username}` : `Blocked @${post.author.username}`, "success");
    setShowOptionsMenu(false);
  };

  const handleMutePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");
    toggleMutePost(post.id);
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
    addToast("Report submitted successfully", "success");
    setShowReportModal(false);
    setSelectedReportReason("");
  };

  const handleShareMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/@${post.author.username}/posts/${post.id}`);
    setCopySuccess(true);
    setTimeout(() => {
      setCopySuccess(false);
      setShowShareMenu(false);
    }, 2000);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");

    const newValue = !isLiked;
    setIsLiked(newValue);
    setLikeCount(newValue ? likeCount + 1 : likeCount - 1);

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${post.id}/engage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type: "LIKE" })
      });
    } catch (err) {
      setIsLiked(isLiked);
      setLikeCount(likeCount);
    }
  };

  const handleResela = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");

    const newValue = !isReselaed;
    setIsReselaed(newValue);
    setReselaCount(newValue ? reselaCount + 1 : reselaCount - 1);

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${post.id}/engage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type: "RESELA" })
      });
    } catch (err) {
      setIsReselaed(isReselaed);
      setReselaCount(reselaCount);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return router.push("/login");

    const newValue = !isBookmarked;
    setIsBookmarked(newValue);
    setBookmarkCount(newValue ? bookmarkCount + 1 : bookmarkCount - 1);

    try {
      const token = localStorage.getItem("access_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${post.id}/engage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ type: "BOOKMARK" })
      });
    } catch (err) {
      setIsBookmarked(isBookmarked);
      setBookmarkCount(bookmarkCount);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.error("Auto-play failed:", e));
            setIsPlaying(true);
            
            if (!hasViewedRef.current) {
              hasViewedRef.current = true;
              setViews((prev: number) => prev + 1);
              fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/posts/${post.id}/view`, { method: "POST" }).catch(() => {});
            }
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.6 } // Play when 60% of the video is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [post.id]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen snap-start snap-always flex items-center justify-center bg-transparent relative md:py-6"
      style={{ height: '100dvh' }}
    >
      {/* TikTok Style Container */}
      <div className="relative flex w-full h-full md:w-[350px] lg:w-[400px] md:h-full md:max-h-[850px] md:rounded-[20px]">
        
        {/* Video Box */}
        <div className="w-full h-full relative bg-transparent md:rounded-[20px] overflow-hidden flex items-center justify-center shadow-2xl">
          <video
            ref={videoRef}
            src={post.mediaUrl}
            poster={post.thumbnailUrl}
            className="w-full h-full object-cover cursor-pointer"
            loop
            playsInline
            onClick={togglePlay}
          />

          {/* Play/Pause Overlay Indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20" onClick={togglePlay}>
              <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md">
                <svg className="w-10 h-10 text-white opacity-90 pl-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          )}

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 w-full p-4 pb-6 pt-24 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-20">
            <div className="flex flex-col gap-2 max-w-[85%] md:max-w-full pointer-events-auto">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => router.push(`/@${post.author.username}`)}>
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-white/20 bg-black shadow-md">
                    <img src={post.author.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author.username}`} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-white font-bold text-[12px] drop-shadow-md hover:underline">@{post.author.username}</span>
                </div>
                {currentUser?.username !== post.author.username && !isFollowing && (
                  <button 
                    onClick={async (e) => { 
                      e.stopPropagation(); 
                      if(!isAuthenticated) return router.push("/login"); 
                      try {
                        const token = localStorage.getItem("access_token");
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${post.author.username}/follow`, {
                          method: "POST",
                          headers: { "Authorization": `Bearer ${token}` }
                        });
                        setFollow(post.author.username, true);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="ml-1 text-primary font-bold text-[10px] px-2 py-[2px] rounded-full border border-primary/40 hover:bg-primary/20 bg-black/40 backdrop-blur-md transition-colors uppercase tracking-wide whitespace-nowrap shadow-md pointer-events-auto"
                  >
                    {post.author.isFollower ? "Follow Back" : "Follow"}
                  </button>
                )}
              </div>
              <p className="text-white/90 text-[15px] leading-snug drop-shadow-md line-clamp-3">
                {post.content}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons (Overlay on mobile, Right side on desktop) */}
        <div className="absolute bottom-6 right-3 md:bottom-2 md:-right-[72px] flex flex-col gap-2 items-center z-30">

          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-white/10 md:bg-white/5 md:hover:bg-white/10 flex items-center justify-center backdrop-blur-md transition shadow-md">
              <div 
                className={`w-[20px] h-[20px] transition-colors ${isLiked ? 'bg-red-500' : 'bg-white'}`}
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
            <span className="text-white text-[13px] font-bold drop-shadow-md">{likeCount}</span>
          </button>

          {/* Resela */}
          <button onClick={handleResela} className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-white/10 md:bg-white/5 md:hover:bg-white/10 flex items-center justify-center backdrop-blur-md transition shadow-md">
              <div 
                className={`w-[20px] h-[20px] transition-colors ${isReselaed ? 'bg-[#3BC492]' : 'bg-white'}`}
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
            <span className="text-white text-[13px] font-bold drop-shadow-md">{reselaCount}</span>
          </button>

          {/* Comment */}
          <button className="flex flex-col items-center gap-1 group" onClick={() => router.push(`/@${post.author.username}/posts/${post.id}`)}>
            <div className="w-10 h-10 rounded-full bg-white/10 md:bg-white/5 md:hover:bg-white/10 flex items-center justify-center backdrop-blur-md transition shadow-md">
              <div 
                className="w-[20px] h-[20px] bg-white transition-opacity opacity-90 group-hover:opacity-100"
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
            <span className="text-white text-[13px] font-bold drop-shadow-md">{post.stats?.replies || 0}</span>
          </button>

          {/* Bookmark */}
          <button onClick={handleBookmark} className="flex flex-col items-center gap-1 group">
            <div className="w-10 h-10 rounded-full bg-white/10 md:bg-white/5 md:hover:bg-white/10 flex items-center justify-center backdrop-blur-md transition shadow-md">
              <div 
                className={`w-[20px] h-[20px] transition-colors ${isBookmarked ? 'bg-[#3BC492]' : 'bg-white'}`}
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
            <span className="text-white text-[13px] font-bold drop-shadow-md">{bookmarkCount}</span>
          </button>

          {/* Share */}
          <div className="relative">
            <button className="flex flex-col items-center gap-1 group" onClick={handleShareMenuClick}>
              <div className="w-10 h-10 rounded-full bg-white/10 md:bg-white/5 md:hover:bg-white/10 flex items-center justify-center backdrop-blur-md transition shadow-md">
                <div 
                  className="w-[20px] h-[20px] bg-white transition-opacity opacity-90 group-hover:opacity-100"
                  style={{
                    WebkitMaskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFeklEQVR4nO2YWWxVRRzGv57l9pw5M2dugRKogrUsoizWEoOpNKISyxJAG6MPRh5wQ1EIBoQoEhRlq1i2ihgpAtoGWVqWQheQQmmBspRSKtByH0xQY8pm771Ny9IxU69GiJR7j0QOSX/J5D7cZOZ8c87/P998QDvttHM30FHTlMler33UNI1LUVFR1wzDaODcrtI0bToAL1xOlMfjmWyahn/0qBGNWV9nivKynaL2VKWoOLBbrFm9QqQ9N7rRNI0GXVdehktRGaM5D/Tu5S8u2ix8dVU3HUWFeSIurmuAEDIDboMQsjApKTFw4vjBNkX4QuPQwRLRsWOHAIBhcBEDbMaChyv2hCXCFxrZ360UlmX9DECHG6CU5rw3ddK1SET4QiMxccDvAJ6FGyCE1O8q3hqxCF9dlZg7Z5awbTsPbkC217rTlY6EFBXmCcao/LzuPJqmXg63yH03jNpTR4WiKNfgBjhnvtyN2Xe/EMuysqZOmXjViZDt2zYISukvcAlPxcbGBp3UydsTXr9iWdZKuIA0AGc0TaufN2dWSyQi9pfvEoSQIIBeThYeZFO6xTCMS6qqXpWDMXqWUboOQCoAJcx5kgCUAPgRwHAAA4lpBnfkbwxLxPFj5aJ/vwf9pml+HKkAg1K6tkNMTOCjWe+3lO8r/rvYCrZvEh/OmNaScH98g2WRWgDJbcwjdy8bgPyuX5Me668/FEV5iVKrce3qr25ZF/Hx9/kptVZFsHGtaIyx0qFPDwm21SbP1B4TSxanC8siQV3XX71hjm4AVgCoB/CBPNBvstZQ0zTOpaQkBzKXLRRlpUVCrlm6p0Asz8wQqc88HZSWXtO08YgUSsnS5ORBQWmnw3ntO4u2CMaY/HZHSB8FYDWA8wDmAugQxpKGoijjOedlpmlc0DTtMjHN814v368oyltO7yM9CSGNRw5FbuhUVW0OfULT7vhliBAjY/wb46446fEDkxIbFUV5B26AMfrT5twcR6fusqWfCc7tfXADmqZdrqmucCRkb0mB7PPn4AIU6WOcOlPZ63Vdb4IbME3jogwAnAjZvWuboJT8BjcQE8NLv8j83JGQxRnzZY3I09sVjHtyyGC/EyH9+j3UCGCBvDv9x2fQb4cQkxCzPtLOlZOdJaKjoy8BqAZQA2ACADvMNWM9Hs9Mzu2Tuq41yTrVNK2Zc7smFNCFO8/1qKo6pnOnTv5wU459ewsF51ye7CNDUzwBYF3odF8EoPvN1pIBnWEYgRdfSGvK/nalqK7a3zqn/JUB3cgRqY1GdHSDfCZHYigh07t06RzI37r+lm/Cy7n0Q+/+yzRxANIByJYsDV+f69ag1qqEhPhAyQ/5ba6x4fs1wrZZUNeVcY7EqKr6vGmaF4elDg2u+HJxq6GTO7WnZEerWRz8+GN+0zTq//EmbkZMyDjKjrZMZr2GYUzv3btnoPr4gbBDB/LnXeRRxzdTRVEmeL3eMtM0z+u63ixriHMuu9Mr0vBFMJc0kEukI/Z49Ca5MZHU4YL5s1sYoyduQzO5PWialjVq1PCI/Vzd6UpxT1zXBgApcAOcMd+G9WsdnVVTp0y86pY7u3wjzU5zrdyN2ULGSXAD8pyQV2YnQmqqK+S95wrckv2W7N7uSEjtqUohI1e4Adum2z79ZKYjIYUFuYJS61e4hDE9eiT4ZXgRqZBJE9+UAd03cAkKY9ZJeS5EGtBRywrc6BDuNA8TQgJ5m8ILs48dLRN9+/aRAd1suA1VVUdKMUuXpLcpIm9Ttuje7V4/Y9bySAO6/5NHKLXq+vfv25A+f7Yo3JErjhze21rUizLmiZSUZOnnLui6MhZ3AXKX0zi38xljZ6OjPUGbsbOc82IAY9tIKdtppx2Exx/mJPtyEUXPCAAAAABJRU5ErkJggg==)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'center',
                    maskImage: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFeklEQVR4nO2YWWxVRRzGv57l9pw5M2dugRKogrUsoizWEoOpNKISyxJAG6MPRh5wQ1EIBoQoEhRlq1i2ihgpAtoGWVqWQheQQmmBspRSKtByH0xQY8pm771Ny9IxU69GiJR7j0QOSX/J5D7cZOZ8c87/P998QDvttHM30FHTlMler33UNI1LUVFR1wzDaODcrtI0bToAL1xOlMfjmWyahn/0qBGNWV9nivKynaL2VKWoOLBbrFm9QqQ9N7rRNI0GXVdehktRGaM5D/Tu5S8u2ix8dVU3HUWFeSIurmuAEDIDboMQsjApKTFw4vjBNkX4QuPQwRLRsWOHAIBhcBEDbMaChyv2hCXCFxrZ360UlmX9DECHG6CU5rw3ddK1SET4QiMxccDvAJ6FGyCE1O8q3hqxCF9dlZg7Z5awbTsPbkC217rTlY6EFBXmCcao/LzuPJqmXg63yH03jNpTR4WiKNfgBjhnvtyN2Xe/EMuysqZOmXjViZDt2zYISukvcAlPxcbGBp3UydsTXr9iWdZKuIA0AGc0TaufN2dWSyQi9pfvEoSQIIBeThYeZFO6xTCMS6qqXpWDMXqWUboOQCoAJcx5kgCUAPgRwHAAA4lpBnfkbwxLxPFj5aJ/vwf9pml+HKkAg1K6tkNMTOCjWe+3lO8r/rvYCrZvEh/OmNaScH98g2WRWgDJbcwjdy8bgPyuX5Me668/FEV5iVKrce3qr25ZF/Hx9/kptVZFsHGtaIyx0qFPDwm21SbP1B4TSxanC8siQV3XX71hjm4AVgCoB/CBPNBvstZQ0zTOpaQkBzKXLRRlpUVCrlm6p0Asz8wQqc88HZSWXtO08YgUSsnS5ORBQWmnw3ntO4u2CMaY/HZHSB8FYDWA8wDmAugQxpKGoijjOedlpmlc0DTtMjHN814v368oyltO7yM9CSGNRw5FbuhUVW0OfULT7vhliBAjY/wb46446fEDkxIbFUV5B26AMfrT5twcR6fusqWfCc7tfXADmqZdrqmucCRkb0mB7PPn4AIU6WOcOlPZ63Vdb4IbME3jogwAnAjZvWuboJT8BjcQE8NLv8j83JGQxRnzZY3I09sVjHtyyGC/EyH9+j3UCGCBvDv9x2fQb4cQkxCzPtLOlZOdJaKjoy8BqAZQA2ACADvMNWM9Hs9Mzu2Tuq41yTrVNK2Zc7smFNCFO8/1qKo6pnOnTv5wU459ewsF51ye7CNDUzwBYF3odF8EoPvN1pIBnWEYgRdfSGvK/nalqK7a3zqn/JUB3cgRqY1GdHSDfCZHYigh07t06RzI37r+lm/Cy7n0Q+/+yzRxANIByJYsDV+f69ag1qqEhPhAyQ/5ba6x4fs1wrZZUNeVcY7EqKr6vGmaF4elDg2u+HJxq6GTO7WnZEerWRz8+GN+0zTq//EmbkZMyDjKjrZMZr2GYUzv3btnoPr4gbBDB/LnXeRRxzdTRVEmeL3eMtM0z+u63ixriHMuu9Mr0vBFMJc0kEukI/Z49Ca5MZHU4YL5s1sYoyduQzO5PWialjVq1PCI/Vzd6UpxT1zXBgApcAOcMd+G9WsdnVVTp0y86pY7u3wjzU5zrdyN2ULGSXAD8pyQV2YnQmqqK+S95wrckv2W7N7uSEjtqUohI1e4Adum2z79ZKYjIYUFuYJS61e4hDE9eiT4ZXgRqZBJE9+UAd03cAkKY9ZJeS5EGtBRywrc6BDuNA8TQgJ5m8ILs48dLRN9+/aRAd1suA1VVUdKMUuXpLcpIm9Ttuje7V4/Y9bySAO6/5NHKLXq+vfv25A+f7Yo3JErjhze21rUizLmiZSUZOnnLui6MhZ3AXKX0zi38xljZ6OjPUGbsbOc82IAY9tIKdtppx2Exx/mJPtyEUXPCAAAAABJRU5ErkJggg==)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                  }}
                />
              </div>
              <span className="text-white text-[13px] font-bold drop-shadow-md">Share</span>
            </button>
            
            {/* Share Dropdown Menu */}
            {showShareMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowShareMenu(false); }}></div>
                <div className="absolute bottom-full right-full mb-2 mr-2 z-20 bg-[#18181b]/90 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl p-2 flex flex-col min-w-[220px]">
                  <button 
                    onClick={handleCopyLink} 
                    className="p-3 hover:bg-gray-800/80 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
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
                    onClick={(e) => { e.stopPropagation(); window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this sela by ${post.author.name}`)}&url=${encodeURIComponent(`${window.location.origin}/@${post.author.username}/posts/${post.id}`)}`, '_blank'); setShowShareMenu(false); }} 
                    className="p-3 hover:bg-gray-800/80 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share to X
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out this sela by ${post.author.name}: ${window.location.origin}/@${post.author.username}/posts/${post.id}`)}`, '_blank'); setShowShareMenu(false); }} 
                    className="p-3 hover:bg-gray-800/80 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                    Share to Telegram
                  </button>
                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/@${post.author.username}/posts/${post.id}`)}`, '_blank'); setShowShareMenu(false); }} 
                    className="p-3 hover:bg-gray-800/80 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Share to Facebook
                  </button>

                  <button 
                    onClick={(e) => { e.stopPropagation(); window.open(`https://snapchat.com/scan?attachmentUrl=${encodeURIComponent(`${window.location.origin}/@${post.author.username}/posts/${post.id}`)}`, '_blank'); setShowShareMenu(false); }} 
                    className="p-3 hover:bg-gray-800/80 text-left rounded-lg text-white font-medium flex items-center gap-3 transition-colors text-[13px]"
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

          {/* Options */}
          <div className="relative mt-1">
            <button className="flex flex-col items-center gap-1 group" onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(!showOptionsMenu); }}>
              <div className="w-10 h-10 rounded-full bg-white/10 md:bg-white/5 md:hover:bg-white/10 flex items-center justify-center backdrop-blur-md transition shadow-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <circle cx="12" cy="5" r="2"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                  <circle cx="12" cy="19" r="2"></circle>
                </svg>
              </div>
            </button>
            
            {/* Options Dropdown Menu */}
            {showOptionsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowOptionsMenu(false); }}></div>
                <div className="absolute bottom-full right-full mb-2 mr-2 z-20 bg-[#18181b]/90 backdrop-blur-md border border-gray-700/50 rounded-xl shadow-2xl p-2 flex flex-col min-w-[220px]">
                  <button 
                    onClick={handleMute} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px]"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
                    {isUserMuted ? `Unmute @${post.author.username}` : `Mute @${post.author.username}`}
                  </button>
                  
                  <button 
                    onClick={handleBlock} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                    {isUserBlocked ? `Unblock @${post.author.username}` : `Block @${post.author.username}`}
                  </button>

                  <button 
                    onClick={handleMutePost} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4zM22 9l-6 6M16 9l6 6"/></svg>
                    {isPostMuted ? `Unmute this sela` : `Mute this sela`}
                  </button>
                  
                  <button 
                    onClick={handleReportClick} 
                    className="w-full px-2.5 py-2 hover:bg-red-500/10 text-left rounded-lg text-red-500/90 hover:text-red-500 font-medium flex items-center gap-2.5 transition-colors text-[13px] mt-0.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                    Report
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Views */}
          <div className="flex flex-col items-center gap-1">
            <div 
              className="w-[20px] h-[20px] bg-white opacity-80"
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
            <span className="text-white/80 text-[12px] font-bold drop-shadow-md">{views}</span>
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
    </div>
  );
}

export default function OrbitFeed() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    }>
      <OrbitContent />
    </Suspense>
  );
}
