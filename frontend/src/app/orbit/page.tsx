"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";

export default function OrbitFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrbitPosts = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const headers: any = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("http://localhost:3001/posts/orbit", { headers });
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
  }, []);

  return (
    <div className="w-full h-screen bg-black overflow-y-scroll snap-y snap-mandatory relative no-scrollbar" style={{ height: '100dvh' }}>
      {/* Back button or Header */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-4 bg-black/30 backdrop-blur-md p-2 rounded-full border border-white/10">
        <button onClick={() => router.push("/")} className="text-white hover:text-gray-300">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 className="text-lg font-bold text-white drop-shadow-md px-2">Orbit</h1>
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

  const [isLiked, setIsLiked] = useState(post.userInteractions?.isLiked || false);
  const [likeCount, setLikeCount] = useState(post.stats?.likes || 0);

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
      await fetch(`http://localhost:3001/posts/${post.id}/engage`, {
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(e => console.error("Auto-play failed:", e));
            setIsPlaying(true);
            // Optionally, track view here
            fetch(`http://localhost:3001/posts/${post.id}/view`, { method: "POST" }).catch(() => {});
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
      className="w-full h-screen snap-start snap-always relative flex items-center justify-center bg-black overflow-hidden"
      style={{ height: '100dvh' }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={post.mediaUrl}
        poster={post.thumbnailUrl}
        className="w-full h-full object-cover md:object-contain absolute inset-0 cursor-pointer"
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

      {/* Overlay UI (Right side actions & Bottom Info) */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-4 pb-20 lg:pb-8 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-20">
        
        <div className="flex items-end justify-between w-full h-full pb-4">
          
          {/* Left: Info */}
          <div className="flex flex-col gap-3 max-w-[75%] pointer-events-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(`/@${post.author.username}`)}>
              <img src={post.author.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author.username}`} alt="Avatar" className="w-11 h-11 rounded-full border border-white/20 bg-gray-800" />
              <span className="text-white font-bold text-[16px] drop-shadow-md">@{post.author.username}</span>
            </div>
            <p className="text-white text-[15px] leading-relaxed drop-shadow-md line-clamp-3 font-medium">
              {post.content}
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-6 items-center pointer-events-auto pb-4 pr-2">
            
            {/* Avatar Profile Link */}
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white bg-black cursor-pointer shadow-lg" onClick={() => router.push(`/@${post.author.username}`)}>
               <img src={post.author.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.author.username}`} alt="Avatar" className="w-full h-full object-cover" />
            </div>

            {/* Like */}
            <button onClick={handleLike} className="flex flex-col items-center gap-1.5 group">
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-white/20 backdrop-blur-md transition shadow-lg">
                <svg className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500' : 'text-white'}`} fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
              <span className="text-white text-[13px] font-bold drop-shadow-md">{likeCount}</span>
            </button>

            {/* Comment */}
            <button className="flex flex-col items-center gap-1.5 group" onClick={() => router.push(`/@${post.author.username}/posts/${post.id}`)}>
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-white/20 backdrop-blur-md transition shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <span className="text-white text-[13px] font-bold drop-shadow-md">{post.stats?.replies || 0}</span>
            </button>

            {/* Share */}
            <button className="flex flex-col items-center gap-1.5 group" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/@${post.author.username}/posts/${post.id}`)}>
              <div className="w-12 h-12 rounded-full bg-black/40 flex items-center justify-center group-hover:bg-white/20 backdrop-blur-md transition shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              </div>
              <span className="text-white text-[13px] font-bold drop-shadow-md">Share</span>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
