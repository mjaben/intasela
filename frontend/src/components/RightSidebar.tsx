"use client";

import AdSlot from "./AdSlot";
import { useFollowStore } from "@/store/useFollowStore";
import { useUserStore } from "@/store/useUserStore";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function RecommendedUser({ user }: { user: { name: string, username: string } }) {
  const router = useRouter();
  const isAuthenticated = useUserStore(s => s.isAuthenticated);
  const globalFollowState = useFollowStore(s => s.followMap[user.username]);
  const setFollow = useFollowStore(s => s.setFollow);
  const isFollowing = globalFollowState ?? false;
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (!isAuthenticated) return router.push("/login");
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const method = isFollowing ? 'DELETE' : 'POST';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/${user.username}/follow`, {
        method,
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setFollow(user.username, !isFollowing);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (isFollowing) return null; // Hide from recommendations if followed

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} alt="avatar" className="w-full h-full" />
        </div>
        <div>
          <div onClick={() => router.push(`/@${user.username}`)} className="font-semibold text-sm leading-tight hover:underline cursor-pointer">{user.name}</div>
          <div className="text-[13px] text-muted-foreground">@{user.username}</div>
        </div>
      </div>
      <button 
        onClick={handleFollow}
        disabled={loading}
        className="bg-foreground text-background text-sm font-bold py-1 px-4 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        Follow
      </button>
    </div>
  );
}

export default function RightSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/users/search?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowSearchDropdown(true);
        }
      } catch (e) {
        console.error(e);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSearchDropdown(false);
      router.push(`/explore?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (pathname.startsWith("/wallet") || pathname.startsWith("/creator-studio") || pathname.startsWith("/orbit") || pathname.startsWith("/settings") || pathname.startsWith("/ads/campaigns/new")) {
    return null;
  }

  return (
    <aside className="w-[350px] h-screen sticky top-0 flex flex-col pt-4 pl-8 pb-6 hidden lg:flex overflow-y-auto no-scrollbar">
      
      <div className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Search Intasela..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          className="w-full bg-accent text-foreground rounded-full py-2.5 pl-4 pr-4 border border-border focus:outline-none focus:border-primary transition-colors text-sm"
        />
        {showSearchDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowSearchDropdown(false)}></div>
            <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-2">
                <button
                  onClick={() => { setShowSearchDropdown(false); router.push(`/explore?q=${encodeURIComponent(searchQuery)}`); }}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-center gap-3 border-b border-border/50"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                  <span className="text-[15px]">Search for "{searchQuery}"</span>
                </button>
                {searchResults.length > 0 && (
                  <div className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">People</div>
                )}
                {searchResults.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => { setShowSearchDropdown(false); router.push(`/@${u.username}`); }}
                    className="w-full text-left px-4 py-2 hover:bg-accent transition-colors flex items-center gap-3"
                  >
                    <img src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.username}`} className="w-10 h-10 rounded-full bg-muted object-cover" />
                    <div>
                      <div className="font-semibold text-sm leading-tight text-foreground">{u.firstName} {u.lastName}</div>
                      <div className="text-[13px] text-muted-foreground">@{u.username}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top Earners Widget */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="font-bold mb-4 text-[15px] tracking-tight">Top Earners This Week</h3>
        <div className="space-y-4">
          {[
            { name: "Salem King", username: "salemking", earned: "+4.2k" },
            { name: "Shee_dah", username: "shee_dah", earned: "+3.8k" },
            { name: "TechSis_Lagos", username: "techsis_lagos", earned: "+2.5k" },
          ].map((user, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${user.username}`} alt="avatar" className="w-full h-full" />
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight hover:underline cursor-pointer">{user.name}</div>
                  <div className="text-[13px] text-muted-foreground">@{user.username}</div>
                </div>
              </div>
              <div className="text-primary font-bold text-sm">
                {user.earned}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="font-bold mb-4 text-[15px] tracking-tight">Trending Topics</h3>
        <div className="space-y-4">
          {[
            { topic: "#CreatorEconomy", posts: "12.5K selas" },
            { topic: "Web3 Monetization", posts: "8,432 selas" },
            { topic: "#TechTwitter", posts: "5,210 selas" },
            { topic: "NextJS 15", posts: "3,100 selas" },
          ].map((item, i) => (
            <div key={i} className="cursor-pointer hover:bg-accent/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
              <div className="font-bold text-[14px]">{item.topic}</div>
              <div className="text-[13px] text-muted-foreground">{item.posts}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended for you */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h3 className="font-bold mb-4 text-[15px] tracking-tight">Recommended for you</h3>
        <div className="space-y-4">
          {[
            { name: "UI/UX Daily", username: "uiux_daily" },
            { name: "Startup Founder", username: "startupguy" },
          ].map((user, i) => (
            <RecommendedUser key={i} user={user} />
          ))}
        </div>
      </div>

      {/* AdSense Slot */}
      <div className="mt-auto pb-4">
        <AdSlot format="vertical" slotId="sidebar" />
      </div>

    </aside>
  );
}
