"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useBlockMuteStore } from "@/store/useBlockMuteStore";
import NotificationItem from "@/components/NotificationItem";
import { motion } from "framer-motion";

export default function ActivityPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const { blockedUsers, mutedUsers, mutedPosts } = useBlockMuteStore();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://localhost:3001/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to fetch notifications");
        
        const data = await res.json();
        setNotifications(data);

        // Mark as read in the background
        fetch("http://localhost:3001/notifications/read", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  const filteredNotifications = notifications.filter(notification => {
    // Check global mute/block state
    const isFromBlockedUser = notification.user?.username && blockedUsers.some(u => u.username === notification.user.username);
    const isFromMutedUser = notification.user?.username && mutedUsers.some(u => u.username === notification.user.username);
    const isMutedPost = notification.post?.id && mutedPosts.includes(notification.post.id);
    
    if (isFromBlockedUser || isFromMutedUser || isMutedPost) {
      return false;
    }

    if (activeTab === 'all') return true;
    if (activeTab === 'replies') return notification.type === 'REPLY';
    if (activeTab === 'reselas') return notification.type === 'RESELA' || notification.type === 'QUOTE';
    return true;
  });

  return (
    <main className="flex-1 min-h-screen pb-20 sm:pb-0">
      <div className="sticky top-0 z-10 flex flex-col bg-background/80 backdrop-blur-md">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold">Activity</h1>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border">
          {['all', 'replies', 'reselas'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 text-center font-bold text-[15px] transition-colors hover:bg-muted/50 relative ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <motion.div
                  layoutId="activityTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-[#3BC492] rounded-t-full mx-auto w-12"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-4 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-4 p-4 border-b border-border">
              <div className="w-6 h-6 bg-muted rounded-full"></div>
              <div className="flex-1">
                <div className="flex gap-2 items-center mb-2">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                </div>
                <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center text-muted-foreground">
          Failed to load activity.
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          You don't have any {activeTab !== 'all' ? activeTab : ''} notifications yet.
        </div>
      ) : (
        <div className="flex flex-col">
          {filteredNotifications.map((notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      )}
    </main>
  );
}
