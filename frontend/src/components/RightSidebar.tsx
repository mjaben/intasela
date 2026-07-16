"use client";

import AdSlot from "./AdSlot";
import { useFollowStore } from "@/store/useFollowStore";
import { useUserStore } from "@/store/useUserStore";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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

  if (pathname.startsWith("/wallet") || pathname.startsWith("/creator-studio") || pathname.startsWith("/orbit") || pathname.startsWith("/settings") || pathname.startsWith("/ads/campaigns/new")) {
    return null;
  }

  return (
    <aside className="w-[350px] h-screen sticky top-0 flex flex-col pt-4 pl-8 pb-6 hidden lg:flex overflow-y-auto no-scrollbar">
      
      {/* Search */}
      <div className="mb-6 relative">
        <input 
          type="text" 
          placeholder="Search Intasela..." 
          className="w-full bg-accent text-foreground rounded-full py-2.5 pl-4 pr-4 border border-border focus:outline-none focus:border-primary transition-colors text-sm"
        />
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
            { topic: "#CreatorEconomy", posts: "12.5K posts" },
            { topic: "Web3 Monetization", posts: "8,432 posts" },
            { topic: "#TechTwitter", posts: "5,210 posts" },
            { topic: "NextJS 15", posts: "3,100 posts" },
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
